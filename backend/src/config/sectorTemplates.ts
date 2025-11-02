/**
 * Plantillas de conceptos base por sector
 * Estas plantillas sirven como base para que la IA las contextualice según el proyecto específico
 */

export const sectorTemplates: Record<string, string[]> = {
  software: [
    'Análisis funcional del sistema',
    'Diseño de interfaz y experiencia de usuario (UI/UX)',
    'Desarrollo backend y base de datos',
    'Integración y pruebas',
    'Despliegue y soporte inicial'
  ],

  marketing: [
    'Estrategia y planificación de contenidos',
    'Creación de piezas gráficas y copy',
    'Programación y publicación en redes sociales',
    'Monitoreo de métricas y reporte de resultados'
  ],

  construccion: [
    'Suministro de materiales e insumos',
    'Mano de obra e instalación profesional',
    'Revisión técnica y puesta en marcha',
    'Limpieza y entrega final de la obra'
  ],

  consultoria: [
    'Reunión de levantamiento de información',
    'Análisis y elaboración de informe técnico',
    'Presentación de resultados y recomendaciones',
    'Seguimiento y soporte post-implementación'
  ],

  eventos: [
    'Planificación y diseño del evento',
    'Contratación de servicios y proveedores',
    'Coordinación logística y montaje',
    'Ejecución del evento y desmontaje',
    'Entrega de material y documentación'
  ],

  comercio: [
    'Revisión de inventario y catálogo',
    'Optimización de gestión comercial',
    'Implementación de estrategias de venta',
    'Capacitación al equipo comercial'
  ],

  manufactura: [
    'Análisis de procesos productivos',
    'Optimización de línea de producción',
    'Control de calidad y estandarización',
    'Capacitación de personal técnico'
  ],

  formacion: [
    'Elaboración de plan de capacitación',
    'Desarrollo de material didáctico',
    'Impartición de sesiones formativas',
    'Evaluación y certificación de participantes'
  ],

  ecommerce: [
    'Configuración de tienda online',
    'Diseño y personalización de plantilla',
    'Carga de catálogo de productos',
    'Configuración de métodos de pago y envío',
    'Capacitación y activación de la tienda'
  ],

  general: [
    'Servicio profesional solicitado',
    'Gestión administrativa y documentación',
    'Entrega y cierre del servicio'
  ]
};

/**
 * Prefijos para reescritura local por sector (cuando OpenAI no está disponible)
 * También incluye prefijos para arquitectura
 */
export const sectorRewritePrefixes: Record<string, Record<string, string>> = {
  arquitectura: {
    'Levantamiento de información, análisis del sitio y requisitos del cliente': 'Levantamiento de información técnica del sitio y',
    'Elaboración de anteproyecto arquitectónico (plantas, alzados, distribución)': 'Elaboración de anteproyecto arquitectónico para',
    'Desarrollo de proyecto ejecutivo: detalles constructivos, instalaciones, acabados': 'Desarrollo de proyecto ejecutivo arquitectónico de',
    'Coordinación con especialidades (estructuras, instalaciones, HVAC) si aplica': 'Coordinación técnica con especialidades para',
    'Supervisión técnica y control de obra conforme a planos aprobados': 'Supervisión técnica y control de cumplimiento normativo de',
    'Entrega de documentación final, planos actualizados (as-built) y memoria': 'Entrega de documentación final (as-built) y memoria técnica de'
  },

  contratista: {
    'Suministro de materiales e insumos según proyecto': 'Suministro de materiales e insumos para',
    'Mano de obra calificada para ejecución de obra civil e instalaciones': 'Mano de obra especializada para ejecución de',
    'Revisión técnica y control de calidad durante la obra': 'Supervisión técnica y control de calidad en',
    'Limpieza y entrega final de la obra': 'Limpieza y entrega final de'
  },

  software: {
    'Análisis funcional del sistema': 'Análisis funcional y técnico de',
    'Diseño de interfaz y experiencia de usuario (UI/UX)': 'Diseño de interfaz y experiencia de usuario para',
    'Desarrollo backend y base de datos': 'Desarrollo de backend y base de datos para',
    'Integración y pruebas': 'Integración y pruebas de',
    'Despliegue y soporte inicial': 'Despliegue y soporte técnico inicial de'
  },

  marketing: {
    'Estrategia y planificación de contenidos': 'Estrategia y planificación de contenidos para',
    'Creación de piezas gráficas y copy': 'Producción de material gráfico y copy para',
    'Programación y publicación en redes sociales': 'Programación y publicación en redes sociales de',
    'Monitoreo de métricas y reporte de resultados': 'Monitoreo y análisis de métricas de'
  },

  construccion: {
    'Suministro de materiales e insumos': 'Suministro de materiales e insumos para',
    'Mano de obra e instalación profesional': 'Mano de obra especializada e instalación de',
    'Revisión técnica y puesta en marcha': 'Supervisión técnica y puesta en marcha de',
    'Limpieza y entrega final de la obra': 'Limpieza y entrega de la obra de'
  },

  consultoria: {
    'Reunión de levantamiento de información': 'Reunión de levantamiento de información para',
    'Análisis y elaboración de informe técnico': 'Análisis y elaboración de informe técnico sobre',
    'Presentación de resultados y recomendaciones': 'Presentación de resultados y recomendaciones para',
    'Seguimiento y soporte post-implementación': 'Seguimiento y soporte post-implementación de'
  },

  eventos: {
    'Planificación y diseño del evento': 'Planificación y diseño integral del evento de',
    'Contratación de servicios y proveedores': 'Gestión de contratación de servicios y proveedores para',
    'Coordinación logística y montaje': 'Coordinación logística y montaje para',
    'Ejecución del evento y desmontaje': 'Ejecución y desmontaje del evento de',
    'Entrega de material y documentación': 'Entrega de material audiovisual y documentación de'
  },

  comercio: {
    'Revisión de inventario y catálogo': 'Análisis y revisión de inventario y catálogo de',
    'Optimización de gestión comercial': 'Optimización de procesos de gestión comercial para',
    'Implementación de estrategias de venta': 'Implementación de estrategias de venta para',
    'Capacitación al equipo comercial': 'Capacitación especializada al equipo comercial de'
  },

  manufactura: {
    'Análisis de procesos productivos': 'Análisis y evaluación de procesos productivos de',
    'Optimización de línea de producción': 'Optimización de línea de producción para',
    'Control de calidad y estandarización': 'Control de calidad y estandarización de',
    'Capacitación de personal técnico': 'Capacitación técnica del personal de'
  },

  formacion: {
    'Elaboración de plan de capacitación': 'Elaboración de plan de capacitación para',
    'Desarrollo de material didáctico': 'Desarrollo de material didáctico y recursos para',
    'Impartición de sesiones formativas': 'Impartición de sesiones formativas sobre',
    'Evaluación y certificación de participantes': 'Evaluación y certificación de participantes en'
  },

  ecommerce: {
    'Configuración de tienda online': 'Configuración y personalización de tienda online para',
    'Diseño y personalización de plantilla': 'Diseño y personalización de plantilla e-commerce para',
    'Carga de catálogo de productos': 'Carga y estructuración de catálogo de productos de',
    'Configuración de métodos de pago y envío': 'Configuración de métodos de pago y envío para',
    'Capacitación y activación de la tienda': 'Capacitación y puesta en marcha de la tienda online de'
  },

  general: {
    'Servicio profesional solicitado': 'Prestación del servicio profesional de',
    'Gestión administrativa y documentación': 'Gestión administrativa y documentación del proyecto de',
    'Entrega y cierre del servicio': 'Entrega final y cierre del servicio de'
  }
};

