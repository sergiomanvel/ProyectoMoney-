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
