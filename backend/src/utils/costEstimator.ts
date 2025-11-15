import { ProjectScale, SectorCostProfile, sectorCostProfiles, getDefaultMarketAdjustment } from '../config/sectorCostProfiles';
import type { ProjectContext } from './contextAnalyzer';
import {
  BASE_TICKET_RANGES_ES,
  SectorKey,
  TicketRange,
  TicketScale,
  getBaseTicketRange,
  normalizePriceScaleInput,
  resolveSectorKey
} from '../config/spainPricingData';

interface CostEstimateInput {
  sector: string;
  priceRange?: string;
  archContext?: { isArchitecture: boolean; mode: 'architect' | 'contractor'; subtype?: 'anteproyecto' | 'full' };
  context?: ProjectContext;
  clientProfile?: 'autonomo' | 'pyme' | 'agencia' | 'startup' | 'enterprise';
  projectType?: string;
  region?: string;
}

export interface CostEstimateResult {
  targetTotal: number;
  baseTotal: number;
  baseTotalBeforeAdjustments?: number;
  appliedMultipliers: {
    inflation?: number;
    marketLocation?: number;
    location?: number;
    urgency?: number;
    timeline?: number;
    clientProfile?: number;
    projectType?: number;
    region?: number;
  };
  scale: ProjectScale;
  profile: SectorCostProfile;
  clientProfile?: string;
  projectType?: string;
  region?: string;
  rangeValidation?: {
    passed: boolean;
    adjusted: boolean;
    original?: number;
    range: { min: number; max: number };
    reason?: string;
    source?: string;
  };
  sectorKey?: SectorKey;
  priceScale?: TicketScale;
  baseRange?: TicketRange;
  baseRangeSource?: 'spain_base_ticket' | 'sector_profile';
}

function midpoint(range: { min: number; max: number }): number {
  return Math.round((range.min + range.max) / 2);
}

function inferScaleFromNumericRange(priceRange: string | undefined, sectorKey: SectorKey): TicketScale | undefined {
  if (!priceRange) return undefined;
  const matches = priceRange.match(/[\d.,]+/g);
  if (!matches || matches.length === 0) return undefined;
  const values = matches
    .map(value => parseFloat(value.replace(/[^\d.-]/g, '').replace(',', '.')))
    .filter(val => Number.isFinite(val));
  if (values.length === 0) return undefined;
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  const config = BASE_TICKET_RANGES_ES[sectorKey];
  if (!config) return undefined;

  const scales: TicketScale[] = ['small', 'standard', 'enterprise'];
  for (const scale of scales) {
    const range = config[scale];
    if (average >= range.min && average <= range.max) {
      return scale;
    }
  }

  // Si no cae dentro de un rango exacto, elegir el más cercano
  let closest: { scale: TicketScale; diff: number } | null = null;
  for (const scale of scales) {
    const range = config[scale];
    const diff = average < range.min ? range.min - average : average - range.max;
    if (closest === null || diff < closest.diff) {
      closest = { scale, diff };
    }
  }
  return closest?.scale;
}

