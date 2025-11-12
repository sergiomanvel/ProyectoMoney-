/**
 * Distribuidor de precios por peso para evitar totales idénticos con pesos sectoriales
 */

import { sectorCostProfiles, SectorCostProfile } from '../config/sectorCostProfiles';
import { CostEstimateResult } from './costEstimator';

export interface QuoteItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface DistributionResult {
  items: QuoteItem[];
  aestheticAdjusted: boolean;
  weights?: number[];
  marginMultiplier?: number;
  overheadMultiplier?: number;
  minPerItem?: number;
}

const WEIGHT_PROFILES: Record<string, Record<string, number>> = {
  software: {
    'análisis': 0.15,
    'diseño': 0.18,
    'desarrollo': 0.35,
    'integracion': 0.30,
    'pruebas': 0.18,
    'soporte': 0.12,
    'documentacion': 0.10,
    'capacitacion': 0.12,
  },
  marketing: {
    'auditoría': 0.15,
    'estrategia': 0.25,
    'contenido': 0.25,
    'pauta': 0.30,
    'redes sociales': 0.25,
    'crm': 0.18,
    'analítica': 0.15,
    'reporte': 0.12,
  },
  construccion: {
    'movimiento': 0.25,
    'cimentación': 0.25,
    'estructura': 0.35,
    'instalaciones': 0.30,
    'acabados': 0.25,
    'supervisión': 0.18,
    'seguridad': 0.12,
    'limpieza': 0.08,
  },
  consultoria: {
    'diagnóstico': 0.22,
    'plan': 0.25,
    'workshop': 0.18,
    'kpi': 0.12,
    'implementación': 0.25,
    'cambio': 0.18,
    'seguimiento': 0.12,
  },
  general: {
    'análisis': 0.20,
    'diseño': 0.25,
    'implementacion': 0.30,
    'configuracion': 0.20,
    'capacitacion': 0.15,
    'soporte': 0.12,
  }
};

function getBenchmarkWeight(description: string, profile?: SectorCostProfile): number {
  if (!profile) return 0;
  const desc = description.toLowerCase();
  let weight = 0;

  if (profile.unitBenchmarks) {
    for (const [keyword, info] of Object.entries(profile.unitBenchmarks)) {
      if (desc.includes(keyword)) {
        weight = Math.max(weight, info.average);
      }
    }
  }

  if (weight === 0 && profile.weightHints) {
    for (const [keyword, hint] of Object.entries(profile.weightHints)) {
      if (desc.includes(keyword)) {
        weight = Math.max(weight, hint);
      }
    }
  }

  return weight;
}

function calculateItemWeight(
  description: string,
  sector?: string,
  archContext?: { isArchitecture: boolean; mode: "architect" | "contractor" },
  profile?: SectorCostProfile
): number {
  const benchmarkWeight = getBenchmarkWeight(description, profile);
  if (benchmarkWeight > 0) {
    return benchmarkWeight;
  }

  const desc = description.toLowerCase().trim();
  let profileWeights = WEIGHT_PROFILES.general;
  if (sector && WEIGHT_PROFILES[sector]) {
    profileWeights = WEIGHT_PROFILES[sector];
  }
  if (archContext?.isArchitecture && archContext.mode === 'architect') {
    profileWeights = {
      'anteproyecto': 0.18,
      'proyecto ejecutivo': 0.32,
      'coordinación': 0.18,
      'supervisión': 0.18,
      'documentación': 0.12,
      'entrega': 0.10
    };
  }

  for (const [keyword, weight] of Object.entries(profileWeights)) {
    if (desc.includes(keyword)) {
      return weight;
    }
  }

  return 1; // peso neutro
}

