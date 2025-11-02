/**
 * Distribuidor de precios por peso para evitar totales idénticos
 */

import { ARCHITECTURE_PRICE_WEIGHTS, CONTRACTOR_PRICE_WEIGHTS } from '../config/architectureTemplates';

export interface QuoteItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface DistributionResult {
  items: QuoteItem[];
  aestheticAdjusted: boolean;
}

/**
 * Perfiles de peso por sector para distribuir precios de forma realista
 */
const WEIGHT_PROFILES: Record<string, Record<string, number>> = {
  software: {
    // Palabras clave y sus pesos
    'análisis': 0.15,
    'diseño': 0.20,
    'desarrollo': 0.35,
    'implementacion': 0.35,
    'programacion': 0.35,
    'backend': 0.30,
    'frontend': 0.25,
    'integracion': 0.30,
    'pruebas': 0.20,
    'testing': 0.20,
    'soporte': 0.15,
    'mantenimiento': 0.15,
    'documentacion': 0.10,
    'capacitacion': 0.15,
    'formacion': 0.15,
  },
  marketing: {
    'estrategia': 0.25,
    'diseno': 0.30,
    'diseno grafico': 0.30,
    'contenidos': 0.35,
    'redes sociales': 0.35,
    'publicidad': 0.40,
    'ads': 0.40,
    'campaña': 0.40,
    'video': 0.35,
    'fotografia': 0.30,
    'edicion': 0.25,
    'community': 0.20,
    'influencer': 0.30,
    'analytics': 0.15,
    'reportes': 0.15,
  },
  construccion: {
    // Pesos para contratistas (materiales y mano de obra)
    'materiales': 0.40,
    'mano de obra': 0.35,
    'instalacion': 0.30,
    'diseño': 0.25,
    'supervision': 0.20,
    'permisos': 0.15,
    'transport': 0.10,
    'limpieza': 0.10,
    'pintura': 0.15,
    'electricidad': 0.25,
    'plomeria': 0.25,
    'refacciones': 0.15,
  },
  arquitectura: {
    // Pesos especiales para arquitectos (énfasis en proyecto y supervisión)
    'levantamiento': 0.10,
    'análisis': 0.10,
    'anteproyecto': 0.20,
    'proyecto': 0.30,
    'proyecto ejecutivo': 0.30,
    'desarrollo': 0.30,
    'memoria': 0.15,
    'documentación': 0.15,
    'planos': 0.15,
    'coordinación': 0.15,
    'especialidades': 0.15,
    'supervisión': 0.25,
    'dirección': 0.25,
    'control': 0.20,
    'cumplimiento': 0.20,
    'normativas': 0.15,
    'entrega': 0.10,
    'as-built': 0.10,
    'cierre': 0.10,
  },
  general: {
    // Pesos por defecto para cualquier sector
    'análisis': 0.15,
    'diseño': 0.20,
    'desarrollo': 0.30,
    'implementacion': 0.30,
    'configuracion': 0.20,
    'capacitacion': 0.15,
    'soporte': 0.15,
  }
};

/**
 * Calcula el peso de un ítem según su descripción
 */
function calculateItemWeight(description: string, sector?: string, archContext?: { isArchitecture: boolean; mode: "architect" | "contractor" }): number {
  const desc = description.toLowerCase().trim();
  
  // Si es arquitectura, usar perfil de arquitectura
  let profile = WEIGHT_PROFILES.general;
  if (archContext?.isArchitecture && archContext.mode === "architect") {
    profile = WEIGHT_PROFILES.arquitectura;
  } else if (sector && WEIGHT_PROFILES[sector]) {
    profile = WEIGHT_PROFILES[sector];
  }
  
  // Buscar coincidencias con palabras clave del perfil
  for (const [keyword, weight] of Object.entries(profile)) {
    if (desc.includes(keyword)) {
      return weight;
    }
  }
  
  // Si no hay coincidencia, devolver peso neutro
  return 0.20;
}

/**
 * Aplica un pequeño ajuste estético para evitar totales "redondos"
 */
