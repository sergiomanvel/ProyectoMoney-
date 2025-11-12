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
    'Migración de datos y transformación de legacy',
    'Implementación de CI/CD y pipelines de despliegue',
    'Configuración de monitoreo y alertas (Sentry, DataDog)',
    'Optimización de rendimiento y escalabilidad',
    'Integración con servicios cloud (AWS, Azure, GCP)',
    'Implementación de seguridad y cumplimiento (GDPR, ISO 27001)',
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
    'Producción de video marketing y edición profesional',
    'Gestión de campañas en TikTok y Reels',
    'Gestión de pauta publicitaria y optimización de campañas',
    'Configuración de pixel de seguimiento y conversiones',
    'Implementación de automatizaciones de email marketing',
    'Creación de landing pages optimizadas para conversión',
    'Gestión de influenciadores y colaboraciones',
    'Administración de redes sociales y community management',
    'Automatización de flujos de nurturing y CRM',
    'Medición de KPI, analítica y reporting ejecutivo',
    'Presentación de insights y recomendaciones de mejora'
  ],

  construccion: [
    'Estudios preliminares y preparación del sitio',
    'Estudio de impacto ambiental y sostenibilidad',
    'Gestión de licencias urbanísticas y permisos',
    'Coordinación de certificaciones energéticas (LEED, BREEAM)',
    'Movimiento de tierras y cimentación estructural',
    'Levantamiento de estructura y obra gris',
    'Instalaciones hidráulicas, eléctricas y especiales',
    'Suministro de materiales certificados y homologados',
    'Gestión de seguridad y salud en obra (PRL)',
    'Control de calidad y ensayos de materiales',
    'Acabados interiores y exteriores',
    'Supervisión técnica y control de calidad',
    'Supervisión de cumplimiento normativo (CTE, DB-SI)',
    'Puesta en marcha de instalaciones y pruebas funcionales',
    'Limpieza, entrega final y documentación de cierre'
  ],

  consultoria: [
    'Levantamiento de información y entrevistas clave',
    'Análisis diagnósticos y benchmarking sectorial',
    'Análisis de procesos y optimización operativa',
    'Due diligence y análisis de mercado',
    'Diseño de plan estratégico y hoja de ruta',
    'Implementación de metodologías ágiles y transformación digital',
    'Facilitación de sesiones ejecutivas y workshops',
    'Definición de indicadores y tableros de control',
    'Diseño de estructura organizacional y roles',
    'Gestión de cambio organizacional y comunicación interna',
    'Acompañamiento en la implementación de iniciativas',
    'Gestión del cambio y coaching gerencial',
    'Seguimiento de resultados y soporte post-implementación'
  ],

  eventos: [
    'Conceptualización creativa y diseño del evento',
    'Plan maestro de producción y cronograma operativo',
    'Selección y negociación con proveedores especializados',
    'Diseño de escenografía, ambientación y señalética',
    'Producción de contenido audiovisual para streaming',
    'Configuración de plataformas virtuales (Zoom, Hopin, etc.)',
    'Gestión de acreditaciones y control de acceso',
    'Coordinación de transporte y alojamiento para invitados',
    'Producción de material gráfico y señalética',
    'Gestión de permisos y licencias para eventos públicos',
    'Coordinación de montaje técnico (audio, video, iluminación)',
    'Gestión de hospitality y atención a invitados',
    'Operación en sitio y control del programa en vivo',
    'Desmontaje, cierre logístico y post mortem del evento',
    'Entrega de memorias fotográficas y KPIs del evento'
  ],

  comercio: [
    'Diagnóstico de operación comercial y experiencia de compra',
    'Diseño de experiencia de compra y customer journey',
    'Optimización de layout, planogramas y visual merchandising',
    'Implementación de sistemas de punto de venta (POS)',
    'Gestión de escaparatismo y vitrinas',
    'Optimización de flujos de tráfico en tienda',
    'Implementación de estrategias omnicanal y CRM',
    'Gestión de inventarios y abastecimiento inteligente',
    'Implementación de programas de fidelización con tarjetas',
    'Diseño de campañas de fidelización y programas de lealtad',
    'Gestión de eventos y activaciones en tienda',
    'Capacitación al equipo comercial y protocolos de servicio',
    'Automatización de reportes y tableros de ventas',
    'Seguimiento de indicadores y recomendaciones continuas'
  ],

  manufactura: [
    'Mapeo y análisis de procesos productivos',
    'Rediseño de layout y balanceo de línea de producción',
    'Implementación de metodologías Lean y mejora continua',
    'Implementación de sistemas MES (Manufacturing Execution Systems)',
    'Integración de IoT y sensores para monitoreo en tiempo real',
    'Implementación de sistemas de trazabilidad y lotes',
    'Automatización de controles de calidad y trazabilidad',
    'Implementación de sistemas de gestión de calidad (SPC)',
    'Certificaciones ISO 9001, ISO 14001, IATF 16949',
    'Gestión de mantenimiento preventivo y TPM',
    'Estandarización de procedimientos y documentación técnica',
    'Optimización de cadena de suministro y logística',
    'Capacitación del personal operativo y mandos medios',
    'Implementación de indicadores OEE y analítica de planta'
  ],

  formacion: [
    'Detección de necesidades y definición del plan formativo',
    'Diseño instruccional y estructura curricular',
    'Diseño de experiencia de aprendizaje (LX Design)',
    'Producción de materiales didácticos y recursos interactivos',
    'Producción de contenido multimedia (videos, interactivos)',
    'Configuración de plataformas LMS (Moodle, Blackboard, etc.)',
    'Implementación de sistemas de gamificación',
    'Impartición de sesiones sincrónicas y asincrónicas',
    'Evaluación del aprendizaje y retroalimentación personalizada',
    'Diseño de programas de mentoring y acompañamiento',
    'Acompañamiento en la aplicación práctica en el puesto',
    'Evaluación de impacto y ROI de la formación',
    'Certificación de participantes y emisión de constancias',
    'Seguimiento post-capacitación y medición de impacto'
  ],

  ecommerce: [
    'Configuración técnica y seguridad de la plataforma ecommerce',
    'Configuración de multi-idioma y multi-moneda',
    'Diseño de experiencia de usuario y personalización de interfaz',
    'Carga y optimización de catálogo de productos',
    'Integración de pasarelas de pago y logística de envíos',
    'Implementación de programas de fidelización y puntos',
    'Integración con marketplaces (Amazon, eBay, Wallapop)',
    'Configuración de fulfillment y almacén',
    'Implementación de sistemas de recomendación y personalización',
    'Configuración de A/B testing y optimización de conversiones',
    'Implementación de automatizaciones de marketing y remarketing',
    'Configuración de analítica, fidelización y CRM',
    'Integración con ERP y sistemas de gestión',
    'Capacitación del equipo en operación diaria y soporte',
    'Plan de lanzamiento y optimización continua de conversiones'
  ],

  general: [
    'Análisis de necesidades y definición de alcances',
    'Diseño de solución y planificación del servicio',
    'Implementación del servicio y ejecución',
    'Seguimiento y soporte durante la prestación',
    'Documentación y entrega final del servicio'
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
    'Migración de datos y transformación de legacy': 'Migración de datos y transformación de sistemas legacy para',
    'Implementación de CI/CD y pipelines de despliegue': 'Implementación de pipelines CI/CD para',
    'Configuración de monitoreo y alertas (Sentry, DataDog)': 'Configuración de monitoreo y alertas para',
    'Optimización de rendimiento y escalabilidad': 'Optimización de rendimiento y escalabilidad de',
    'Integración con servicios cloud (AWS, Azure, GCP)': 'Integración con servicios cloud para',
    'Implementación de seguridad y cumplimiento (GDPR, ISO 27001)': 'Implementación de seguridad y cumplimiento normativo para',
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
    'Producción de video marketing y edición profesional': 'Producción de video marketing y edición para',
    'Gestión de campañas en TikTok y Reels': 'Gestión de campañas en TikTok y Reels para',
    'Gestión de pauta publicitaria y optimización de campañas': 'Gestión de pauta y optimización de campañas para',
    'Configuración de pixel de seguimiento y conversiones': 'Configuración de pixel de seguimiento y conversiones para',
    'Implementación de automatizaciones de email marketing': 'Implementación de automatizaciones de email marketing para',
    'Creación de landing pages optimizadas para conversión': 'Creación de landing pages optimizadas para',
    'Gestión de influenciadores y colaboraciones': 'Gestión de influenciadores y colaboraciones para',
    'Administración de redes sociales y community management': 'Administración y community management de',
    'Automatización de flujos de nurturing y CRM': 'Implementación de automatizaciones y CRM para',
    'Medición de KPI, analítica y reporting ejecutivo': 'Analítica de resultados y reporting de',
    'Presentación de insights y recomendaciones de mejora': 'Presentación de insights y recomendaciones para'
  },

  construccion: {
    'Estudios preliminares y preparación del sitio': 'Estudios preliminares y preparación del sitio para',
    'Estudio de impacto ambiental y sostenibilidad': 'Estudio de impacto ambiental y sostenibilidad para',
    'Gestión de licencias urbanísticas y permisos': 'Gestión de licencias urbanísticas y permisos para',
    'Coordinación de certificaciones energéticas (LEED, BREEAM)': 'Coordinación de certificaciones energéticas para',
    'Movimiento de tierras y cimentación estructural': 'Movimiento de tierras y cimentación de',
    'Levantamiento de estructura y obra gris': 'Levantamiento de estructura y obra gris de',
    'Instalaciones hidráulicas, eléctricas y especiales': 'Instalaciones hidráulicas, eléctricas y especiales de',
    'Suministro de materiales certificados y homologados': 'Suministro de materiales certificados y homologados para',
    'Gestión de seguridad y salud en obra (PRL)': 'Gestión de seguridad y salud en obra para',
    'Control de calidad y ensayos de materiales': 'Control de calidad y ensayos de materiales para',
    'Acabados interiores y exteriores': 'Aplicación de acabados interiores y exteriores para',
    'Supervisión técnica y control de calidad': 'Supervisión técnica y control de calidad de',
    'Supervisión de cumplimiento normativo (CTE, DB-SI)': 'Supervisión de cumplimiento normativo para',
    'Puesta en marcha de instalaciones y pruebas funcionales': 'Puesta en marcha de instalaciones y pruebas para',
    'Limpieza, entrega final y documentación de cierre': 'Limpieza final y documentación de cierre para'
  },

  consultoria: {
    'Levantamiento de información y entrevistas clave': 'Levantamiento de información estratégica para',
    'Análisis diagnósticos y benchmarking sectorial': 'Análisis diagnóstico y benchmarking de',
    'Análisis de procesos y optimización operativa': 'Análisis de procesos y optimización operativa para',
    'Due diligence y análisis de mercado': 'Due diligence y análisis de mercado para',
    'Diseño de plan estratégico y hoja de ruta': 'Diseño de plan estratégico y hoja de ruta para',
    'Implementación de metodologías ágiles y transformación digital': 'Implementación de metodologías ágiles y transformación digital para',
    'Facilitación de sesiones ejecutivas y workshops': 'Facilitación de workshops y sesiones ejecutivas para',
    'Definición de indicadores y tableros de control': 'Definición de indicadores y tableros de control para',
    'Diseño de estructura organizacional y roles': 'Diseño de estructura organizacional y roles para',
    'Gestión de cambio organizacional y comunicación interna': 'Gestión de cambio organizacional y comunicación para',
    'Acompañamiento en la implementación de iniciativas': 'Acompañamiento en la implementación de iniciativas de',
    'Gestión del cambio y coaching gerencial': 'Gestión del cambio y coaching gerencial en',
    'Seguimiento de resultados y soporte post-implementación': 'Seguimiento de resultados y soporte post-implementación para'
  },

  eventos: {
    'Conceptualización creativa y diseño del evento': 'Conceptualización creativa y diseño del evento de',
    'Plan maestro de producción y cronograma operativo': 'Plan maestro de producción y cronograma para',
    'Selección y negociación con proveedores especializados': 'Selección y negociación con proveedores para',
    'Diseño de escenografía, ambientación y señalética': 'Diseño de escenografía y ambientación para',
    'Producción de contenido audiovisual para streaming': 'Producción de contenido audiovisual para streaming de',
    'Configuración de plataformas virtuales (Zoom, Hopin, etc.)': 'Configuración de plataformas virtuales para',
    'Gestión de acreditaciones y control de acceso': 'Gestión de acreditaciones y control de acceso para',
    'Coordinación de transporte y alojamiento para invitados': 'Coordinación de transporte y alojamiento para',
    'Producción de material gráfico y señalética': 'Producción de material gráfico y señalética para',
    'Gestión de permisos y licencias para eventos públicos': 'Gestión de permisos y licencias para',
    'Coordinación de montaje técnico (audio, video, iluminación)': 'Coordinación de montaje técnico para',
    'Gestión de hospitality y atención a invitados': 'Gestión de hospitality y atención al público de',
    'Operación en sitio y control del programa en vivo': 'Operación en sitio y control del programa para',
    'Desmontaje, cierre logístico y post mortem del evento': 'Desmontaje y cierre logístico del evento de',
    'Entrega de memorias fotográficas y KPIs del evento': 'Entrega de memorias y KPIs del evento de'
  },

  comercio: {
    'Diagnóstico de operación comercial y experiencia de compra': 'Diagnóstico de operación comercial y experiencia de compra de',
    'Diseño de experiencia de compra y customer journey': 'Diseño de experiencia de compra y customer journey para',
    'Optimización de layout, planogramas y visual merchandising': 'Optimización de layout y visual merchandising de',
    'Implementación de sistemas de punto de venta (POS)': 'Implementación de sistemas de punto de venta para',
    'Gestión de escaparatismo y vitrinas': 'Gestión de escaparatismo y vitrinas para',
    'Optimización de flujos de tráfico en tienda': 'Optimización de flujos de tráfico en tienda para',
    'Implementación de estrategias omnicanal y CRM': 'Implementación de estrategias omnicanal y CRM para',
    'Gestión de inventarios y abastecimiento inteligente': 'Gestión de inventarios y abastecimiento para',
    'Implementación de programas de fidelización con tarjetas': 'Implementación de programas de fidelización con tarjetas para',
    'Diseño de campañas de fidelización y programas de lealtad': 'Diseño de programas de fidelización para',
    'Gestión de eventos y activaciones en tienda': 'Gestión de eventos y activaciones en tienda para',
    'Capacitación al equipo comercial y protocolos de servicio': 'Capacitación comercial y protocolos de servicio para',
    'Automatización de reportes y tableros de ventas': 'Automatización de reportes y tableros de ventas para',
    'Seguimiento de indicadores y recomendaciones continuas': 'Seguimiento de indicadores y recomendaciones para'
  },

  manufactura: {
    'Mapeo y análisis de procesos productivos': 'Mapeo y análisis de procesos productivos de',
    'Rediseño de layout y balanceo de línea de producción': 'Rediseño de layout y balanceo de línea para',
    'Implementación de metodologías Lean y mejora continua': 'Implementación de metodologías Lean para',
    'Implementación de sistemas MES (Manufacturing Execution Systems)': 'Implementación de sistemas MES para',
    'Integración de IoT y sensores para monitoreo en tiempo real': 'Integración de IoT y sensores para',
    'Implementación de sistemas de trazabilidad y lotes': 'Implementación de sistemas de trazabilidad y lotes para',
    'Automatización de controles de calidad y trazabilidad': 'Automatización de controles de calidad en',
    'Implementación de sistemas de gestión de calidad (SPC)': 'Implementación de sistemas de gestión de calidad para',
    'Certificaciones ISO 9001, ISO 14001, IATF 16949': 'Certificaciones ISO e IATF para',
    'Gestión de mantenimiento preventivo y TPM': 'Gestión de mantenimiento preventivo para',
    'Estandarización de procedimientos y documentación técnica': 'Estandarización de procedimientos y documentación para',
    'Optimización de cadena de suministro y logística': 'Optimización de cadena de suministro y logística para',
    'Capacitación del personal operativo y mandos medios': 'Capacitación operativa y de mandos medios en',
    'Implementación de indicadores OEE y analítica de planta': 'Implementación de indicadores OEE y analítica en'
  },

  formacion: {
    'Detección de necesidades y definición del plan formativo': 'Detección de necesidades y plan formativo de',
    'Diseño instruccional y estructura curricular': 'Diseño instruccional y estructura curricular para',
    'Diseño de experiencia de aprendizaje (LX Design)': 'Diseño de experiencia de aprendizaje para',
    'Producción de materiales didácticos y recursos interactivos': 'Producción de materiales didácticos para',
    'Producción de contenido multimedia (videos, interactivos)': 'Producción de contenido multimedia para',
    'Configuración de plataformas LMS (Moodle, Blackboard, etc.)': 'Configuración de plataformas LMS para',
    'Implementación de sistemas de gamificación': 'Implementación de sistemas de gamificación para',
    'Impartición de sesiones sincrónicas y asincrónicas': 'Impartición de sesiones formativas para',
    'Evaluación del aprendizaje y retroalimentación personalizada': 'Evaluación de aprendizaje y retroalimentación en',
    'Diseño de programas de mentoring y acompañamiento': 'Diseño de programas de mentoring y acompañamiento para',
    'Acompañamiento en la aplicación práctica en el puesto': 'Acompañamiento en la aplicación práctica de',
    'Evaluación de impacto y ROI de la formación': 'Evaluación de impacto y ROI de la formación para',
    'Certificación de participantes y emisión de constancias': 'Certificación de participantes de',
    'Seguimiento post-capacitación y medición de impacto': 'Seguimiento post-capacitación y medición de impacto en'
  },

  ecommerce: {
    'Configuración técnica y seguridad de la plataforma ecommerce': 'Configuración técnica y seguridad de la tienda de',
    'Configuración de multi-idioma y multi-moneda': 'Configuración de multi-idioma y multi-moneda para',
    'Diseño de experiencia de usuario y personalización de interfaz': 'Diseño de experiencia de usuario y personalización para',
    'Carga y optimización de catálogo de productos': 'Optimización del catálogo de productos de',
    'Integración de pasarelas de pago y logística de envíos': 'Integración de pagos y logística para',
    'Implementación de programas de fidelización y puntos': 'Implementación de programas de fidelización y puntos para',
    'Integración con marketplaces (Amazon, eBay, Wallapop)': 'Integración con marketplaces para',
    'Configuración de fulfillment y almacén': 'Configuración de fulfillment y almacén para',
    'Implementación de sistemas de recomendación y personalización': 'Implementación de sistemas de recomendación para',
    'Configuración de A/B testing y optimización de conversiones': 'Configuración de A/B testing y optimización para',
    'Implementación de automatizaciones de marketing y remarketing': 'Implementación de automatizaciones y remarketing para',
    'Configuración de analítica, fidelización y CRM': 'Configuración de analítica y CRM para',
    'Integración con ERP y sistemas de gestión': 'Integración con ERP y sistemas de gestión para',
    'Capacitación del equipo en operación diaria y soporte': 'Capacitación del equipo operativo de',
    'Plan de lanzamiento y optimización continua de conversiones': 'Plan de lanzamiento y optimización de conversiones para'
  },

  general: {
    'Análisis de necesidades y definición de alcances': 'Análisis de necesidades y definición de alcances para',
    'Diseño de solución y planificación del servicio': 'Diseño de solución y planificación del servicio de',
    'Implementación del servicio y ejecución': 'Implementación y ejecución del servicio de',
    'Seguimiento y soporte durante la prestación': 'Seguimiento y soporte durante la prestación de',
    'Documentación y entrega final del servicio': 'Documentación y entrega final del servicio de'
  }
};