function applyAestheticAdjustment(
  items: QuoteItem[],
  targetTotal: number,
  taxPercent: number,
  meta?: Partial<DistributionResult>
): DistributionResult {
  let adjusted = false;
  let subtotal = items.reduce((sum, item) => sum + item.total, 0);
  let total = subtotal * (1 + taxPercent / 100);

  const lastDigits = Math.round(total) % 100;
  if (lastDigits === 0 || lastDigits === 50) {
    const adjustment = lastDigits === 0 ? -15 : 15;
    const maxAdjustment = total * 0.02;
    const finalAdjustment = Math.abs(adjustment) <= maxAdjustment ? adjustment : 0;

    if (finalAdjustment !== 0) {
      const newSubtotal = subtotal + finalAdjustment;
      const ratio = newSubtotal / subtotal;
      items = items.map(item => {
        const newTotal = item.total * ratio;
        return {
          ...item,
          total: parseFloat(newTotal.toFixed(2)),
          unitPrice: parseFloat((newTotal / Math.max(item.quantity, 1)).toFixed(2))
        };
      });
      adjusted = true;
    }
  }

  return {
    items,
    aestheticAdjusted: adjusted,
    ...meta
  };
}

function nudgeValue(value: number, index: number): number {
  const rounded = Math.round(value);
  const lastTwo = Math.abs(rounded) % 100;
  if (lastTwo === 0 || lastTwo === 50) {
    const adjustment = ((index % 3) + 1) * 3.7;
    const sign = index % 2 === 0 ? 1 : -1;
    return value + sign * adjustment;
  }
  return value;
}

/**
 * Obtiene el margen según perfil de cliente y tipo de proyecto
 */
function getMarginByProfileAndType(
  sector?: string,
  clientProfile?: string,
  projectType?: string,
  baseMargin: number = 0.12
): number {
  // Márgenes por perfil de cliente (Software)
  if (sector === 'software' && clientProfile) {
    const marginMap: Record<string, number> = {
      'autonomo': 0.10,
      'pyme': 0.12,
      'agencia': 0.13,
      'startup': 0.11,
      'enterprise': 0.15
    };
    if (marginMap[clientProfile]) {
      return marginMap[clientProfile];
    }
  }

  // Márgenes por tipo de obra (Construcción)
  if (sector === 'construccion' && projectType) {
    const marginMap: Record<string, number> = {
      'residencial': 0.12,
      'industrial': 0.15,
      'comercial': 0.13,
      'rehabilitacion': 0.10,
      'reforma': 0.10
    };
    if (marginMap[projectType]) {
      return marginMap[projectType];
    }
  }

  // Márgenes por perfil de consultor (Consultoría)
  if (sector === 'consultoria' && clientProfile) {
    const marginMap: Record<string, number> = {
      'junior': 0.10,
      'senior': 0.15,
      'partner': 0.20,
      'big4': 0.25
    };
    // En consultoría, clientProfile puede ser el perfil del consultor
    if (marginMap[clientProfile]) {
      return marginMap[clientProfile];
    }
  }

  return baseMargin;
}

/**
 * Ajusta pesos según perfil de cliente y tipo de proyecto
 */
