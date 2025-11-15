/**
 * Estructura de datos para precios de servicios profesionales en España
 * por sector y comunidad autónoma.
 *
 * Este archivo concentra:
 * - Rangos base nacionales por sector (BASE_TICKET_RANGES_ES)
 * - Estructura placeholder para datos por comunidad autónoma
 * - utilidades para mapear sector/ubicación a llaves internas
 */

export type TicketScale = 'small' | 'standard' | 'enterprise';

export type SectorKey =
  | 'software_it'
  | 'ecommerce_retail'
  | 'marketing_digital'
  | 'consultoria'
  | 'construccion_reformas'
  | 'arquitectura'
  | 'eventos_produccion'
  | 'servicios_creativos'
  | 'mantenimiento_instalaciones'
  | 'formacion';

export interface TicketRange {
  min: number;
  max: number;
}

export interface SectorTicketConfig {
  small: TicketRange;
  standard: TicketRange;
  enterprise: TicketRange;
}

/**
 * Rangos base nacionales (EUR) por sector, utilizados como referencia
 * cuando aún no existen datos específicos por comunidad autónoma.
 */
export const BASE_TICKET_RANGES_ES: Record<SectorKey, SectorTicketConfig> = {
  software_it: {
    small: { min: 2000, max: 6000 },
    standard: { min: 6000, max: 18000 },
    enterprise: { min: 18000, max: 60000 }
  },
  ecommerce_retail: {
    small: { min: 1500, max: 4000 },
    standard: { min: 4000, max: 10000 },
    enterprise: { min: 10000, max: 35000 }
  },
  marketing_digital: {
    small: { min: 400, max: 1200 },
    standard: { min: 1200, max: 4000 },
    enterprise: { min: 4000, max: 15000 }
  },
  consultoria: {
    small: { min: 800, max: 3000 },
    standard: { min: 3000, max: 12000 },
    enterprise: { min: 12000, max: 45000 }
  },
  construccion_reformas: {
    small: { min: 3000, max: 15000 },
    standard: { min: 15000, max: 45000 },
    enterprise: { min: 45000, max: 200000 }
  },
  arquitectura: {
    small: { min: 1500, max: 6000 },
    standard: { min: 6000, max: 25000 },
    enterprise: { min: 25000, max: 120000 }
  },
  eventos_produccion: {
    small: { min: 2000, max: 10000 },
    standard: { min: 10000, max: 40000 },
    enterprise: { min: 40000, max: 250000 }
  },
  servicios_creativos: {
    small: { min: 300, max: 1500 },
    standard: { min: 1500, max: 6000 },
    enterprise: { min: 6000, max: 40000 }
  },
  mantenimiento_instalaciones: {
    small: { min: 300, max: 2000 },
    standard: { min: 2000, max: 12000 },
    enterprise: { min: 12000, max: 60000 }
  },
  formacion: {
    small: { min: 600, max: 3000 },
    standard: { min: 3000, max: 15000 },
    enterprise: { min: 15000, max: 80000 }
  }
};

/**
 * Mapeo entre los sectores expuestos en el UI/backend y las llaves internas.
 * Permite mantener compatibilidad con valores legados.
 */
export const SECTOR_KEY_ALIASES: Record<string, SectorKey> = {
  software: 'software_it',
  software_it: 'software_it',
  ti: 'software_it',
  tecnologia: 'software_it',

  ecommerce: 'ecommerce_retail',
  retail: 'ecommerce_retail',
  comercio: 'ecommerce_retail',
  ecommerce_retail: 'ecommerce_retail',

  marketing: 'marketing_digital',
  marketing_digital: 'marketing_digital',
  redes: 'marketing_digital',

  consultoria: 'consultoria',
  consulting: 'consultoria',

  construccion: 'construccion_reformas',
  reformas: 'construccion_reformas',
  construccion_reformas: 'construccion_reformas',

  arquitectura: 'arquitectura',

  eventos: 'eventos_produccion',
  eventos_produccion: 'eventos_produccion',

  creatives: 'servicios_creativos',
  servicios_creativos: 'servicios_creativos',
  branding: 'servicios_creativos',
  general: 'servicios_creativos',

  mantenimiento: 'mantenimiento_instalaciones',
  instalaciones: 'mantenimiento_instalaciones',
  mantenimiento_instalaciones: 'mantenimiento_instalaciones',
  manufactura: 'mantenimiento_instalaciones',

  formacion: 'formacion',
  training: 'formacion'
};

export const PRICE_RANGE_SCALE_MAP: Record<string, TicketScale> = {
  small: 'small',
  standard: 'standard',
  enterprise: 'enterprise',
  'pequeno': 'small',
  'medio': 'standard',
  'grande': 'enterprise',
  '500 - 2,000': 'small',
  '2,000 - 5,000': 'small',
  '5,000 - 10,000': 'standard',
  '10,000 - 20,000': 'standard',
  '20,000 - 40,000': 'standard',
  '40,000 - 75,000': 'enterprise',
  '75,000 - 125,000': 'enterprise',
  '125,000 - 250,000': 'enterprise',
  '250,000+': 'enterprise'
};

