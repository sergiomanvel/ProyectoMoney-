export type ProjectScale = 'small' | 'standard' | 'enterprise';

export interface SectorCostProfile {
  ticketRanges: Record<ProjectScale, { min: number; max: number }>;
  defaultScale: ProjectScale;
  unitBenchmarks?: Record<string, { average: number; unit?: string; mvp?: number; enterprise?: number; branding?: number; performance?: number; it?: number; financiera?: number; estrategica?: number; rrhh?: number; b2c?: number; b2b?: number; marketplace?: number; dropshipping?: number; subscription?: number; corporate?: number; social?: number; cultural?: number; deportivo?: number; virtual?: number; hibrido?: number; fisico?: number; omnicanal?: number; franchising?: number; popup?: number; concept?: number; discreta?: number; continua?: number; porLotes?: number; custom?: number; automotriz?: number; farmaceutica?: number; presencial?: number; online?: number; blended?: number; eLearning?: number; coaching?: number; workshop?: number; residencial?: number; industrial?: number; comercial?: number; rehabilitacion?: number; reforma?: number; autonomo?: number; pyme?: number; agencia?: number; startup?: number }>;
  weightHints?: Record<string, number>;
  clientProfileMultipliers?: Record<string, number>;
  projectTypeMultipliers?: Record<string, number>;
  campaignTypeMultipliers?: Record<string, number>;
  consultingTypeMultipliers?: Record<string, number>;
  consultantProfileMultipliers?: Record<string, number>;
  ecommerceTypeMultipliers?: Record<string, number>;
  eventTypeMultipliers?: Record<string, number>;
  commerceTypeMultipliers?: Record<string, number>;
  manufacturingTypeMultipliers?: Record<string, number>;
  trainingTypeMultipliers?: Record<string, number>;
  workTypeMultipliers?: Record<string, number>;
}

