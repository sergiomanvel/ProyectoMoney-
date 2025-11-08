import { ProjectScale, SectorCostProfile, sectorCostProfiles, getDefaultMarketAdjustment } from '../config/sectorCostProfiles';
import type { ProjectContext } from './contextAnalyzer';

interface CostEstimateInput {
  sector: string;
  priceRange?: string;
  archContext?: { isArchitecture: boolean; mode: 'architect' | 'contractor'; subtype?: 'anteproyecto' | 'full' };
  context?: ProjectContext;
}

export interface CostEstimateResult {
  targetTotal: number;
  scale: ProjectScale;
  profile: SectorCostProfile;
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

export function estimateProjectCost({ sector, priceRange, archContext, context }: CostEstimateInput): CostEstimateResult {
  const normalizedSector = sector?.toLowerCase() || 'general';
  const profile =
    (archContext?.isArchitecture ? sectorCostProfiles['construccion'] : sectorCostProfiles[normalizedSector]) ??
    sectorCostProfiles['general'];

  const manualTarget = parsePriceRange(priceRange);
  let scale = pickScale(profile, manualTarget);

  if (context?.scaleOverride) {
    scale = context.scaleOverride;
  }

  let baseTotal = manualTarget ?? midpoint(profile.ticketRanges[scale]);

  if (!manualTarget && context?.scaleOverride) {
    baseTotal = midpoint(profile.ticketRanges[context.scaleOverride]);
  }

  const adjustment = getDefaultMarketAdjustment();
  let adjustedTotal = baseTotal * (adjustment.inflationIndex ?? 1) * (adjustment.locationMultiplier ?? 1);

  if (context?.urgencyMultiplier && context.urgencyMultiplier > 1) {
    adjustedTotal *= context.urgencyMultiplier;
  }

  if (context?.timelineWeeks && context.timelineWeeks <= 2) {
    adjustedTotal *= 1.1;
  }

  if (context?.locationMultiplier && context.locationMultiplier > 0) {
    adjustedTotal *= context.locationMultiplier;
  }

  return {
    targetTotal: Math.round(adjustedTotal),
    scale,
    profile
  };
}