export function resolveSectorKey(input?: string): SectorKey {
  if (!input) return 'servicios_creativos';
  const normalized = input.toLowerCase().trim();
  return SECTOR_KEY_ALIASES[normalized] || 'servicios_creativos';
}

export function getBaseTicketRange(sectorKey: SectorKey, scale: TicketScale): TicketRange {
  return BASE_TICKET_RANGES_ES[sectorKey][scale];
}

export function normalizePriceScaleInput(priceRange?: string): TicketScale | undefined {
  if (!priceRange) return undefined;
  const normalized = priceRange.toLowerCase().trim();
  if (PRICE_RANGE_SCALE_MAP[normalized]) {
    return PRICE_RANGE_SCALE_MAP[normalized];
  }
  return undefined;
}

export type SpanishAutonomousCommunity = 
  | 'andalucia'
  | 'aragon'
  | 'asturias'
  | 'baleares'
  | 'canarias'
  | 'cantabria'
  | 'castilla-leon'
  | 'castilla-la-mancha'
  | 'cataluna'
  | 'extremadura'
  | 'galicia'
  | 'madrid'
  | 'murcia'
  | 'navarra'
  | 'pais-vasco'
  | 'la-rioja'
  | 'valencia'
  | 'ceuta'
  | 'melilla';

export interface SpainPricingProfile {
  /** Nombre de la comunidad autónoma */
  community: SpanishAutonomousCommunity;
  /** Nombre completo de la comunidad */
  fullName: string;
  /** Multiplicador base para esta comunidad (1.0 = precio base España) */
  baseMultiplier: number;
  /** Rangos de precios por sector y escala (en EUR) */
  sectorRanges: Record<string, {
    small: { min: number; max: number };
    standard: { min: number; max: number };
    enterprise: { min: number; max: number };
  }>;
  /** Benchmarks unitarios por sector (en EUR) */
  sectorBenchmarks?: Record<string, Record<string, number>>;
  /** Última actualización de los datos */
  lastUpdated?: string;
  /** Fuente de los datos */
  source?: string;
}

/**
 * Datos de precios por comunidad autónoma en España.
 * 
 * ESTRUCTURA PREPARADA PARA RECIBIR DATOS REALES
 * 
 * Cuando tengas los datos de la investigación, reemplaza este objeto
 * con los valores reales por sector y comunidad autónoma.
 * 
 * Ejemplo de estructura esperada:
 * 
 * ```typescript
 * export const spainPricingData: Record<SpanishAutonomousCommunity, SpainPricingProfile> = {
 *   madrid: {
 *     community: 'madrid',
 *     fullName: 'Comunidad de Madrid',
 *     baseMultiplier: 1.2, // 20% más caro que la media
 *     sectorRanges: {
 *       software: {
 *         small: { min: 15000, max: 35000 },
 *         standard: { min: 35000, max: 95000 },
 *         enterprise: { min: 95000, max: 250000 }
 *       },
 *       marketing: {
 *         small: { min: 7000, max: 17000 },
 *         standard: { min: 17000, max: 46000 },
 *         enterprise: { min: 46000, max: 100000 }
 *       },
 *       // ... más sectores
 *     },
 *     lastUpdated: '2024-01-15',
 *     source: 'Investigación de mercado 2024'
 *   },
 *   // ... más comunidades
 * };
 * ```
 */