export function estimateProjectCost({ sector, priceRange, archContext, context, clientProfile, projectType, region }: CostEstimateInput): CostEstimateResult {
  const normalizedSector = sector?.toLowerCase() || 'general';
  const sectorKey = resolveSectorKey(normalizedSector);
  const profile =
    (archContext?.isArchitecture ? sectorCostProfiles['construccion'] : sectorCostProfiles[normalizedSector]) ??
    sectorCostProfiles['general'];

  const desiredScale = normalizePriceScaleInput(priceRange) || inferScaleFromNumericRange(priceRange, sectorKey);
  let scale: ProjectScale = desiredScale ?? profile.defaultScale;

  if (context?.scaleOverride) {
    scale = context.scaleOverride;
  }

  let baseRange: TicketRange | undefined = BASE_TICKET_RANGES_ES[sectorKey]?.[scale] ?? profile.ticketRanges[scale];
  if (!baseRange) {
    baseRange = BASE_TICKET_RANGES_ES[sectorKey]?.standard ?? profile.ticketRanges[profile.defaultScale];
    scale = profile.defaultScale;
  }
  const baseRangeSource: 'spain_base_ticket' | 'sector_profile' =
    BASE_TICKET_RANGES_ES[sectorKey]?.[scale] ? 'spain_base_ticket' : 'sector_profile';

  const baseTotalBeforeMultipliers = baseRange ? midpoint(baseRange) : midpoint(profile.ticketRanges[scale]);
  const baseTotalBeforeAdjustments = Math.round(baseTotalBeforeMultipliers);
  let baseTotal = baseTotalBeforeAdjustments;

  const adjustment = getDefaultMarketAdjustment();
  const inflationMultiplier = adjustment.inflationIndex ?? 1;
  const marketLocationMultiplier = adjustment.locationMultiplier ?? 1;

  const appliedMultipliers: CostEstimateResult['appliedMultipliers'] = {};

  let adjustedTotal = baseTotal * inflationMultiplier * marketLocationMultiplier;
  if (inflationMultiplier !== 1) {
    appliedMultipliers.inflation = inflationMultiplier;
  }
  if (marketLocationMultiplier !== 1) {
    appliedMultipliers.marketLocation = marketLocationMultiplier;
  }

  // Aplicar multiplicador por perfil de cliente (si aplica)
  const finalClientProfile = clientProfile || context?.clientProfile;
  if (finalClientProfile && profile.clientProfileMultipliers) {
    const clientMultiplier = profile.clientProfileMultipliers[finalClientProfile];
    if (clientMultiplier && clientMultiplier !== 1) {
      adjustedTotal *= clientMultiplier;
      appliedMultipliers.clientProfile = clientMultiplier;
    }
  }

  // Aplicar multiplicador por tipo de proyecto (si aplica)
  const finalProjectType = projectType || context?.projectType;
  if (finalProjectType) {
    // Multiplicador por tipo de campaña (Marketing)
    if (profile.campaignTypeMultipliers && profile.campaignTypeMultipliers[finalProjectType]) {
      const campaignMultiplier = profile.campaignTypeMultipliers[finalProjectType];
      if (campaignMultiplier !== 1) {
        adjustedTotal *= campaignMultiplier;
        appliedMultipliers.projectType = campaignMultiplier;
      }
    }
    // Multiplicador por tipo de obra (Construcción)
    else if (profile.workTypeMultipliers && profile.workTypeMultipliers[finalProjectType]) {
      const workMultiplier = profile.workTypeMultipliers[finalProjectType];
      if (workMultiplier !== 1) {
        adjustedTotal *= workMultiplier;
        appliedMultipliers.projectType = workMultiplier;
      }
    }
    // Multiplicador por tipo de consultoría (Consultoría)
    else if (profile.consultingTypeMultipliers && profile.consultingTypeMultipliers[finalProjectType]) {
      const consultingMultiplier = profile.consultingTypeMultipliers[finalProjectType];
      if (consultingMultiplier !== 1) {
        adjustedTotal *= consultingMultiplier;
        appliedMultipliers.projectType = consultingMultiplier;
      }
    }
    // Multiplicador por tipo de ecommerce (Ecommerce)
    else if (profile.ecommerceTypeMultipliers && profile.ecommerceTypeMultipliers[finalProjectType]) {
      const ecommerceMultiplier = profile.ecommerceTypeMultipliers[finalProjectType];
      if (ecommerceMultiplier !== 1) {
        adjustedTotal *= ecommerceMultiplier;
        appliedMultipliers.projectType = ecommerceMultiplier;
      }
    }
    // Multiplicador por tipo de evento (Eventos)
    else if (profile.eventTypeMultipliers && profile.eventTypeMultipliers[finalProjectType]) {
      const eventMultiplier = profile.eventTypeMultipliers[finalProjectType];
      if (eventMultiplier !== 1) {
        adjustedTotal *= eventMultiplier;
        appliedMultipliers.projectType = eventMultiplier;
      }
    }
    // Multiplicador por tipo de comercio (Comercio)
    else if (profile.commerceTypeMultipliers && profile.commerceTypeMultipliers[finalProjectType]) {
      const commerceMultiplier = profile.commerceTypeMultipliers[finalProjectType];
      if (commerceMultiplier !== 1) {
        adjustedTotal *= commerceMultiplier;
        appliedMultipliers.projectType = commerceMultiplier;
      }
    }
    // Multiplicador por tipo de manufactura (Manufactura)
    else if (profile.manufacturingTypeMultipliers && profile.manufacturingTypeMultipliers[finalProjectType]) {
      const manufacturingMultiplier = profile.manufacturingTypeMultipliers[finalProjectType];
      if (manufacturingMultiplier !== 1) {
        adjustedTotal *= manufacturingMultiplier;
        appliedMultipliers.projectType = manufacturingMultiplier;
      }
    }
    // Multiplicador por tipo de formación (Formación)
    else if (profile.trainingTypeMultipliers && profile.trainingTypeMultipliers[finalProjectType]) {
      const trainingMultiplier = profile.trainingTypeMultipliers[finalProjectType];
      if (trainingMultiplier !== 1) {
        adjustedTotal *= trainingMultiplier;
        appliedMultipliers.projectType = trainingMultiplier;
      }
    }
    // Multiplicador por tipo de proyecto (Software)
    else if (profile.projectTypeMultipliers && profile.projectTypeMultipliers[finalProjectType]) {
      const projectMultiplier = profile.projectTypeMultipliers[finalProjectType];
      if (projectMultiplier !== 1) {
        adjustedTotal *= projectMultiplier;
        appliedMultipliers.projectType = projectMultiplier;
      }
    }
  }

  // Aplicar multiplicador por región (si aplica)
  const finalRegion = region || context?.region;
  if (finalRegion && context?.locationMultiplier && context.locationMultiplier !== 1) {
    adjustedTotal *= context.locationMultiplier;
    appliedMultipliers.region = context.locationMultiplier;
  } else if (context?.locationMultiplier && context.locationMultiplier > 0) {
    adjustedTotal *= context.locationMultiplier;
    appliedMultipliers.location = context.locationMultiplier;
  }

  if (context?.urgencyMultiplier && context.urgencyMultiplier > 1) {
    adjustedTotal *= context.urgencyMultiplier;
    appliedMultipliers.urgency = context.urgencyMultiplier;
  }

  if (context?.timelineWeeks && context.timelineWeeks <= 2) {
    const timelineMultiplier = 1.1;
    adjustedTotal *= timelineMultiplier;
    appliedMultipliers.timeline = timelineMultiplier;
  }

  const finalTargetTotal = Math.round(adjustedTotal);
  
  // Validar que el precio final esté dentro del rango del sector
  const validatedTotal = validatePriceRange(finalTargetTotal, scale, profile, normalizedSector, baseRange);

  return {
    targetTotal: validatedTotal.total,
    baseTotal: Math.round(baseTotal),
    baseTotalBeforeAdjustments,
    appliedMultipliers,
    scale,
    profile,
    clientProfile: finalClientProfile,
    projectType: finalProjectType,
    region: finalRegion || context?.region,
    rangeValidation: validatedTotal.validation,
    sectorKey,
    priceScale: desiredScale,
    baseRange,
    baseRangeSource
  };
}

