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
  meta?: {
    aestheticAdjusted?: boolean;
    generatedBy?: string;
  };
}
