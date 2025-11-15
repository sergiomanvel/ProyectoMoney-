/**
 * Utilidad para generar explicaciones legibles del cálculo de precios.
 * Permite modo auditable para entender cómo se llegó al precio final.
 */

import { CostEstimateResult } from './costEstimator';
import { PriceSuggestionResult } from '../services/quoteHistoryService';
import type { ProjectContext } from './contextAnalyzer';

export interface PricingBreakdown {
  // Base
  baseTotal: number;
  baseSource: 'ticketRange' | 'priceRange' | 'historical' | 'spainData' | 'internal';
  rangeReference?: { min: number; max: number; source: string; sectorKey?: string; scale?: string };
  
  // Ajustes aplicados
  adjustments: {
    sector?: { value: number; multiplier: number; description: string };
    historical?: { value: number; weight: number; similarQuotes: number[]; description: string };
    location?: { value: number; multiplier: number; region: string; description: string };
    quality?: { value: number; multiplier: number; level: string; description: string };
    urgency?: { value: number; multiplier: number; reason?: string; description: string };
    clientProfile?: { value: number; multiplier: number; profile: string; description: string };
    projectType?: { value: number; multiplier: number; type: string; description: string };
    inflation?: { value: number; multiplier: number; description: string };
    timeline?: { value: number; multiplier: number; description: string };
  };
  
  // Validaciones
  validations: {
    minPriceApplied?: { original: number; adjusted: number; reason: string };
    maxPriceApplied?: { original: number; adjusted: number; reason: string };
    rangeValidation: { passed: boolean; range: { min: number; max: number }; adjusted?: boolean; reason?: string };
  };
  
  // Resultado final
  finalTotal: number;
  calculationMethod: 'internal' | 'hybrid' | 'spainData' | 'external';
  confidence: 'high' | 'medium' | 'low';
  currency: string;
}

/**
 * Construye un desglose completo del precio a partir de los datos de estimación
 */
type BlendDetailsLegacy = {
  baseWeight: number;
  historicWeight: number;
  baseValue: number;
  historicValue: number;
};

type BlendDetailsGranular = {
  contributions: Record<string, number>;
  weights: Record<string, number>;
  clamped?: boolean;
  range?: { min: number; max: number };
};

type BlendDetails = BlendDetailsLegacy | BlendDetailsGranular | undefined;

function isLegacyBlend(details: BlendDetails): details is BlendDetailsLegacy {
  return !!details && 'baseWeight' in details && 'historicWeight' in details;
}

