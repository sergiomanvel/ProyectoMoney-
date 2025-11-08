/**
 * Plantillas de conceptos base por sector
 * Estas plantillas sirven como base para que la IA las contextualice según el proyecto específico
 */

export const sectorTemplates: Record<string, string[]> = {
  software: [
    'Descubrimiento de requerimientos y alcances funcionales',
    'Arquitectura técnica y diseño de soluciones escalables',
    'Diseño de interfaz y experiencia de usuario (UI/UX)',
    'Desarrollo backend y gestión de base de datos',
    'Implementación de frontend responsivo y accesible',
    'Integración de APIs externas y servicios de terceros',
    'Pruebas QA automatizadas y control de calidad',
    'Despliegue DevOps y soporte de estabilización',
    'Documentación técnica y transferencia de conocimiento',
    'Capacitación y soporte post-lanzamiento'
  ],

  marketing: [
    'Auditoría de marca y análisis de competencia',
    'Definición de estrategia integral de marketing digital',
    'Planificación editorial y calendarización de contenidos',
    'Producción de piezas creativas y copywriting',
    'Gestión de pauta publicitaria y optimización de campañas',
    'Administración de redes sociales y community management',
    'Automatización de flujos de nurturing y CRM',
    'Medición de KPI, analítica y reporting ejecutivo',
    'Presentación de insights y recomendaciones de mejora'
  ],

  construccion: [
    'Estudios preliminares y preparación del sitio',
    'Movimiento de tierras y cimentación estructural',
    'Levantamiento de estructura y obra gris',
    'Instalaciones hidráulicas, eléctricas y especiales',
    'Acabados interiores y exteriores',
    'Supervisión técnica y control de calidad',
    'Gestión de seguridad y cumplimiento normativo',
    'Limpieza, entrega final y documentación de cierre'
  ],

  consultoria: [
    'Levantamiento de información y entrevistas clave',
    'Análisis diagnósticos y benchmarking sectorial',
    'Diseño de plan estratégico y hoja de ruta',
    'Facilitación de sesiones ejecutivas y workshops',
    'Definición de indicadores y tableros de control',
    'Acompañamiento en la implementación de iniciativas',
    'Gestión del cambio y coaching gerencial',
    'Seguimiento de resultados y soporte post-implementación'
  ],

  eventos: [
    'Conceptualización creativa y diseño del evento',
    'Plan maestro de producción y cronograma operativo',
    'Selección y negociación con proveedores especializados',
    'Diseño de escenografía, ambientación y señalética',
    'Coordinación de montaje técnico (audio, video, iluminación)',
    'Gestión de hospitality y atención a invitados',
    'Operación en sitio y control del programa en vivo',
    'Desmontaje, cierre logístico y post mortem del evento',
    'Entrega de memorias fotográficas y KPIs del evento'
  ],

  comercio: [
    'Diagnóstico de operación comercial y experiencia de compra',
    'Optimización de layout, planogramas y visual merchandising',
    'Implementación de estrategias omnicanal y CRM',
    'Gestión de inventarios y abastecimiento inteligente',
    'Diseño de campañas de fidelización y programas de lealtad',
    'Capacitación al equipo comercial y protocolos de servicio',
    'Automatización de reportes y tableros de ventas',
    'Seguimiento de indicadores y recomendaciones continuas'
  ],

  manufactura: [
    'Mapeo y análisis de procesos productivos',
    'Rediseño de layout y balanceo de línea de producción',
    'Implementación de metodologías Lean y mejora continua',
    'Automatización de controles de calidad y trazabilidad',
    'Gestión de mantenimiento preventivo y TPM',
    'Estandarización de procedimientos y documentación técnica',
    'Capacitación del personal operativo y mandos medios',
    'Implementación de indicadores OEE y analítica de planta'
  ],

  formacion: [
    'Detección de necesidades y definición del plan formativo',
    'Diseño instruccional y estructura curricular',
    'Producción de materiales didácticos y recursos interactivos',
    'Impartición de sesiones sincrónicas y asincrónicas',
    'Evaluación del aprendizaje y retroalimentación personalizada',
    'Acompañamiento en la aplicación práctica en el puesto',
    'Certificación de participantes y emisión de constancias',
    'Seguimiento post-capacitación y medición de impacto'
  ],

  ecommerce: [
    'Configuración técnica y seguridad de la plataforma ecommerce',
    'Diseño de experiencia de usuario y personalización de interfaz',
    'Carga y optimización de catálogo de productos',
    'Integración de pasarelas de pago y logística de envíos',
    'Implementación de automatizaciones de marketing y remarketing',
    'Configuración de analítica, fidelización y CRM',
    'Capacitación del equipo en operación diaria y soporte',
    'Plan de lanzamiento y optimización continua de conversiones'
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
    'Levantamiento topográfico, normativo y programa arquitectónico': 'Levantamiento topográfico y normativo para',
    'Conceptualización y anteproyecto con plantas, alzados y renders': 'Desarrollo de anteproyecto arquitectónico de',
    'Proyecto arquitectónico ejecutivo con detalles constructivos y acabados': 'Proyecto arquitectónico ejecutivo con detalles de',
    'Coordinación de ingenierías estructurales, instalaciones y sostenibilidad': 'Coordinación integral de ingenierías y especialidades para',
    'Gestión de tramitología, licencias y documentación para permisos': 'Gestión de tramitología y licencias para',
    'Supervisión arquitectónica y control de calidad durante la obra': 'Supervisión arquitectónica y control de calidad en',
    'Revisión de pruebas, listas de punch list y entrega de obra conforme': 'Administración de punch list y entrega conforme de',
    'Elaboración de planos as-built, memoria descriptiva y manuales de uso': 'Elaboración de planos as-built y documentación final de'
  },

  contratista: {
    'Planeación de obra, logística y habilitación de frente de trabajo': 'Planeación ejecutiva y habilitación de frentes para',
    'Suministro de materiales certificados y gestión de proveedores': 'Suministro de materiales certificados para',
    'Ejecución de obra civil, albañilerías y estructura': 'Ejecución de obra civil y estructura de',
    'Instalaciones eléctricas, hidráulicas y sistemas especiales': 'Instalaciones especializadas para',
    'Supervisión de seguridad industrial y control de calidad': 'Supervisión de seguridad y control de calidad en',
    'Acabados finos, herrería, carpintería y detalles de cierre': 'Instalación de acabados y detalles finales para',
    'Puesta en marcha de sistemas y pruebas funcionales': 'Puesta en marcha y pruebas funcionales de',
    'Limpieza profunda, entrega final y documentación de garantía': 'Limpieza final y entrega con garantías de'
  },

  software: {
    'Descubrimiento de requerimientos y alcances funcionales': 'Descubrimiento de requerimientos y alcance de',
    'Arquitectura técnica y diseño de soluciones escalables': 'Definición de arquitectura técnica para',
    'Diseño de interfaz y experiencia de usuario (UI/UX)': 'Diseño de experiencias UI/UX para',
    'Desarrollo backend y gestión de base de datos': 'Implementación de backend y base de datos para',
    'Implementación de frontend responsivo y accesible': 'Desarrollo de frontend responsivo para',
    'Integración de APIs externas y servicios de terceros': 'Integración de servicios y APIs para',
    'Pruebas QA automatizadas y control de calidad': 'Ejecución de pruebas QA automatizadas de',
    'Despliegue DevOps y soporte de estabilización': 'Despliegue continuo y soporte de',
    'Documentación técnica y transferencia de conocimiento': 'Documentación técnica y transferencia de',
    'Capacitación y soporte post-lanzamiento': 'Capacitación y soporte operativo post-lanzamiento de'
  },

  marketing: {
    'Auditoría de marca y análisis de competencia': 'Auditoría de marca y análisis competitivo de',
    'Definición de estrategia integral de marketing digital': 'Diseño de estrategia digital integral para',
    'Planificación editorial y calendarización de contenidos': 'Planificación editorial y calendarización para',
    'Producción de piezas creativas y copywriting': 'Producción creativa y copywriting para',
    'Gestión de pauta publicitaria y optimización de campañas': 'Gestión de pauta y optimización de campañas para',
    'Administración de redes sociales y community management': 'Administración y community management de',
    'Automatización de flujos de nurturing y CRM': 'Implementación de automatizaciones y CRM para',
    'Medición de KPI, analítica y reporting ejecutivo': 'Analítica de resultados y reporting de',
    'Presentación de insights y recomendaciones de mejora': 'Presentación de insights y recomendaciones para'
  },

  construccion: {
    'Estudios preliminares y preparación del sitio': 'Estudios preliminares y preparación del sitio para',
    'Movimiento de tierras y cimentación estructural': 'Movimiento de tierras y cimentación de',
    'Levantamiento de estructura y obra gris': 'Levantamiento de estructura y obra gris de',
    'Instalaciones hidráulicas, eléctricas y especiales': 'Instalaciones hidráulicas, eléctricas y especiales de',
    'Acabados interiores y exteriores': 'Aplicación de acabados interiores y exteriores para',
    'Supervisión técnica y control de calidad': 'Supervisión técnica y control de calidad de',
    'Gestión de seguridad y cumplimiento normativo': 'Gestión de seguridad y cumplimiento normativo en',
    'Limpieza, entrega final y documentación de cierre': 'Limpieza final y documentación de cierre para'
  },

  consultoria: {
    'Levantamiento de información y entrevistas clave': 'Levantamiento de información estratégica para',
    'Análisis diagnósticos y benchmarking sectorial': 'Análisis diagnóstico y benchmarking de',
    'Diseño de plan estratégico y hoja de ruta': 'Diseño de plan estratégico y hoja de ruta para',
    'Facilitación de sesiones ejecutivas y workshops': 'Facilitación de workshops y sesiones ejecutivas para',
    'Definición de indicadores y tableros de control': 'Definición de indicadores y tableros de control para',
    'Acompañamiento en la implementación de iniciativas': 'Acompañamiento en la implementación de iniciativas de',
    'Gestión del cambio y coaching gerencial': 'Gestión del cambio y coaching gerencial en',
    'Seguimiento de resultados y soporte post-implementación': 'Seguimiento de resultados y soporte post-implementación para'
  },

  eventos: {
    'Conceptualización creativa y diseño del evento': 'Conceptualización creativa y diseño del evento de',
    'Plan maestro de producción y cronograma operativo': 'Plan maestro de producción y cronograma para',
    'Selección y negociación con proveedores especializados': 'Selección y negociación con proveedores para',
    'Diseño de escenografía, ambientación y señalética': 'Diseño de escenografía y ambientación para',
    'Coordinación de montaje técnico (audio, video, iluminación)': 'Coordinación de montaje técnico para',
    'Gestión de hospitality y atención a invitados': 'Gestión de hospitality y atención al público de',
    'Operación en sitio y control del programa en vivo': 'Operación en sitio y control del programa para',
    'Desmontaje, cierre logístico y post mortem del evento': 'Desmontaje y cierre logístico del evento de',
    'Entrega de memorias fotográficas y KPIs del evento': 'Entrega de memorias y KPIs del evento de'
  },

  comercio: {
    'Diagnóstico de operación comercial y experiencia de compra': 'Diagnóstico de operación comercial y experiencia de compra de',
    'Optimización de layout, planogramas y visual merchandising': 'Optimización de layout y visual merchandising de',
    'Implementación de estrategias omnicanal y CRM': 'Implementación de estrategias omnicanal y CRM para',
    'Gestión de inventarios y abastecimiento inteligente': 'Gestión de inventarios y abastecimiento para',
    'Diseño de campañas de fidelización y programas de lealtad': 'Diseño de programas de fidelización para',
    'Capacitación al equipo comercial y protocolos de servicio': 'Capacitación comercial y protocolos de servicio para',
    'Automatización de reportes y tableros de ventas': 'Automatización de reportes y tableros de ventas para',
    'Seguimiento de indicadores y recomendaciones continuas': 'Seguimiento de indicadores y recomendaciones para'
  },

  manufactura: {
    'Mapeo y análisis de procesos productivos': 'Mapeo y análisis de procesos productivos de',
    'Rediseño de layout y balanceo de línea de producción': 'Rediseño de layout y balanceo de línea para',
    'Implementación de metodologías Lean y mejora continua': 'Implementación de metodologías Lean para',
    'Automatización de controles de calidad y trazabilidad': 'Automatización de controles de calidad en',
    'Gestión de mantenimiento preventivo y TPM': 'Gestión de mantenimiento preventivo para',
    'Estandarización de procedimientos y documentación técnica': 'Estandarización de procedimientos y documentación para',
    'Capacitación del personal operativo y mandos medios': 'Capacitación operativa y de mandos medios en',
    'Implementación de indicadores OEE y analítica de planta': 'Implementación de indicadores OEE y analítica en'
  },

  formacion: {
    'Detección de necesidades y definición del plan formativo': 'Detección de necesidades y plan formativo de',
    'Diseño instruccional y estructura curricular': 'Diseño instruccional y estructura curricular para',
    'Producción de materiales didácticos y recursos interactivos': 'Producción de materiales didácticos para',
    'Impartición de sesiones sincrónicas y asincrónicas': 'Impartición de sesiones formativas para',
    'Evaluación del aprendizaje y retroalimentación personalizada': 'Evaluación de aprendizaje y retroalimentación en',
    'Acompañamiento en la aplicación práctica en el puesto': 'Acompañamiento en la aplicación práctica de',
    'Certificación de participantes y emisión de constancias': 'Certificación de participantes de',
    'Seguimiento post-capacitación y medición de impacto': 'Seguimiento post-capacitación y medición de impacto en'
  },

  ecommerce: {
    'Configuración técnica y seguridad de la plataforma ecommerce': 'Configuración técnica y seguridad de la tienda de',
    'Diseño de experiencia de usuario y personalización de interfaz': 'Diseño de experiencia de usuario y personalización para',
    'Carga y optimización de catálogo de productos': 'Optimización del catálogo de productos de',
    'Integración de pasarelas de pago y logística de envíos': 'Integración de pagos y logística para',
    'Implementación de automatizaciones de marketing y remarketing': 'Implementación de automatizaciones y remarketing para',
    'Configuración de analítica, fidelización y CRM': 'Configuración de analítica y CRM para',
    'Capacitación del equipo en operación diaria y soporte': 'Capacitación del equipo operativo de',
    'Plan de lanzamiento y optimización continua de conversiones': 'Plan de lanzamiento y optimización de conversiones para'
  },

  general: {
    'Servicio profesional solicitado': 'Prestación del servicio profesional de',
    'Gestión administrativa y documentación': 'Gestión administrativa y documentación del proyecto de',
    'Entrega y cierre del servicio': 'Entrega final y cierre del servicio de'
  }
};