function adjustWeightsByProfileAndType(
  weights: number[],
  items: QuoteItem[],
  sector?: string,
  clientProfile?: string,
  projectType?: string
): number[] {
  const adjustedWeights = [...weights];
  const descs = items.map(item => item.description.toLowerCase());

  // Software: Autónomo (más desarrollo, menos documentación)
  if (sector === 'software' && clientProfile === 'autonomo') {
    descs.forEach((desc, idx) => {
      if (desc.includes('desarrollo') || desc.includes('backend') || desc.includes('frontend')) {
        adjustedWeights[idx] = weights[idx] * 1.15;
      } else if (desc.includes('documentacion') || desc.includes('documentación')) {
        adjustedWeights[idx] = weights[idx] * 0.85;
      }
    });
  }

  // Software: Enterprise (más arquitectura y documentación)
  if (sector === 'software' && clientProfile === 'enterprise') {
    descs.forEach((desc, idx) => {
      if (desc.includes('arquitectura') || desc.includes('arquitectura técnica')) {
        adjustedWeights[idx] = weights[idx] * 1.20;
      } else if (desc.includes('documentacion') || desc.includes('documentación')) {
        adjustedWeights[idx] = weights[idx] * 1.15;
      }
    });
  }

  // Marketing: Branding (más creatividad y estrategia)
  if (sector === 'marketing' && projectType === 'branding') {
    descs.forEach((desc, idx) => {
      if (desc.includes('estrategia') || desc.includes('auditoría de marca') || desc.includes('contenido')) {
        adjustedWeights[idx] = weights[idx] * 1.15;
      } else if (desc.includes('pauta') || desc.includes('analítica')) {
        adjustedWeights[idx] = weights[idx] * 0.90;
      }
    });
  }

  // Marketing: Performance (más pauta y analítica)
  if (sector === 'marketing' && projectType === 'performance') {
    descs.forEach((desc, idx) => {
      if (desc.includes('pauta') || desc.includes('analítica') || desc.includes('crm')) {
        adjustedWeights[idx] = weights[idx] * 1.15;
      } else if (desc.includes('estrategia') || desc.includes('auditoría de marca')) {
        adjustedWeights[idx] = weights[idx] * 0.90;
      }
    });
  }

  // Consultoría: IT (más implementación y tecnología)
  if (sector === 'consultoria' && projectType === 'it') {
    descs.forEach((desc, idx) => {
      if (desc.includes('implementación') || desc.includes('tecnología') || desc.includes('tecnologia')) {
        adjustedWeights[idx] = weights[idx] * 1.15;
      } else if (desc.includes('diagnóstico') || desc.includes('diagnostico')) {
        adjustedWeights[idx] = weights[idx] * 0.95;
      }
    });
  }

  // Consultoría: Financiera (más análisis y reporting)
  if (sector === 'consultoria' && projectType === 'financiera') {
    descs.forEach((desc, idx) => {
      if (desc.includes('análisis') || desc.includes('analisis') || desc.includes('kpi') || desc.includes('reporting')) {
        adjustedWeights[idx] = weights[idx] * 1.15;
      } else if (desc.includes('workshop') || desc.includes('capacitación')) {
        adjustedWeights[idx] = weights[idx] * 0.90;
      }
    });
  }

  // Consultoría: Estratégica (más diagnóstico y plan)
  if (sector === 'consultoria' && projectType === 'estrategica') {
    descs.forEach((desc, idx) => {
      if (desc.includes('diagnóstico') || desc.includes('diagnostico') || desc.includes('plan estratégico') || desc.includes('plan estrategico')) {
        adjustedWeights[idx] = weights[idx] * 1.15;
      } else if (desc.includes('implementación') || desc.includes('implementacion')) {
        adjustedWeights[idx] = weights[idx] * 0.95;
      }
    });
  }

  return adjustedWeights;
}

