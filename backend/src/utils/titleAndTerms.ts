/**
 * Utilidades para generar títulos y términos de cotización específicos por sector
 */

/**
 * Construye un título profesional según el sector
 */
export function buildQuoteTitle(description: string, sector?: string, archContext?: { isArchitecture: boolean; mode: "architect" | "contractor"; subtype?: "anteproyecto" | "full" }): string {
  const desc = description.toLowerCase().trim();
  
  // Extraer palabras clave del proyecto para el título
  let projectKeywords = extractKeywords(description);
  
  // Si es arquitectura en modo arquitecto, títulos especiales
  if (archContext?.isArchitecture && archContext.mode === "architect") {
    // ⚡ ANTEPROYECTO: Título específico
    if (archContext?.subtype === "anteproyecto") {
      // Buscar superficie en la descripción (ej: "160 m²" o "160 m2")
      const surfaceMatch = desc.match(/(\d+)\s*m²|\b(\d+)\s*m2/);
      const surface = surfaceMatch ? (surfaceMatch[1] || surfaceMatch[2]) : null;
      
      if (desc.includes('vivienda') || desc.includes('casa') || desc.includes('residencial')) {
        return surface 
          ? `Propuesta técnica y económica para anteproyecto arquitectónico de vivienda unifamiliar (${surface} m²)`
          : `Propuesta técnica y económica para anteproyecto arquitectónico de vivienda unifamiliar`;
      }
      if (desc.includes('comercial') || desc.includes('local') || desc.includes('oficinas')) {
        return `Propuesta técnica y económica para anteproyecto arquitectónico de local comercial`;
      }
      return `Propuesta técnica y económica para anteproyecto arquitectónico`;
    }
    
    // PROYECTO COMPLETO
    if (desc.includes('vivienda') || desc.includes('casa') || desc.includes('residencial')) {
      return `Propuesta técnica y económica para proyecto arquitectónico integral${projectKeywords ? ` - ${projectKeywords}` : ''}`;
    }
    if (desc.includes('comercial') || desc.includes('oficinas')) {
      return `Desarrollo de proyecto arquitectónico y dirección de obra${projectKeywords ? ` - ${projectKeywords}` : ''}`;
    }
    return `Propuesta técnica y económica para proyecto arquitectónico${projectKeywords ? ` - ${projectKeywords}` : ''}`;
  }
  
  switch (sector) {
    case 'software':
      // Títulos para software
      if (desc.includes('web') || desc.includes('sitio') || desc.includes('página')) {
        return `Cotización para desarrollo de sitio web${projectKeywords ? ` - ${projectKeywords}` : ''}`;
      }
      if (desc.includes('app') || desc.includes('aplicacion') || desc.includes('móvil')) {
        return `Cotización para desarrollo de aplicación móvil${projectKeywords ? ` - ${projectKeywords}` : ''}`;
      }
      if (desc.includes('sistema') || desc.includes('plataforma')) {
        return `Cotización para desarrollo de sistema${projectKeywords ? ` - ${projectKeywords}` : ''}`;
      }
      if (desc.includes('tienda') || desc.includes('ecommerce') || desc.includes('online')) {
        return `Cotización para tienda online${projectKeywords ? ` - ${projectKeywords}` : ''}`;
      }
      return `Cotización para desarrollo de software${projectKeywords ? ` - ${projectKeywords}` : ''}`;
    
    case 'marketing':
      if (desc.includes('redes sociales') || desc.includes('social media')) {
        return `Propuesta de gestión de redes sociales${projectKeywords ? ` - ${projectKeywords}` : ''}`;
      }
      if (desc.includes('publicidad') || desc.includes('anuncios') || desc.includes('ads')) {
        return `Propuesta de campaña publicitaria${projectKeywords ? ` - ${projectKeywords}` : ''}`;
      }
      if (desc.includes('contenidos') || desc.includes('content')) {
        return `Propuesta de creación de contenidos${projectKeywords ? ` - ${projectKeywords}` : ''}`;
      }
      if (desc.includes('branding') || desc.includes('identidad')) {
        return `Propuesta de branding e identidad visual${projectKeywords ? ` - ${projectKeywords}` : ''}`;
      }
      return `Propuesta de servicios de marketing digital${projectKeywords ? ` - ${projectKeywords}` : ''}`;
    
    case 'construccion':
      if (desc.includes('reforma') || desc.includes('remodelacion')) {
        return `Presupuesto de reforma${projectKeywords ? ` - ${projectKeywords}` : ''}`;
      }
      if (desc.includes('obra nueva') || desc.includes('construccion nueva')) {
        return `Presupuesto de obra nueva${projectKeywords ? ` - ${projectKeywords}` : ''}`;
      }
      if (desc.includes('instalacion') || desc.includes('instalación')) {
        return `Presupuesto de instalación${projectKeywords ? ` - ${projectKeywords}` : ''}`;
      }
      return `Presupuesto de servicios técnicos${projectKeywords ? ` - ${projectKeywords}` : ''}`;
    
    case 'eventos':
      if (desc.includes('boda') || desc.includes('matrimonio')) {
        return `Cotización para boda${projectKeywords ? ` - ${projectKeywords}` : ''}`;
      }
      if (desc.includes('corporativo') || desc.includes('empresarial')) {
        return `Cotización para evento corporativo${projectKeywords ? ` - ${projectKeywords}` : ''}`;
      }
      if (desc.includes('cumpleaños') || desc.includes('fiesta')) {
        return `Cotización para fiesta${projectKeywords ? ` - ${projectKeywords}` : ''}`;
      }
      return `Cotización para evento${projectKeywords ? ` - ${projectKeywords}` : ''}`;
    
    case 'consultoria':
      return `Propuesta de consultoría${projectKeywords ? ` - ${projectKeywords}` : ''}`;
    
    case 'formacion':
      return `Cotización para servicios de formación${projectKeywords ? ` - ${projectKeywords}` : ''}`;
    
    default:
      // Título genérico pero profesional
      return `Cotización de servicios profesionales${projectKeywords ? ` - ${projectKeywords}` : ''}`;
  }
}

