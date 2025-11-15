import type { ProjectContext } from '../utils/contextAnalyzer';

export interface Quote {
  id?: number;
  clientName: string;
  clientEmail: string;
  projectDescription: string;
  priceRange: string;
  generatedContent: string;
  totalAmount: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface QuoteItem {
  id?: number;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  category?: "proyecto" | "supervision" | "obra" | "entrega";
}

export interface GeneratedQuote {
  title: string;
  clientName: string;
  projectDescription: string;
  items: QuoteItem[];
  subtotal: number;
  tax: number;
  total: number;
  validUntil: string;
  terms: string[];
  summary?: string;
  sector?: string;
  estimatedDelivery?: string;
  deliverables?: string[];
  timeline?: string[];
  fluctuationWarning?: string;
  currency?: string; // Código de moneda (MXN, EUR, USD, etc.)
  meta?: {
    aestheticAdjusted?: boolean;
    generatedBy?: string;
    projectContext?: ProjectContext;
    qualityLevel?: 'basico' | 'estandar' | 'premium';
    clientProfile?: 'autonomo' | 'pyme' | 'agencia' | 'startup' | 'enterprise';
    projectType?: string;
    region?: string;
    historicalPricing?: {
      suggestedAverage?: number;
      low?: number;
      high?: number;
      similarQuoteIds?: number[];
    };
    estimateDetail?: {
      scale?: string;
      baseTotal?: number;
      baseTotalBeforeAdjustments?: number;
      appliedMultipliers?: {
        inflation?: number;
        marketLocation?: number;
        location?: number;
        urgency?: number;
        timeline?: number;
        clientProfile?: number;
        projectType?: number;
        region?: number;
      };
      blendedHistoricTotal?: number;
      fallbackUsed?: boolean;
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
      sectorKey?: string;
      priceScale?: 'small' | 'standard' | 'enterprise';
      baseRange?: { min: number; max: number };
      baseRangeSource?: string;
      adjustmentsSummary?: {
        qualityMultiplier?: number;
        locationMultiplier?: number;
        urgencyMultiplier?: number;
        clientProfileMultiplier?: number;
        projectTypeMultiplier?: number;
      };
      blendDetails?: {
        contributions?: Record<string, number>;
        weights?: Record<string, number>;
        clamped?: boolean;
        range?: { min: number; max: number };
      };
      pricingBreakdown?: {
        baseTotal: number;
        baseSource: 'ticketRange' | 'priceRange' | 'historical' | 'spainData' | 'internal';
        adjustments: Record<string, any>;
        validations: {
          minPriceApplied?: { original: number; adjusted: number; reason: string };
          maxPriceApplied?: { original: number; adjusted: number; reason: string };
          rangeValidation: { passed: boolean; range: { min: number; max: number }; adjusted?: boolean; reason?: string };
        };
        finalTotal: number;
        calculationMethod: 'internal' | 'hybrid' | 'spainData' | 'external';
        confidence: 'high' | 'medium' | 'low';
        currency: string;
        rangeReference?: { min: number; max: number; source: string; sectorKey?: string; scale?: string };
      };
      pricingExplanation?: string; // Explicación legible del precio
    };
    debug?: {
      traceId?: string;
      timings?: Record<string, number>;
      flags?: Record<string, boolean>;
      openAIModel?: string;
      historySample?: number[];
      distribution?: {
        weights?: number[];
        marginMultiplier?: number;
        overheadMultiplier?: number;
        minPerItem?: number;
      };
    };
  };
}