export function distributeTotalsByWeight(
  items: QuoteItem[],
  targetTotal: number,
  sector?: string,
  taxPercent: number = 16,
  archContext?: { isArchitecture: boolean; mode: "architect" | "contractor" },
  costInfo?: CostEstimateResult,
  qualityMarginOffset: number = 0,
  traceId?: string
): DistributionResult {
  const prefix = traceId ? `[quote:${traceId}]` : undefined;
  const profile =
    costInfo?.profile ||
    sectorCostProfiles[sector || 'general'] ||
    sectorCostProfiles['general'];

  const marginPercentRaw = parseFloat(process.env.DEFAULT_MARGIN_PERCENT || '0.12');
  const baseMargin = Number.isFinite(marginPercentRaw) ? marginPercentRaw : 0.12;
  
  // Obtener margen según perfil y tipo
  const profileMargin = getMarginByProfileAndType(
    sector,
    costInfo?.clientProfile,
    costInfo?.projectType,
    baseMargin
  );
  
  const marginPercent = Math.max(profileMargin + qualityMarginOffset, 0);
  const marginMultiplier = 1 + marginPercent;

  const overheadPercentRaw = parseFloat(process.env.DEFAULT_OVERHEAD_PERCENT || '0.05');
  const overheadPercent = Number.isFinite(overheadPercentRaw) ? Math.max(overheadPercentRaw, 0) : 0.05;
  const overheadMultiplier = 1 + overheadPercent;

  let weights: number[];
  if (archContext?.isArchitecture && archContext.mode === 'architect') {
    const fixedWeights = [0.14, 0.16, 0.32, 0.18, 0.12, 0.08];
    weights = items.map((_, idx) => fixedWeights[idx] || 0.1);
    if (prefix) {
      console.debug(`${prefix} ⚙️ Pesos arquitectura aplicados`, { weights });
    }
  } else {
    weights = items.map(item => calculateItemWeight(item.description, sector, archContext, profile));
    
    // Ajustar pesos según perfil de cliente y tipo de proyecto
    weights = adjustWeightsByProfileAndType(
      weights,
      items,
      sector,
      costInfo?.clientProfile,
      costInfo?.projectType
    );
    
    if (prefix && (costInfo?.clientProfile || costInfo?.projectType)) {
      console.debug(`${prefix} ⚙️ Pesos ajustados por perfil/tipo`, {
        clientProfile: costInfo?.clientProfile,
        projectType: costInfo?.projectType,
        weights
      });
    }
  }

  let totalWeight = weights.reduce((sum, w) => sum + w, 0);
  if (!Number.isFinite(totalWeight) || totalWeight <= 0) {
    if (prefix) {
      console.warn(`${prefix} ⚠️ Pesos inválidos, usando neutros`, { weights });
    }
    weights = items.map(() => 1);
    totalWeight = items.length;
  }

  const targetSubtotal = targetTotal / (1 + taxPercent / 100);
  const baseSubtotal = targetSubtotal / (marginMultiplier * overheadMultiplier);
  const minPerItem = baseSubtotal * 0.05 / Math.max(items.length, 1);

  let distributedItems = items.map((item, index) => {
    const weightRatio = weights[index] / totalWeight;
    let allocatedSubtotal = baseSubtotal * weightRatio;
    if (allocatedSubtotal < minPerItem) {
      allocatedSubtotal = minPerItem;
    }

    const withOverhead = allocatedSubtotal * overheadMultiplier;
    let finalTotal = withOverhead * marginMultiplier;
    finalTotal = nudgeValue(finalTotal, index);

    const unitPrice = finalTotal / Math.max(item.quantity, 1);
    return {
      description: item.description,
      quantity: item.quantity,
      total: finalTotal,
      unitPrice
    };
  });

  let subtotal = distributedItems.reduce((sum, item) => sum + item.total, 0);
  if (Math.abs(subtotal - targetSubtotal) > 1) {
    const ratio = targetSubtotal / subtotal;
    let numberIndex = 0;
    distributedItems = distributedItems.map(item => {
      let adjusted = item.total * ratio;
      adjusted = nudgeValue(adjusted, numberIndex++);
      const unit = adjusted / Math.max(item.quantity, 1);
      return {
        ...item,
        total: adjusted,
        unitPrice: unit
      };
    });
  }

  const formattedItems = distributedItems.map((item, index) => {
    const total = parseFloat(item.total.toFixed(2));
    const unitPrice = parseFloat(item.unitPrice.toFixed(2));
    if (prefix && weights[index] === 0.1 && archContext?.isArchitecture && archContext.mode === 'architect') {
      console.debug(`${prefix} ℹ️ Peso por defecto aplicado en posición ${index}`, { description: item.description });
    }
    return {
      ...item,
      total,
      unitPrice
    };
  });
  if (prefix) {
    console.debug(`${prefix} 💰 Distribución completada`, {
      targetTotal,
      marginMultiplier: parseFloat(marginMultiplier.toFixed(4)),
      overheadMultiplier: parseFloat(overheadMultiplier.toFixed(4)),
      minPerItem: parseFloat(minPerItem.toFixed(2))
    });
  }

  return applyAestheticAdjustment(formattedItems, targetTotal, taxPercent, {
    weights,
    marginMultiplier: parseFloat(marginMultiplier.toFixed(4)),
    overheadMultiplier: parseFloat(overheadMultiplier.toFixed(4)),
    minPerItem: parseFloat(minPerItem.toFixed(2))
  });
}

