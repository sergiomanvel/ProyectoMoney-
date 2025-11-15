/**
 * Generador de resúmenes comerciales para cotizaciones
 */

/**
 * Genera un resumen comercial profesional usando OpenAI o template local
 */
export async function generateCommercialSummary(
  projectDescription: string,
  clientName: string,
  total: number,
  openai?: any,
  archContext?: { isArchitecture: boolean; mode: "architect" | "contractor" },
  options?: { traceId?: string; onFallback?: () => void }
): Promise<string> {
  // Si OpenAI está disponible, generar resumen personalizado
  if (openai) {
    try {
      return await generateWithOpenAI(projectDescription, clientName, openai, archContext, options?.traceId);
    } catch (error) {
      const errMessage = error instanceof Error ? error.message : String(error);
      const openAIError = error as { name?: string; status?: number; error?: { type?: string } };
      if (options?.traceId) {
        console.warn(`[quote:${options.traceId}] ⚠️ OpenAI falló para resumen comercial, usando template local`, errMessage, {
          name: openAIError?.name,
          status: openAIError?.status,
          type: openAIError?.error?.type
        });
      } else {
        console.warn('⚠️ OpenAI falló para resumen comercial, usando template local', errMessage);
      }
      options?.onFallback?.();
      return generateLocalSummary(projectDescription, clientName, archContext);
    }
  }
  
  // Usar template local
  return generateLocalSummary(projectDescription, clientName, archContext);
}

/**
 * Genera resumen usando OpenAI
 */
async function generateWithOpenAI(
  projectDescription: string,
  clientName: string,
  openai: any,
  archContext?: { isArchitecture: boolean; mode: "architect" | "contractor" },
  traceId?: string
): Promise<string> {
  let prompt: string;
  
  if (archContext?.isArchitecture && archContext.mode === "architect") {
    prompt = `Redacta un breve párrafo comercial (1-2 frases máximo) para una propuesta de despacho de arquitectura. Usa tono técnico y profesional.

Descripción del proyecto: "${projectDescription.substring(0, 300)}"
Cliente: ${clientName}

IMPORTANTE:
- Solo 1-2 frases.
- Tono técnico y profesional de despacho de arquitectura.
- Agradece y presenta la propuesta arquitectónica.
- Menciona: diseño, documentación técnica, supervisión, garantías de calidad arquitectónica, cumplimiento normativo.
- Ejemplo: "Agradecemos la oportunidad de colaborar en el desarrollo de su proyecto. Esta propuesta detalla el alcance de nuestras fases de diseño, documentación técnica y supervisión de obra, garantizando la calidad arquitectónica y el cumplimiento normativo en cada etapa."

Responde SOLO con el párrafo, sin comillas ni markdown.`;
  } else {
    prompt = `Redacta un breve párrafo comercial (1-2 frases máximo) agradeciendo el interés y presentando la propuesta técnica y económica para el siguiente proyecto. 
Usa tono formal y profesional en español.

Descripción del proyecto: "${projectDescription.substring(0, 300)}"
Cliente: ${clientName}

IMPORTANTE:
- Solo 1-2 frases.
- Tono profesional y cortés.
- Agradece, presenta la propuesta.
- Sin enumeraciones ni viñetas.
- Ejemplo de estilo: "Gracias por confiar en nosotros para su proyecto. A continuación presentamos nuestra propuesta técnica y económica."

Responde SOLO con el párrafo, sin comillas ni markdown.`;
  }

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'Respondes ÚNICAMENTE con el párrafo solicitado. Sin explicaciones ni formato adicional.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.6,
    max_tokens: 100
  });

  const summary = response.choices[0]?.message?.content?.trim();
  if (!summary) {
    throw new Error('Resumen vacío de OpenAI');
  }

  if (traceId) {
    console.log(`[quote:${traceId}] 📝 Resumen comercial generado con OpenAI`, {
      model: 'gpt-4o-mini',
      promptTokens: response.usage?.prompt_tokens,
      completionTokens: response.usage?.completion_tokens
    });
  }

  // Limpiar comillas si existen
  return summary.replace(/^["']|["']$/g, '');
}

/**
 * Genera resumen usando template local
 */
function generateLocalSummary(projectDescription: string, clientName: string, archContext?: { isArchitecture: boolean; mode: "architect" | "contractor" }): string {
  // Si es arquitectura en modo arquitecto, resumen especial de despacho
  if (archContext?.isArchitecture && archContext.mode === "architect") {
    const variants = [
      `Agradecemos la oportunidad de colaborar en el desarrollo de su proyecto. Esta propuesta detalla el alcance de nuestras fases de diseño, documentación técnica y supervisión de obra, garantizando la calidad arquitectónica y el cumplimiento normativo en cada etapa.`,
      `Nos complace presentar nuestra propuesta técnica y económica para su proyecto arquitectónico. Nuestro equipo profesional abarcará las fases de anteproyecto, proyecto ejecutivo con detalles constructivos, coordinación de especialidades y supervisión técnica conforme a estándares de calidad.`,
      `Gracias por confiar en nuestro despacho para su proyecto. La propuesta contempla diseño arquitectónico integral, documentación técnica completa (planos, memoria y especificaciones), coordinación multidisciplinaria y acompañamiento durante la obra garantizando el cumplimiento normativo.`,
      `Es un honor poder participar en su proyecto arquitectónico. Nuestros servicios profesionales incluyen desarrollo de proyecto completo, supervisión técnica y entrega de documentación final (as-built), asegurando excelencia arquitectónica y conformidad con normativas vigentes.`
    ];
    const randomIndex = Math.floor(Math.random() * variants.length);
    return variants[randomIndex];
  }
  
  // Extraer palabras clave del proyecto
  const desc = projectDescription.toLowerCase();
  
  let contextInfo = '';
  if (desc.includes('web') || desc.includes('sitio') || desc.includes('página')) {
    contextInfo = 'para su sitio web';
  } else if (desc.includes('app') || desc.includes('aplicacion') || desc.includes('móvil')) {
    contextInfo = 'para su aplicación móvil';
  } else if (desc.includes('marketing') || desc.includes('publicidad')) {
    contextInfo = 'para su campaña de marketing';
  } else if (desc.includes('sistema')) {
    contextInfo = 'para su sistema';
  } else {
    contextInfo = 'para su proyecto';
  }
  
  // Variantes aleatorias para hacer cada cotización diferente
  const variants = [
    `Gracias por su interés en nuestros servicios. A continuación presentamos la propuesta técnica y económica ${contextInfo}. Si requiere ajustes, podemos adaptarla a sus necesidades específicas.`,
    `Agradecemos sinceramente la oportunidad de trabajar con ${clientName}. En las siguientes líneas detallamos nuestra propuesta técnica y económica ${contextInfo}.`,
    `Nos complace presentar la propuesta técnica y económica ${contextInfo}. Estamos a su disposición para cualquier aclaración o ajuste necesario.`,
    `Es un placer poder colaborar en este proyecto. A continuación encontrará la propuesta detallada ${contextInfo}, con todos los conceptos y condiciones claramente especificados.`
  ];
  
  // Seleccionar variante aleatoria
  const randomIndex = Math.floor(Math.random() * variants.length);
  return variants[randomIndex];
}

