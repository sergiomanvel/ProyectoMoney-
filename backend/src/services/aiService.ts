import OpenAI from 'openai';
import { GeneratedQuote } from '../models/Quote';
import dotenv from 'dotenv';
import Ajv from 'ajv';
import schema from '../schemas/generatedQuote.schema.json';
import { getAppConfig } from '../utils/appConfig';
import { refineItemsByContext } from '../utils/itemRefiner';
import { distributeTotalsByWeight } from '../utils/priceDistributor';
import { buildQuoteTitle, buildQuoteTerms, buildQuoteTimeline } from '../utils/titleAndTerms';
import { generateCommercialSummary } from '../utils/commercialSummary';
import { sectorTemplates, sectorRewritePrefixes } from '../config/sectorTemplates';
import { ARCHITECTURE_TEMPLATES, ARCHITECTURE_PRICE_WEIGHTS, CONTRACTOR_PRICE_WEIGHTS } from '../config/architectureTemplates';
import { sanitizeArchitectureItems } from '../utils/architectureSanitizer';
import dayjs from 'dayjs';

// Cargar .env por si este módulo se importa antes que el server
dotenv.config();

/**
 * Resultado de validación de descripción
 */
export interface DescriptionValidation {
  valid: boolean;
  reason?: string;
}

export class AIService {
  /**
   * Genera una cotización estructurada usando OpenAI
   * 
   * PIPELINE DE 4 ETAPAS:
   * 1️⃣ Validación de input (anti-troll)
   * 2️⃣ Clasificación de sector
   * 3️⃣ Generación IA context-aware
   * 4️⃣ Quality check post-IA
   */
  static async generateQuote(
    projectDescription: string,
    clientName: string,
    priceRange: string
  ): Promise<GeneratedQuote | { error: true; type: string; message: string }> {
    // ==========================================
    // 🟣 ETAPA 1: INPUT VALIDATION
    // ==========================================
    const validation = this.validateDescriptionQuality(projectDescription);
    
    if (!validation.valid) {
      console.log('⚠️ [Stage 1] Validación fallida:', validation.reason);
      return {
        error: true,
        type: 'INVALID_DESCRIPTION',
        message: validation.reason || 'La descripción no parece un servicio o producto comercial.'
      };
    }

    try {
      // Modo demo: saltar llamada a OpenAI y usar fallback seguro
      const isDemo = String(process.env.DEMO_MODE || '').toLowerCase() === 'true';
      if (isDemo) {
        console.log('🤖 DEMO_MODE activo: usando generador local sin llamar a OpenAI');
        return await this.generateFallbackQuote(projectDescription, clientName, priceRange);
      }

      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        console.warn('⚠️ OPENAI_API_KEY ausente: generando con fallback local');
        return await this.generateFallbackQuote(projectDescription, clientName, priceRange);
      }

      // ==========================================
      // 🟣 ETAPA 2: SECTOR CLASSIFICATION
      // ==========================================
      const openai = new OpenAI({ apiKey });
      const sector = await this.classifySector(openai, projectDescription);
      
      // Rechazar si sector = "otro" y descripción aún parece sospechosa
      if (sector === 'otro' && !this.isLikelyValidDescription(projectDescription)) {
        console.log('⚠️ [Stage 2] Sector "otro" con descripción sospechosa');
        return {
          error: true,
          type: 'INVALID_DESCRIPTION',
          message: 'La descripción no parece un servicio o producto comercial. Especifica un proyecto o servicio real.'
        };
      }

      // ==========================================
      // 🟣 ETAPA 3: AI QUOTE GENERATION
      // ==========================================
      const prompt = this.buildContextAwarePrompt(projectDescription, clientName, priceRange, sector);
      
      const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
      const completion = await openai.chat.completions.create({
        model,
        messages: [
          {
            role: "system",
            content: this.getSystemPrompt()
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.5, // Más conservador para respuestas profesionales
        max_tokens: 2000,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No se recibió respuesta de OpenAI');
      }

      // Parsear JSON
      let raw: any;
      try {
        raw = JSON.parse(response);
      } catch (parseError) {
        console.error('❌ Error parseando JSON de IA:', parseError);
        // Si IA devuelve error explícito, retornarlo
        if (response.includes('error') && response.includes('no válida')) {
          return {
            error: true,
            type: 'INVALID_DESCRIPTION',
            message: 'La descripción no corresponde a un servicio comercial válido.'
          };
        }
        throw new Error('JSON inválido de IA');
      }

      // Verificar si la IA retornó un error explícito
      if (raw.error === true) {
        console.log('⚠️ [Stage 3] IA retornó error explícito:', raw.message);
        return {
          error: true,
          type: 'INVALID_DESCRIPTION',
          message: raw.message || 'Descripción no válida para cotización profesional.'
        };
      }

      // ==========================================
      // 🟣 ETAPA 4: POST-AI QUALITY CHECK
      // ==========================================
      const qualityCheck = this.postAICheck(raw, sector);
      if (!qualityCheck.valid) {
        console.log('⚠️ [Stage 4] Quality check falló:', qualityCheck.reason);
        return await this.generateFallbackQuote(projectDescription, clientName, priceRange);
      }

      // Validación JSON Schema
      const ajv = new Ajv({ allErrors: true });
      const validate = ajv.compile(schema as any);
      const valid = validate(raw);

      if (!valid) {
        console.error('❌ [Stage 4] JSON Schema inválido:', validate.errors);
        return await this.generateFallbackQuote(projectDescription, clientName, priceRange);
      }

      // Mapear al modelo interno GeneratedQuote
      const data: any = raw as any;
      
      // 🎨 MEJORAS: Aplicar refinamiento profesional
      console.log('🎨 [Professional] Aplicando refinamientos profesionales...');
      
      // 1. Refinar items con contexto
      const config = getAppConfig();
      const refinedItems = await refineItemsByContext(
        data.items,
        projectDescription,
        sector,
        openai
      );
      
      // 2. Distribuir precios de forma realista
      const priceDistribution = distributeTotalsByWeight(
        refinedItems,
        data.total,
        sector,
        data.taxPercent || config.defaultTaxPercent
      );
      
      // 3. Construir título profesional
      const professionalTitle = buildQuoteTitle(projectDescription, sector);
      
      // 4. Construir términos profesionales
      const professionalTerms = buildQuoteTerms(sector);
      
      // 5. Generar resumen comercial
      const commercialSummary = await generateCommercialSummary(
        projectDescription,
        clientName,
        data.total,
        openai
      );
      
      // Construir quote final
      const mapped: GeneratedQuote = {
        title: professionalTitle,
        clientName: data.client?.name || clientName,
        projectDescription: data.projectDescription || projectDescription,
        items: priceDistribution.items,
        subtotal: priceDistribution.items.reduce((sum, item) => sum + item.total, 0),
        tax: priceDistribution.items.reduce((sum, item) => sum + item.total, 0) * ((data.taxPercent || config.defaultTaxPercent) / 100),
        total: priceDistribution.items.reduce((sum, item) => sum + item.total, 0) * (1 + (data.taxPercent || config.defaultTaxPercent) / 100),
        validUntil: data.validUntil,
        terms: professionalTerms,
        summary: commercialSummary,
        sector: sector,
        meta: {
          aestheticAdjusted: priceDistribution.aestheticAdjusted,
          generatedBy: 'ai-full'
        }
      };

      console.log('✅ Cotización generada exitosamente con sector:', sector);
      console.log('🎨 Refinamientos aplicados:', {
        itemsRefined: refinedItems.length,
        priceDistributed: true,
        professionalTitle: true,
        aestheticAdjusted: priceDistribution.aestheticAdjusted
      });
      
      return mapped;

    } catch (error) {
      console.error('❌ Error generando cotización con IA:', error);
      
      // Fallback: generar cotización básica
      return await this.generateFallbackQuote(projectDescription, clientName, priceRange);
    }
  }

  /**
   * 🟣 ETAPA 1: Valida calidad de la descripción
   */
  private static validateDescriptionQuality(description: string): DescriptionValidation {
    const desc = description.toLowerCase().trim();

    // 1. Longitud mínima
    if (desc.length < 10) {
      return {
        valid: false,
        reason: 'La descripción es demasiado corta. Proporciona más detalles sobre el proyecto o servicio.'
      };
    }

    // 2. Palabras prohibidas (childish/vulgar/troll)
    const forbiddenWords = [
      'caca', 'zurullo', 'pedo', 'mierda', 'puta', 'pene', 'verga',
      'jajaja', 'jaja', 'xd', 'lol', 'lmao', 'rofl', 'poop',
      'broma', 'troll', 'prueba', 'test', 'testing', 'nose',
      'no sé', 'tonto', 'idiota', 'monkey', 'mono'
    ];

    const hasForbiddenWord = forbiddenWords.some(word => desc.includes(word));
    
    if (hasForbiddenWord) {
      return {
        valid: false,
        reason: 'La descripción no parece un servicio o producto comercial. Especifica un proyecto o servicio real.'
      };
    }

    // 2.5. Validación específica para arquitectura fantástica
    const fantasyArchitectureWords = [
      'castillo con dragones', 'castillo medieval con lava', 'puente levadizo con lava',
      'castillo', 'dragones', 'lava', 'puente levadizo', 'fantasy', 'fantasía',
      'mágico', 'magia', 'hechizo', 'dragon', 'dragón'
    ];
    
    const hasFantasyWord = fantasyArchitectureWords.some(word => desc.includes(word));
    
    if (hasFantasyWord) {
      return {
        valid: false,
        reason: 'La descripción no corresponde a un proyecto arquitectónico real. Describe el tipo de obra, superficie, uso y nivel de detalle requerido.'
      };
    }

    // 3. Debe contener al menos una palabra clave profesional
    const professionalKeywords = [
      'servicio', 'proyecto', 'diseño', 'desarrollo', 'marketing',
      'instalacion', 'instalación', 'software', 'app', 'aplicacion',
      'evento', 'construccion', 'construcción', 'reforma', 'obra',
      'consultoria', 'consultoría', 'asesoria', 'asesoría',
      'mantenimiento', 'reparacion', 'reparación', 'capacitacion',
      'formacion', 'campaña', 'publicidad', 'contenidos', 'redes',
      'sistema', 'web', 'pagina', 'sitio', 'tienda', 'ecommerce',
      'plataforma', 'dashboard', 'logistica', 'logística', 'seguridad',
      'limpieza', 'jardineria', 'jardinería', 'hogar', 'empresa',
      'negocio', 'comercial', 'industrial', 'residencial'
    ];

    const hasProfessionalKeyword = professionalKeywords.some(keyword => desc.includes(keyword));
    
    if (!hasProfessionalKeyword) {
      return {
        valid: false,
        reason: 'La descripción debe mencionar un tipo de servicio, proyecto o producto comercial.'
      };
    }

    return { valid: true };
  }

  /**
   * 🏗️ DETECTOR DE ARQUITECTURA: Distingue arquitecto vs contratista
   */
  private static detectArchitectureContext(desc: string, sector?: string): { isArchitecture: boolean; mode: "architect" | "contractor"; subtype?: "anteproyecto" | "full" } {
    const d = desc.toLowerCase();

    // ⚡ PRIORITY 1: Anteproyecto explícito → Fuerza modo arquitecto (ignora hints de contratista)
    const isAnteproyecto =
      d.includes("anteproyecto arquitectónico") ||
      d.includes("anteproyecto arquitectonico") ||
      (d.includes("anteproyecto") && d.includes("vivienda"));

    if (isAnteproyecto) {
      return {
        isArchitecture: true,
        mode: "architect",
        subtype: "anteproyecto"
      };
    }

    const arqWords = [
      "proyecto arquitectónico",
      "proyecto arquitectonico",
      "anteproyecto",
      "planos arquitectónicos",
      "planos de arquitectura",
      "memoria descriptiva",
      "dirección de obra",
      "supervisión de obra",
      "coordinación técnica",
      "vivienda unifamiliar",
      "edificio residencial",
      "proyecto ejecutivo",
      "despacho de arquitectura",
      "arquitecto",
      "arquitecta"
    ];

    const isArq = arqWords.some(w => d.includes(w)) || sector === "construccion";

    // Si el usuario habla de "suministro", "materiales", "mano de obra" → probablemente contratista
    const contractorHints = ["suministro", "materiales", "mano de obra", "instalación", "instalacion", "ejecución física"];
    const isContractor = contractorHints.some(w => d.includes(w));

    return {
      isArchitecture: isArq,
      mode: isContractor ? "contractor" : "architect"
    };
  }

  /**
   * 🟣 ETAPA 2: Clasifica el sector del servicio
   * Primero intenta con OpenAI, si falla usa clasificación local
   */
  private static async classifySector(openai: OpenAI, description: string): Promise<string> {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Analiza la descripción y responde SOLO con un sector de esta lista: software, marketing, construccion, eventos, consultoria, comercio, manufactura, formacion, otro. Sin explicaciones.'
          },
          {
            role: 'user',
            content: description
          }
        ],
        temperature: 0.3,
        max_tokens: 10
      });

      const sector = response.choices[0]?.message?.content?.trim().toLowerCase() || 'otro';
      
      // Validar que sea un sector válido
      const validSectors = ['software', 'marketing', 'construccion', 'eventos', 'consultoria', 'comercio', 'manufactura', 'formacion', 'otro'];
      if (!validSectors.includes(sector)) {
        return 'otro';
      }

      return sector;
    } catch (error) {
      console.warn('⚠️ OpenAI falló para clasificación de sector, usando fallback local');
      // Fallback: clasificación local por keywords
      return this.classifySectorLocal(description);
    }
  }

  /**
   * Fallback: Clasifica sector localmente usando keywords
   */
  private static classifySectorLocal(description: string): string {
    const desc = description.toLowerCase();

    // Software / Tecnología
    const softwareKeywords = [
      'web', 'pagina', 'sitio', 'app', 'aplicacion', 'software', 'desarrollo', 
      'programacion', 'tienda online', 'ecommerce', 'sistema', 'plataforma', 
      'dashboard', 'api', 'frontend', 'backend', 'mobile', 'android', 'ios', 
      'wordpress', 'hosting', 'dominio', 'seo', 'sem'
    ];
    if (softwareKeywords.some(kw => desc.includes(kw))) {
      return 'software';
    }

    // Marketing / Comunicación
    const marketingKeywords = [
      'marketing', 'redes sociales', 'facebook', 'instagram', 'twitter', 
      'linkedin', 'tiktok', 'youtube', 'contenidos', 'publicidad', 'ads', 
      'comunity', 'community', 'influencer', 'banner', 'video', 'fotografia', 
      'diseno grafico', 'branding', 'identidad visual'
    ];
    if (marketingKeywords.some(kw => desc.includes(kw))) {
      return 'marketing';
    }

    // Construcción / Instalaciones
    const constructionKeywords = [
      'construccion', 'obra', 'instalacion', 'montaje', 'reforma', 'pintura', 
      'electricidad', 'plomeria', 'azulejo', 'techo', 'pared', 'panel', 
      'agua', 'sanitario', 'gaz', 'climatizacion', 'aire acondicionado',
      'certificacion electrica', 'certificado final de obra'
    ];
    if (constructionKeywords.some(kw => desc.includes(kw))) {
      return 'construccion';
    }

    // Eventos
    const eventsKeywords = [
      'evento', 'fiesta', 'ceremonia', 'seminario', 'conferencia', 'workshop', 
      'inauguracion', 'clausura', 'boda', 'cumpleanos', 'sonido', 'iluminacion', 
      'catering', 'meseros', 'animacion', 'dj', 'escenario', 'tarima'
    ];
    if (eventsKeywords.some(kw => desc.includes(kw))) {
      return 'eventos';
    }

    // Consultoría
    const consultingKeywords = [
      'consultoria', 'asesoria', 'asesor', 'consultor', 'auditoria', 'evaluacion', 
      'diagnostico', 'plan estrategico', 'estudio de mercado', 'benchmarking'
    ];
    if (consultingKeywords.some(kw => desc.includes(kw))) {
      return 'consultoria';
    }

    // Comercio / Retail
    const commerceKeywords = [
      'tienda', 'retail', 'vitrina', 'merchandising', 'ventas', 'comercial', 
      'distribucion', 'mayoreo', 'menudeo', 'franquicia'
    ];
    if (commerceKeywords.some(kw => desc.includes(kw))) {
      return 'comercio';
    }

    // Manufactura
    const manufacturingKeywords = [
      'manufactura', 'produccion', 'fabricacion', 'maquila', 'industrial', 
      'linea de produccion', 'calidad', 'control de calidad', 'packaging'
    ];
    if (manufacturingKeywords.some(kw => desc.includes(kw))) {
      return 'manufactura';
    }

    // Formación
    const trainingKeywords = [
      'capacitacion', 'formacion', 'entrenamiento', 'curso', 'taller', 'workshop', 
      'educacion', 'capacitacion', 'material didactico', 'certificacion'
    ];
    if (trainingKeywords.some(kw => desc.includes(kw))) {
      return 'formacion';
    }

    return 'otro';
  }

  /**
   * Verifica si la descripción parece válida a pesar de sector "otro"
   */
  private static isLikelyValidDescription(description: string): boolean {
    const desc = description.toLowerCase();
    
    // Más keywords profesionales para casos edge
    const likelyValidWords = [
      'servicio', 'servicios', 'instalar', 'instalacion', 'montar',
      'reparar', 'reparacion', 'mantenimiento', 'limpieza',
      'capacitacion', 'entrenamiento', 'curso', 'curso',
      'asesoria', 'consultoria', 'auditoria', 'evaluacion'
    ];

    return likelyValidWords.some(word => desc.includes(word));
  }

  /**
   * Sistema de prompt profesional
   */
  private static getSystemPrompt(): string {
    return `Eres un asistente experto en elaboración de cotizaciones profesionales y reales para empresas y freelancers.

Tu misión es crear presupuestos claros, adaptados al SECTOR detectado, con lenguaje formal y coherente.

IMPORTANTE:
- Nunca inventes servicios absurdos o irreales
- Si la descripción no corresponde a un servicio comercial real, responde con: {"error": true, "message": "Descripción no válida para cotización profesional."}
- Usa siempre tono profesional, español neutro
- No uses bromas, chistes ni lenguaje informal
- RESPONDE SOLO JSON, SIN TEXTO ANTES NI DESPUÉS`;
  }

  /**
   * 🟣 ETAPA 3: Construye prompt context-aware
   */
  private static buildContextAwarePrompt(
    projectDescription: string,
    clientName: string,
    priceRange: string,
    sector: string
  ): string {
    const cfg = getAppConfig();

    // Contexto específico por sector
    const sectorContext = this.getSectorContext(sector);

    return `
Genera una cotización comercial PROFESIONAL y REALISTA.

SECTOR DETECTADO: ${sector}

${sectorContext}

CLIENTE: ${clientName}
DESCRIPCIÓN: ${projectDescription}
RANGO DE PRECIO: ${priceRange}
IVA: ${cfg.defaultTaxPercent}%

ESTRUCTURA JSON REQUERIDA:
{
  "title": "Título profesional y realista de la cotización",
  "sector": "${sector}",
  "client": {
    "name": "${clientName}",
    "email": ""
  },
  "projectDescription": "${projectDescription}",
  "items": [
    {
      "description": "Concepto concreto y profesional",
      "quantity": 1,
      "unitPrice": 0,
      "total": 0
    }
  ],
  "subtotal": 0,
  "taxPercent": ${cfg.defaultTaxPercent},
  "taxAmount": 0,
  "total": 0,
  "terms": [
    "Condiciones profesionales del servicio"
  ],
  "validUntil": "YYYY-MM-DD (30 días desde hoy)",
  "summary": "Resumen breve profesional para email o PDF"
}

REGLAS CRÍTICAS:
✅ Usa entre 3 y 7 ítems coherentes con el sector y la descripción
✅ Si cliente menciona taller/mecánica → ítems mecánicos y repuestos
✅ Si cliente menciona marketing → contenido, publicación, analítica, estrategia
✅ Si cliente menciona tecnología → análisis, desarrollo, pruebas, soporte
✅ Si rango de precio está presente → ajusta total dentro del rango
✅ Cada ítem debe tener descripción única (NO repetir descripciones)
✅ Descripciones de ítems entre 15 y 60 caracteres
✅ Calcula correctamente: subtotal, IVA, total
✅ Términos profesionales de contratación y pago
❌ NO uses palabras inapropiadas, bromas, jerga juvenil
❌ NO repitas conceptos idénticos
❌ NO uses descripciones vagas (< 4 caracteres)

DEVUELVE SOLO JSON VÁLIDO. SIN TEXTO ANTES NI DESPUÉS.`;
  }

  /**
   * Contexto específico por sector para el prompt
   */
  private static getSectorContext(sector: string): string {
    switch (sector) {
      case 'software':
        return `CONTEXTO: Sector de desarrollo de software y tecnología
ÍTEMS TÍPICOS: Análisis de requerimientos, Diseño UI/UX, Desarrollo frontend/backend, Base de datos, Testing y QA, Documentación técnica, Deploy y configuración, Soporte y mantenimiento`;

      case 'marketing':
        return `CONTEXTO: Sector de marketing digital y comunicación
ÍTEMS TÍPICOS: Auditoría de marca, Estrategia de contenidos, Producción creativa, Gestión de redes sociales, Campañas publicitarias, SEO/SEM, Analítica y reportes, Community management`;

      case 'construccion':
        return `CONTEXTO: Sector de construcción e instalaciones
ÍTEMS TÍPICOS: Materiales y suministros, Mano de obra especializada, Maquinaria y herramientas, Desplazamiento y logística, Puesta en marcha, Certificaciones, Garantía y mantenimiento`;

      case 'eventos':
        return `CONTEXTO: Sector de eventos y entretenimiento
ÍTEMS TÍPICOS: Planificación y coordinación, Montaje de escenarios, Sonido e iluminación, Catering, Personal de servicio, Equipamiento audiovisual, Seguridad, Limpieza post-evento`;

      case 'consultoria':
        return `CONTEXTO: Sector de consultoría y asesoría
ÍTEMS TÍPICOS: Sesión de diagnóstico, Análisis de situación actual, Elaboración de plan de acción, Presentación de resultados, Seguimiento y acompañamiento, Capacitación a equipo`;

      case 'comercio':
        return `CONTEXTO: Sector comercial y retail
ÍTEMS TÍPICOS: Diseño de vitrinas, Merchandising, Catálogo de productos, Asesoría de compras, Logística de distribución, Etiquetado y packaging, Servicio al cliente`;

      case 'manufactura':
        return `CONTEXTO: Sector de manufactura y producción
ÍTEMS TÍPICOS: Materiales raw, Proceso de fabricación, Control de calidad, Empaquetado, Envío y distribución, Certificaciones, Mantenimiento preventivo`;

      case 'formacion':
        return `CONTEXTO: Sector de formación y capacitación
ÍTEMS TÍPICOS: Diseño de programa, Material educativo, Sesiones de capacitación, Evaluaciones, Certificaciones, Seguimiento post-capacitación, Materiales de apoyo`;

      default:
        return `CONTEXTO: Servicios generales
ÍTEMS: Usa palabras clave de la descripción para crear conceptos coherentes y profesionales.`;
    }
  }

  /**
   * 🟣 ETAPA 4: Post-AI Quality Check
   */
  private static postAICheck(raw: any, sector: string): { valid: boolean; reason?: string } {
    // Verificar estructura básica
    if (!raw || typeof raw !== 'object') {
      return { valid: false, reason: 'Respuesta inválida de IA' };
    }

    // Verificar items
    if (!raw.items || !Array.isArray(raw.items) || raw.items.length < 3) {
      return { valid: false, reason: 'Menos de 3 ítems generados' };
    }

    // Verificar cada item
    const forbiddenWords = ['caca', 'zurullo', 'jajaja', 'xd', 'lol', 'troll', 'broma'];
    for (const item of raw.items) {
      const desc = item.description?.toLowerCase() || '';
      
      // Verificar longitud
      if (desc.length < 4) {
        return { valid: false, reason: `Item con descripción muy corta: "${item.description}"` };
      }

      // Verificar palabras prohibidas
      if (forbiddenWords.some(word => desc.includes(word))) {
        return { valid: false, reason: `Item contiene palabra prohibida: "${item.description}"` };
      }

      // Verificar repetición de palabras (máximo 3 repeticiones)
      const words = desc.split(/\s+/);
      const wordCount: Record<string, number> = {};
      for (const word of words) {
        wordCount[word] = (wordCount[word] || 0) + 1;
        if (wordCount[word] > 3 && word.length > 3) {
          return { valid: false, reason: `Item con palabras repetidas excesivamente: "${item.description}"` };
        }
      }
    }

    // Verificar totales
    if (!raw.total || raw.total === 0) {
      return { valid: false, reason: 'Total es cero' };
    }

    if (!raw.subtotal || raw.subtotal === 0) {
      return { valid: false, reason: 'Subtotal es cero' };
    }

    // Verificar repetición de descripciones idénticas
    const descriptions = raw.items.map((item: any) => item.description?.toLowerCase() || '');
    const uniqueDescriptions = new Set(descriptions);
    if (uniqueDescriptions.size < descriptions.length) {
      return { valid: false, reason: 'Hay ítems con descripciones idénticas' };
    }

    return { valid: true };
  }

  /**
   * Genera cotización de fallback profesional usando templates
   */
  private static async generateFallbackQuote(
    projectDescription: string,
    clientName: string,
    priceRange: string
  ): Promise<GeneratedQuote> {
    const basePrice = this.extractBasePrice(priceRange);
    const cfg = getAppConfig();
    const taxPercent = cfg.defaultTaxPercent / 100;

    // Clasificar sector localmente
    const sector = this.classifySectorLocal(projectDescription);
    
    // 🏗️ Detectar arquitectura
    const archContext = this.detectArchitectureContext(projectDescription, sector);
    
    // 🏭 Usar templates del sector (o arquitectura si aplica)
    console.log(`🏭 [Fallback-Template] Usando plantillas del sector: ${sector}`);
    let baseConcepts: string[];
    if (archContext.isArchitecture && archContext.mode === "architect") {
      baseConcepts = ARCHITECTURE_TEMPLATES.architect;
      console.log(`🏗️ Modo arquitecto activado en fallback`);
    } else if (archContext.isArchitecture && archContext.mode === "contractor") {
      baseConcepts = ARCHITECTURE_TEMPLATES.contractor;
      console.log(`🏗️ Modo contratista activado en fallback`);
    } else {
      baseConcepts = sectorTemplates[sector] || sectorTemplates['general'];
    }
    
    // Contextualizar localmente
    let contextualizedItems = await this.contextualizeItemsLocal(
      projectDescription,
      sector,
      baseConcepts,
      archContext
    );
    
    console.log(`✅ Fallback generó ${contextualizedItems.length} items contextualizados`);
    
    // Sanitizar items en modo arquitecto (eliminar vocabulario de contratista)
    if (archContext?.isArchitecture && archContext.mode === "architect") {
      contextualizedItems = sanitizeArchitectureItems(contextualizedItems, archContext.subtype);
      console.log('🏗️ Items sanitizados para modo arquitecto en fallback');
    }
    
    // Distribuir precios
    const priceDistribution = distributeTotalsByWeight(
      contextualizedItems,
      basePrice,
      sector,
      cfg.defaultTaxPercent,
      archContext
    );
    
    // Título profesional
    const professionalTitle = buildQuoteTitle(projectDescription, sector, archContext);
    
    // Términos profesionales
    const professionalTerms = buildQuoteTerms(sector, archContext);
    
    // Resumen comercial
    const commercialSummary = await generateCommercialSummary(projectDescription, clientName, basePrice, undefined, archContext);
    
    // Timeline de plazos
    const timeline = buildQuoteTimeline(sector, archContext);

    return {
      title: professionalTitle,
      clientName,
      projectDescription,
      items: priceDistribution.items,
      subtotal: priceDistribution.items.reduce((sum, item) => sum + item.total, 0),
      tax: priceDistribution.items.reduce((sum, item) => sum + item.total, 0) * taxPercent,
      total: priceDistribution.items.reduce((sum, item) => sum + item.total, 0) * (1 + taxPercent),
      validUntil: dayjs().add(30, 'day').format('YYYY-MM-DD'),
      terms: professionalTerms,
      summary: commercialSummary,
      sector: sector,
      timeline: timeline,
      meta: {
        aestheticAdjusted: priceDistribution.aestheticAdjusted,
        generatedBy: 'template-fallback'
      }
    };
  }

  /**
   * Extrae precio base del rango
   */
  private static extractBasePrice(priceRange: string): number {
    const numbers = priceRange.match(/\d+/g);
    if (numbers && numbers.length > 0) {
      if (numbers.length >= 2) {
        const min = parseInt(numbers[0]) * 1000;
        const max = parseInt(numbers[1]) * 1000;
        return Math.round((min + max) / 2);
      }
      return parseInt(numbers[0]) * 1000;
    }
    return 50000; // Precio por defecto
  }

  /**
   * Extrae keywords de la descripción
   */
  private static extractKeywords(description: string): string[] {
    const stopWords = ['el', 'la', 'los', 'las', 'de', 'del', 'un', 'una', 'para', 'con', 'por', 'en', 'y', 'o', 'a', 'el', 'es', 'se', 'que', 'un'];
    const words = description.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 4 && !stopWords.includes(word));
    
    return [...new Set(words)].slice(0, 10);
  }

  /**
   * 🎯 FUNCIÓN ENTERPRISE: Genera cotización con control del usuario
   * Prioriza sector e items del usuario sobre IA
   */
  static async generateQuoteEnterprise(
    projectDescription: string,
    clientName: string,
    priceRange: string,
    userSector?: string,
    userItems?: Array<{ description: string; quantity: number; unitPrice: number }>
  ): Promise<GeneratedQuote | { error: true; type: string; message: string }> {
    // ==========================================
    // 🟣 ETAPA 1: INPUT VALIDATION
    // ==========================================
    const validation = this.validateDescriptionQuality(projectDescription);
    
    if (!validation.valid) {
      console.log('⚠️ [Stage 1] Validación fallida:', validation.reason);
      return {
        error: true,
        type: 'INVALID_DESCRIPTION',
        message: validation.reason || 'La descripción no parece un servicio o producto comercial.'
      };
    }

    // Sanitizar items del usuario si existen
    const sanitizedItems = userItems ? this.sanitizeUserItems(userItems) : [];

    try {
      // Modo demo: saltar llamada a OpenAI y usar fallback seguro
      const isDemo = String(process.env.DEMO_MODE || '').toLowerCase() === 'true';
      if (isDemo) {
        console.log('🤖 DEMO_MODE activo: usando generador local sin llamar a OpenAI');
        return await this.generateFallbackQuoteWithItems(projectDescription, clientName, priceRange, userSector, sanitizedItems);
      }

      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        console.warn('⚠️ OPENAI_API_KEY ausente: generando con fallback local');
        return await this.generateFallbackQuoteWithItems(projectDescription, clientName, priceRange, userSector, sanitizedItems);
      }

      // ==========================================
      // 🟣 ETAPA 2: DETERMINE SECTOR
      // ==========================================
      let sector: string;
      
      if (userSector && userSector.trim().length > 0) {
        // Usuario proporcionó sector: usar directamente
        sector = userSector.trim().toLowerCase();
        console.log('✅ Usando sector proporcionado por usuario:', sector);
      } else {
        // Clasificar sector automáticamente
        const openai = new OpenAI({ apiKey });
        sector = await this.classifySector(openai, projectDescription);
        
        // Rechazar si sector = "otro" y descripción aún parece sospechosa
        if (sector === 'otro' && !this.isLikelyValidDescription(projectDescription)) {
          console.log('⚠️ [Stage 2] Sector "otro" con descripción sospechosa');
          return {
            error: true,
            type: 'INVALID_DESCRIPTION',
            message: 'La descripción no parece un servicio o producto comercial. Especifica un proyecto o servicio real.'
          };
        }
      }

      // ==========================================
      // 🏗️ ETAPA 2.5: DETECT ARCHITECTURE MODE
      // ==========================================
      const archContext = this.detectArchitectureContext(projectDescription, sector);
      console.log(`🏗️ [Architecture Detection] isArchitecture: ${archContext.isArchitecture}, mode: ${archContext.mode}`);

      // ==========================================
      // 🟣 ETAPA 3: BUILD QUOTE
      // ==========================================
      let quote: GeneratedQuote;

      if (sanitizedItems && sanitizedItems.length > 0) {
        // 👤 USUARIO PROPORCIONÓ ITEMS → Usarlos como base
        console.log('✅ Usuario proporcionó items, usando como fuente de verdad');
        quote = await this.generateFromUserItems(
          projectDescription, 
          clientName, 
          priceRange, 
          sector, 
          sanitizedItems,
          apiKey,
          archContext
        );
      } else {
        // 🤖 GENERAR COMPLETAMENTE CON IA
        console.log('🤖 Usuario NO proporcionó items, generando completamente con IA');
        quote = await this.generateFullQuoteWithAI(
          projectDescription,
          clientName,
          priceRange,
          sector,
          apiKey,
          archContext
        );
      }

      return quote;

    } catch (error) {
      console.error('❌ Error generando cotización:', error);
      
      // Fallback: generar cotización básica
      return await this.generateFallbackQuoteWithItems(projectDescription, clientName, priceRange, userSector, sanitizedItems);
    }
  }

  /**
   * Sanitiza items del usuario (anti-troll)
   */
  private static sanitizeUserItems(items: Array<{ description: string; quantity: number; unitPrice: number }>): Array<{ description: string; quantity: number; unitPrice: number }> {
    const forbiddenWords = ['caca', 'zurullo', 'jajaja', 'xd', 'lol', 'troll', 'broma', 'pedo', 'mierda', 'puta'];
    
    return items
      .filter(item => {
        const desc = item.description.toLowerCase().trim();
        return desc.length > 0 && 
               desc.length >= 4 && 
               !forbiddenWords.some(word => desc.includes(word));
      })
      .map(item => ({
        description: item.description.trim(),
        quantity: Math.max(1, item.quantity || 1),
        unitPrice: item.unitPrice || 0
      }));
  }

  /**
   * Genera cotización a partir de items del usuario
   */
  private static async generateFromUserItems(
    projectDescription: string,
    clientName: string,
    priceRange: string,
    sector: string,
    userItems: Array<{ description: string; quantity: number; unitPrice: number }>,
    apiKey: string,
    archContext?: { isArchitecture: boolean; mode: "architect" | "contractor"; subtype?: "anteproyecto" | "full" }
  ): Promise<GeneratedQuote> {
    const openai = new OpenAI({ apiKey });
    
    // Distribuir precios si faltan
    let itemsWithPrices = this.distributePricesToUserItems(userItems, priceRange);
    
    // Sanitizar items en modo arquitecto (eliminar vocabulario de contratista)
    if (archContext?.isArchitecture && archContext.mode === "architect") {
      itemsWithPrices = sanitizeArchitectureItems(
        itemsWithPrices.map(item => ({ ...item, total: item.quantity * item.unitPrice })),
        archContext.subtype
      ).map(item => ({ description: item.description, quantity: item.quantity, unitPrice: item.unitPrice }));
      console.log('🏗️ Items del usuario sanitizados para modo arquitecto');
    }
    
    // Calcular totales
    const subtotal = itemsWithPrices.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const cfg = getAppConfig();
    const taxPercent = cfg.defaultTaxPercent / 100;
    const taxAmount = subtotal * taxPercent;
    const total = subtotal + taxAmount;

    // Usar IA solo para enriquecer: título, términos, resumen
    try {
      const prompt = this.buildEnrichmentPrompt(projectDescription, clientName, sector, itemsWithPrices);
      
      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: "system",
            content: "Eres un experto en enriquecer cotizaciones profesionales. Solo necesitas generar título, términos y resumen. RESPONDE SOLO JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.5,
        max_tokens: 800,
      });

      const response = completion.choices[0]?.message?.content;
      if (response) {
        const enriched = JSON.parse(response);
        
        // 🎨 MEJORAS: Aplicar refinamiento profesional (solo precios, título, términos, resumen)
        console.log('🎨 [User Items] Aplicando refinamientos profesionales...');
        
        // 1. Distribuir precios de forma realista (sin refinar descripciones del usuario)
        const itemsForDistribution = itemsWithPrices.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.quantity * item.unitPrice
        }));
        
        const priceDistribution = distributeTotalsByWeight(
          itemsForDistribution,
          total,
          sector,
          cfg.defaultTaxPercent,
          archContext
        );
        
        // 2. Construir título profesional
        const professionalTitle = buildQuoteTitle(projectDescription, sector, archContext);
        
        // 3. Construir términos profesionales
        const professionalTerms = buildQuoteTerms(sector, archContext);
        
        // 4. Generar resumen comercial
        const commercialSummary = await generateCommercialSummary(
          projectDescription,
          clientName,
          total,
          openai,
          archContext
        );
        
        // 5. Timeline de plazos
        const timeline = buildQuoteTimeline(sector, archContext);
        
        return {
          title: professionalTitle,
          clientName,
          projectDescription,
          items: priceDistribution.items,
          subtotal: priceDistribution.items.reduce((sum, item) => sum + item.total, 0),
          tax: priceDistribution.items.reduce((sum, item) => sum + item.total, 0) * taxPercent,
          total: priceDistribution.items.reduce((sum, item) => sum + item.total, 0) * (1 + taxPercent),
          validUntil: enriched.validUntil || dayjs().add(30, 'day').format('YYYY-MM-DD'),
          terms: professionalTerms,
          summary: commercialSummary,
          sector: sector,
          timeline: timeline,
          meta: {
            aestheticAdjusted: priceDistribution.aestheticAdjusted,
            generatedBy: 'user-items'
          }
        };
      }
    } catch (error) {
      console.error('Error enriqueciendo con IA, usando valores por defecto:', error);
    }

    // 🎨 MEJORAS: Aplicar también en fallback
    console.log('🎨 [User Items Fallback] Aplicando refinamientos profesionales...');
    
    const itemsForDistribution = itemsWithPrices.map(item => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.quantity * item.unitPrice
    }));
    
    const priceDistribution = distributeTotalsByWeight(
      itemsForDistribution,
      total,
      sector,
      cfg.defaultTaxPercent,
      archContext
    );
    
    const professionalTitle = buildQuoteTitle(projectDescription, sector, archContext);
    const professionalTerms = buildQuoteTerms(sector, archContext);
    const commercialSummary = await generateCommercialSummary(projectDescription, clientName, total, undefined, archContext);
    const timeline = buildQuoteTimeline(sector, archContext);

    return {
      title: professionalTitle,
      clientName,
      projectDescription,
      items: priceDistribution.items,
      subtotal: priceDistribution.items.reduce((sum, item) => sum + item.total, 0),
      tax: priceDistribution.items.reduce((sum, item) => sum + item.total, 0) * taxPercent,
      total: priceDistribution.items.reduce((sum, item) => sum + item.total, 0) * (1 + taxPercent),
      validUntil: dayjs().add(30, 'day').format('YYYY-MM-DD'),
      terms: professionalTerms,
      summary: commercialSummary,
      sector: sector,
      timeline: timeline,
      meta: {
        aestheticAdjusted: priceDistribution.aestheticAdjusted,
        generatedBy: 'user-items-fallback'
      }
    };
  }

  /**
   * Genera cotización completamente con IA usando templates contextualizados
   */
  private static async generateFullQuoteWithAI(
    projectDescription: string,
    clientName: string,
    priceRange: string,
    sector: string,
    apiKey: string,
    archContext?: { isArchitecture: boolean; mode: "architect" | "contractor"; subtype?: "anteproyecto" | "full" }
  ): Promise<GeneratedQuote> {
    const openai = new OpenAI({ apiKey });
    const config = getAppConfig();
    
    // 🎯 NUEVO PIPELINE: Usar templates base y contextualizar
    console.log(`🏭 [Template-Based] Usando plantillas del sector: ${sector}`);
    
    // 1. Obtener template base del sector (o arquitectura si aplica)
    let baseConcepts: string[];
    if (archContext?.isArchitecture && archContext.mode === "architect") {
      baseConcepts = ARCHITECTURE_TEMPLATES.architect;
      console.log(`🏗️ Usando plantillas de arquitectura (modo: arquitecto)`);
    } else if (archContext?.isArchitecture && archContext.mode === "contractor") {
      baseConcepts = ARCHITECTURE_TEMPLATES.contractor;
      console.log(`🏗️ Usando plantillas de arquitectura (modo: contratista)`);
    } else {
      baseConcepts = sectorTemplates[sector] || sectorTemplates['general'];
      console.log(`📋 Template base tiene ${baseConcepts.length} conceptos`);
    }
    
    // 2. Intentar contextualizar con OpenAI
    let contextualizedItems: Array<{ description: string; quantity: number; unitPrice: number; total: number }>;
    
    try {
      contextualizedItems = await this.contextualizeItemsWithOpenAI(
        openai,
        projectDescription,
        sector,
        baseConcepts,
        archContext
      );
      console.log('✅ Items contextualizados con OpenAI');
    } catch (error) {
      console.warn('⚠️ OpenAI falló en contextualización, usando reescritura local');
      contextualizedItems = await this.contextualizeItemsLocal(
        projectDescription,
        sector,
        baseConcepts,
        archContext
      );
      console.log('✅ Items contextualizados localmente');
    }
    
    // 2.5. Sanitizar items en modo arquitecto (eliminar vocabulario de contratista)
    if (archContext?.isArchitecture && archContext.mode === "architect") {
      contextualizedItems = sanitizeArchitectureItems(contextualizedItems, archContext.subtype);
      console.log('🏗️ Items sanitizados para modo arquitecto');
    }
    
    // 3. Calcular precios
    const basePrice = this.extractBasePrice(priceRange);
    const taxPercent = config.defaultTaxPercent / 100;
    const subtotal = basePrice / (1 + taxPercent);
    
    // 4. Distribuir precios (con pesos especiales para arquitectura)
    const priceDistribution = distributeTotalsByWeight(
      contextualizedItems,
      basePrice,
      sector,
      config.defaultTaxPercent,
      archContext
    );
    
    // 5. Generar metadatos profesionales
    const professionalTitle = buildQuoteTitle(projectDescription, sector, archContext);
    const professionalTerms = buildQuoteTerms(sector, archContext);
    const commercialSummary = await generateCommercialSummary(
      projectDescription,
      clientName,
      basePrice,
      openai,
      archContext
    );
    const timeline = buildQuoteTimeline(sector, archContext);
    
    return {
      title: professionalTitle,
      clientName,
      projectDescription,
      items: priceDistribution.items,
      subtotal: priceDistribution.items.reduce((sum, item) => sum + item.total, 0),
      tax: priceDistribution.items.reduce((sum, item) => sum + item.total, 0) * taxPercent,
      total: priceDistribution.items.reduce((sum, item) => sum + item.total, 0) * (1 + taxPercent),
      validUntil: dayjs().add(30, 'day').format('YYYY-MM-DD'),
      terms: professionalTerms,
      summary: commercialSummary,
      sector: sector,
      timeline: timeline,
      meta: {
        aestheticAdjusted: priceDistribution.aestheticAdjusted,
        generatedBy: 'ai-template'
      }
    };
  }
  
  /**
   * Contextualiza items usando OpenAI (reescritura profesional)
   */
  private static async contextualizeItemsWithOpenAI(
    openai: OpenAI,
    projectDescription: string,
    sector: string,
    baseConcepts: string[],
    archContext?: { isArchitecture: boolean; mode: "architect" | "contractor" }
  ): Promise<Array<{ description: string; quantity: number; unitPrice: number; total: number }>> {
    // Si es arquitectura y modo arquitecto, usar prompt especial
    let prompt: string;
    if (archContext?.isArchitecture && archContext.mode === "architect") {
      prompt = `Eres un arquitecto senior que elabora propuestas técnicas y económicas. A partir de la descripción del proyecto y de una lista base de fases, debes reescribir los conceptos para que suenen profesionales y propios de un despacho de arquitectura.

PROYECTO: "${projectDescription}"

CONCEPTOS BASE A CONTEXTUALIZAR:
${baseConcepts.map((c, i) => `${i + 1}. ${c}`).join('\n')}

IMPORTANTE:
- Incluye términos arquitectónicos: "proyecto ejecutivo", "memoria descriptiva", "coordinación con especialidades", "supervisión de obra", "cumplimiento de normativas"
- NO conviertas la propuesta en un presupuesto de materiales ni mano de obra
- NO incluyas "suministro" ni "mano de obra" a menos que la descripción lo pida expresamente
- Enfócate en: diseño, documentación técnica, supervisión, cumplimiento normativo
- Usa tono técnico y profesional de despacho de arquitectura

DEVUELVE SOLO JSON con este array:
["Concepto 1 adaptado", "Concepto 2 adaptado", ...]`;
    } else {
      prompt = `Eres un especialista en redacción de cotizaciones profesionales. A partir de un sector y una descripción de proyecto, debes ADAPTAR los conceptos de una cotización para que suenen específicos, profesionales y relacionados con el caso.

PROYECTO: "${projectDescription}"
SECTOR: ${sector}

CONCEPTOS BASE A CONTEXTUALIZAR:
${baseConcepts.map((c, i) => `${i + 1}. ${c}`).join('\n')}

IMPORTANTE:
- Adapta cada concepto al proyecto específico
- Usa vocabulario profesional del sector
- Si es médico → menciona pacientes, citas, historial clínico
- Si es marketing → menciona contenidos, publicaciones, métricas, redes sociales
- Si es construcción → menciona suministro, mano de obra, instalación, puesta en marcha
- Si es software → menciona análisis, desarrollo, pruebas, integración, despliegue
- NO inventes servicios absurdos ni coloquiales

DEVUELVE SOLO JSON con este array:
["Concepto 1 adaptado", "Concepto 2 adaptado", ...]`;
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: "system",
          content: "Eres un experto en cotizaciones profesionales. Respondes SOLO con JSON válido."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.5,
      max_tokens: 800,
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) {
      throw new Error('Respuesta vacía de OpenAI');
    }

    // Limpiar markdown si existe
    const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const adaptedDescriptions = JSON.parse(cleanedContent);

    // Mapear a items con cantidad 1
    return adaptedDescriptions.map((desc: string) => ({
      description: desc,
      quantity: 1,
      unitPrice: 0,
      total: 0
    }));
  }
  
  /**
   * Contextualiza items localmente usando prefijos del sector
   */
  private static async contextualizeItemsLocal(
    projectDescription: string,
    sector: string,
    baseConcepts: string[],
    archContext?: { isArchitecture: boolean; mode: "architect" | "contractor" }
  ): Promise<Array<{ description: string; quantity: number; unitPrice: number; total: number }>> {
    // Determinar qué prefijos usar según modo
    let prefixes: Record<string, string>;
    if (archContext?.isArchitecture && archContext.mode === "architect") {
      prefixes = sectorRewritePrefixes['arquitectura'] || {};
    } else if (archContext?.isArchitecture && archContext.mode === "contractor") {
      prefixes = sectorRewritePrefixes['contratista'] || {};
    } else {
      prefixes = sectorRewritePrefixes[sector] || sectorRewritePrefixes['general'];
    }
    
    return baseConcepts.map(concept => {
      const prefix = prefixes[concept] || concept;
      
      // Intentar adaptar usando la descripción
      let adapted = prefix;
      
      // Extraer palabras clave de la descripción
      const desc = projectDescription.toLowerCase();
      let contextInfo = '';
      
      // Para arquitectura
      if (archContext?.isArchitecture && archContext.mode === "architect") {
        if (desc.includes('vivienda') || desc.includes('casa') || desc.includes('residencial')) {
          contextInfo = 'la vivienda residencial';
        } else if (desc.includes('comercial') || desc.includes('oficinas')) {
          contextInfo = 'el edificio comercial';
        } else if (desc.includes('industrial')) {
          contextInfo = 'la nave industrial';
        } else {
          contextInfo = 'el proyecto arquitectónico';
        }
      } else {
        // Para otros sectores
        if (desc.includes('clínica') || desc.includes('médica') || desc.includes('citas')) {
          contextInfo = 'del sistema de gestión de citas y pacientes';
        } else if (desc.includes('instagram') || desc.includes('facebook') || desc.includes('redes')) {
          contextInfo = 'de la estrategia en redes sociales';
        } else if (desc.includes('tienda') || desc.includes('shopify') || desc.includes('ecommerce')) {
          contextInfo = 'de la tienda online';
        } else if (desc.includes('web') || desc.includes('sitio') || desc.includes('página')) {
          contextInfo = 'del sitio web';
        } else if (desc.includes('app') || desc.includes('móvil')) {
          contextInfo = 'de la aplicación móvil';
        } else if (desc.includes('reforma') || desc.includes('obra')) {
          contextInfo = 'de la obra';
        }
      }
      
      if (contextInfo) {
        adapted = `${prefix} ${contextInfo}`;
      } else {
        adapted = prefix;
      }
      
      return {
        description: adapted,
        quantity: 1,
        unitPrice: 0,
        total: 0
      };
    });
  }

  /**
   * Construye prompt para enriquecimiento (solo título, términos, resumen)
   */
  private static buildEnrichmentPrompt(
    projectDescription: string,
    clientName: string,
    sector: string,
    items: Array<{ description: string; quantity: number; unitPrice: number }>
  ): string {
    const cfg = getAppConfig();
    const itemsText = items.map((item, i) => 
      `${i + 1}. ${item.description} (Cantidad: ${item.quantity}, Precio: $${item.unitPrice})`
    ).join('\n');

    return `
Enriquece esta cotización profesional generando título, términos y resumen.

CLIENTE: ${clientName}
SECTOR: ${sector}
DESCRIPCIÓN: ${projectDescription}

CONCEPTOS YA DEFINIDOS:
${itemsText}

DEVUELVE SOLO JSON:
{
  "title": "Título profesional (50-80 caracteres)",
  "terms": ["Término 1", "Término 2", "Término 3"],
  "validUntil": "YYYY-MM-DD (30 días desde hoy)",
  "summary": "Resumen breve (100-150 caracteres)"
}

IMPORTANTE: Respeta los conceptos definidos, solo enriquece título y términos.`;
  }

  /**
   * Distribuye precios del rango entre items del usuario
   */
  private static distributePricesToUserItems(
    items: Array<{ description: string; quantity: number; unitPrice: number }>,
    priceRange: string
  ): Array<{ description: string; quantity: number; unitPrice: number }> {
    // Contar items que necesitan precio
    const itemsWithoutPrice = items.filter(item => !item.unitPrice || item.unitPrice === 0);
    
    if (itemsWithoutPrice.length === 0) {
      // Todos tienen precio
      return items;
    }

    // Extraer precio base del rango
    const basePrice = this.extractBasePrice(priceRange);

    // Si solo uno sin precio, usar todo el rango
    if (itemsWithoutPrice.length === 1 && items.length === 1) {
      return [{
        description: items[0].description,
        quantity: items[0].quantity,
        unitPrice: basePrice / items[0].quantity
      }];
    }

    // Distribuir proporcionalmente
    const pricePerItem = basePrice / items.length;
    
    return items.map(item => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice > 0 ? item.unitPrice : Math.round(pricePerItem / item.quantity)
    }));
  }

  /**
   * Genera fallback con items del usuario si existen
   */
  private static async generateFallbackQuoteWithItems(
    projectDescription: string,
    clientName: string,
    priceRange: string,
    userSector?: string,
    userItems?: Array<{ description: string; quantity: number; unitPrice: number }>
  ): Promise<GeneratedQuote> {
    // Si hay items del usuario, usarlos
    if (userItems && userItems.length > 0) {
      const itemsWithPrices = this.distributePricesToUserItems(userItems, priceRange);
      const subtotal = itemsWithPrices.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      const cfg = getAppConfig();
      const taxPercent = cfg.defaultTaxPercent / 100;
      const tax = subtotal * taxPercent;
      const total = subtotal + tax;

      return {
        title: `COTIZACIÓN - ${projectDescription.substring(0, 50)}`,
        clientName,
        projectDescription,
        items: itemsWithPrices.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.quantity * item.unitPrice
        })),
        subtotal,
        tax,
        total,
        validUntil: dayjs().add(30, 'day').format('YYYY-MM-DD'),
        terms: this.getDefaultTerms()
      };
    }

    // Si no hay items, usar generador normal
    return await this.generateFallbackQuote(projectDescription, clientName, priceRange);
  }

  /**
   * Términos por defecto
   */
  private static getDefaultTerms(): string[] {
    return [
      'Pago del 50% al iniciar el proyecto',
      'Pago del 50% restante al finalizar',
      'Válido por 30 días',
      'Precios incluyen IVA',
      'Condiciones generales aplican según sector'
    ];
  }
}