/**
 * Extrae palabras clave cortas del proyecto para el título
 */
function extractKeywords(description: string): string {
  const desc = description.toLowerCase().trim();
  
  // Palabras clave a buscar
  const keywords = [
    'sistema de gestion',
    'app de citas',
    'citas medicas',
    'portal de pacientes',
    'ecommerce',
    'tienda online',
    'campaña de',
    'evento corporativo',
    'reforma integral',
    'obra nueva'
  ];
  
  for (const keyword of keywords) {
    if (desc.includes(keyword)) {
      return keyword.charAt(0).toUpperCase() + keyword.slice(1);
    }
  }
  
  return '';
}

/**
 * Construye términos y condiciones específicos por sector
 */
export function buildQuoteTerms(sector?: string, archContext?: { isArchitecture: boolean; mode: "architect" | "contractor"; subtype?: "anteproyecto" | "full" }): string[] {
  // Si es arquitectura en modo arquitecto, términos especiales
  if (archContext?.isArchitecture && archContext.mode === "architect") {
    // ⚡ ANTEPROYECTO: Términos específicos (alcance limitado)
    if (archContext?.subtype === "anteproyecto") {
      return [
        'Alcance limitado a la fase de ANTEPROYECTO arquitectónico.',
        'No incluye desarrollo de proyecto ejecutivo, cálculo estructural ni dirección de obra.',
        'Se incluyen hasta 2 revisiones del anteproyecto sin costo adicional.',
        'La propuesta es válida por 30 días naturales.',
        'Forma de pago sugerida: 60% al iniciar, 40% a la entrega del anteproyecto.',
        'Las estimaciones de materiales que se incluyan son de carácter preliminar y deberán validarse en el proyecto ejecutivo.'
      ];
    }
    
    // PROYECTO COMPLETO
    return [
      'Honorarios profesionales para proyecto arquitectónico, dirección y supervisión de obra.',
      'Los planos y documentos técnicos cumplen con normativas vigentes (Reglamento de Construcción, NOMs aplicables).',
      'Pago por fases: 40% al iniciar, 40% a la mitad, 20% al finalizar.',
      'La propuesta incluye hasta 2 revisiones de planos sin costo adicional.',
      'Modificaciones mayores al proyecto original se facturarán aparte.',
      'El proyecto incluye memoria descriptiva, especificaciones técnicas y cálculo de instalaciones.',
      'Esta propuesta es válida por 30 días naturales.'
    ];
  }
  
  switch (sector) {
    case 'software':
      return [
        'Los precios incluyen desarrollo y pruebas conforme al alcance acordado.',
        'Pago: 50% al inicio y 50% al término de la entrega.',
        'Plazo estimado de entrega será acordado en firma de contrato.',
        'Soporte incluido por 30 días posteriores a la entrega.',
        'Modificaciones fuera del alcance inicial generarán costos adicionales.',
        'Los archivos fuente quedan en propiedad del cliente al cierre del proyecto.',
        'Esta cotización es válida por 15 días naturales.'
      ];
    
    case 'marketing':
      return [
        'Pago mensual anticipado. Tarjetas o transferencia bancaria.',
        'Se requiere aprobación del cliente para producción de materiales.',
        'Plazo de producción estándar: 5-10 días laborables.',
        'Revisión de métricas y reportes mensuales incluidos.',
        'Cancelación con 15 días de anticipación.',
        'Materiales adicionales (fotografías, modelos, etc.) se cotizan aparte.',
        'Esta propuesta es válida por 30 días naturales.'
      ];
    
    case 'construccion':
      return [
        'Precios sujetos a confirmación previa inspección del área.',
        'No incluye licencias o permisos municipales.',
        'Forma de pago: 40% anticipado, 40% a mitad de obra, 20% al finalizar.',
        'Variaciones de materiales y mano de obra se facturarán según avance.',
        'Garantía de 12 meses en mano de obra ejecutada.',
        'Cliente aportará instalaciones eléctricas y sanitarias existentes.',
        'Esta cotización es válida por 15 días naturales.'
      ];
    
    case 'eventos':
      return [
        'Reserva confirmada con 50% anticipado.',
        'Servicios adicionales disponibles bajo solicitud.',
        'Cancelación con 7 días de anticipación: reembolso del 50%.',
        'Menores de edad deben estar acompañados por adultos.',
        'Dependencias y cambios de fecha sujetos a disponibilidad.',
        'Montaje y desmontaje incluido en horario acordado.',
        'Esta cotización es válida por 10 días naturales.'
      ];
    
    case 'consultoria':
      return [
        'Honorarios de consultoría según horas trabajadas.',
        'Facturación mensual por horas consumidas.',
        'Acceso a recursos y documentación durante el proyecto.',
        'Reportes de seguimiento incluidos.',
        'Cancelación con 7 días de anticipación.',
        'Confidencialidad y NDA incluidos en términos.',
        'Esta propuesta es válida por 20 días naturales.'
      ];
    
    case 'formacion':
      return [
        'Capacitación presencial o virtual según acuerdo.',
        'Material didáctico y certificado incluidos.',
        'Pago: 100% anticipado para confirmar fechas.',
        'Mínimo de 5 participantes para abrir curso.',
        'Reagendación con 7 días de anticipación.',
        'Evaluación y seguimiento post-capacitación incluidos.',
        'Esta cotización es válida por 30 días naturales.'
      ];
    
    default:
      // Términos genéricos pero profesionales
      return [
        'Los precios son válidos para el alcance descrito en esta cotización.',
        'Pago: condiciones a acordar según proyecto.',
        'Tiempo de entrega será confirmado al formalizar el servicio.',
        'Modificaciones fuera del alcance generarán costos adicionales.',
        'Se requiere aprobación del cliente para inicio de trabajos.',
        'Servicios sujetos a disponibilidad y confirmación de recursos.',
        'Esta cotización es válida por 15 días naturales.'
      ];
  }
}

