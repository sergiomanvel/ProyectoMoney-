import { ProjectScale } from '../config/sectorCostProfiles';

export interface ProjectContext {
  scaleOverride?: ProjectScale;
  urgencyMultiplier?: number;
  urgencyReason?: string;
  locationHint?: string;
  timelineWeeks?: number;
  locationMultiplier?: number;
  fluctuationWarning?: string;
}

const ENTERPRISE_KEYWORDS = ['integral', 'llave en mano', 'llave-en-mano', 'completo', '360', 'full', 'turnkey', 'global'];
const SMALL_KEYWORDS = ['piloto', 'mvp', 'prototipo', 'prueba', 'demo', 'mínimo', 'minimo', 'simple'];
const URGENCY_KEYWORDS: Array<{ regex: RegExp; multiplier: number; reason: string }> = [
  { regex: /\b(urgente|urgencia|inmediato|inmediata)\b/i, multiplier: 1.15, reason: 'Solicitud urgente' },
  { regex: /\b(lo antes posible|lo más pronto posible|lo mas pronto posible)\b/i, multiplier: 1.12, reason: 'Prioridad alta' },
  { regex: /\b(24\s*h|24\s*horas|48\s*h|48\s*horas|esta semana|en la semana)\b/i, multiplier: 1.2, reason: 'Entrega en 48h' }
];

const REGIONAL_MULTIPLIERS: Record<string, number> = {
  madrid: 1.25,
  'ciudad de mexico': 1.15,
  mexico: 1.1,
  españa: 1.2,
  argentina: 0.85,
  bolivia: 0.8,
  colombia: 0.9,
  chile: 1.05,
  peru: 0.95,
  usa: 1.3,
  'united states': 1.3
};

const VOLATILE_SECTORS = new Set(['construccion', 'eventos', 'manufactura']);

export function analyzeProjectContext(projectDescription: string, priceRange?: string, projectLocation?: string, sectorHint?: string): ProjectContext {
  const context: ProjectContext = {};
  const desc = projectDescription?.toLowerCase() || '';

  if (ENTERPRISE_KEYWORDS.some(keyword => desc.includes(keyword))) {
    context.scaleOverride = 'enterprise';
  } else if (SMALL_KEYWORDS.some(keyword => desc.includes(keyword))) {
    context.scaleOverride = 'small';
  }

  const areaMatch = projectDescription.match(/(\d+(?:[\.,]\d+)?)\s*(m2|m²|metros cuadrados)/i);
  if (areaMatch) {
    const numeric = parseFloat(areaMatch[1].replace(',', '.'));
    if (Number.isFinite(numeric)) {
      if (numeric >= 400) context.scaleOverride = 'enterprise';
      else if (numeric >= 120) context.scaleOverride = context.scaleOverride || 'standard';
      else if (numeric <= 60) context.scaleOverride = context.scaleOverride || 'small';
    }
  }

  for (const urgency of URGENCY_KEYWORDS) {
    if (urgency.regex.test(desc)) {
      context.urgencyMultiplier = Math.max(context.urgencyMultiplier || 1, urgency.multiplier);
      context.urgencyReason = urgency.reason;
      break;
    }
  }

  const timelineMatch = projectDescription.match(/(\d+)\s*(semanas|semana|meses|mes)/i);
  if (timelineMatch) {
    const value = parseInt(timelineMatch[1], 10);
    if (Number.isFinite(value) && value > 0) {
      const unit = timelineMatch[2].toLowerCase();
      context.timelineWeeks = unit.startsWith('mes') ? value * 4 : value;
    }
  }

  const locationMatch = projectDescription.match(/\ben\s+([A-ZÁÉÍÓÚÑ][\wáéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][\wáéíóúñ]+){0,2})/);
  const locationCandidate = locationMatch ? locationMatch[1].trim() : projectLocation;
  if (locationCandidate) {
    const normalized = locationCandidate.toLowerCase().trim();
    const normalizedClean = normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    context.locationHint = locationCandidate;

    const directKeys = [normalized, normalizedClean];
    for (const key of directKeys) {
      if (key && REGIONAL_MULTIPLIERS[key]) {
        context.locationMultiplier = REGIONAL_MULTIPLIERS[key];
        break;
      }
    }

    if (!context.locationMultiplier) {
      const parts = normalized.split(/[,\/]/).map(part => part.trim());
      const cleanParts = normalizedClean.split(/[,\/]/).map(part => part.trim());
      for (const part of [...parts, ...cleanParts]) {
        if (REGIONAL_MULTIPLIERS[part]) {
          context.locationMultiplier = REGIONAL_MULTIPLIERS[part];
          break;
        }
      }
    }
  }

  if (!context.scaleOverride && priceRange) {
    const numbers = priceRange.match(/\d+/g);
    if (numbers && numbers.length >= 2) {
      const max = parseInt(numbers[numbers.length - 1], 10);
      if (Number.isFinite(max)) {
        if (max <= 20) context.scaleOverride = 'small';
        else if (max >= 125) context.scaleOverride = 'enterprise';
      }
    }
  }

  if (!context.fluctuationWarning) {
    const sectorKey = sectorHint?.toLowerCase();
    if (sectorKey && VOLATILE_SECTORS.has(sectorKey)) {
      context.fluctuationWarning = 'Los precios podrían variar por coste de materiales en los próximos 15 días';
    } else if (desc.includes('materiales') || desc.includes('insumo') || desc.includes('petróleo') || desc.includes('acero')) {
      context.fluctuationWarning = 'Los precios pueden fluctuar según costos de insumos críticos.';
    }
  }

  return context;
}

