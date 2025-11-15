/**
 * Detecta la moneda según la región del proyecto
 */

import { ProjectContext } from './contextAnalyzer';

/**
 * Regiones que usan EUR (euros)
 */
const EUR_REGIONS = new Set([
  'madrid', 'cataluña', 'cataluna', 'barcelona', 'baleares', 'islas baleares',
  'país vasco', 'pais vasco', 'euskadi', 'andalucía', 'andalucia', 'valencia',
  'comunidad valenciana', 'murcia', 'región de murcia', 'castilla y león',
  'castilla y leon', 'galicia', 'asturias', 'principado de asturias', 'cantabria',
  'aragón', 'aragon', 'extremadura', 'castilla la mancha', 'castilla-la mancha',
  'la rioja', 'navarra', 'comunidad foral de navarra', 'canarias', 'islas canarias',
  'ceuta', 'melilla', 'españa', 'spain'
]);

/**
 * Regiones que usan USD (dólares)
 */
const USD_REGIONS = new Set([
  'usa', 'united states', 'estados unidos', 'ee.uu.', 'eeuu'
]);

/**
 * Detecta la moneda según la región del proyecto
 * @param region - Región detectada (comunidad autónoma, país, etc.)
 * @param projectLocation - Ubicación del proyecto (descripción completa)
 * @returns Código de moneda (MXN, EUR, USD, etc.)
 */
export function detectCurrency(region?: string, projectLocation?: string): string {
  // Normalizar región
  const normalizedRegion = region?.toLowerCase().trim() || '';
  const normalizedLocation = projectLocation?.toLowerCase().trim() || '';
  
  // Buscar en región detectada
  if (normalizedRegion) {
    if (EUR_REGIONS.has(normalizedRegion)) {
      return 'EUR';
    }
    if (USD_REGIONS.has(normalizedRegion)) {
      return 'USD';
    }
  }
  
  // Buscar en ubicación del proyecto
  if (normalizedLocation) {
    // Buscar comunidades autónomas españolas
    for (const eurRegion of EUR_REGIONS) {
      if (normalizedLocation.includes(eurRegion)) {
        return 'EUR';
      }
    }
    
    // Buscar países
    if (normalizedLocation.includes('españa') || normalizedLocation.includes('spain')) {
      return 'EUR';
    }
    if (normalizedLocation.includes('usa') || normalizedLocation.includes('united states') || normalizedLocation.includes('estados unidos')) {
      return 'USD';
    }
    if (normalizedLocation.includes('méxico') || normalizedLocation.includes('mexico')) {
      return 'MXN';
    }
  }
  
  // Por defecto, usar MXN (pesos mexicanos)
  return 'MXN';
}

/**
 * Obtiene el locale según la moneda
 * @param currency - Código de moneda (MXN, EUR, USD, etc.)
 * @returns Locale (es-MX, es-ES, en-US, etc.)
 */
export function getLocaleForCurrency(currency: string): string {
  switch (currency) {
    case 'EUR':
      return 'es-ES';
    case 'USD':
      return 'en-US';
    case 'MXN':
    default:
      return 'es-MX';
  }
}

/**
 * Formatea un monto según la moneda
 * @param amount - Monto a formatear
 * @param currency - Código de moneda (MXN, EUR, USD, etc.)
 * @returns Monto formateado con símbolo de moneda
 */
export function formatCurrency(amount: number, currency: string = 'MXN'): string {
  const locale = getLocaleForCurrency(currency);
  
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch (error) {
    // Fallback si la moneda no es válida
    const symbol = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : '$';
    return `${symbol}${Math.round(amount).toLocaleString(locale)}`;
  }
}

