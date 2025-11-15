import { ProjectScale } from '../config/sectorCostProfiles';

export interface SoftwareProjectProfile {
  isSaaS: boolean;
  hasWebAdmin: boolean;
  hasMobileApp: boolean;
  hasApi: boolean;
  hasAnalytics: boolean;
  hasIntegrations: boolean;
  integrationTargets: string[];
  estimatedComplexity: 'low' | 'medium' | 'high';
  complexityScore: number;
  descriptionLength: number;
}

export interface ProjectContext {
  scaleOverride?: ProjectScale;
  urgencyMultiplier?: number;
  urgencyReason?: string;
  locationHint?: string;
  timelineWeeks?: number;
  locationMultiplier?: number;
  fluctuationWarning?: string;
  region?: string; // Comunidad autónoma o región detectada
  clientProfile?: 'autonomo' | 'pyme' | 'agencia' | 'startup' | 'enterprise';
  projectType?: string; // Tipo de proyecto específico del sector
  softwareProfile?: SoftwareProjectProfile;
}

const ENTERPRISE_KEYWORDS = ['integral', 'llave en mano', 'llave-en-mano', 'completo', '360', 'full', 'turnkey', 'global'];
const SMALL_KEYWORDS = ['piloto', 'mvp', 'prototipo', 'prueba', 'demo', 'mínimo', 'minimo', 'simple'];
const URGENCY_KEYWORDS: Array<{ regex: RegExp; multiplier: number; reason: string }> = [
  { regex: /\b(urgente|urgencia|inmediato|inmediata)\b/i, multiplier: 1.15, reason: 'Solicitud urgente' },
  { regex: /\b(lo antes posible|lo más pronto posible|lo mas pronto posible)\b/i, multiplier: 1.12, reason: 'Prioridad alta' },
  { regex: /\b(24\s*h|24\s*horas|48\s*h|48\s*horas|esta semana|en la semana)\b/i, multiplier: 1.2, reason: 'Entrega en 48h' }
];

// Multiplicadores por comunidad autónoma española (prioridad alta)
const SPAIN_REGIONAL_MULTIPLIERS: Record<string, number> = {
  'madrid': 1.25,
  'cataluña': 1.20,
  'cataluna': 1.20,
  'barcelona': 1.20,
  'baleares': 1.15,
  'islas baleares': 1.15,
  'país vasco': 1.18,
  'pais vasco': 1.18,
  'euskadi': 1.18,
  'andalucía': 0.95,
  'andalucia': 0.95,
  'valencia': 1.05,
  'comunidad valenciana': 1.05,
  'murcia': 0.90,
  'región de murcia': 0.90,
  'castilla y león': 0.92,
  'castilla y leon': 0.92,
  'galicia': 0.93,
  'asturias': 0.94,
  'principado de asturias': 0.94,
  'cantabria': 0.95,
  'aragón': 0.96,
  'aragon': 0.96,
  'extremadura': 0.88,
  'castilla la mancha': 0.89,
  'castilla-la mancha': 0.89,
  'la rioja': 0.97,
  'navarra': 1.10,
  'comunidad foral de navarra': 1.10,
  'canarias': 1.08,
  'islas canarias': 1.08,
  'ceuta': 1.20,
  'melilla': 1.20
};

// Multiplicadores por comunidad autónoma para construcción (valores más altos)
const CONSTRUCTION_REGIONAL_MULTIPLIERS: Record<string, number> = {
  'madrid': 1.30,
  'cataluña': 1.25,
  'cataluna': 1.25,
  'barcelona': 1.25,
  'baleares': 1.35,
  'islas baleares': 1.35,
  'país vasco': 1.28,
  'pais vasco': 1.28,
  'euskadi': 1.28,
  'canarias': 1.32,
  'islas canarias': 1.32,
  'andalucía': 0.92,
  'andalucia': 0.92,
  'valencia': 1.05,
  'comunidad valenciana': 1.05,
  'murcia': 0.88,
  'región de murcia': 0.88,
  'castilla y león': 0.90,
  'castilla y leon': 0.90,
  'galicia': 0.93,
  'asturias': 0.94,
  'principado de asturias': 0.94,
  'cantabria': 0.95,
  'aragón': 0.96,
  'aragon': 0.96,
  'extremadura': 0.85,
  'castilla la mancha': 0.87,
  'castilla-la mancha': 0.87,
  'la rioja': 0.97,
  'navarra': 1.12,
  'comunidad foral de navarra': 1.12,
  'ceuta': 1.20,
  'melilla': 1.20
};

