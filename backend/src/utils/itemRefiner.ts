/**
 * Refinador de items para hacerlos más específicos y profesionales
 */

export interface Item {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

/**
 * Refina las descripciones de items usando OpenAI o mapeo local
 */
export async function refineItemsByContext(
  items: Item[],
  projectDescription: string,
  sector?: string,
  openai?: any
): Promise<Item[]> {
  // Intentar con OpenAI si está disponible
  if (openai) {
    try {
      return await refineWithOpenAI(items, projectDescription, sector, openai);
    } catch (error) {
      console.warn('⚠️ OpenAI falló para refinamiento de items, usando mapeo local');
      return refineWithLocalMapping(items, sector);
    }
  }
  
  // Si no hay OpenAI, usar mapeo local
  return refineWithLocalMapping(items, sector);
}

/**
 * Refina items usando OpenAI
 */
async function refineWithOpenAI(
  items: Item[],
  projectDescription: string,
  sector: string | undefined,
  openai: any
): Promise<Item[]> {
  const descriptionsOnly = items.map(item => item.description);
  
  const prompt = `Eres un experto en redacción de cotizaciones profesionales. 
Reescribe estos conceptos de forma más específica y profesional para una cotización del sector ${sector || 'general'}.
Usa el contexto: "${projectDescription.substring(0, 200)}"

Conceptos a reescribir:
${descriptionsOnly.map((d, i) => `${i + 1}. ${d}`).join('\n')}

IMPORTANTE:
- Devuelve SOLO un array JSON con las descripciones reescritas en el mismo orden.
- Ejemplo: ["Descripción 1", "Descripción 2", ...]
- Mantén el tono profesional.
- No cambies la categoría de cada concepto (análisis sigue siendo análisis, diseño sigue siendo diseño).
- Español formal.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'Respondes ÚNICAMENTE con un array JSON de strings. Sin explicaciones ni markdown.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.5,
    max_tokens: 500
  });

  const content = response.choices[0]?.message?.content?.trim();
  if (!content) {
    throw new Error('Respuesta vacía de OpenAI');
  }

  // Limpiar markdown code blocks si existen
  const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const refinedDescriptions = JSON.parse(cleanedContent);

  // Mapear las descripciones refinadas de vuelta a los items
  return items.map((item, index) => ({
    ...item,
    description: refinedDescriptions[index] || item.description
  }));
}

/**
 * Refina items usando mapeo local por sector
 */
function refineWithLocalMapping(items: Item[], sector?: string): Item[] {
  return items.map(item => {
    const desc = item.description.toLowerCase().trim();
    const refined = applyLocalRefinement(desc, sector);
    return {
      ...item,
      description: refined
    };
  });
}

/**
 * Aplica refinamiento local según palabras clave
 */
function applyLocalRefinement(description: string, sector?: string): string {
  // Prefijos profesionales por sector
  const prefixes: Record<string, Record<string, string>> = {
    software: {
      'análisis': 'Análisis funcional y técnico de',
      'diseno': 'Diseño de interfaz y experiencia de usuario para',
      'desarrollo': 'Desarrollo de sistema',
      'backend': 'Desarrollo de backend con',
      'frontend': 'Desarrollo de frontend con',
      'integracion': 'Integración de servicios y APIs para',
      'pruebas': 'Pruebas y validación de',
      'testing': 'Pruebas de calidad y testing de',
      'soporte': 'Soporte técnico y mantenimiento de',
      'mantenimiento': 'Mantenimiento y actualización de',
      'documentacion': 'Documentación técnica de',
      'capacitacion': 'Capacitación de usuarios en',
      'formacion': 'Formación del equipo en'
    },
    marketing: {
      'estrategia': 'Desarrollo de estrategia de marketing para',
      'diseno': 'Diseño de material gráfico y visual para',
      'contenidos': 'Creación de contenidos para',
      'redes sociales': 'Gestión de redes sociales de',
      'publicidad': 'Producción de campaña publicitaria de',
      'ads': 'Gestión de campañas de publicidad online para',
      'campaña': 'Ejecución de campaña promocional de',
      'video': 'Producción de video para',
      'fotografia': 'Fotografía profesional de',
      'edicion': 'Edición y post-producción de',
      'community': 'Gestión de comunidad online de',
      'analytics': 'Análisis de métricas y reportes de',
      'reportes': 'Reportes de resultados de'
    },
    construccion: {
      'materiales': 'Suministro de materiales para',
      'mano de obra': 'Mano de obra especializada para',
      'instalacion': 'Instalación profesional de',
      'diseno': 'Diseño arquitectónico de',
      'supervision': 'Supervisión técnica de',
      'permisos': 'Gestión de permisos y licencias para',
      'transport': 'Transporte y logística de',
      'limpieza': 'Limpieza y retiro de escombros de',
      'pintura': 'Pintura y acabados de',
      'electricidad': 'Instalación eléctrica de',
      'plomeria': 'Instalación de plomería y sanitarios de',
      'refacciones': 'Refacciones y reparaciones de'
    },
    general: {
      // Mapeo genérico para cualquier sector
      'análisis': 'Análisis y evaluación de',
      'diseno': 'Diseño y planificación de',
      'desarrollo': 'Desarrollo e implementación de',
      'configuracion': 'Configuración y puesta en marcha de',
      'capacitacion': 'Capacitación y formación en',
      'soporte': 'Soporte y seguimiento de',
      'consultoria': 'Consultoría especializada en',
      'asesoria': 'Asesoría profesional en'
    }
  };

  const sectorPrefixes = sector && prefixes[sector] ? prefixes[sector] : prefixes.general;
  
  // Buscar coincidencias con palabras clave
  for (const [keyword, prefix] of Object.entries(sectorPrefixes)) {
    if (description.includes(keyword)) {
      // Capitalizar la primera letra de la descripción original
      const capitalized = description.charAt(0).toUpperCase() + description.slice(1);
      
      // Construir descripción refinada
      if (description.length > keyword.length) {
        // Si la descripción es más larga que la keyword, combinar
        const rest = description.substring(keyword.length).trim();
        return `${prefix} ${rest}`;
      } else {
        // Si la descripción solo contiene la keyword, usar solo el prefijo genérico
        return prefix.replace(' de', '').replace('para', '').replace(' en', '');
      }
    }
  }
  
  // Si no hay coincidencias, capitalizar y devolver
  return description.charAt(0).toUpperCase() + description.slice(1);
}