/**
 * Valida que el precio final esté dentro del rango del sector.
 * Ajusta automáticamente si está fuera del rango y registra la validación.
 */
export function validatePriceRange(
  finalPrice: number,
  scale: ProjectScale,
  profile: SectorCostProfile,
  sector: string,
  customRange?: TicketRange
): {
  total: number;
  validation: {
    passed: boolean;
    adjusted: boolean;
    original?: number;
    range: { min: number; max: number };
    reason?: string;
    source?: string;
  };
} {
  const range = customRange ?? profile.ticketRanges[scale];
  const originalPrice = finalPrice;
  let adjusted = false;
  let reason: string | undefined;
  let validatedPrice = finalPrice;

  // Si está por debajo del mínimo, ajustar al mínimo
  if (finalPrice < range.min) {
    validatedPrice = range.min;
    adjusted = true;
    reason = `Precio ${finalPrice} por debajo del mínimo ${range.min} para sector ${sector} (${scale})`;
    console.warn(`⚠️ [validatePriceRange] ${reason}`);
  }
  
  // Si está por encima del máximo, ajustar al máximo
  if (finalPrice > range.max) {
    validatedPrice = range.max;
    adjusted = true;
    reason = `Precio ${finalPrice} por encima del máximo ${range.max} para sector ${sector} (${scale})`;
    console.warn(`⚠️ [validatePriceRange] ${reason}`);
  }

  return {
    total: validatedPrice,
    validation: {
      passed: !adjusted,
      adjusted,
      original: adjusted ? originalPrice : undefined,
      range: { min: range.min, max: range.max },
      reason: adjusted ? reason : undefined,
      source: customRange ? 'spain_base_ticket' : 'sector_profile'
    }
  };
}