export function buildPricingBreakdown(
  costEstimate: CostEstimateResult,
  priceSuggestion?: PriceSuggestionResult,
  blendDetails?: BlendDetails,
  projectContext?: ProjectContext,
  qualityLevel?: 'basico' | 'estandar' | 'premium',
  currency: string = 'MXN'
): PricingBreakdown {
  const adjustments: PricingBreakdown['adjustments'] = {};
  const baseSource: PricingBreakdown['baseSource'] =
    costEstimate.baseRangeSource === 'spain_base_ticket' ? 'spainData' : 'ticketRange';
  const breakdown: PricingBreakdown = {
    baseTotal: costEstimate.baseTotal,
    baseSource,
    adjustments,
    validations: {
      rangeValidation: costEstimate.rangeValidation || {
        passed: true,
        range: { min: 0, max: Infinity }
      }
    },
    finalTotal: costEstimate.targetTotal,
    calculationMethod: 'internal',
    confidence: 'medium',
    currency
  };
  if (costEstimate.baseRange) {
    breakdown.rangeReference = {
      min: costEstimate.baseRange.min,
      max: costEstimate.baseRange.max,
      source: baseSource === 'spainData' ? 'BASE_TICKET_RANGES_ES' : 'sectorCostProfiles',
      sectorKey: costEstimate.sectorKey,
      scale: costEstimate.priceScale || costEstimate.scale
    };
  }
  
  // Ajuste por sector (base)
  adjustments.sector = {
    value: costEstimate.baseTotal,
    multiplier: 1.0,
    description: `Precio base para sector ${costEstimate.sectorKey || costEstimate.scale} (${costEstimate.scale})`
  };
  
  // Ajuste histórico
  const historicContribution = isLegacyBlend(blendDetails)
    ? blendDetails.historicValue
    : blendDetails?.contributions?.historic;
  const historicWeight = isLegacyBlend(blendDetails)
    ? blendDetails.historicWeight
    : blendDetails?.weights?.historic;

  if (priceSuggestion?.suggestedAverage && (blendDetails || historicContribution)) {
    adjustments.historical = {
      value: historicContribution ?? priceSuggestion.suggestedAverage,
      weight: historicWeight ?? 0.25,
      similarQuotes: priceSuggestion.similarQuotes.map(q => q.id),
      description: `Promedio de ${priceSuggestion.similarQuotes.length} cotizaciones similares del usuario (peso: ${(((historicWeight ?? 0.25) * 100).toFixed(0))}%)`
    };
  }
  
  // Ajuste por ubicación/región
  if (costEstimate.appliedMultipliers.location || costEstimate.appliedMultipliers.region) {
    const locationMultiplier = costEstimate.appliedMultipliers.location || costEstimate.appliedMultipliers.region || 1;
    adjustments.location = {
      value: costEstimate.baseTotal * locationMultiplier,
      multiplier: locationMultiplier,
      region: costEstimate.region || projectContext?.locationHint || 'No especificada',
      description: `Ajuste por ubicación: ${costEstimate.region || 'región'} (${locationMultiplier > 1 ? '+' : ''}${((locationMultiplier - 1) * 100).toFixed(0)}%)`
    };
  }
  
  // Ajuste por calidad
  if (qualityLevel) {
    const qualityMultipliers: Record<string, number> = {
      basico: 0.9,
      estandar: 1.0,
      premium: 1.1
    };
    const qualityMultiplier = qualityMultipliers[qualityLevel] || 1.0;
    if (qualityMultiplier !== 1.0) {
      adjustments.quality = {
        value: costEstimate.targetTotal * qualityMultiplier,
        multiplier: qualityMultiplier,
        level: qualityLevel,
        description: `Nivel de calidad: ${qualityLevel} (${qualityMultiplier > 1 ? '+' : ''}${((qualityMultiplier - 1) * 100).toFixed(0)}%)`
      };
    }
  }
  
  // Ajuste por urgencia
  if (costEstimate.appliedMultipliers.urgency) {
    adjustments.urgency = {
      value: costEstimate.targetTotal * costEstimate.appliedMultipliers.urgency,
      multiplier: costEstimate.appliedMultipliers.urgency,
      reason: projectContext?.urgencyReason,
      description: `Proyecto urgente (${((costEstimate.appliedMultipliers.urgency - 1) * 100).toFixed(0)}% adicional)`
    };
  }
  
  // Ajuste por perfil de cliente
  if (costEstimate.appliedMultipliers.clientProfile && costEstimate.clientProfile) {
    adjustments.clientProfile = {
      value: costEstimate.targetTotal * costEstimate.appliedMultipliers.clientProfile,
      multiplier: costEstimate.appliedMultipliers.clientProfile,
      profile: costEstimate.clientProfile,
      description: `Perfil de cliente: ${costEstimate.clientProfile} (${costEstimate.appliedMultipliers.clientProfile > 1 ? '+' : ''}${((costEstimate.appliedMultipliers.clientProfile - 1) * 100).toFixed(0)}%)`
    };
  }
  
  // Ajuste por tipo de proyecto
  if (costEstimate.appliedMultipliers.projectType && costEstimate.projectType) {
    adjustments.projectType = {
      value: costEstimate.targetTotal * costEstimate.appliedMultipliers.projectType,
      multiplier: costEstimate.appliedMultipliers.projectType,
      type: costEstimate.projectType,
      description: `Tipo de proyecto: ${costEstimate.projectType} (${costEstimate.appliedMultipliers.projectType > 1 ? '+' : ''}${((costEstimate.appliedMultipliers.projectType - 1) * 100).toFixed(0)}%)`
    };
  }
  
  // Ajuste por inflación
  if (costEstimate.appliedMultipliers.inflation) {
    adjustments.inflation = {
      value: costEstimate.baseTotal * costEstimate.appliedMultipliers.inflation,
      multiplier: costEstimate.appliedMultipliers.inflation,
      description: `Ajuste por inflación (${((costEstimate.appliedMultipliers.inflation - 1) * 100).toFixed(1)}%)`
    };
  }
  
  // Ajuste por timeline
  if (costEstimate.appliedMultipliers.timeline) {
    adjustments.timeline = {
      value: costEstimate.targetTotal * costEstimate.appliedMultipliers.timeline,
      multiplier: costEstimate.appliedMultipliers.timeline,
      description: `Timeline ajustado (${((costEstimate.appliedMultipliers.timeline - 1) * 100).toFixed(0)}% adicional)`
    };
  }
  
  // Validaciones
  const validations = breakdown.validations;
  if (costEstimate.rangeValidation?.adjusted && costEstimate.rangeValidation.original) {
    if (costEstimate.rangeValidation.original < costEstimate.rangeValidation.range.min) {
      validations.minPriceApplied = {
        original: costEstimate.rangeValidation.original,
        adjusted: costEstimate.targetTotal,
        reason: costEstimate.rangeValidation.reason || 'Precio por debajo del mínimo del sector'
      };
    } else if (costEstimate.rangeValidation.original > costEstimate.rangeValidation.range.max) {
      validations.maxPriceApplied = {
        original: costEstimate.rangeValidation.original,
        adjusted: costEstimate.targetTotal,
        reason: costEstimate.rangeValidation.reason || 'Precio por encima del máximo del sector'
      };
    }
  }
  
  // Determinar método de cálculo
  let calculationMethod: PricingBreakdown['calculationMethod'] = baseSource === 'spainData' ? 'spainData' : 'internal';
  if (priceSuggestion?.suggestedAverage) {
    calculationMethod = 'hybrid';
  }
  // TODO: Añadir detección de 'spainData' cuando se integren datos de España
  // TODO: Añadir detección de 'external' cuando se integren APIs externas
  
  // Determinar nivel de confianza
  let confidence: PricingBreakdown['confidence'] = 'medium';
  if (priceSuggestion?.suggestedAverage && priceSuggestion.similarQuotes.length >= 3) {
    confidence = 'high';
  } else if (!priceSuggestion || priceSuggestion.similarQuotes.length === 0) {
    confidence = 'low';
  }
  
  breakdown.calculationMethod = calculationMethod;
  breakdown.confidence = confidence;

  return breakdown;
}