export const spainPricingData: Record<SpanishAutonomousCommunity, SpainPricingProfile> = {
  // PLACEHOLDER: Estructura preparada para recibir datos reales
  // Reemplazar con datos de la investigación cuando estén disponibles
  
  madrid: {
    community: 'madrid',
    fullName: 'Comunidad de Madrid',
    baseMultiplier: 1.0, // TODO: Actualizar con datos reales
    sectorRanges: {} // TODO: Rellenar con rangos reales por sector
  },
  cataluna: {
    community: 'cataluna',
    fullName: 'Cataluña',
    baseMultiplier: 1.0, // TODO: Actualizar con datos reales
    sectorRanges: {}
  },
  valencia: {
    community: 'valencia',
    fullName: 'Comunidad Valenciana',
    baseMultiplier: 1.0,
    sectorRanges: {}
  },
  andalucia: {
    community: 'andalucia',
    fullName: 'Andalucía',
    baseMultiplier: 1.0,
    sectorRanges: {}
  },
  'pais-vasco': {
    community: 'pais-vasco',
    fullName: 'País Vasco',
    baseMultiplier: 1.0,
    sectorRanges: {}
  },
  galicia: {
    community: 'galicia',
    fullName: 'Galicia',
    baseMultiplier: 1.0,
    sectorRanges: {}
  },
  'castilla-leon': {
    community: 'castilla-leon',
    fullName: 'Castilla y León',
    baseMultiplier: 1.0,
    sectorRanges: {}
  },
  'castilla-la-mancha': {
    community: 'castilla-la-mancha',
    fullName: 'Castilla-La Mancha',
    baseMultiplier: 1.0,
    sectorRanges: {}
  },
  extremadura: {
    community: 'extremadura',
    fullName: 'Extremadura',
    baseMultiplier: 1.0,
    sectorRanges: {}
  },
  asturias: {
    community: 'asturias',
    fullName: 'Principado de Asturias',
    baseMultiplier: 1.0,
    sectorRanges: {}
  },
  murcia: {
    community: 'murcia',
    fullName: 'Región de Murcia',
    baseMultiplier: 1.0,
    sectorRanges: {}
  },
  aragon: {
    community: 'aragon',
    fullName: 'Aragón',
    baseMultiplier: 1.0,
    sectorRanges: {}
  },
  baleares: {
    community: 'baleares',
    fullName: 'Islas Baleares',
    baseMultiplier: 1.0,
    sectorRanges: {}
  },
  canarias: {
    community: 'canarias',
    fullName: 'Islas Canarias',
    baseMultiplier: 1.0,
    sectorRanges: {}
  },
  cantabria: {
    community: 'cantabria',
    fullName: 'Cantabria',
    baseMultiplier: 1.0,
    sectorRanges: {}
  },
  navarra: {
    community: 'navarra',
    fullName: 'Comunidad Foral de Navarra',
    baseMultiplier: 1.0,
    sectorRanges: {}
  },
  'la-rioja': {
    community: 'la-rioja',
    fullName: 'La Rioja',
    baseMultiplier: 1.0,
    sectorRanges: {}
  },
  ceuta: {
    community: 'ceuta',
    fullName: 'Ceuta',
    baseMultiplier: 1.0,
    sectorRanges: {}
  },
  melilla: {
    community: 'melilla',
    fullName: 'Melilla',
    baseMultiplier: 1.0,
    sectorRanges: {}
  }
};

/**
 * Mapeo de nombres de regiones/ciudades a comunidades autónomas
 */
export const regionToCommunityMap: Record<string, SpanishAutonomousCommunity> = {
  // Ciudades principales
  'madrid': 'madrid',
  'barcelona': 'cataluna',
  'valencia': 'valencia',
  'sevilla': 'andalucia',
  'bilbao': 'pais-vasco',
  'zaragoza': 'aragon',
  'murcia': 'murcia',
  'málaga': 'andalucia',
  'palma': 'baleares',
  'las palmas': 'canarias',
  'santa cruz de tenerife': 'canarias',
  'valladolid': 'castilla-leon',
  'vigo': 'galicia',
  'gijón': 'asturias',
  'santander': 'cantabria',
  'pamplona': 'navarra',
  'logroño': 'la-rioja',
  'badajoz': 'extremadura',
  'toledo': 'castilla-la-mancha',
  'santiago de compostela': 'galicia',
  'oviedo': 'asturias',
  
  // Comunidades autónomas (nombres alternativos)
  'comunidad de madrid': 'madrid',
  'cataluña': 'cataluna',
  'comunidad valenciana': 'valencia',
  'país vasco': 'pais-vasco',
  'euskadi': 'pais-vasco',
  'castilla y león': 'castilla-leon',
  'castilla-la mancha': 'castilla-la-mancha',
  'islas baleares': 'baleares',
  'islas canarias': 'canarias',
  'principado de asturias': 'asturias',
  'región de murcia': 'murcia',
  'comunidad foral de navarra': 'navarra'
};

/**
 * Obtiene el perfil de precios para una comunidad autónoma
 */
export function getSpainPricingProfile(region: string): SpainPricingProfile | null {
  const normalized = region.toLowerCase().trim();
  
  // Buscar en el mapeo de regiones
  const community = regionToCommunityMap[normalized];
  if (community && spainPricingData[community]) {
    return spainPricingData[community];
  }
  
  // Buscar directamente por nombre de comunidad
  const directMatch = Object.values(spainPricingData).find(
    profile => profile.community === normalized || profile.fullName.toLowerCase() === normalized
  );
  
  return directMatch || null;
}

/**
 * Obtiene el multiplicador de precio para una región en España
 */
export function getSpainPriceMultiplier(region: string): number {
  const profile = getSpainPricingProfile(region);
  return profile?.baseMultiplier || 1.0;
}

/**
 * Obtiene rangos de precios por sector para una comunidad autónoma
 */
export function getSpainSectorRanges(
  region: string,
  sector: string
): { small: { min: number; max: number }; standard: { min: number; max: number }; enterprise: { min: number; max: number } } | null {
  const profile = getSpainPricingProfile(region);
  if (!profile) return null;
  
  const normalizedSector = sector.toLowerCase();
  return profile.sectorRanges[normalizedSector] || null;
}