function applyAestheticAdjustment(
  items: QuoteItem[],
  targetTotal: number,
  taxPercent: number
): DistributionResult {
  let adjusted = false;
  
  // Recalcular subtotal real
  let actualSubtotal = items.reduce((sum, item) => sum + item.total, 0);
  let actualTotal = actualSubtotal * (1 + taxPercent / 100);
  
  // Si el total termina en 00 o 50, intentar ajustar
  const lastDigits = Math.round(actualTotal) % 100;
  if (lastDigits === 0 || lastDigits === 50) {
    // Ajustar ±10 o ±20
    const adjustment = lastDigits === 0 ? -15 : 15;
    
    // No ajustar más del 2% del total
    const maxAdjustment = actualTotal * 0.02;
    const finalAdjustment = Math.abs(adjustment) <= maxAdjustment ? adjustment : 0;
    
    if (finalAdjustment !== 0) {
      // Ajustar el subtotal proporcionalmente
      const newSubtotal = actualSubtotal + finalAdjustment;
      const ratio = newSubtotal / actualSubtotal;
      
      // Reasignar proporcionalmente a cada item
      items = items.map(item => {
        const newTotal = item.total * ratio;
        return {
          ...item,
          unitPrice: newTotal / item.quantity,
          total: newTotal
        };
      });
      
      adjusted = true;
      console.log(`🎨 Ajuste estético aplicado: ${actualTotal.toFixed(2)} → ${(newSubtotal * (1 + taxPercent / 100)).toFixed(2)}`);
    }
  }
  
  return {
    items,
    aestheticAdjusted: adjusted
  };
}

/**
 * Distribuye el total entre los items usando pesos
 */
export function distributeTotalsByWeight(
  items: QuoteItem[],
  targetTotal: number,
  sector?: string,
  taxPercent: number = 16,
  archContext?: { isArchitecture: boolean; mode: "architect" | "contractor" }
): DistributionResult {
  // Para arquitectura, usar pesos fijos por posición según sugerencia del usuario
  let weights: number[];
  if (archContext?.isArchitecture && archContext.mode === "architect") {
    // Pesos específicos por posición: 0.12, 0.13, 0.35, 0.15, 0.15, 0.10
    const fixedWeights = [0.12, 0.13, 0.35, 0.15, 0.15, 0.10];
    weights = items.map((_, index) => fixedWeights[index] || 0.20);
    console.log(`🏗️ Usando pesos fijos de arquitectura: ${weights.join(', ')}`);
  } else {
    // Para otros sectores, calcular pesos dinámicamente
    weights = items.map(item => calculateItemWeight(item.description, sector, archContext));
  }
  
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  
  // Calcular el subtotal objetivo (sin IVA)
  const targetSubtotal = targetTotal / (1 + taxPercent / 100);
  
  // Distribuir el subtotal según pesos
  const distributedItems = items.map((item, index) => {
    const weightRatio = weights[index] / totalWeight;
    const allocatedSubtotal = targetSubtotal * weightRatio;
    
    // Añadir pequeña variación aleatoria (±3%) para evitar valores idénticos
    const randomVariation = (Math.random() * 0.06 - 0.03); // -3% a +3%
    const finalTotal = allocatedSubtotal * (1 + randomVariation);
    
    // Calcular unitPrice
    const unitPrice = finalTotal / item.quantity;
    
    return {
      description: item.description,
      quantity: item.quantity,
      unitPrice: parseFloat(unitPrice.toFixed(2)),
      total: parseFloat(finalTotal.toFixed(2))
    };
  });
  
  // Recalcular subtotal y total reales (después de variaciones aleatorias)
  let actualSubtotal = distributedItems.reduce((sum, item) => sum + item.total, 0);
  let actualTax = actualSubtotal * (taxPercent / 100);
  let actualTotal = actualSubtotal + actualTax;
  
  // Aplicar ajuste estético
  const result = applyAestheticAdjustment(distributedItems, actualTotal, taxPercent);
  
  return result;
}

