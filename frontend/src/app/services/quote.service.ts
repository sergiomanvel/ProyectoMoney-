import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface QuoteRequest {
  clientName: string;
  clientEmail: string;
  projectDescription: string;
  priceRange: string;
  sector?: string;
  projectLocation?: string;
  ownerId?: string;
  qualityLevel?: 'basico' | 'estandar' | 'premium';
  clientProfile?: string;
  projectType?: string;
  region?: string;
  items?: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
}

export interface QuoteResponse {
  success: boolean;
  quoteId?: string;
  quote?: any;
  pdfUrl?: string;
  message?: string;
  error?: string;
  type?: string;
}

export interface Quote {
  id: number;
  folio?: string;
  status?: string;
  valid_until?: string;
  client_name: string;
  client_email: string;
  project_description: string;
  total_amount: number;
  created_at: string;
}

export interface QuoteItem {
  id?: number;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class QuoteService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Genera una nueva cotización
   */
  generateQuote(request: QuoteRequest): Observable<QuoteResponse> {
    return this.http.post<QuoteResponse>(`${this.apiUrl}/generate-quote`, request);
  }

  /**
   * Obtiene todas las cotizaciones
   */
  getQuotes(): Observable<{ success: boolean; quotes: Quote[] }> {
    return this.http.get<{ success: boolean; quotes: Quote[] }>(`${this.apiUrl}/quotes`);
  }

  /**
   * Obtiene una cotización específica
   */
  getQuote(id: string): Observable<{ success: boolean; quote: any }> {
    return this.http.get<{ success: boolean; quote: any }>(`${this.apiUrl}/quotes/${id}`);
  }

  /**
   * Descarga el PDF de una cotización
   */
  downloadPDF(id: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/quotes/${id}/pdf`, {
      responseType: 'blob'
    });
  }

  /**
   * Envía una cotización por email
   */
  sendEmail(id: string, customMessage?: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.apiUrl}/quotes/${id}/send-email`,
      { customMessage }
    );
  }

  /** Marca como enviada */
  markSent(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.apiUrl}/quotes/${id}/mark-sent`, {});
  }

  /** Marca como aceptada */
  acceptQuote(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.apiUrl}/quotes/${id}/accept`, {});
  }

  /** Obtiene cotización por token (público) */
  getQuoteByToken(token: string): Observable<{ success: boolean; quote: any }> {
    return this.http.get<{ success: boolean; quote: any }>(`${this.apiUrl}/quotes/view/${token}`);
  }

  /** Obtiene items de una cotización */
  getQuoteItems(quoteId: number): Observable<{ success: boolean; items: QuoteItem[] }> {
    return this.http.get<{ success: boolean; items: QuoteItem[] }>(`${this.apiUrl}/quotes/${quoteId}/items`);
  }

  /** Crea un nuevo item en una cotización */
  createQuoteItem(quoteId: number, item: { description: string; quantity: number; unitPrice: number }): Observable<{ success: boolean; items: QuoteItem[] }> {
    return this.http.post<{ success: boolean; items: QuoteItem[] }>(`${this.apiUrl}/quotes/${quoteId}/items`, item);
  }

  /** Actualiza un item existente */
  updateQuoteItem(quoteId: number, itemId: number, item: Partial<QuoteItem>): Observable<{ success: boolean; items: QuoteItem[] }> {
    return this.http.put<{ success: boolean; items: QuoteItem[] }>(`${this.apiUrl}/quotes/${quoteId}/items/${itemId}`, item);
  }

  /** Elimina un item */
  deleteQuoteItem(quoteId: number, itemId: number): Observable<{ success: boolean; items: QuoteItem[] }> {
    return this.http.delete<{ success: boolean; items: QuoteItem[] }>(`${this.apiUrl}/quotes/${quoteId}/items/${itemId}`);
  }

  /** Recalcula los totales de una cotización */
  recalculateQuote(quoteId: number): Observable<{ success: boolean; quote: any; totals: { subtotal: number; tax: number; total: number } }> {
    return this.http.post<{ success: boolean; quote: any; totals: { subtotal: number; tax: number; total: number } }>(
      `${this.apiUrl}/quotes/${quoteId}/recalculate`,
      {}
    );
  }

  /** Migra items de generated_content a DB para activar edición */
  migrateItems(quoteId: number): Observable<{ success: boolean; items: QuoteItem[]; message: string }> {
    return this.http.post<{ success: boolean; items: QuoteItem[]; message: string }>(
      `${this.apiUrl}/quotes/${quoteId}/migrate-items`,
      {}
    );
  }
}
