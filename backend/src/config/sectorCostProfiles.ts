export type ProjectScale = 'small' | 'standard' | 'enterprise';

export interface SectorCostProfile {
  ticketRanges: Record<ProjectScale, { min: number; max: number }>;
  defaultScale: ProjectScale;
  unitBenchmarks?: Record<string, { average: number; unit?: string }>;
  weightHints?: Record<string, number>;
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
      'descubrimiento de requerimientos': { average: 6000 },
      'arquitectura técnica': { average: 12000 },
      'diseño ui/ux': { average: 8000 },
      'desarrollo backend': { average: 20000 },
      'frontend responsivo': { average: 18000 },
      'integración de apis': { average: 14000 },
      'qa automatizadas': { average: 7000 },
      'devops': { average: 9000 },
      'documentación técnica': { average: 5000 },
      'capacitacion': { average: 4000 }
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
      'auditoría de marca': { average: 5000 },
      'estrategia integral': { average: 7000 },
      'contenido': { average: 4500 },
      'pauta': { average: 8000 },
      'social media': { average: 5500 },
      'crm': { average: 6000 },
      'analítica': { average: 4000 }
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
      'movimiento de tierras': { average: 28000 },
      'cimentación': { average: 35000 },
      'estructura': { average: 48000 },
      'instalaciones': { average: 42000 },
      'acabados': { average: 31000 },
      'supervisión': { average: 18000 }
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
      'diagnóstico': { average: 9000 },
      'plan estratégico': { average: 14000 },
      'workshops': { average: 6000 },
      'kpi': { average: 5000 },
      'gestión del cambio': { average: 8000 }
    }
  },
  eventos: {
    ticketRanges: {
      small: { min: 9000, max: 26000 },
      standard: { min: 26000, max: 62000 },
      enterprise: { min: 62000, max: 140000 }
    },
    defaultScale: 'standard'
  },
  comercio: {
    ticketRanges: {
      small: { min: 7000, max: 18000 },
      standard: { min: 18000, max: 45000 },
      enterprise: { min: 45000, max: 90000 }
    },
    defaultScale: 'standard'
  },
  manufactura: {
    ticketRanges: {
      small: { min: 20000, max: 55000 },
      standard: { min: 55000, max: 140000 },
      enterprise: { min: 140000, max: 320000 }
    },
    defaultScale: 'standard'
  },
  formacion: {
    ticketRanges: {
      small: { min: 4000, max: 12000 },
      standard: { min: 12000, max: 32000 },
      enterprise: { min: 32000, max: 75000 }
    },
    defaultScale: 'standard'
  },
  ecommerce: {
    ticketRanges: {
      small: { min: 9000, max: 22000 },
      standard: { min: 22000, max: 55000 },
      enterprise: { min: 55000, max: 120000 }
    },
    defaultScale: 'standard'
  },
  general: {
    ticketRanges: {
      small: { min: 6000, max: 15000 },
      standard: { min: 15000, max: 38000 },
      enterprise: { min: 38000, max: 85000 }
    },
    defaultScale: 'standard'
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

