import OpenAI from 'openai';
import { performance } from 'node:perf_hooks';
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
import { estimateProjectCost, CostEstimateResult } from '../utils/costEstimator';
import { analyzeProjectContext, ProjectContext } from '../utils/contextAnalyzer';
import { QuoteHistoryService, PriceSuggestionResult } from './quoteHistoryService';
import { randomUUID } from 'crypto';

export type QualityLevel = 'basico' | 'estandar' | 'premium';

interface QualityConfig {
  priceMultiplier: number;
  marginOffset: number;
  styleGuidance: string;
  maxItems?: number;
  minItems?: number;
}

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
    priceRange: string,
    qualityLevel: QualityLevel = 'estandar'
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

    const normalizedQuality = this.normalizeQualityLevel(qualityLevel);
    const qualityConfig = this.getQualityConfig(normalizedQuality);
    let projectContext = analyzeProjectContext(projectDescription, priceRange);

    try {

      // Modo demo: saltar llamada a OpenAI y usar fallback seguro
      const isDemo = String(process.env.DEMO_MODE || '').toLowerCase() === 'true';
      if (isDemo) {
        console.log('🤖 DEMO_MODE activo: usando generador local sin llamar a OpenAI');
        return await this.generateFallbackQuote(projectDescription, clientName, priceRange, normalizedQuality, projectContext);
      }

      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        console.warn('⚠️ OPENAI_API_KEY ausente: generando con fallback local');
        return await this.generateFallbackQuote(projectDescription, clientName, priceRange, normalizedQuality, projectContext);
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
      const archContext = this.detectArchitectureContext(projectDescription, sector);
      projectContext = analyzeProjectContext(projectDescription, priceRange, undefined, sector);

      const costEstimate = estimateProjectCost({
        sector,
        priceRange,
        archContext,
        context: projectContext,
        clientProfile: projectContext.clientProfile,
        projectType: projectContext.projectType,
        region: projectContext.region
      });
      const prompt = this.buildContextAwarePrompt(
        projectDescription,
        clientName,
        priceRange,
        sector,
        archContext,
        projectContext,
        qualityConfig,
        normalizedQuality,
        [],
        undefined,
        projectContext.clientProfile,
        projectContext.projectType,
        projectContext.region
      );
      
      const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
      const temperature = 0.5;
      const trace = randomUUID();
      console.debug(`[quote:${trace}] 📨 Prompt generación base`, {
        model,
        temperature,
        hasHistory: false,
        qualityLevel: normalizedQuality
      });
      const completion = await openai.chat.completions.create({
        model,
        messages: [
          {
            role: "system",
            content: this.getSystemPrompt(sector, archContext)
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature, // Más conservador para respuestas profesionales
        max_tokens: 2000,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No se recibió respuesta de OpenAI');
      }
      if (completion.usage) {
        console.debug(`[quote:${trace}] 📊 Uso generación base`, {
          promptTokens: completion.usage.prompt_tokens,
          completionTokens: completion.usage.completion_tokens
        });
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
        return await this.generateFallbackQuote(projectDescription, clientName, priceRange, normalizedQuality, projectContext);
      }

      // Validación JSON Schema
      const ajv = new Ajv({ allErrors: true });
      const validate = ajv.compile(schema as any);
      const valid = validate(raw);

      if (!valid) {
        console.error('❌ [Stage 4] JSON Schema inválido:', validate.errors);
        return await this.generateFallbackQuote(projectDescription, clientName, priceRange, normalizedQuality, projectContext);
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
      const desiredTotal = Math.round(((data.total ?? costEstimate.targetTotal) || costEstimate.targetTotal) * qualityConfig.priceMultiplier);
      const priceDistribution = distributeTotalsByWeight(
        refinedItems,
        desiredTotal,
        sector,
        data.taxPercent || config.defaultTaxPercent,
        archContext,
        costEstimate,
        qualityConfig.marginOffset
      );
      
      // 3. Construir título profesional
      const professionalTitle = buildQuoteTitle(projectDescription, sector);
      
      // 4. Construir términos profesionales
      const professionalTerms = buildQuoteTerms(sector);
      
      // 5. Generar resumen comercial
      const commercialSummary = await generateCommercialSummary(
        projectDescription,
        clientName,
        desiredTotal,
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
          generatedBy: 'ai-full',
          projectContext,
          qualityLevel: normalizedQuality
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
      if (error instanceof Error && error.message === 'INVALID_PRICE_RANGE') {
        return {
          error: true,
          type: 'INVALID_PRICE_RANGE',
          message: 'El rango de precio proporcionado no es válido. Usa valores numéricos en miles, por ejemplo "5 - 12".'
        };
      }
      
      // Fallback: generar cotización básica
      return await this.generateFallbackQuote(projectDescription, clientName, priceRange, normalizedQuality, projectContext);
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
      'broma', 'troll', 'test', 'testing', 'nose',
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
  private static getSystemPrompt(
    sector?: string,
    archContext?: { isArchitecture: boolean; mode: "architect" | "contractor"; subtype?: "anteproyecto" | "full" }
  ): string {
    const sectorVoice = this.getSectorVoice(sector, archContext);

    return `Eres un asistente experto en elaboración de cotizaciones profesionales y reales para empresas y freelancers.

Tu misión es crear presupuestos claros, adaptados al SECTOR detectado, con lenguaje formal y coherente.

Guía de estilo y terminología que debes seguir sin repetir literalmente los ejemplos:
${sectorVoice}

IMPORTANTE:
- Nunca inventes servicios absurdos o irreales
- Si la descripción no corresponde a un servicio comercial real, responde con: {"error": true, "message": "Descripción no válida para cotización profesional."}
- Usa siempre tono profesional, español neutro
- No uses bromas, chistes ni lenguaje informal
- RESPONDE SOLO JSON, SIN TEXTO ANTES NI DESPUÉS`;
  }

  private static getSectorVoice(
    sector?: string,
    archContext?: { isArchitecture: boolean; mode: "architect" | "contractor"; subtype?: "anteproyecto" | "full" }
  ): string {
    if (archContext?.isArchitecture && archContext.mode === "architect") {
      return `- Perfil: Arquitecto senior responsable de proyecto ejecutivo y supervisión.
- Tono: Técnico, riguroso, orientado a normativas y coordinación multidisciplinaria.
- Vocabulario recomendado: anteproyecto, proyecto ejecutivo, memoria descriptiva, coordinación de especialidades, cumplimiento normativo, supervisión de obra.
- Ejemplo inspiracional (no copiar literal): "Coordinación de especialidades estructurales y de instalaciones para asegurar compatibilidad con el proyecto ejecutivo."`;
    }

    if (archContext?.isArchitecture && archContext.mode === "contractor") {
      return `- Perfil: Contratista general enfocado en ejecución física y logística de obra.
- Tono: Directo, orientado a recursos, seguridad y entrega en obra.
- Vocabulario recomendado: suministro de materiales, mano de obra especializada, control de calidad, puesta en marcha, seguridad en obra.
- Ejemplo inspiracional (no copiar literal): "Suministro e instalación de paneles de yeso con mano de obra certificada y control de calidad por tramo."`;
    }

    switch (sector) {
      case 'software':
        return `- Perfil: Director de proyectos de desarrollo de software.
- Tono: Consultivo, enfocado en entregables, metodología y calidad del código.
- Vocabulario recomendado: análisis funcional, arquitectura de software, APIs REST, pruebas QA, DevOps, despliegue continuo, soporte post-lanzamiento.
- Ejemplo inspiracional (no copiar literal): "Implementación de APIs REST seguras y documentadas para sincronizar inventarios en tiempo real."`;
      case 'marketing':
        return `- Perfil: Estratega de marketing digital senior.
- Tono: Comercial, orientado a resultados y métricas.
- Vocabulario recomendado: auditoría de marca, estrategia de contenidos, pauta digital, conversiones, KPI, analítica, community management.
- Ejemplo inspiracional (no copiar literal): "Producción de piezas creativas y guiones para campaña omnicanal enfocada en generación de leads."`;
      case 'construccion':
        return `- Perfil: Ingeniero residente de obra civil.
- Tono: Técnico, concreto, orientado a cumplimiento de especificaciones y seguridad.
- Vocabulario recomendado: movimiento de tierras, cimentación, estructura, acabados, normativas locales, control de calidad, bitácora de obra.
- Ejemplo inspiracional (no copiar literal): "Ejecución de losa de cimentación con supervisión estructural y pruebas de resistencia."`;
      case 'eventos':
        return `- Perfil: Productor ejecutivo de eventos corporativos.
- Tono: Logístico, detallado, orientado a experiencia del asistente y coordinación de proveedores.
- Vocabulario recomendado: plan de producción, escenografía, rider técnico, montaje, cronograma, hospitality, desmontaje.
- Ejemplo inspiracional (no copiar literal): "Coordinación integral de montaje de escenarios, iluminación y sonorización para ceremonia inaugural."`;
      case 'consultoria':
        return `- Perfil: Consultor senior especializado en estrategia y transformación.
- Tono: Analítico, estructurado y orientado a impacto de negocio.
- Vocabulario recomendado: diagnóstico, benchmark, plan de acción, implementación, gestión del cambio, KPI, acompañamiento ejecutivo.
- Ejemplo inspiracional (no copiar literal): "Elaboración de roadmap de transformación digital con hitos trimestrales y métricas de adopción."`;
      case 'comercio':
        return `- Perfil: Especialista en operaciones y retail.
- Tono: Comercial, enfocado en optimización de procesos y experiencia de compra.
- Vocabulario recomendado: layout de tienda, visual merchandising, inventarios, capacitación comercial, CRM, fidelización.
- Ejemplo inspiracional (no copiar literal): "Reingeniería de layout y planogramas para aumentar rotación de categorías clave."`;
      case 'manufactura':
        return `- Perfil: Ingeniero industrial responsable de planta.
- Tono: Preciso, enfocado en eficiencia operativa y control de calidad.
- Vocabulario recomendado: línea de producción, balanceo, OEE, mantenimiento preventivo, documentación técnica, certificaciones.
- Ejemplo inspiracional (no copiar literal): "Implementación de sistema Andon y capacitación del personal para reducir tiempos de parada."`;
      case 'formacion':
        return `- Perfil: Coordinador académico de programas de capacitación.
- Tono: Didáctico, claro y enfocado en resultados de aprendizaje.
- Vocabulario recomendado: diseño instruccional, materiales didácticos, sesiones sincrónicas, evaluación, certificación, seguimiento post-curso.
- Ejemplo inspiracional (no copiar literal): "Diseño de material didáctico interactivo y rúbricas de evaluación para el programa de liderazgo."`;
      default:
        return `- Perfil: Consultor de negocios con experiencia multisectorial.
- Tono: Profesional, claro y orientado a valor para el cliente.
- Vocabulario recomendado: alcance del servicio, entregables, cronograma, métricas de éxito, soporte, condiciones comerciales.
- Ejemplo inspiracional (no copiar literal): "Acompañamiento integral en la implementación del servicio con seguimiento de indicadores clave."`;
    }
  }

  private static getProjectContextPrompt(
    context?: ProjectContext,
    clientProfile?: string,
    projectType?: string,
    region?: string
  ): string {
    const lines: string[] = [];
    
    if (context?.locationHint) {
      lines.push(`- Ubicación estimada del proyecto: ${context.locationHint}`);
    }
    if (context?.scaleOverride) {
      lines.push(`- Escala estimada del proyecto: ${context.scaleOverride}`);
    }
    if (context?.timelineWeeks) {
      lines.push(`- Plazo objetivo inferido: ${context.timelineWeeks} semanas`);
    }
    if (context?.urgencyMultiplier && context.urgencyMultiplier > 1) {
      lines.push(`- Urgencia detectada: ${context.urgencyReason || 'Alta prioridad'}`);
    }
    
    // Añadir perfil de cliente (si se proporciona)
    if (clientProfile) {
      const profileLabels: Record<string, string> = {
        'autonomo': 'Autónomo',
        'pyme': 'PYME',
        'agencia': 'Agencia',
        'startup': 'Startup',
        'enterprise': 'Enterprise',
        'junior': 'Consultor Junior',
        'senior': 'Consultor Senior',
        'partner': 'Partner',
        'big4': 'Big 4'
      };
      const profileLabel = profileLabels[clientProfile] || clientProfile;
      lines.push(`- Perfil de cliente: ${profileLabel}`);
    }
    
    // Añadir tipo de proyecto (si se proporciona)
    if (projectType) {
      const typeLabels: Record<string, string> = {
        'branding': 'Campaña de Branding',
        'performance': 'Campaña de Performance',
        'mixto': 'Campaña Mixta',
        'residencial': 'Obra Residencial',
        'industrial': 'Obra Industrial',
        'comercial': 'Obra Comercial',
        'rehabilitacion': 'Rehabilitación',
        'reforma': 'Reforma',
        'it': 'Consultoría IT',
        'financiera': 'Consultoría Financiera',
        'estrategica': 'Consultoría Estratégica',
        'rrhh': 'Consultoría RRHH',
        'b2c': 'Ecommerce B2C',
        'b2b': 'Ecommerce B2B',
        'marketplace': 'Marketplace',
        'dropshipping': 'Dropshipping',
        'subscription': 'Subscription',
        'corporate': 'Evento Corporate',
        'social': 'Evento Social',
        'cultural': 'Evento Cultural',
        'deportivo': 'Evento Deportivo',
        'virtual': 'Evento Virtual',
        'hibrido': 'Evento Híbrido',
        'fisico': 'Comercio Físico',
        'omnicanal': 'Comercio Omnicanal',
        'franchising': 'Franchising',
        'popup': 'Pop-up Store',
        'concept': 'Concept Store',
        'discreta': 'Manufactura Discreta',
        'continua': 'Manufactura Continua',
        'porLotes': 'Manufactura por Lotes',
        'custom': 'Manufactura Custom',
        'automotriz': 'Manufactura Automotriz',
        'farmaceutica': 'Manufactura Farmacéutica',
        'presencial': 'Formación Presencial',
        'online': 'Formación Online',
        'blended': 'Formación Blended',
        'eLearning': 'E-learning',
        'coaching': 'Coaching',
        'workshop': 'Workshop'
      };
      const typeLabel = typeLabels[projectType] || projectType;
      lines.push(`- Tipo de proyecto: ${typeLabel}`);
    }
    
    // Añadir región (si se proporciona)
    if (region) {
      const regionLabels: Record<string, string> = {
        'madrid': 'Madrid',
        'cataluña': 'Cataluña',
        'baleares': 'Baleares',
        'país vasco': 'País Vasco',
        'canarias': 'Canarias',
        'andalucía': 'Andalucía',
        'valencia': 'Valencia',
        'murcia': 'Murcia',
        'castilla y león': 'Castilla y León',
        'galicia': 'Galicia',
        'asturias': 'Asturias',
        'cantabria': 'Cantabria',
        'aragón': 'Aragón',
        'extremadura': 'Extremadura',
        'castilla la mancha': 'Castilla-La Mancha',
        'la rioja': 'La Rioja',
        'navarra': 'Navarra'
      };
      const regionLabel = regionLabels[region] || region;
      lines.push(`- Región: ${regionLabel} (los precios están ajustados al mercado local)`);
    }
    
    if (lines.length === 0) return '';
    return `Contexto adicional del proyecto:\n${lines.join('\n')}\n`;
  }

  private static detectSectorSpecialization(sector: string, projectDescription: string): string | undefined {
    const desc = projectDescription.toLowerCase();
    switch (sector) {
      case 'software':
        if (desc.includes('ecommerce') || desc.includes('tienda')) return 'desarrollador especializado en comercio electrónico';
        if (desc.includes('mobile') || desc.includes('app')) return 'arquitecto de aplicaciones móviles';
        if (desc.includes('erp') || desc.includes('integración')) return 'consultor de integración y sistemas ERP';
        return 'director técnico de desarrollo de software';
      case 'marketing':
        if (desc.includes('social') || desc.includes('instagram') || desc.includes('tiktok')) return 'estratega de social media';
        if (desc.includes('seo') || desc.includes('sem')) return 'especialista en SEO/SEM';
        if (desc.includes('eventos') || desc.includes('activaciones')) return 'planner de marketing experiencial';
        return 'director de marketing digital';
      case 'construccion':
        if (desc.includes('residencial') || desc.includes('vivienda')) return 'constructor especializado en obra residencial';
        if (desc.includes('industrial') || desc.includes('nave')) return 'ingeniero residente de obra industrial';
        if (desc.includes('interior') || desc.includes('remodelación')) return 'contratista de remodelaciones interiores';
        return 'contratista general de construcción';
      case 'consultoria':
        if (desc.includes('rrhh') || desc.includes('talento')) return 'consultor sénior en recursos humanos';
        if (desc.includes('tecnología') || desc.includes('digital')) return 'consultor en transformación digital';
        if (desc.includes('finanzas') || desc.includes('financiero')) return 'consultor financiero corporativo';
        return 'consultor estratégico senior';
      case 'eventos':
        if (desc.includes('corporativo')) return 'productor ejecutivo de eventos corporativos';
        if (desc.includes('boda') || desc.includes('social')) return 'planner de eventos sociales premium';
        return 'productor integral de eventos';
      case 'manufactura':
        if (desc.includes('lean') || desc.includes('mejora')) return 'ingeniero industrial experto en lean manufacturing';
        if (desc.includes('automatización')) return 'especialista en automatización de plantas';
        return 'gerente de operaciones industriales';
      case 'formacion':
        if (desc.includes('soft skills') || desc.includes('liderazgo')) return 'coordinador académico de programas de liderazgo';
        if (desc.includes('tecnología') || desc.includes('programación')) return 'diseñador instruccional en tecnología';
        return 'director de programas de formación corporativa';
      case 'ecommerce':
        if (desc.includes('shopify') || desc.includes('magento')) return 'consultor de plataformas ecommerce';
        if (desc.includes('marketplace')) return 'gerente de operaciones marketplace';
        return 'especialista en crecimiento ecommerce';
      default:
        if (desc.includes('finanzas') || desc.includes('financiero')) return 'consultor de servicios financieros';
        if (desc.includes('legal')) return 'asesor legal corporativo';
        return undefined;
    }
  }

  private static buildRoleDeclaration(
    sector: string,
    projectDescription: string,
    archContext?: { isArchitecture: boolean; mode: "architect" | "contractor"; subtype?: "anteproyecto" | "full" }
  ): string {
    if (archContext?.isArchitecture) {
      if (archContext.mode === 'architect') {
        return 'Escribe como un arquitecto senior responsable del proyecto (diseño, documentación técnica, coordinación de especialidades).';
      }
      return 'Escribe como un contratista general de obra civil enfocado en ejecución, logística y control de calidad.';
    }

    const specialization = this.detectSectorSpecialization(sector, projectDescription);
    if (specialization) {
      return `Escribe como si fueras un ${specialization}, usando terminología técnica precisa.`;
    }

    return `Escribe como un profesional experimentado del sector ${sector}, manteniendo un tono técnico y creíble.`;
  }

  private static normalizeQualityLevel(value?: string): QualityLevel {
    const normalized = (value || '').toLowerCase();
    if (normalized === 'basico' || normalized === 'básico') return 'basico';
    if (normalized === 'premium') return 'premium';
    return 'estandar';
  }

  private static getQualityConfig(level: QualityLevel): QualityConfig {
    switch (level) {
      case 'basico':
        return {
          priceMultiplier: 0.9,
          marginOffset: -0.03,
          styleGuidance: 'Usa descripciones concisas (20-35 palabras) y enfoque en tareas esenciales. Mantén el tono directo y práctico.',
          maxItems: 5,
          minItems: 3
        };
      case 'premium':
        return {
          priceMultiplier: 1.1,
          marginOffset: 0.05,
          styleGuidance: 'Redacta con detalle (40-60 palabras), enfatizando valor agregado, acompañamiento estratégico y entregables exclusivos.',
          minItems: 5
        };
      default:
        return {
          priceMultiplier: 1,
          marginOffset: 0,
          styleGuidance: 'Mantén un tono profesional equilibrado (30-45 palabras) destacando alcance, entregables y metodología.'
        };
    }
  }

  private static blendHistoricTotal(
    baseTotal: number,
    suggestion?: PriceSuggestionResult,
    traceId?: string
  ): { total: number; note?: string } {
    const prefix = traceId ? `[quote:${traceId}]` : undefined;
    if (!suggestion || !suggestion.suggestedAverage || !Number.isFinite(suggestion.suggestedAverage)) {
      if (prefix) {
        console.debug(`${prefix} 🔢 Sin historial suficiente, se usa total base`, { baseTotal });
      }
      return { total: baseTotal };
    }

    const suggested = suggestion.suggestedAverage;
    const blended = Math.round((baseTotal * 0.6) + (suggested * 0.4));
    const note = QuoteHistoryService.buildPricingNote(suggestion);
    if (prefix) {
      console.debug(`${prefix} 🔁 Blend histórico aplicado`, {
        baseTotal,
        historicAverage: suggested,
        blendedTotal: blended,
        similarQuoteIds: suggestion.similarQuotes.map(entry => entry.id)
      });
    }
    return {
      total: blended,
      note
    };
  }

  private static adjustConceptsForQuality(concepts: string[], config: QualityConfig): string[] {
    let adjusted = [...concepts];
    if (config.maxItems && adjusted.length > config.maxItems) {
      adjusted = adjusted.slice(0, config.maxItems);
    }
    if (config.minItems && adjusted.length < config.minItems) {
      const filler = 'Seguimiento y soporte adicional para garantizar resultados.';
      while (adjusted.length < config.minItems) {
        adjusted.push(filler);
      }
    }
    return adjusted;
  }

  /**
   * 🟣 ETAPA 3: Construye prompt context-aware
   */
  private static buildContextAwarePrompt(
    projectDescription: string,
    clientName: string,
    priceRange: string,
    sector: string,
    archContext?: { isArchitecture: boolean; mode: "architect" | "contractor"; subtype?: "anteproyecto" | "full" },
    projectContext?: ProjectContext,
    qualityConfig?: QualityConfig,
    qualityLevel: QualityLevel = 'estandar',
    historySnippets: string[] = [],
    pricingNote?: string,
    clientProfile?: string,
    projectType?: string,
    region?: string
  ): string {
    const cfg = getAppConfig();
    const sectorVoice = this.getSectorVoice(sector, archContext);
    const contextNotes = this.getProjectContextPrompt(projectContext, clientProfile, projectType, region);
    const qualityNotes = qualityConfig
      ? `NIVEL DE CALIDAD: ${qualityLevel.toUpperCase()}\n- Estilo esperado: ${qualityConfig.styleGuidance}`
      : '';
    const historyNotes = historySnippets.length
      ? `CASOS SIMILARES DEL MISMO USUARIO:\n${historySnippets.join('\n')}\n`
      : '';
    const pricingSection = pricingNote ? `${pricingNote}\n` : '';

    // Contexto específico por sector
    const sectorContext = this.getSectorContext(sector, clientProfile, projectType);

    return `
Genera una cotización comercial PROFESIONAL y REALISTA.

PAUTAS DE ESTILO POR SECTOR (no copies literalmente los ejemplos, solo inspírate):
${sectorVoice}

${qualityNotes}

SECTOR DETECTADO: ${sector}

${sectorContext}

${contextNotes}

${historyNotes}
${pricingSection}

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
  private static getSectorContext(sector: string, clientProfile?: string, projectType?: string): string {
    let baseContext = '';
    let profileContext = '';
    let typeContext = '';

    switch (sector) {
      case 'software':
        baseContext = `CONTEXTO: Sector de desarrollo de software y tecnología
ÍTEMS TÍPICOS: Análisis de requerimientos, Diseño UI/UX, Desarrollo frontend/backend, Base de datos, Testing y QA, Documentación técnica, Deploy y configuración, Soporte y mantenimiento`;
        if (clientProfile === 'autonomo') {
          profileContext = '\nNOTA: Cliente autónomo - priorizar desarrollo práctico y funcional, menos énfasis en documentación extensa.';
        } else if (clientProfile === 'enterprise') {
          profileContext = '\nNOTA: Cliente enterprise - incluir arquitectura robusta, documentación completa, y procesos de calidad.';
        }
        break;

      case 'marketing':
        baseContext = `CONTEXTO: Sector de marketing digital y comunicación
ÍTEMS TÍPICOS: Auditoría de marca, Estrategia de contenidos, Producción creativa, Gestión de redes sociales, Campañas publicitarias, SEO/SEM, Analítica y reportes, Community management`;
        if (projectType === 'branding') {
          typeContext = '\nNOTA: Campaña de branding - priorizar creatividad, estrategia de marca, y contenido visual premium.';
        } else if (projectType === 'performance') {
          typeContext = '\nNOTA: Campaña de performance - priorizar pauta digital, optimización de conversiones, y analítica.';
        }
        break;

      case 'construccion':
        baseContext = `CONTEXTO: Sector de construcción e instalaciones
ÍTEMS TÍPICOS: Materiales y suministros, Mano de obra especializada, Maquinaria y herramientas, Desplazamiento y logística, Puesta en marcha, Certificaciones, Garantía y mantenimiento`;
        if (projectType === 'residencial') {
          typeContext = '\nNOTA: Obra residencial - enfoque en acabados, habitabilidad, y normativas residenciales.';
        } else if (projectType === 'industrial') {
          typeContext = '\nNOTA: Obra industrial - enfoque en estructura, instalaciones especializadas, y cumplimiento industrial.';
        }
        break;

      case 'eventos':
        baseContext = `CONTEXTO: Sector de eventos y entretenimiento
ÍTEMS TÍPICOS: Planificación y coordinación, Montaje de escenarios, Sonido e iluminación, Catering, Personal de servicio, Equipamiento audiovisual, Seguridad, Limpieza post-evento`;
        if (projectType === 'virtual') {
          typeContext = '\nNOTA: Evento virtual - priorizar plataforma virtual, streaming, y tecnología de transmisión.';
        } else if (projectType === 'hibrido') {
          typeContext = '\nNOTA: Evento híbrido - incluir componentes físicos y virtuales, tecnología dual, y coordinación compleja.';
        }
        break;

      case 'consultoria':
        baseContext = `CONTEXTO: Sector de consultoría y asesoría
ÍTEMS TÍPICOS: Sesión de diagnóstico, Análisis de situación actual, Elaboración de plan de acción, Presentación de resultados, Seguimiento y acompañamiento, Capacitación a equipo`;
        if (projectType === 'it') {
          typeContext = '\nNOTA: Consultoría IT - priorizar análisis técnico, implementación, y tecnología.';
        } else if (projectType === 'financiera') {
          typeContext = '\nNOTA: Consultoría financiera - priorizar análisis financiero, reporting, y estrategia financiera.';
        }
        break;

      case 'comercio':
        baseContext = `CONTEXTO: Sector comercial y retail
ÍTEMS TÍPICOS: Diseño de vitrinas, Merchandising, Catálogo de productos, Asesoría de compras, Logística de distribución, Etiquetado y packaging, Servicio al cliente`;
        if (projectType === 'omnicanal') {
          typeContext = '\nNOTA: Comercio omnicanal - incluir integración de canales físico y online, sincronización de inventarios, y estrategia omnicanal.';
        }
        break;

      case 'manufactura':
        baseContext = `CONTEXTO: Sector de manufactura y producción
ÍTEMS TÍPICOS: Materiales raw, Proceso de fabricación, Control de calidad, Empaquetado, Envío y distribución, Certificaciones, Mantenimiento preventivo`;
        if (projectType === 'automotriz') {
          typeContext = '\nNOTA: Manufactura automotriz - priorizar cumplimiento IATF 16949, control estadístico de procesos, y calidad automotriz.';
        } else if (projectType === 'farmaceutica') {
          typeContext = '\nNOTA: Manufactura farmacéutica - priorizar cumplimiento GMP, trazabilidad, y calidad farmacéutica.';
        }
        break;

      case 'formacion':
        baseContext = `CONTEXTO: Sector de formación y capacitación
ÍTEMS TÍPICOS: Diseño de programa, Material educativo, Sesiones de capacitación, Evaluaciones, Certificaciones, Seguimiento post-capacitación, Materiales de apoyo`;
        if (projectType === 'online') {
          typeContext = '\nNOTA: Formación online - priorizar plataforma LMS, contenido multimedia, y diseño instruccional digital.';
        } else if (projectType === 'coaching') {
          typeContext = '\nNOTA: Coaching - priorizar sesiones personalizadas, acompañamiento individual, y desarrollo de habilidades.';
        }
        break;

      default:
        baseContext = `CONTEXTO: Servicios generales
ÍTEMS: Usa palabras clave de la descripción para crear conceptos coherentes y profesionales.`;
    }

    return baseContext + profileContext + typeContext;
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
    priceRange: string,
    qualityLevel: QualityLevel = 'estandar',
    existingContext?: ProjectContext,
    adjustedCostEstimate?: CostEstimateResult,
    _historySnippets: string[] = [],
    _pricingNote?: string,
    traceId?: string
  ): Promise<GeneratedQuote> {
    const trace = traceId || randomUUID();
    const prefix = `[quote:${trace}]`;
    // Clasificar sector localmente
    const sector = this.classifySectorLocal(projectDescription);
    
    // 🏗️ Detectar arquitectura
    const archContext = this.detectArchitectureContext(projectDescription, sector);

    const initialContext = existingContext ?? analyzeProjectContext(projectDescription, priceRange);
    const projectContext = analyzeProjectContext(
      projectDescription,
      priceRange,
      initialContext.locationHint,
      sector
    );
    if (initialContext.locationMultiplier && !projectContext.locationMultiplier) {
      projectContext.locationMultiplier = initialContext.locationMultiplier;
    }
    if (initialContext.urgencyMultiplier && !projectContext.urgencyMultiplier) {
      projectContext.urgencyMultiplier = initialContext.urgencyMultiplier;
      projectContext.urgencyReason = projectContext.urgencyReason ?? initialContext.urgencyReason;
    }
    if (initialContext.timelineWeeks && !projectContext.timelineWeeks) {
      projectContext.timelineWeeks = initialContext.timelineWeeks;
    }
    if (!projectContext.fluctuationWarning && initialContext.fluctuationWarning) {
      projectContext.fluctuationWarning = initialContext.fluctuationWarning;
    }
    const normalizedQuality = this.normalizeQualityLevel(qualityLevel);
    const qualityConfig = this.getQualityConfig(normalizedQuality);
    const estimateStart = performance.now();
    const baseEstimate = estimateProjectCost({
      sector,
      priceRange,
      archContext: archContext.isArchitecture ? archContext : undefined,
      context: projectContext,
      clientProfile: projectContext.clientProfile,
      projectType: projectContext.projectType,
      region: projectContext.region
    });
    const estimateDuration = performance.now() - estimateStart;
    console.debug(`${prefix} 🧮 Estimación fallback`, {
      scale: baseEstimate.scale,
      baseTotal: baseEstimate.baseTotal,
      appliedMultipliers: baseEstimate.appliedMultipliers,
      duration: Number(estimateDuration.toFixed(2))
    });
    const costEstimate = adjustedCostEstimate
      ? { ...baseEstimate, ...adjustedCostEstimate }
      : baseEstimate;
    const basePrice = Math.round(costEstimate.targetTotal * qualityConfig.priceMultiplier);
    const cfg = getAppConfig();
    const taxPercent = cfg.defaultTaxPercent / 100;
    
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
    baseConcepts = this.adjustConceptsForQuality(baseConcepts, qualityConfig);
    
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
    const distributionStart = performance.now();
    const priceDistribution = distributeTotalsByWeight(
      contextualizedItems,
      basePrice,
      sector,
      cfg.defaultTaxPercent,
      archContext,
      costEstimate,
      qualityConfig.marginOffset,
      trace
    );
    const distributionDuration = performance.now() - distributionStart;
    console.debug(`${prefix} 💸 Distribución fallback`, {
      total: basePrice,
      itemCount: priceDistribution.items.length,
      duration: Number(distributionDuration.toFixed(2))
    });
    
    // Título profesional
    const professionalTitle = buildQuoteTitle(projectDescription, sector, archContext);
    
    // Términos profesionales
    const professionalTerms = buildQuoteTerms(sector, archContext);
    
    // Resumen comercial
    const commercialSummary = await generateCommercialSummary(
      projectDescription,
      clientName,
      basePrice,
      undefined,
      archContext,
      { traceId: trace, onFallback: () => { /* fallback already local */ } }
    );
    
    // Timeline de plazos
    const timeline = buildQuoteTimeline(sector, archContext);

    const fallbackQuote: GeneratedQuote = {
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
      fluctuationWarning: projectContext.fluctuationWarning,
      meta: {
        aestheticAdjusted: priceDistribution.aestheticAdjusted,
        generatedBy: 'template-fallback',
        projectContext,
        qualityLevel: normalizedQuality
      }
    };

    const estimateDetail = {
      scale: costEstimate.scale,
      baseTotal: costEstimate.baseTotal,
      appliedMultipliers: costEstimate.appliedMultipliers,
      blendedHistoricTotal: costEstimate.targetTotal,
      fallbackUsed: true,
      clientProfile: projectContext.clientProfile,
      projectType: projectContext.projectType,
      region: projectContext.region
    };

    const distributionInfo = {
      weights: priceDistribution.weights,
      marginMultiplier: priceDistribution.marginMultiplier,
      overheadMultiplier: priceDistribution.overheadMultiplier,
      minPerItem: priceDistribution.minPerItem
    };

      fallbackQuote.meta = {
        ...(fallbackQuote.meta ?? {}),
        projectContext,
        qualityLevel: normalizedQuality,
        clientProfile: projectContext.clientProfile,
        projectType: projectContext.projectType,
        region: projectContext.region,
        estimateDetail,
        debug: {
          traceId: trace,
          timings: this.formatTimings({
            estimateProjectCost: estimateDuration,
            distributeTotalsByWeight: distributionDuration
          }),
          flags: { fallback: true, usedLocalItems: true, usedLocalSummary: true },
          openAIModel: 'local-fallback',
          historySample: [],
          distribution: distributionInfo
        }
      };

    return fallbackQuote;
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
    userItems?: Array<{ description: string; quantity: number; unitPrice: number }>,
    qualityLevel: string = 'estandar',
    projectLocation?: string,
    ownerId?: string,
    traceId?: string,
    clientProfile?: 'autonomo' | 'pyme' | 'agencia' | 'startup' | 'enterprise',
    projectType?: string,
    region?: string
  ): Promise<GeneratedQuote | { error: true; type: string; message: string }> {
    const internalTraceId = traceId || randomUUID();
    const prefix = `[quote:${internalTraceId}]`;
    const label = (phase: string) => `${prefix} ${phase}`;
    console.log(`${prefix} ▶️ Inicio generateQuoteEnterprise`, {
      clientName,
      priceRange,
      userSector,
      projectLocation,
      qualityLevel,
      ownerId
    });
    console.time(label('generateQuoteEnterprise total'));
    const historyTimings: Record<string, number> = {};

    // ==========================================
    // 🟣 ETAPA 1: INPUT VALIDATION
    // ==========================================
    const validation = this.validateDescriptionQuality(projectDescription);
    
    if (!validation.valid) {
      console.log(`${prefix} ⚠️ [Stage 1] Validación fallida:`, validation.reason);
      console.timeEnd(label('generateQuoteEnterprise total'));
      return {
        error: true,
        type: 'INVALID_DESCRIPTION',
        message: validation.reason || 'La descripción no parece un servicio o producto comercial.'
      };
    }

    // Sanitizar items del usuario si existen
    const sanitizedItems = userItems ? this.sanitizeUserItems(userItems) : [];
    const normalizedQuality = this.normalizeQualityLevel(qualityLevel);
    const projectContext = analyzeProjectContext(projectDescription, priceRange, projectLocation, userSector);
    // Añadir clientProfile, projectType y region al contexto si se proporcionaron
    if (clientProfile) {
      projectContext.clientProfile = clientProfile;
    }
    if (projectType) {
      projectContext.projectType = projectType;
    }
    if (region) {
      projectContext.region = region;
    }

    const resolvedOwnerId = (ownerId || 'anonymous').trim().toLowerCase();
    let historySnippets: string[] = [];
    let priceSuggestion: PriceSuggestionResult | undefined;
    let pricingNote: string | undefined;

    try {
      console.time(label('history.findRelevant.preOpenAI'));
      // Modo demo: saltar llamada a OpenAI y usar fallback seguro
      const isDemo = String(process.env.DEMO_MODE || '').toLowerCase() === 'true';

      if (isDemo) {
        console.log(`${prefix} 🤖 DEMO_MODE activo: usando generador local sin llamar a OpenAI`);
        const history = await QuoteHistoryService.findRelevantHistory(resolvedOwnerId, userSector, 5, internalTraceId);
        console.timeEnd(label('history.findRelevant.preOpenAI'));
        historySnippets = QuoteHistoryService.buildPromptSnippets(history);
        priceSuggestion = await QuoteHistoryService.suggestPriceFromHistory(resolvedOwnerId, projectDescription, userSector);
        pricingNote = QuoteHistoryService.buildPricingNote(priceSuggestion);
        return await this.generateFallbackQuoteWithItems(
          projectDescription,
          clientName,
          priceRange,
          userSector,
          sanitizedItems,
          normalizedQuality,
          projectContext,
          historySnippets,
          priceSuggestion,
          pricingNote
        , internalTraceId
        );
      }

      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        console.warn(`${prefix} ⚠️ OPENAI_API_KEY ausente: generando con fallback local`);
        const history = await QuoteHistoryService.findRelevantHistory(resolvedOwnerId, userSector, 5, internalTraceId);
        console.timeEnd(label('history.findRelevant.preOpenAI'));
        historySnippets = QuoteHistoryService.buildPromptSnippets(history);
        priceSuggestion = await QuoteHistoryService.suggestPriceFromHistory(resolvedOwnerId, projectDescription, userSector);
        pricingNote = QuoteHistoryService.buildPricingNote(priceSuggestion);
        return await this.generateFallbackQuoteWithItems(
          projectDescription,
          clientName,
          priceRange,
          userSector,
          sanitizedItems,
          normalizedQuality,
          projectContext,
          historySnippets,
          priceSuggestion,
          pricingNote
        , internalTraceId
        );
      }
      console.timeEnd(label('history.findRelevant.preOpenAI'));

      // ==========================================
      // 🟣 ETAPA 2: DETERMINE SECTOR
      // ==========================================
      let sector: string;
      
      if (userSector && userSector.trim().length > 0) {
        // Usuario proporcionó sector: usar directamente
        sector = userSector.trim().toLowerCase();
        console.log(`${prefix} ✅ Usando sector proporcionado por usuario:`, sector);
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
      console.time(label('detectArchitectureContext'));
      let archContext;
      try {
        archContext = this.detectArchitectureContext(projectDescription, sector);
        console.log(`${prefix} 🏗️ [Architecture Detection]`, archContext);
      } catch (detErr) {
        console.error(`${prefix} ❌ detectArchitectureContext error`, detErr);
        throw detErr;
      } finally {
        console.timeEnd(label('detectArchitectureContext'));
      }

      // ==========================================
      // 🟣 ETAPA 3: BUILD QUOTE
      // ==========================================
      let quote: GeneratedQuote;

      const historyFindStart = performance.now();
      console.time(label('history.findRelevant'));
      const history = await QuoteHistoryService.findRelevantHistory(resolvedOwnerId, sector, 5, internalTraceId);
      console.timeEnd(label('history.findRelevant'));
      historyTimings.historyFindRelevant = performance.now() - historyFindStart;
      const historySnippetStart = performance.now();
      console.time(label('history.buildSnippets'));
      historySnippets = QuoteHistoryService.buildPromptSnippets(history);
      console.timeEnd(label('history.buildSnippets'));
      historyTimings.historyBuildSnippets = performance.now() - historySnippetStart;
      const suggestStart = performance.now();
      console.time(label('history.suggestPrice'));
      priceSuggestion = await QuoteHistoryService.suggestPriceFromHistory(resolvedOwnerId, projectDescription, sector);
      console.timeEnd(label('history.suggestPrice'));
      historyTimings.historySuggestPrice = performance.now() - suggestStart;
      const pricingNoteStart = performance.now();
      console.time(label('history.buildPricingNote'));
      pricingNote = QuoteHistoryService.buildPricingNote(priceSuggestion);
      console.timeEnd(label('history.buildPricingNote'));
      historyTimings.historyBuildPricingNote = performance.now() - pricingNoteStart;

      if (sanitizedItems && sanitizedItems.length > 0) {
        // 👤 USUARIO PROPORCIONÓ ITEMS → Usarlos como base
        console.log(`${prefix} ✅ Usuario proporcionó items, usando como fuente de verdad`);
        quote = await this.generateFromUserItems(
          projectDescription, 
          clientName, 
          priceRange, 
          sector, 
          sanitizedItems,
          apiKey,
          archContext,
          normalizedQuality,
          projectContext,
          historySnippets,
          priceSuggestion,
          pricingNote,
          internalTraceId
        );
      } else {
        // 🤖 GENERAR COMPLETAMENTE CON IA
        console.log(`${prefix} 🤖 Usuario NO proporcionó items, generando completamente con IA`);
        quote = await this.generateFullQuoteWithAI(
          projectDescription,
          clientName,
          priceRange,
          sector,
          apiKey,
          archContext,
          normalizedQuality,
          projectContext,
          historySnippets,
          priceSuggestion,
          pricingNote,
          internalTraceId
        );
      }

      if (projectContext.fluctuationWarning) {
        quote.fluctuationWarning = projectContext.fluctuationWarning;
      }

      quote.meta = {
        ...(quote.meta ?? {}),
        projectContext,
        clientProfile: projectContext.clientProfile,
        projectType: projectContext.projectType,
        region: projectContext.region,
        debug: {
          ...(quote.meta?.debug ?? {}),
          timings: {
            ...(quote.meta?.debug?.timings ?? {}),
            ...this.formatTimings(historyTimings)
          }
        },
        ...(priceSuggestion
          ? {
              historicalPricing: {
                suggestedAverage: priceSuggestion.suggestedAverage,
                low: priceSuggestion.low,
                high: priceSuggestion.high,
                similarQuoteIds: priceSuggestion.similarQuotes.map(entry => entry.id)
              }
            }
          : {})
      };

      console.timeEnd(label('generateQuoteEnterprise total'));
      console.log(`${prefix} ✅ Cotización generada correctamente`);
      return quote;

    } catch (error: unknown) {
      console.timeEnd(label('generateQuoteEnterprise total'));
      const errMessage = error instanceof Error ? error.message : String(error);
      console.error(`${prefix} ❌ Error generando cotización:`, errMessage);
      if (error instanceof Error && error.stack) {
        console.error(`${prefix} stacktrace:`, error.stack);
      }
      if (error instanceof Error && error.message === 'INVALID_PRICE_RANGE') {
        console.warn(`${prefix} ⚠️ priceRange inválido`, { priceRange });
        return {
          error: true,
          type: 'INVALID_PRICE_RANGE',
          message: 'El rango de precio no es válido. Usa el formato "5000 - 12000" en miles de la divisa configurada.'
        };
      }
      
      // Fallback: generar cotización básica
      if (historySnippets.length === 0) {
        const history = await QuoteHistoryService.findRelevantHistory(resolvedOwnerId, userSector, 5, internalTraceId);
        historySnippets = QuoteHistoryService.buildPromptSnippets(history);
      }
      if (!priceSuggestion) {
        priceSuggestion = await QuoteHistoryService.suggestPriceFromHistory(resolvedOwnerId, projectDescription, userSector);
      }
      pricingNote = pricingNote || QuoteHistoryService.buildPricingNote(priceSuggestion);
      return await this.generateFallbackQuoteWithItems(
        projectDescription,
        clientName,
        priceRange,
        userSector,
        sanitizedItems,
        normalizedQuality,
        projectContext,
        historySnippets,
        priceSuggestion,
        pricingNote,
        internalTraceId
      );
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
    archContext?: { isArchitecture: boolean; mode: "architect" | "contractor"; subtype?: "anteproyecto" | "full" },
    qualityLevel: QualityLevel = 'estandar',
    existingContext?: ProjectContext,
    historySnippets: string[] = [],
    priceSuggestion?: PriceSuggestionResult,
    pricingNote?: string,
    traceId?: string
  ): Promise<GeneratedQuote> {
    const trace = traceId || randomUUID();
    const prefix = `[quote:${trace}]`;
    const label = (phase: string) => `${prefix} ${phase}`;
    const debugInfo: {
      traceId: string;
      openAIModel: string;
      timings: Record<string, number>;
      flags: Record<string, boolean>;
      historySample: number[];
      distribution?: {
        weights?: number[];
        marginMultiplier?: number;
        overheadMultiplier?: number;
        minPerItem?: number;
      };
    } = {
      traceId: trace,
      openAIModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      timings: {},
      flags: {},
      historySample: priceSuggestion?.similarQuotes?.map(entry => entry.id) ?? []
    };
    const openai = new OpenAI({ apiKey });
    const normalizedQuality = this.normalizeQualityLevel(qualityLevel);
    const qualityConfig = this.getQualityConfig(normalizedQuality);
    const analyzeStart = performance.now();
    console.time(label('analyzeProjectContext'));
    const projectContext = existingContext ?? analyzeProjectContext(projectDescription, priceRange, undefined, sector);
    console.timeEnd(label('analyzeProjectContext'));
    debugInfo.timings.analyzeProjectContext = performance.now() - analyzeStart;
    const estimateStart = performance.now();
    console.time(label('estimateProjectCost'));
    const costEstimate = estimateProjectCost({
      sector,
      priceRange,
      archContext,
      context: projectContext,
      clientProfile: projectContext.clientProfile,
      projectType: projectContext.projectType,
      region: projectContext.region
    });
    console.debug(`${prefix} 🧮 Estimación de costos (user items)`, {
      scale: costEstimate.scale,
      baseTotal: costEstimate.baseTotal,
      appliedMultipliers: costEstimate.appliedMultipliers,
      clientProfile: costEstimate.clientProfile,
      projectType: costEstimate.projectType,
      region: costEstimate.region
    });
    console.timeEnd(label('estimateProjectCost'));
    debugInfo.timings.estimateProjectCost = performance.now() - estimateStart;
    const blendStart = performance.now();
    const blend = this.blendHistoricTotal(costEstimate.targetTotal, priceSuggestion, trace);
    debugInfo.timings.blendHistoricTotal = performance.now() - blendStart;
    
    // Distribuir precios si faltan
    let itemsWithPrices = this.distributePricesToUserItems(userItems, priceRange, sector, archContext, trace);
    
    // Sanitizar items en modo arquitecto (eliminar vocabulario de contratista)
    if (archContext?.isArchitecture && archContext.mode === "architect") {
      itemsWithPrices = sanitizeArchitectureItems(
        itemsWithPrices.map(item => ({ ...item, total: item.quantity * item.unitPrice })),
        archContext.subtype
      ).map(item => ({ description: item.description, quantity: item.quantity, unitPrice: item.unitPrice }));
      console.log(`${prefix} 🏗️ Items del usuario sanitizados para modo arquitecto`);
    }
    
    // Calcular totales
    const subtotal = itemsWithPrices.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const cfg = getAppConfig();
    const taxPercent = cfg.defaultTaxPercent / 100;
    const taxAmount = subtotal * taxPercent;
    const total = (subtotal + taxAmount) * qualityConfig.priceMultiplier;

    // Usar IA solo para enriquecer: título, términos, resumen
    const effectivePricingNote = pricingNote || QuoteHistoryService.buildPricingNote(priceSuggestion);
    const itemsForDistribution = itemsWithPrices.map(item => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.quantity * item.unitPrice
    }));
    const distributionStart = performance.now();
    const priceDistribution = distributeTotalsByWeight(
      itemsForDistribution,
      total,
      sector,
      cfg.defaultTaxPercent,
      archContext,
      costEstimate,
      qualityConfig.marginOffset,
      trace
    );
    debugInfo.timings.distributeTotalsByWeight = performance.now() - distributionStart;
    console.debug(`${prefix} 💸 Distribución user items`, {
      total,
      itemCount: priceDistribution.items.length,
      qualityMultiplier: qualityConfig.priceMultiplier
    });
    debugInfo.distribution = {
      weights: priceDistribution.weights,
      marginMultiplier: priceDistribution.marginMultiplier,
      overheadMultiplier: priceDistribution.overheadMultiplier,
      minPerItem: priceDistribution.minPerItem
    };
    const professionalTitle = buildQuoteTitle(projectDescription, sector, archContext);
    const professionalTerms = buildQuoteTerms(sector, archContext);
    const timeline = buildQuoteTimeline(sector, archContext);

    let generatedQuote: GeneratedQuote | null = null;
    let generatedBy: 'user-items' | 'user-items-fallback' = 'user-items';
    let validUntil = dayjs().add(30, 'day').format('YYYY-MM-DD');
    let commercialSummary: string;
    const summaryStart = performance.now();

    try {
      const prompt = this.buildEnrichmentPrompt(
        projectDescription,
        clientName,
        sector,
        itemsWithPrices,
        archContext,
        projectContext,
        qualityConfig,
        historySnippets,
        effectivePricingNote,
        projectContext?.clientProfile,
        projectContext?.projectType,
        projectContext?.region
      );
      console.debug(`${prefix} 📝 Prompt enriquecimiento user-items`, { model: debugInfo.openAIModel, items: itemsWithPrices.length });
      
      const completionStart = performance.now();
      const completion = await openai.chat.completions.create({
        model: debugInfo.openAIModel,
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
      debugInfo.timings.enrichUserItems = performance.now() - completionStart;

      const response = completion.choices[0]?.message?.content;
      if (response) {
        const enriched = JSON.parse(response);
        console.log(`${prefix} 🎨 [User Items] Refinamiento profesional completado`);
        if (completion.usage) {
          console.debug(`${prefix} 📊 Uso enriquecimiento user-items`, {
            promptTokens: completion.usage.prompt_tokens,
            completionTokens: completion.usage.completion_tokens
          });
        }
        validUntil = enriched.validUntil || validUntil;
        commercialSummary = await generateCommercialSummary(
          projectDescription,
          clientName,
          total,
          openai,
          archContext,
          { traceId: trace, onFallback: () => { debugInfo.flags.usedLocalSummary = true; debugInfo.flags.usedFallback = true; } }
        );
        debugInfo.timings.generateCommercialSummary = performance.now() - summaryStart;
        generatedQuote = {
          title: professionalTitle,
          clientName,
          projectDescription,
          items: priceDistribution.items,
          subtotal: priceDistribution.items.reduce((sum, item) => sum + item.total, 0),
          tax: priceDistribution.items.reduce((sum, item) => sum + item.total, 0) * taxPercent,
          total: priceDistribution.items.reduce((sum, item) => sum + item.total, 0) * (1 + taxPercent),
          validUntil,
          terms: professionalTerms,
          summary: commercialSummary,
          sector,
          timeline,
          fluctuationWarning: projectContext.fluctuationWarning,
          meta: {
            aestheticAdjusted: priceDistribution.aestheticAdjusted,
            generatedBy: 'user-items',
            projectContext,
            qualityLevel: normalizedQuality
          }
        };
      }
    } catch (error) {
      debugInfo.flags.usedFallback = true;
      const errMessage = error instanceof Error ? error.message : String(error);
      console.error(`${prefix} Error enriqueciendo con IA, usando valores por defecto:`, errMessage);
      if (error instanceof Error && error.stack) {
        console.error(`${prefix} stacktrace:`, error.stack);
      }
    }
    if (!generatedQuote) {
      debugInfo.flags.usedLocalSummary = true;
      generatedBy = 'user-items-fallback';
      commercialSummary = await generateCommercialSummary(
        projectDescription,
        clientName,
        total,
        undefined,
        archContext,
        { traceId: trace, onFallback: () => { debugInfo.flags.usedLocalSummary = true; debugInfo.flags.usedFallback = true; } }
      );
      debugInfo.timings.generateCommercialSummary = performance.now() - summaryStart;
      generatedQuote = {
        title: professionalTitle,
        clientName,
        projectDescription,
        items: priceDistribution.items,
        subtotal: priceDistribution.items.reduce((sum, item) => sum + item.total, 0),
        tax: priceDistribution.items.reduce((sum, item) => sum + item.total, 0) * taxPercent,
        total: priceDistribution.items.reduce((sum, item) => sum + item.total, 0) * (1 + taxPercent),
        validUntil,
        terms: professionalTerms,
        summary: commercialSummary,
        sector,
        timeline,
        fluctuationWarning: projectContext.fluctuationWarning,
        meta: {
          aestheticAdjusted: priceDistribution.aestheticAdjusted,
          generatedBy,
          projectContext,
          qualityLevel: normalizedQuality
        }
      };
    }

    const fallbackUsed = Boolean(
      debugInfo.flags.usedLocalItems ||
      debugInfo.flags.usedLocalSummary ||
      debugInfo.flags.usedFallback
    );

    const estimateDetail = {
      scale: costEstimate.scale,
      baseTotal: costEstimate.baseTotal,
      appliedMultipliers: costEstimate.appliedMultipliers,
      blendedHistoricTotal: blend.total,
      fallbackUsed,
      clientProfile: projectContext.clientProfile,
      projectType: projectContext.projectType,
      region: projectContext.region
    };

    const debugMeta = {
      traceId: trace,
      timings: this.formatTimings(debugInfo.timings),
      flags: debugInfo.flags,
      openAIModel: debugInfo.openAIModel,
      historySample: debugInfo.historySample,
      distribution: debugInfo.distribution
    };

    const historicalMeta = priceSuggestion
      ? {
          suggestedAverage: priceSuggestion.suggestedAverage,
          low: priceSuggestion.low,
          high: priceSuggestion.high,
          similarQuoteIds: priceSuggestion.similarQuotes.map(entry => entry.id)
        }
      : undefined;

    generatedQuote.meta = {
      ...(generatedQuote.meta ?? {}),
      projectContext,
      qualityLevel: normalizedQuality,
      clientProfile: projectContext.clientProfile,
      projectType: projectContext.projectType,
      region: projectContext.region,
      estimateDetail,
      debug: debugMeta,
      ...(historicalMeta ? { historicalPricing: historicalMeta } : {})
    };

    return generatedQuote;
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
    archContext?: { isArchitecture: boolean; mode: "architect" | "contractor"; subtype?: "anteproyecto" | "full" },
    qualityLevel: QualityLevel = 'estandar',
    existingContext?: ProjectContext,
    historySnippets: string[] = [],
    priceSuggestion?: PriceSuggestionResult,
    pricingNote?: string,
    traceId?: string
  ): Promise<GeneratedQuote> {
    const trace = traceId || randomUUID();
    const prefix = `[quote:${trace}]`;
    const label = (phase: string) => `${prefix} ${phase}`;
    const debugInfo: {
      traceId: string;
      openAIModel: string;
      timings: Record<string, number>;
      flags: Record<string, boolean>;
      historySample: number[];
      distribution?: {
        weights?: number[];
        marginMultiplier?: number;
        overheadMultiplier?: number;
        minPerItem?: number;
      };
    } = {
      traceId: trace,
      openAIModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      timings: {},
      flags: {},
      historySample: []
    };
    const openai = new OpenAI({ apiKey });
    const config = getAppConfig();
    const analyzeStart = performance.now();
    console.time(label('analyzeProjectContext'));
    const projectContext = existingContext ?? analyzeProjectContext(projectDescription, priceRange, undefined, sector);
    console.timeEnd(label('analyzeProjectContext'));
    debugInfo.timings.analyzeProjectContext = performance.now() - analyzeStart;
    const normalizedQuality = this.normalizeQualityLevel(qualityLevel);
    const qualityConfig = this.getQualityConfig(normalizedQuality);
    const estimateStart = performance.now();
    console.time(label('estimateProjectCost'));
    const costEstimate = estimateProjectCost({
      sector,
      priceRange,
      archContext,
      context: projectContext,
      clientProfile: projectContext.clientProfile,
      projectType: projectContext.projectType,
      region: projectContext.region
    });
    console.timeEnd(label('estimateProjectCost'));
    debugInfo.timings.estimateProjectCost = performance.now() - estimateStart;
    console.debug(`${prefix} 🧮 Estimación de costos`, {
      scale: costEstimate.scale,
      baseTotal: costEstimate.baseTotal,
      appliedMultipliers: costEstimate.appliedMultipliers,
      clientProfile: costEstimate.clientProfile,
      projectType: costEstimate.projectType,
      region: costEstimate.region
    });
    const blendStart = performance.now();
    console.time(label('blendHistoricTotal'));
    const blend = this.blendHistoricTotal(costEstimate.targetTotal, priceSuggestion, trace);
    console.timeEnd(label('blendHistoricTotal'));
    debugInfo.timings.blendHistoricTotal = performance.now() - blendStart;
    const targetTotal = blend.total;
    const effectivePricingNote = pricingNote || blend.note;
    const adjustedCostEstimate = {
      ...costEstimate,
      targetTotal
    };
    
    // 🎯 NUEVO PIPELINE: Usar templates base y contextualizar
    console.log(`${prefix} 🏭 [Template-Based] Usando plantillas del sector: ${sector}`);
    
    // 1. Obtener template base del sector (o arquitectura si aplica)
    let baseConcepts: string[];
    if (archContext?.isArchitecture && archContext.mode === "architect") {
      baseConcepts = ARCHITECTURE_TEMPLATES.architect;
      console.log(`${prefix} 🏗️ Usando plantillas de arquitectura (modo: arquitecto)`);
    } else if (archContext?.isArchitecture && archContext.mode === "contractor") {
      baseConcepts = ARCHITECTURE_TEMPLATES.contractor;
      console.log(`${prefix} 🏗️ Usando plantillas de arquitectura (modo: contratista)`);
    } else {
      baseConcepts = sectorTemplates[sector] || sectorTemplates['general'];
      console.log(`${prefix} 📋 Template base tiene ${baseConcepts.length} conceptos`);
    }
    baseConcepts = this.adjustConceptsForQuality(baseConcepts, qualityConfig);
    
    // 2. Intentar contextualizar con OpenAI
    const contextualizeLabel = label('contextualizeItemsWithOpenAI');
    console.time(contextualizeLabel);
    const contextualizeStart = performance.now();
    let contextualizedItems = await this.contextualizeItemsWithOpenAI(
      openai,
      projectDescription,
      sector,
      baseConcepts,
      archContext,
      qualityConfig,
      historySnippets,
      effectivePricingNote,
      {
        traceId: trace,
        model: debugInfo.openAIModel,
        onFallback: () => {
          debugInfo.flags.usedLocalItems = true;
          debugInfo.flags.usedFallback = true;
        }
      },
      projectContext,
      projectContext?.clientProfile,
      projectContext?.projectType,
      projectContext?.region
    );
    console.timeEnd(contextualizeLabel);
    debugInfo.timings.contextualizeItemsWithOpenAI = performance.now() - contextualizeStart;
    if (!debugInfo.flags.usedLocalItems) {
      console.log(`${prefix} ✅ Items contextualizados con OpenAI`);
    }
    
    // 2.5. Sanitizar items en modo arquitecto (eliminar vocabulario de contratista)
    if (archContext?.isArchitecture && archContext.mode === "architect") {
      contextualizedItems = sanitizeArchitectureItems(contextualizedItems, archContext.subtype);
      console.log(`${prefix} 🏗️ Items sanitizados para modo arquitecto`);
    }
    
    // 3. Calcular precios
    const pricingStart = performance.now();
    console.time(label('calculatePricing'));
    const basePrice = Math.round(targetTotal * qualityConfig.priceMultiplier);
    const taxPercent = config.defaultTaxPercent / 100;
    
    // 4. Distribuir precios (con pesos especiales para arquitectura)
    const distributionStart = performance.now();
    const priceDistribution = distributeTotalsByWeight(
      contextualizedItems,
      basePrice,
      sector,
      config.defaultTaxPercent,
      archContext,
      adjustedCostEstimate,
      qualityConfig.marginOffset,
      trace
    );
    console.timeEnd(label('calculatePricing'));
    debugInfo.timings.calculatePricing = performance.now() - pricingStart;
    debugInfo.timings.distributeTotalsByWeight = performance.now() - distributionStart;
    console.debug(`${prefix} 💸 Base price calculado`, {
      basePrice,
      qualityMultiplier: qualityConfig.priceMultiplier,
      itemCount: priceDistribution.items.length
    });
    debugInfo.distribution = {
      weights: priceDistribution.weights,
      marginMultiplier: priceDistribution.marginMultiplier,
      overheadMultiplier: priceDistribution.overheadMultiplier,
      minPerItem: priceDistribution.minPerItem
    };
    
    // 5. Generar metadatos profesionales
    const titleStart = performance.now();
    console.time(label('buildQuoteTitle'));
    const professionalTitle = buildQuoteTitle(projectDescription, sector, archContext);
    console.timeEnd(label('buildQuoteTitle'));
    debugInfo.timings.buildQuoteTitle = performance.now() - titleStart;
    const termsStart = performance.now();
    console.time(label('buildQuoteTerms'));
    const professionalTerms = buildQuoteTerms(sector, archContext);
    console.timeEnd(label('buildQuoteTerms'));
    debugInfo.timings.buildQuoteTerms = performance.now() - termsStart;
    const summaryLabel = label('generateCommercialSummary');
    console.time(summaryLabel);
    const summaryStart = performance.now();
    const commercialSummary = await generateCommercialSummary(
      projectDescription,
      clientName,
      basePrice,
      openai,
      archContext,
      { traceId: trace, onFallback: () => { debugInfo.flags.usedLocalSummary = true; debugInfo.flags.usedFallback = true; } }
    );
    console.timeEnd(summaryLabel);
    debugInfo.timings.generateCommercialSummary = performance.now() - summaryStart;
    if (priceSuggestion?.similarQuotes?.length) {
      debugInfo.historySample = priceSuggestion.similarQuotes.map(entry => entry.id);
    }
    const timeline = buildQuoteTimeline(sector, archContext);
    
    const generatedQuote: GeneratedQuote = {
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
      timeline,
      fluctuationWarning: projectContext.fluctuationWarning,
      meta: {
        aestheticAdjusted: priceDistribution.aestheticAdjusted,
        generatedBy: 'ai-template',
        projectContext,
        qualityLevel: normalizedQuality
      }
    };

    const fallbackUsed = Boolean(
      debugInfo.flags.usedLocalItems ||
      debugInfo.flags.usedLocalSummary ||
      debugInfo.flags.usedFallback
    );

    const estimateDetail = {
      scale: costEstimate.scale,
      baseTotal: costEstimate.baseTotal,
      appliedMultipliers: costEstimate.appliedMultipliers,
      blendedHistoricTotal: blend.total,
      fallbackUsed,
      clientProfile: projectContext.clientProfile,
      projectType: projectContext.projectType,
      region: projectContext.region
    };

    const debugMeta = {
      traceId: trace,
      timings: this.formatTimings(debugInfo.timings),
      flags: debugInfo.flags,
      openAIModel: debugInfo.openAIModel,
      historySample: debugInfo.historySample,
      distribution: debugInfo.distribution
    };

    const historicalMeta = priceSuggestion
      ? {
          suggestedAverage: priceSuggestion.suggestedAverage,
          low: priceSuggestion.low,
          high: priceSuggestion.high,
          similarQuoteIds: priceSuggestion.similarQuotes.map(entry => entry.id)
        }
      : undefined;

    generatedQuote.meta = {
      ...(generatedQuote.meta ?? {}),
      projectContext,
      qualityLevel: normalizedQuality,
      clientProfile: projectContext.clientProfile,
      projectType: projectContext.projectType,
      region: projectContext.region,
      estimateDetail,
      debug: debugMeta,
      ...(historicalMeta ? { historicalPricing: historicalMeta } : {})
    };

    return generatedQuote;
  }
  
  /**
   * Contextualiza items usando OpenAI (reescritura profesional)
   */
  private static async contextualizeItemsWithOpenAI(
    openai: OpenAI,
    projectDescription: string,
    sector: string,
    baseConcepts: string[],
    archContext?: { isArchitecture: boolean; mode: "architect" | "contractor" },
    qualityConfig?: QualityConfig,
    historySnippets: string[] = [],
    pricingNote?: string,
    options?: { traceId?: string; onFallback?: () => void; model?: string; temperature?: number },
    projectContext?: ProjectContext,
    clientProfile?: string,
    projectType?: string,
    region?: string
  ): Promise<Array<{ description: string; quantity: number; unitPrice: number; total: number }>> {
    const trace = options?.traceId || randomUUID();
    const prefix = `[quote:${trace}]`;
    const label = (phase: string) => `${prefix} ${phase}`;
    const model = options?.model || process.env.OPENAI_MODEL || 'gpt-4o-mini';
    const temperature = options?.temperature ?? 0.4;
    const sectorVoice = this.getSectorVoice(sector, archContext);
    const roleDeclaration = this.buildRoleDeclaration(sector, projectDescription, archContext);
    const qualityStyle = qualityConfig?.styleGuidance
      ? `- Estilo según nivel de calidad: ${qualityConfig.styleGuidance}`
      : '';
    const historyBlock = historySnippets.length
      ? `REFERENCIAS HISTÓRICAS DEL MISMO USUARIO:\n${historySnippets.join('\n')}\n\n`
      : '';
    const pricingBlock = pricingNote ? `${pricingNote}\n\n` : '';
    
    // Construir contexto adicional del proyecto
    const contextBlock = this.getProjectContextPrompt(projectContext, clientProfile, projectType, region);
    const sectorContextBlock = this.getSectorContext(sector, clientProfile, projectType);

    console.time(label('openai.contextualize.buildPrompt'));
    // Si es arquitectura y modo arquitecto, usar prompt especial
    let prompt: string;
    if (archContext?.isArchitecture && archContext.mode === "architect") {
      prompt = `${roleDeclaration}
A partir de la descripción del proyecto y de una lista base de fases, reescribe los conceptos para que suenen profesionales y propios de un despacho de arquitectura.

PROYECTO: "${projectDescription}"

${contextBlock}${historyBlock}${pricingBlock}

CONTEXTO DEL SECTOR:
${sectorContextBlock}

CONCEPTOS BASE A CONTEXTUALIZAR:
${baseConcepts.map((c, i) => `${i + 1}. ${c}`).join('\n')}

IMPORTANTE:
- Pautas de estilo (no copies literal, solo inspírate):
${sectorVoice}
- Ajustes de calidad:
${qualityStyle || '- Mantén el nivel estándar indicado.'}
- Incluye términos arquitectónicos: "proyecto ejecutivo", "memoria descriptiva", "coordinación con especialidades", "supervisión de obra", "cumplimiento de normativas"
- NO conviertas la propuesta en un presupuesto de materiales ni mano de obra
- NO incluyas "suministro" ni "mano de obra" a menos que la descripción lo pida expresamente
- Enfócate en: diseño, documentación técnica, supervisión, cumplimiento normativo
- Usa tono técnico y profesional de despacho de arquitectura

DEVUELVE SOLO JSON con este array:
["Concepto 1 adaptado", "Concepto 2 adaptado", ...]`;
    } else {
      prompt = `${roleDeclaration}
A partir de un sector y una descripción de proyecto, adapta los conceptos de una cotización para que suenen específicos, profesionales y relacionados con el caso.

PROYECTO: "${projectDescription}"
SECTOR: ${sector}

${contextBlock}${historyBlock}${pricingBlock}

CONTEXTO DEL SECTOR:
${sectorContextBlock}

CONCEPTOS BASE A CONTEXTUALIZAR:
${baseConcepts.map((c, i) => `${i + 1}. ${c}`).join('\n')}

IMPORTANTE:
- Pautas de estilo (no copies literal, solo inspírate):
${sectorVoice}
- Ajustes de calidad:
${qualityStyle || '- Mantén el nivel estándar indicado.'}
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
    console.timeEnd(label('openai.contextualize.buildPrompt'));

    const completionLabel = label('openai.contextualize.request');
    console.time(completionLabel);
    console.debug(`${prefix} 📨 Prompt contextualización`, {
      model,
      temperature,
      baseConcepts: baseConcepts.length,
      includesHistory: historySnippets.length > 0,
      hasPricingNote: Boolean(pricingNote)
    });
    try {
      const completion = await openai.chat.completions.create({
        model,
        messages: [
          {
            role: "system",
            content: `Eres un asistente experto en ${sector}. Devuelves únicamente JSON válido.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature,
        max_tokens: 700,
      });
      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('Respuesta vacía de OpenAI en contextualización de items');
      }
      const parsed = JSON.parse(response);
      if (completion.usage) {
        console.debug(`${prefix} 📊 Uso contextualización`, {
          promptTokens: completion.usage.prompt_tokens,
          completionTokens: completion.usage.completion_tokens
        });
      }
      return parsed.map((description: string) => ({
        description,
        quantity: 1,
        unitPrice: 0,
        total: 0
      }));
    } catch (error) {
      const errMessage = error instanceof Error ? error.message : String(error);
      const openAIError = error as { name?: string; status?: number; error?: { type?: string } };
      console.error(`${prefix} ❌ contextualizeItemsWithOpenAI falló:`, errMessage, {
        name: openAIError?.name,
        status: openAIError?.status,
        type: openAIError?.error?.type
      });
      if (error instanceof Error && error.stack) {
        console.error(`${prefix} stacktrace:`, error.stack);
      }
      options?.onFallback?.();
      const fallbackItems = await this.contextualizeItemsLocal(
        projectDescription,
        sector,
        baseConcepts,
        archContext
      );
      console.warn(`${prefix} 🔄 Fallback local para contextualizar items`, { count: fallbackItems.length });
      return fallbackItems;
    } finally {
      console.timeEnd(completionLabel);
    }
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

  private static formatTimings(timings: Record<string, number>): Record<string, number> {
    const formatted: Record<string, number> = {};
    for (const [key, value] of Object.entries(timings)) {
      if (!Number.isFinite(value)) continue;
      formatted[key] = Number(value.toFixed(2));
    }
    return formatted;
  }

  /**
   * Construye prompt para enriquecimiento (solo título, términos, resumen)
   */
  private static buildEnrichmentPrompt(
    projectDescription: string,
    clientName: string,
    sector: string,
    items: Array<{ description: string; quantity: number; unitPrice: number }>,
    archContext?: { isArchitecture: boolean; mode: "architect" | "contractor"; subtype?: "anteproyecto" | "full" },
    projectContext?: ProjectContext,
    qualityConfig?: QualityConfig,
    historySnippets: string[] = [],
    pricingNote?: string,
    clientProfile?: string,
    projectType?: string,
    region?: string
  ): string {
    const cfg = getAppConfig();
    const itemsText = items.map((item, i) => 
      `${i + 1}. ${item.description} (Cantidad: ${item.quantity}, Precio: $${item.unitPrice})`
    ).join('\n');
    const sectorVoice = this.getSectorVoice(sector, archContext);
    const contextNotes = this.getProjectContextPrompt(projectContext, clientProfile, projectType, region);
    const sectorContext = this.getSectorContext(sector, clientProfile, projectType);
    const qualityNotes = qualityConfig
      ? `NIVEL DE CALIDAD: ${qualityConfig.styleGuidance}`
      : '';
    const historyNotes = historySnippets.length
      ? `REFERENCIAS DE COTIZACIONES PREVIAS DEL MISMO USUARIO:\n${historySnippets.join('\n')}\n`
      : '';
    const pricingSection = pricingNote ? `${pricingNote}\n` : '';

    return `
Enriquece esta cotización profesional generando título, términos y resumen.

CLIENTE: ${clientName}
SECTOR: ${sector}
DESCRIPCIÓN: ${projectDescription}

PAUTAS DE ESTILO POR SECTOR (inspírate, no copies literal):
${sectorVoice}

${qualityNotes}

${contextNotes}

CONTEXTO DEL SECTOR:
${sectorContext}

${historyNotes}
${pricingSection}

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
    priceRange: string,
    sector?: string,
    archContext?: { isArchitecture: boolean; mode: "architect" | "contractor"; subtype?: "anteproyecto" | "full" },
    traceId?: string
  ): Array<{ description: string; quantity: number; unitPrice: number }> {
    const trace = traceId || randomUUID();
    const prefix = `[quote:${trace}]`;
    // Contar items que necesitan precio
    const itemsWithoutPrice = items.filter(item => !item.unitPrice || item.unitPrice === 0);
    
    if (itemsWithoutPrice.length === 0) {
      // Todos tienen precio
      return items;
    }

    let basePrice: number | undefined;
    try {
      const estimate = estimateProjectCost({
        sector: sector || 'general',
        priceRange,
        archContext: archContext?.isArchitecture ? archContext : undefined,
        context: undefined,
        clientProfile: undefined,
        projectType: undefined,
        region: undefined
      });
      basePrice = estimate.targetTotal;
      console.debug(`${prefix} 💸 Estimación para distribuir user-items`, {
        basePrice,
        scale: estimate.scale
      });
    } catch (error) {
      const errMessage = error instanceof Error ? error.message : String(error);
      console.warn(`${prefix} ⚠️ No se pudo estimar costo para user-items`, errMessage);
    }

    if (!Number.isFinite(basePrice) || (basePrice ?? 0) <= 0) {
      const knownTotal = items.reduce((sum, item) => {
        if (item.unitPrice && item.unitPrice > 0) {
          return sum + item.unitPrice * Math.max(item.quantity, 1);
        }
        return sum;
      }, 0);
      basePrice = knownTotal > 0 ? knownTotal : Math.max(items.length, 1) * 1000;
      console.debug(`${prefix} 🔁 Usando basePrice fallback`, { basePrice });
    }

    const resolvedBasePrice = Math.max(basePrice ?? Math.max(items.length, 1) * 1000, 1);

    // Si solo uno sin precio, usar todo el rango
    if (itemsWithoutPrice.length === 1 && items.length === 1) {
      return [{
        description: items[0].description,
        quantity: items[0].quantity,
        unitPrice: resolvedBasePrice / Math.max(items[0].quantity, 1)
      }];
    }

    // Distribuir proporcionalmente
    const pricePerItem = resolvedBasePrice / Math.max(items.length, 1);
    
    return items.map(item => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice > 0
        ? item.unitPrice
        : Math.max(1, Math.round(pricePerItem / Math.max(item.quantity, 1)))
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
    userItems?: Array<{ description: string; quantity: number; unitPrice: number }> ,
    qualityLevel: QualityLevel = 'estandar',
    existingContext?: ProjectContext,
    historySnippets: string[] = [],
    priceSuggestion?: PriceSuggestionResult,
    pricingNote?: string,
    traceId?: string
  ): Promise<GeneratedQuote> {
    const trace = traceId || randomUUID();
    const prefix = `[quote:${trace}]`;
    const archContext = this.detectArchitectureContext(projectDescription, userSector);
    const normalizedQuality = this.normalizeQualityLevel(qualityLevel);
    const qualityConfig = this.getQualityConfig(normalizedQuality);
    const projectContext = existingContext ?? analyzeProjectContext(projectDescription, priceRange, undefined, userSector);
    const estimateStart = performance.now();
    const costEstimate = estimateProjectCost({
      sector: userSector || this.classifySectorLocal(projectDescription),
      priceRange,
      archContext: archContext.isArchitecture ? archContext : undefined,
      context: projectContext,
      clientProfile: projectContext.clientProfile,
      projectType: projectContext.projectType,
      region: projectContext.region
    });
    const estimateDuration = performance.now() - estimateStart;
    console.debug(`${prefix} 🧮 Estimación fallback user-items`, {
      scale: costEstimate.scale,
      baseTotal: costEstimate.baseTotal,
      appliedMultipliers: costEstimate.appliedMultipliers,
      duration: Number(estimateDuration.toFixed(2))
    });
    const blend = this.blendHistoricTotal(costEstimate.targetTotal, priceSuggestion, traceId);
    const targetTotal = blend.total;
    const effectivePricingNote = pricingNote || blend.note;
    const adjustedCostEstimate = {
      ...costEstimate,
      targetTotal
    };
    // Si hay items del usuario, usarlos
    if (userItems && userItems.length > 0) {
      const itemsWithPrices = this.distributePricesToUserItems(
        userItems,
        priceRange,
        userSector,
        archContext,
        trace
      );
      const subtotal = itemsWithPrices.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      const cfg = getAppConfig();
      const taxPercent = cfg.defaultTaxPercent / 100;
      const tax = subtotal * taxPercent;
      const baseTotal = subtotal + tax;
      const adjustedSubtotal = subtotal * qualityConfig.priceMultiplier;
      const adjustedTotal = baseTotal * qualityConfig.priceMultiplier;
      const adjustedTax = adjustedTotal - adjustedSubtotal;

      const fallbackQuote: GeneratedQuote = {
        title: `COTIZACIÓN - ${projectDescription.substring(0, 50)}`,
        clientName,
        projectDescription,
        items: itemsWithPrices.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: parseFloat((item.unitPrice * qualityConfig.priceMultiplier).toFixed(2)),
          total: parseFloat((item.quantity * item.unitPrice * qualityConfig.priceMultiplier).toFixed(2))
        })),
        subtotal: adjustedSubtotal,
        tax: adjustedTax,
        total: adjustedTotal,
        validUntil: dayjs().add(30, 'day').format('YYYY-MM-DD'),
        terms: this.getDefaultTerms(),
        fluctuationWarning: projectContext.fluctuationWarning,
        meta: {
          qualityLevel: normalizedQuality,
          projectContext,
          generatedBy: 'user-items-fallback'
        }
      };

      fallbackQuote.meta = {
        ...(fallbackQuote.meta ?? {}),
        projectContext,
        qualityLevel: normalizedQuality,
        clientProfile: projectContext.clientProfile,
        projectType: projectContext.projectType,
        region: projectContext.region,
        estimateDetail: {
          scale: costEstimate.scale,
          baseTotal: costEstimate.baseTotal,
          appliedMultipliers: costEstimate.appliedMultipliers,
          blendedHistoricTotal: targetTotal,
          fallbackUsed: true
        },
        debug: {
          traceId: trace,
          timings: this.formatTimings({
            estimateProjectCost: estimateDuration
          }),
          flags: { fallback: true, usedLocalItems: true, usedLocalSummary: true },
          openAIModel: 'local-fallback',
          historySample: priceSuggestion?.similarQuotes?.map(entry => entry.id) ?? []
        }
      };

      return fallbackQuote;
    }

    // Si no hay items, usar generador normal
    return await this.generateFallbackQuote(
      projectDescription,
      clientName,
      priceRange,
      normalizedQuality,
      projectContext,
      adjustedCostEstimate,
      historySnippets,
      effectivePricingNote,
      traceId
    );
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