// Multiplicadores para otros países (mantener compatibilidad)
const OTHER_COUNTRIES_MULTIPLIERS: Record<string, number> = {
  'ciudad de mexico': 1.15,
  'mexico': 1.1,
  'españa': 1.2,
  'argentina': 0.85,
  'bolivia': 0.8,
  'colombia': 0.9,
  'chile': 1.05,
  'peru': 0.95,
  'usa': 1.3,
  'united states': 1.3
};

const REGIONAL_MULTIPLIERS: Record<string, number> = {
  ...SPAIN_REGIONAL_MULTIPLIERS,
  ...CONSTRUCTION_REGIONAL_MULTIPLIERS,
  ...OTHER_COUNTRIES_MULTIPLIERS
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

  // Detectar ubicación (mejorado para detectar comunidad autónoma)
  const locationMatch = projectDescription.match(/\ben\s+([A-ZÁÉÍÓÚÑ][\wáéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][\wáéíóúñ]+){0,2})/);
  const locationCandidate = locationMatch ? locationMatch[1].trim() : projectLocation;
  if (locationCandidate) {
    const normalized = locationCandidate.toLowerCase().trim();
    const normalizedClean = normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    context.locationHint = locationCandidate;
    context.region = locationCandidate; // Guardar región detectada

    // Buscar primero en multiplicadores españoles (prioridad)
    const directKeys = [normalized, normalizedClean];
    for (const key of directKeys) {
      if (key && SPAIN_REGIONAL_MULTIPLIERS[key]) {
        context.locationMultiplier = SPAIN_REGIONAL_MULTIPLIERS[key];
        context.region = key;
        break;
      }
      // Si es construcción, usar multiplicadores de construcción
      if (sectorHint?.toLowerCase() === 'construccion' && CONSTRUCTION_REGIONAL_MULTIPLIERS[key]) {
        context.locationMultiplier = CONSTRUCTION_REGIONAL_MULTIPLIERS[key];
        context.region = key;
        break;
      }
    }

    if (!context.locationMultiplier) {
      const parts = normalized.split(/[,\/]/).map(part => part.trim());
      const cleanParts = normalizedClean.split(/[,\/]/).map(part => part.trim());
      for (const part of [...parts, ...cleanParts]) {
        if (SPAIN_REGIONAL_MULTIPLIERS[part]) {
          context.locationMultiplier = SPAIN_REGIONAL_MULTIPLIERS[part];
          context.region = part;
          break;
        }
        // Si es construcción, usar multiplicadores de construcción
        if (sectorHint?.toLowerCase() === 'construccion' && CONSTRUCTION_REGIONAL_MULTIPLIERS[part]) {
          context.locationMultiplier = CONSTRUCTION_REGIONAL_MULTIPLIERS[part];
          context.region = part;
          break;
        }
        // Fallback a otros países
        if (OTHER_COUNTRIES_MULTIPLIERS[part]) {
          context.locationMultiplier = OTHER_COUNTRIES_MULTIPLIERS[part];
          context.region = part;
          break;
        }
      }
    }

    // Si no se encontró, intentar con REGIONAL_MULTIPLIERS (compatibilidad)
    if (!context.locationMultiplier) {
      for (const key of directKeys) {
        if (key && REGIONAL_MULTIPLIERS[key]) {
          context.locationMultiplier = REGIONAL_MULTIPLIERS[key];
          context.region = key;
          break;
        }
      }
      if (!context.locationMultiplier) {
        const parts = normalized.split(/[,\/]/).map(part => part.trim());
        const cleanParts = normalizedClean.split(/[,\/]/).map(part => part.trim());
        for (const part of [...parts, ...cleanParts]) {
          if (REGIONAL_MULTIPLIERS[part]) {
            context.locationMultiplier = REGIONAL_MULTIPLIERS[part];
            context.region = part;
            break;
          }
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

  // Detectar perfil de cliente (opcional, basado en palabras clave)
  const clientProfileKeywords = {
    autonomo: ['autónomo', 'autonomo', 'freelance', 'freelancer', 'independiente'],
    pyme: ['pyme', 'pme', 'pequeña empresa', 'pequeña y mediana', 'startup', 'empresa familiar'],
    agencia: ['agencia', 'agencia digital', 'agencia de marketing', 'estudio'],
    startup: ['startup', 'start-up', 'empresa emergente', 'nueva empresa'],
    enterprise: ['enterprise', 'corporativo', 'corporación', 'multinacional', 'gran empresa', 'empresa grande']
  };

  for (const [profile, keywords] of Object.entries(clientProfileKeywords)) {
    if (keywords.some(keyword => desc.includes(keyword))) {
      context.clientProfile = profile as ProjectContext['clientProfile'];
      break;
    }
  }

  // Detectar tipo de proyecto según sector
  if (sectorHint) {
    const sector = sectorHint.toLowerCase();
    if (sector === 'software') {
      if (desc.includes('mvp') || desc.includes('prototipo') || desc.includes('piloto')) {
        context.projectType = 'mvp';
      } else if (desc.includes('enterprise') || desc.includes('corporativo') || desc.includes('gran escala')) {
        context.projectType = 'enterprise';
      } else {
        context.projectType = 'standard';
      }
    } else if (sector === 'marketing') {
      if (desc.includes('branding') || desc.includes('marca') || desc.includes('identidad')) {
        context.projectType = 'branding';
      } else if (desc.includes('performance') || desc.includes('conversiones') || desc.includes('roas')) {
        context.projectType = 'performance';
      } else {
        context.projectType = 'mixto';
      }
    } else if (sector === 'construccion') {
      if (desc.includes('residencial') || desc.includes('vivienda') || desc.includes('casa')) {
        context.projectType = 'residencial';
      } else if (desc.includes('industrial') || desc.includes('nave') || desc.includes('fábrica')) {
        context.projectType = 'industrial';
      } else if (desc.includes('comercial') || desc.includes('local') || desc.includes('tienda')) {
        context.projectType = 'comercial';
      } else if (desc.includes('rehabilitación') || desc.includes('rehabilitacion') || desc.includes('reforma integral')) {
        context.projectType = 'rehabilitacion';
      } else if (desc.includes('reforma') || desc.includes('remodelación') || desc.includes('remodelacion')) {
        context.projectType = 'reforma';
      }
    } else if (sector === 'consultoria') {
      if (desc.includes('it') || desc.includes('tecnología') || desc.includes('tecnologia') || desc.includes('digital')) {
        context.projectType = 'it';
      } else if (desc.includes('financiera') || desc.includes('financiero') || desc.includes('contable')) {
        context.projectType = 'financiera';
      } else if (desc.includes('estratégica') || desc.includes('estrategica') || desc.includes('estrategia')) {
        context.projectType = 'estrategica';
      } else if (desc.includes('rrhh') || desc.includes('recursos humanos') || desc.includes('talento')) {
        context.projectType = 'rrhh';
      } else {
        context.projectType = 'general';
      }
    } else if (sector === 'ecommerce') {
      if (desc.includes('b2b') || desc.includes('business to business')) {
        context.projectType = 'b2b';
      } else if (desc.includes('marketplace') || desc.includes('plataforma')) {
        context.projectType = 'marketplace';
      } else if (desc.includes('dropshipping') || desc.includes('dropship')) {
        context.projectType = 'dropshipping';
      } else if (desc.includes('suscripción') || desc.includes('suscripcion') || desc.includes('subscription')) {
        context.projectType = 'subscription';
      } else {
        context.projectType = 'b2c';
      }
    } else if (sector === 'eventos') {
      if (desc.includes('corporativo') || desc.includes('empresa') || desc.includes('negocio')) {
        context.projectType = 'corporate';
      } else if (desc.includes('social') || desc.includes('boda') || desc.includes('cumpleaños')) {
        context.projectType = 'social';
      } else if (desc.includes('cultural') || desc.includes('arte') || desc.includes('museo')) {
        context.projectType = 'cultural';
      } else if (desc.includes('deportivo') || desc.includes('deporte') || desc.includes('deportes')) {
        context.projectType = 'deportivo';
      } else if (desc.includes('virtual') || desc.includes('online') || desc.includes('streaming')) {
        context.projectType = 'virtual';
      } else if (desc.includes('híbrido') || desc.includes('hibrido') || desc.includes('mixto')) {
        context.projectType = 'hibrido';
      } else {
        context.projectType = 'corporate';
      }
    } else if (sector === 'comercio') {
      if (desc.includes('omnicanal') || desc.includes('omnichannel') || desc.includes('multi-canal')) {
        context.projectType = 'omnicanal';
      } else if (desc.includes('franquicia') || desc.includes('franchising') || desc.includes('franquiciado')) {
        context.projectType = 'franchising';
      } else if (desc.includes('pop-up') || desc.includes('popup') || desc.includes('temporal')) {
        context.projectType = 'popup';
      } else if (desc.includes('concept store') || desc.includes('concept') || desc.includes('experiencia')) {
        context.projectType = 'concept';
      } else {
        context.projectType = 'fisico';
      }
    } else if (sector === 'manufactura') {
      if (desc.includes('continua') || desc.includes('flujo continuo')) {
        context.projectType = 'continua';
      } else if (desc.includes('por lotes') || desc.includes('lotes') || desc.includes('batch')) {
        context.projectType = 'porLotes';
      } else if (desc.includes('custom') || desc.includes('personalizado') || desc.includes('a medida')) {
        context.projectType = 'custom';
      } else if (desc.includes('automotriz') || desc.includes('automóvil') || desc.includes('automovil')) {
        context.projectType = 'automotriz';
      } else if (desc.includes('farmacéutica') || desc.includes('farmaceutica') || desc.includes('farma')) {
        context.projectType = 'farmaceutica';
      } else {
        context.projectType = 'discreta';
      }
    } else if (sector === 'formacion') {
      if (desc.includes('online') || desc.includes('virtual') || desc.includes('remoto')) {
        context.projectType = 'online';
      } else if (desc.includes('blended') || desc.includes('mixto') || desc.includes('híbrido')) {
        context.projectType = 'blended';
      } else if (desc.includes('e-learning') || desc.includes('elearning') || desc.includes('plataforma')) {
        context.projectType = 'eLearning';
      } else if (desc.includes('coaching') || desc.includes('coach')) {
        context.projectType = 'coaching';
      } else if (desc.includes('workshop') || desc.includes('taller')) {
        context.projectType = 'workshop';
      } else {
        context.projectType = 'presencial';
      }
    }
  }

  if (sectorHint) {
    const softwareAliases = new Set(['software', 'software_it', 'software desarrollo', 'software / desarrollo']);
    if (softwareAliases.has(sectorHint.toLowerCase())) {
      context.softwareProfile = detectSoftwareProfile(desc);
    }
  }

  return context;
}

function detectSoftwareProfile(desc: string): SoftwareProjectProfile {
  const normalized = desc.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const lengthScore = normalized.length > 600 ? 1 : 0;

  const matchAny = (patterns: RegExp[]) => patterns.some(regex => regex.test(normalized));

  const hasWebAdmin = matchAny([
    /\bpanel\s+(web|admin|administrador)/,
    /\bdashboard\b/,
    /\bbackoffice\b/,
    /interfaz\s+de\s+administracion/,
    /portal\s+de\s+gestion/
  ]);

  const hasMobileApp = matchAny([
    /\bapp\s+m(ovil|óvil)/,
    /\baplicacion\s+m(ovil|óvil)/,
    /\bandroid\b/,
    /\bios\b/,
    /aplicacion\s+hibrida/,
    /conductores\s+.*app/
  ]);

  const hasApi = matchAny([
    /\bapi\b/,
    /\brest\b/,
    /\bgraphql\b/,
    /\bendpoints?\b/,
    /\bwebhooks?\b/
  ]);

  const hasAnalytics = matchAny([
    /\bmetricas?\b/,
    /\banalitica\b/,
    /\banalytics?\b/,
    /\breportes?\b/,
    /\bkpi?s?\b/
  ]);

  const integrationCatalog: Array<{ regex: RegExp; label: string }> = [
    { regex: /google\s+maps?/, label: 'Google Maps' },
    { regex: /mapbox/, label: 'Mapbox' },
    { regex: /stripe/, label: 'Stripe' },
    { regex: /paypal/, label: 'PayPal' },
    { regex: /salesforce/, label: 'Salesforce' },
    { regex: /sap/, label: 'SAP' },
    { regex: /hubspot/, label: 'HubSpot' },
    { regex: /zapier/, label: 'Zapier' },
    { regex: /\bcrm\b/, label: 'CRM' },
    { regex: /\berp\b/, label: 'ERP' },
    { regex: /pasarelas?\s+de\s+pago/, label: 'Pasarelas de pago' }
  ];
  const integrationTargets = integrationCatalog
    .filter(entry => entry.regex.test(normalized))
    .map(entry => entry.label);
  const hasIntegrations = integrationTargets.length > 0;

  const isSaaS = matchAny([
    /\bsaas\b/,
    /software\s+as\s+a\s+service/,
    /plataforma\s+como\s+servicio/,
    /multi\s*tenant/,
    /multi\s*empresa/,
    /multi\s*cliente/
  ]);

  let score = 0;
  if (hasWebAdmin) score += 2;
  if (hasMobileApp) score += 3;
  if (hasApi) score += 2;
  if (hasAnalytics) score += 1;
  if (hasIntegrations) score += 1;
  if (isSaaS) score += 2;
  score += lengthScore;

  let estimatedComplexity: SoftwareProjectProfile['estimatedComplexity'] = 'low';
  if (score >= 7) {
    estimatedComplexity = 'high';
  } else if (score >= 4) {
    estimatedComplexity = 'medium';
  }

  return {
    isSaaS,
    hasWebAdmin,
    hasMobileApp,
    hasApi,
    hasAnalytics,
    hasIntegrations,
    integrationTargets,
    estimatedComplexity,
    complexityScore: score,
    descriptionLength: normalized.length
  };
}