/**
 * Construye timeline de plazos y entregas según sector
 */
export function buildQuoteTimeline(sector?: string, archContext?: { isArchitecture: boolean; mode: "architect" | "contractor"; subtype?: "anteproyecto" | "full" }): string[] | undefined {
  // Solo generar timeline para arquitectura en modo arquitecto
  if (archContext?.isArchitecture && archContext.mode === "architect") {
    // ⚡ ANTEPROYECTO: Timeline más corto (solo fase preliminar)
    if (archContext?.subtype === "anteproyecto") {
      return [
        'Recolección de información y levantamiento: 3-5 días hábiles',
        'Presentación de anteproyecto arquitectónico: 1-2 semanas tras levantamiento',
        'Revisión con el cliente y ajustes: 3-5 días hábiles',
        'Entrega final de planos y memoria: 2-3 días hábiles después de la aprobación'
      ];
    }
    
    // PROYECTO COMPLETO
    return [
      'Fase 1 y 2 (Levantamiento + Anteproyecto): 3 semanas',
      'Fase 3 (Proyecto Ejecutivo): 4 semanas',
      'Fase 4 y 5 (Coordinación + Supervisión): según cronograma de obra',
      'Fase 6 (Entrega Final): 1 semana tras cierre técnico'
    ];
  }
  
  return undefined;
}