export const sectorCostProfiles: Record<string, SectorCostProfile> = {
  software: {
    ticketRanges: {
      small: { min: 18000, max: 45000 },
      standard: { min: 45000, max: 120000 },
      enterprise: { min: 120000, max: 320000 }
    },
    defaultScale: 'standard',
    unitBenchmarks: {
      'descubrimiento de requerimientos': { average: 6000, mvp: 4000, enterprise: 12000 },
      'arquitectura técnica': { average: 12000, mvp: 8000, enterprise: 25000 },
      'diseño ui/ux': { average: 8000, mvp: 5000, enterprise: 18000 },
      'desarrollo backend': { average: 20000, mvp: 12000, enterprise: 40000 },
      'frontend responsivo': { average: 18000, mvp: 10000, enterprise: 35000 },
      'integración de apis': { average: 14000, mvp: 8000, enterprise: 28000 },
      'qa automatizadas': { average: 7000, mvp: 4000, enterprise: 15000 },
      'devops': { average: 9000, mvp: 5000, enterprise: 18000 },
      'documentación técnica': { average: 5000, mvp: 3000, enterprise: 12000 },
      'capacitacion': { average: 4000, mvp: 2000, enterprise: 8000 }
    },
    clientProfileMultipliers: {
      'autonomo': 0.85,
      'pyme': 1.0,
      'agencia': 1.15,
      'startup': 0.90,
      'enterprise': 1.20
    },
    projectTypeMultipliers: {
      'mvp': 0.85,
      'standard': 1.0,
      'enterprise': 1.35
    }
  },
  marketing: {
    ticketRanges: {
      small: { min: 8000, max: 20000 },
      standard: { min: 20000, max: 55000 },
      enterprise: { min: 55000, max: 120000 }
    },
    defaultScale: 'standard',
    unitBenchmarks: {
      'auditoría de marca': { average: 5000, branding: 6000, performance: 4000 },
      'estrategia integral': { average: 7000, branding: 8500, performance: 6000 },
      'contenido': { average: 4500, branding: 6000, performance: 3500 },
      'pauta': { average: 8000, branding: 10000, performance: 6000 },
      'social media': { average: 5500, branding: 6500, performance: 4500 },
      'crm': { average: 6000, branding: 7000, performance: 5000 },
      'analítica': { average: 4000, branding: 4500, performance: 3500 }
    },
    campaignTypeMultipliers: {
      'branding': 1.15,
      'performance': 0.90,
      'mixto': 1.0
    }
  },
  construccion: {
    ticketRanges: {
      small: { min: 60000, max: 140000 },
      standard: { min: 140000, max: 320000 },
      enterprise: { min: 320000, max: 780000 }
    },
    defaultScale: 'standard',
    unitBenchmarks: {
      'movimiento de tierras': { average: 28000, residencial: 28000, industrial: 35000, comercial: 30000, rehabilitacion: 25000, reforma: 22000 },
      'cimentación': { average: 35000, residencial: 35000, industrial: 42000, comercial: 38000, rehabilitacion: 32000, reforma: 28000 },
      'estructura': { average: 48000, residencial: 48000, industrial: 58000, comercial: 52000, rehabilitacion: 43000, reforma: 38000 },
      'instalaciones': { average: 42000, residencial: 42000, industrial: 50000, comercial: 46000, rehabilitacion: 38000, reforma: 34000 },
      'acabados': { average: 31000, residencial: 31000, industrial: 37000, comercial: 34000, rehabilitacion: 28000, reforma: 25000 },
      'supervisión': { average: 18000, residencial: 18000, industrial: 22000, comercial: 20000, rehabilitacion: 16000, reforma: 14000 }
    },
    workTypeMultipliers: {
      'residencial': 1.0,
      'industrial': 1.15,
      'comercial': 1.10,
      'rehabilitacion': 0.95,
      'reforma': 0.90
    }
  },
  consultoria: {
    ticketRanges: {
      small: { min: 12000, max: 28000 },
      standard: { min: 28000, max: 75000 },
      enterprise: { min: 75000, max: 180000 }
    },
    defaultScale: 'standard',
    unitBenchmarks: {
      'diagnóstico': { average: 9000, it: 12000, financiera: 15000, estrategica: 10000, rrhh: 8000 },
      'plan estratégico': { average: 14000, it: 18000, financiera: 22000, estrategica: 16000, rrhh: 12000 },
      'workshops': { average: 6000, it: 7500, financiera: 9000, estrategica: 7000, rrhh: 5500 },
      'kpi': { average: 5000, it: 6000, financiera: 7500, estrategica: 5500, rrhh: 4500 },
      'gestión del cambio': { average: 8000, it: 10000, financiera: 12000, estrategica: 9000, rrhh: 7000 }
    },
    consultingTypeMultipliers: {
      'it': 1.20,
      'financiera': 1.35,
      'estrategica': 1.10,
      'rrhh': 0.90,
      'general': 1.0
    },
    consultantProfileMultipliers: {
      'junior': 0.75,
      'senior': 1.0,
      'partner': 1.50,
      'big4': 1.80
    }
  },
  eventos: {
    ticketRanges: {
      small: { min: 9000, max: 26000 },
      standard: { min: 26000, max: 62000 },
      enterprise: { min: 62000, max: 140000 }
    },
    defaultScale: 'standard',
    unitBenchmarks: {
      'conceptualización y diseño': { average: 5000, corporate: 5000, social: 6000, cultural: 4500, deportivo: 6500, virtual: 3500, hibrido: 7000 },
      'plan de producción y cronograma': { average: 4000, corporate: 4000, social: 4800, cultural: 3600, deportivo: 5200, virtual: 2800, hibrido: 5600 },
      'selección y negociación de proveedores': { average: 3500, corporate: 3500, social: 4200, cultural: 3150, deportivo: 4550, virtual: 2450, hibrido: 4900 },
      'diseño de escenografía y ambientación': { average: 8000, corporate: 8000, social: 9600, cultural: 7200, deportivo: 10400, virtual: 5600, hibrido: 11200 },
      'montaje técnico (audio, video, iluminación)': { average: 12000, corporate: 12000, social: 14400, cultural: 10800, deportivo: 15600, virtual: 8400, hibrido: 16800 },
      'catering y hospitality': { average: 15000, corporate: 15000, social: 18000, cultural: 13500, deportivo: 19500, virtual: 10500, hibrido: 21000 },
      'operación en sitio y control': { average: 6000, corporate: 6000, social: 7200, cultural: 5400, deportivo: 7800, virtual: 4200, hibrido: 8400 },
      'desmontaje y cierre logístico': { average: 4000, corporate: 4000, social: 4800, cultural: 3600, deportivo: 5200, virtual: 2800, hibrido: 5600 },
      'memorias fotográficas y KPIs': { average: 3000, corporate: 3000, social: 3600, cultural: 2700, deportivo: 3900, virtual: 2100, hibrido: 4200 },
      'gestión de streaming y eventos virtuales': { average: 10000, corporate: 10000, social: 12000, cultural: 9000, deportivo: 13000, virtual: 7000, hibrido: 14000 }
    },
    eventTypeMultipliers: {
      'corporate': 1.0,
      'social': 1.15,
      'cultural': 0.90,
      'deportivo': 1.20,
      'virtual': 0.70,
      'hibrido': 1.25
    }
  },
  comercio: {
    ticketRanges: {
      small: { min: 7000, max: 18000 },
      standard: { min: 18000, max: 45000 },
      enterprise: { min: 45000, max: 90000 }
    },
    defaultScale: 'standard',
    unitBenchmarks: {
      'diagnóstico de operación comercial': { average: 5000, fisico: 5000, omnicanal: 6250, franchising: 5750, popup: 4000, concept: 6500 },
      'optimización de layout y planogramas': { average: 8000, fisico: 8000, omnicanal: 10000, franchising: 9200, popup: 6400, concept: 10400 },
      'visual merchandising y diseño de tienda': { average: 12000, fisico: 12000, omnicanal: 15000, franchising: 13800, popup: 9600, concept: 15600 },
      'implementación de estrategias omnicanal': { average: 10000, fisico: 8000, omnicanal: 12500, franchising: 11500, popup: 8000, concept: 13000 },
      'gestión de inventarios y abastecimiento': { average: 7000, fisico: 7000, omnicanal: 8750, franchising: 8050, popup: 5600, concept: 9100 },
      'campañas de fidelización y lealtad': { average: 6000, fisico: 6000, omnicanal: 7500, franchising: 6900, popup: 4800, concept: 7800 },
      'capacitación comercial y protocolos': { average: 5000, fisico: 5000, omnicanal: 6250, franchising: 5750, popup: 4000, concept: 6500 },
      'automatización de reportes y tableros': { average: 4500, fisico: 4500, omnicanal: 5625, franchising: 5175, popup: 3600, concept: 5850 },
      'seguimiento de indicadores y recomendaciones': { average: 4000, fisico: 4000, omnicanal: 5000, franchising: 4600, popup: 3200, concept: 5200 }
    },
    commerceTypeMultipliers: {
      'fisico': 1.0,
      'omnicanal': 1.25,
      'franchising': 1.15,
      'popup': 0.80,
      'concept': 1.30
    }
  },
  manufactura: {
    ticketRanges: {
      small: { min: 20000, max: 55000 },
      standard: { min: 55000, max: 140000 },
      enterprise: { min: 140000, max: 320000 }
    },
    defaultScale: 'standard',
    unitBenchmarks: {
      'mapeo y análisis de procesos': { average: 12000, discreta: 12000, continua: 14400, porLotes: 11400, custom: 16200, automotriz: 16800, farmaceutica: 18000 },
      'rediseño de layout y balanceo': { average: 18000, discreta: 18000, continua: 21600, porLotes: 17100, custom: 24300, automotriz: 25200, farmaceutica: 27000 },
      'implementación de metodologías Lean': { average: 15000, discreta: 15000, continua: 18000, porLotes: 14250, custom: 20250, automotriz: 21000, farmaceutica: 22500 },
      'automatización de controles de calidad': { average: 20000, discreta: 20000, continua: 24000, porLotes: 19000, custom: 27000, automotriz: 28000, farmaceutica: 30000 },
      'gestión de mantenimiento preventivo': { average: 14000, discreta: 14000, continua: 16800, porLotes: 13300, custom: 18900, automotriz: 19600, farmaceutica: 21000 },
      'estandarización de procedimientos': { average: 10000, discreta: 10000, continua: 12000, porLotes: 9500, custom: 13500, automotriz: 14000, farmaceutica: 15000 },
      'capacitación del personal': { average: 8000, discreta: 8000, continua: 9600, porLotes: 7600, custom: 10800, automotriz: 11200, farmaceutica: 12000 },
      'implementación de indicadores OEE': { average: 12000, discreta: 12000, continua: 14400, porLotes: 11400, custom: 16200, automotriz: 16800, farmaceutica: 18000 },
      'implementación de Industry 4.0': { average: 35000, discreta: 35000, continua: 42000, porLotes: 33250, custom: 47250, automotriz: 49000, farmaceutica: 52500 },
      'certificaciones ISO/IATF': { average: 25000, discreta: 25000, continua: 30000, porLotes: 23750, custom: 33750, automotriz: 35000, farmaceutica: 37500 }
    },
    manufacturingTypeMultipliers: {
      'discreta': 1.0,
      'continua': 1.20,
      'porLotes': 0.95,
      'custom': 1.35,
      'automotriz': 1.40,
      'farmaceutica': 1.50
    }
  },
  formacion: {
    ticketRanges: {
      small: { min: 4000, max: 12000 },
      standard: { min: 12000, max: 32000 },
      enterprise: { min: 32000, max: 75000 }
    },
    defaultScale: 'standard',
    unitBenchmarks: {
      'detección de necesidades': { average: 3000, presencial: 3000, online: 2250, blended: 3450, eLearning: 2100, coaching: 4200, workshop: 3300 },
      'diseño instruccional': { average: 8000, presencial: 8000, online: 6000, blended: 9200, eLearning: 5600, coaching: 11200, workshop: 8800 },
      'producción de materiales didácticos': { average: 10000, presencial: 10000, online: 7500, blended: 11500, eLearning: 7000, coaching: 14000, workshop: 11000 },
      'impartición de sesiones presenciales': { average: 12000, presencial: 12000, online: 0, blended: 13800, eLearning: 0, coaching: 16800, workshop: 13200 },
      'impartición de sesiones online': { average: 8000, presencial: 0, online: 8000, blended: 9200, eLearning: 5600, coaching: 11200, workshop: 8800 },
      'evaluación y retroalimentación': { average: 5000, presencial: 5000, online: 3750, blended: 5750, eLearning: 3500, coaching: 7000, workshop: 5500 },
      'acompañamiento práctico': { average: 6000, presencial: 6000, online: 4500, blended: 6900, eLearning: 4200, coaching: 8400, workshop: 6600 },
      'certificación y constancias': { average: 3000, presencial: 3000, online: 2250, blended: 3450, eLearning: 2100, coaching: 4200, workshop: 3300 },
      'seguimiento post-capacitación': { average: 4000, presencial: 4000, online: 3000, blended: 4600, eLearning: 2800, coaching: 5600, workshop: 4400 },
      'configuración de plataforma LMS': { average: 15000, presencial: 0, online: 15000, blended: 17250, eLearning: 10500, coaching: 0, workshop: 0 }
    },
    trainingTypeMultipliers: {
      'presencial': 1.0,
      'online': 0.75,
      'blended': 1.15,
      'eLearning': 0.70,
      'coaching': 1.40,
      'workshop': 1.10
    }
  },
  ecommerce: {
    ticketRanges: {
      small: { min: 9000, max: 22000 },
      standard: { min: 22000, max: 55000 },
      enterprise: { min: 55000, max: 120000 }
    },
    defaultScale: 'standard',
    unitBenchmarks: {
      'configuración de plataforma': { average: 8000, b2c: 8000, b2b: 10000, marketplace: 12000, dropshipping: 6000, subscription: 9000 },
      'diseño de experiencia de usuario': { average: 12000, b2c: 12000, b2b: 15000, marketplace: 18000, dropshipping: 9000, subscription: 14000 },
      'carga de catálogo de productos': { average: 6000, b2c: 6000, b2b: 8000, marketplace: 10000, dropshipping: 4000, subscription: 7000 },
      'integración de pasarelas de pago': { average: 5000, b2c: 5000, b2b: 7000, marketplace: 8000, dropshipping: 4000, subscription: 6000 },
      'integración de logística y envíos': { average: 7000, b2c: 7000, b2b: 9000, marketplace: 11000, dropshipping: 5000, subscription: 8000 },
      'automatizaciones de marketing': { average: 5500, b2c: 5500, b2b: 7000, marketplace: 8000, dropshipping: 4000, subscription: 6500 },
      'configuración de analítica y CRM': { average: 4500, b2c: 4500, b2b: 6000, marketplace: 7000, dropshipping: 3500, subscription: 5500 },
      'capacitación y soporte': { average: 4000, b2c: 4000, b2b: 5000, marketplace: 6000, dropshipping: 3000, subscription: 4500 },
      'optimización de conversiones': { average: 5000, b2c: 5000, b2b: 6500, marketplace: 7500, dropshipping: 4000, subscription: 6000 },
      'integración con ERP': { average: 10000, b2c: 8000, b2b: 12000, marketplace: 14000, dropshipping: 6000, subscription: 11000 },
      'integración con marketplace': { average: 8000, b2c: 8000, b2b: 10000, marketplace: 12000, dropshipping: 6000, subscription: 9000 }
    },
    ecommerceTypeMultipliers: {
      'b2c': 1.0,
      'b2b': 1.25,
      'marketplace': 1.35,
      'dropshipping': 0.85,
      'subscription': 1.15
    }
  },
  general: {
    ticketRanges: {
      small: { min: 6000, max: 15000 },
      standard: { min: 15000, max: 38000 },
      enterprise: { min: 38000, max: 85000 }
    },
    defaultScale: 'standard',
    unitBenchmarks: {
      'análisis de necesidades': { average: 4000 },
      'diseño de solución': { average: 6000 },
      'implementación del servicio': { average: 12000 },
      'seguimiento y soporte': { average: 5000 },
      'documentación y entrega': { average: 3000 }
    }
  }
};

export interface MarketAdjustment {
  inflationIndex?: number;
  locationMultiplier?: number;
}

export function getDefaultMarketAdjustment(): MarketAdjustment {
  const inflationIndex = parseFloat(process.env.COST_INFLATION_INDEX || '1');
  const locationMultiplier = parseFloat(process.env.LOCATION_COST_FACTOR || '1');
  return {
    inflationIndex: Number.isFinite(inflationIndex) ? inflationIndex : 1,
    locationMultiplier: Number.isFinite(locationMultiplier) ? locationMultiplier : 1
  };
}

