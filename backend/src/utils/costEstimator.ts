import { ProjectScale, SectorCostProfile, sectorCostProfiles, getDefaultMarketAdjustment } from '../config/sectorCostProfiles';
import type { ProjectContext } from './contextAnalyzer';

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
}

function parsePriceRange(priceRange?: string): number | undefined {
  if (!priceRange) return undefined;
  const numbers = priceRange.match(/[\d.]+/g);
  if (!numbers || numbers.length === 0) return undefined;
  if (numbers.length === 1) return parseFloat(numbers[0].replace(/,/g, '')) * 1000;

  const min = parseFloat(numbers[0].replace(/,/g, '')) * 1000;
  const max = parseFloat(numbers[numbers.length - 1].replace(/,/g, '')) * 1000;
  if (!Number.isFinite(min) || !Number.isFinite(max)) return undefined;
  return Math.round((min + max) / 2);
}

function pickScale(profile: SectorCostProfile, target?: number): ProjectScale {
  if (!target) return profile.defaultScale;

  if (target <= profile.ticketRanges.small.max) return 'small';
  if (target >= profile.ticketRanges.enterprise.min) return 'enterprise';
  return 'standard';
}

function midpoint(range: { min: number; max: number }): number {
  return Math.round((range.min + range.max) / 2);
}

export function estimateProjectCost({ sector, priceRange, archContext, context, clientProfile, projectType, region }: CostEstimateInput): CostEstimateResult {
  const normalizedSector = sector?.toLowerCase() || 'general';
  const profile =
    (archContext?.isArchitecture ? sectorCostProfiles['construccion'] : sectorCostProfiles[normalizedSector]) ??
    sectorCostProfiles['general'];

  const manualTarget = parsePriceRange(priceRange);
  if (priceRange && priceRange.trim().length > 0 && manualTarget === undefined) {
    throw new Error('INVALID_PRICE_RANGE');
  }
  let scale = pickScale(profile, manualTarget);

  if (context?.scaleOverride) {
    scale = context.scaleOverride;
  }

  let baseTotal = manualTarget ?? midpoint(profile.ticketRanges[scale]);

  if (!manualTarget && context?.scaleOverride) {
    baseTotal = midpoint(profile.ticketRanges[context.scaleOverride]);
  }

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

  return {
    targetTotal: Math.round(adjustedTotal),
    baseTotal: Math.round(baseTotal),
    appliedMultipliers,
    scale,
    profile,
    clientProfile: finalClientProfile,
    projectType: finalProjectType,
    region: finalRegion || context?.region
  };
}