/**
 * Genera una explicación legible del precio en texto plano
 */
export function buildPricingExplanation(breakdown: PricingBreakdown): string {
  const parts: string[] = [];
  
  parts.push(`💰 DESGLOSE DE PRECIO (${breakdown.currency})`);
  parts.push('');
  parts.push(`📊 Precio Base: ${formatCurrency(breakdown.baseTotal, breakdown.currency)}`);
  parts.push(`   Fuente: ${getBaseSourceLabel(breakdown.baseSource)}`);
  if (breakdown.rangeReference) {
    parts.push(
      `   Rango de referencia: ${formatCurrency(breakdown.rangeReference.min, breakdown.currency)} - ${formatCurrency(
        breakdown.rangeReference.max,
        breakdown.currency
      )} (${breakdown.rangeReference.source})`
    );
  }
  parts.push('');
  
  if (Object.keys(breakdown.adjustments).length > 0) {
    parts.push('📈 Ajustes Aplicados:');
    Object.values(breakdown.adjustments).forEach(adj => {
      if (adj) {
        parts.push(`   • ${adj.description}`);
        if ('value' in adj && adj.value !== breakdown.baseTotal) {
          parts.push(`     Valor: ${formatCurrency(adj.value, breakdown.currency)}`);
        }
      }
    });
    parts.push('');
  }
  
  if (breakdown.validations.rangeValidation) {
    const val = breakdown.validations.rangeValidation;
    if (val.adjusted) {
      parts.push('⚠️ Validación de Rango:');
      parts.push(`   ${val.reason || 'Precio ajustado para cumplir con el rango del sector'}`);
      parts.push(`   Rango válido: ${formatCurrency(val.range.min, breakdown.currency)} - ${formatCurrency(val.range.max, breakdown.currency)}`);
      parts.push('');
    }
  }
  
  parts.push(`✅ Precio Final: ${formatCurrency(breakdown.finalTotal, breakdown.currency)}`);
  parts.push(`   Método: ${getCalculationMethodLabel(breakdown.calculationMethod)}`);
  parts.push(`   Confianza: ${getConfidenceLabel(breakdown.confidence)}`);
  
  return parts.join('\n');
}

/**
 * Genera una explicación breve del precio (una línea)
 */
export function buildPricingSummary(breakdown: PricingBreakdown): string {
  const adjustments = Object.keys(breakdown.adjustments).length;
  const confidence = breakdown.confidence === 'high' ? 'alta' : breakdown.confidence === 'medium' ? 'media' : 'baja';
  
  return `Precio calculado: ${formatCurrency(breakdown.finalTotal, breakdown.currency)} (${adjustments} ajustes aplicados, confianza ${confidence})`;
}

// Funciones auxiliares

function formatCurrency(amount: number, currency: string): string {
  try {
    const locale = currency === 'EUR' ? 'es-ES' : currency === 'USD' ? 'en-US' : 'es-MX';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0
    }).format(amount);
  } catch {
    return `${currency} ${Math.round(amount).toLocaleString()}`;
  }
}

function getBaseSourceLabel(source: PricingBreakdown['baseSource']): string {
  const labels: Record<PricingBreakdown['baseSource'], string> = {
    ticketRange: 'Rango estándar del sector',
    priceRange: 'Rango proporcionado por el usuario',
    historical: 'Basado en histórico del usuario',
    spainData: 'Datos de precios de España',
    internal: 'Cálculo interno'
  };
  return labels[source] || 'Desconocido';
}

function getCalculationMethodLabel(method: PricingBreakdown['calculationMethod']): string {
  const labels: Record<PricingBreakdown['calculationMethod'], string> = {
    internal: 'Lógica interna',
    hybrid: 'Híbrido (interno + histórico)',
    spainData: 'Datos de España',
    external: 'APIs externas'
  };
  return labels[method] || 'Desconocido';
}

function getConfidenceLabel(confidence: PricingBreakdown['confidence']): string {
  const labels: Record<PricingBreakdown['confidence'], string> = {
    high: 'Alta (basado en histórico suficiente)',
    medium: 'Media (histórico limitado)',
    low: 'Baja (sin histórico, solo lógica interna)'
  };
  return labels[confidence] || 'Desconocida';
}

