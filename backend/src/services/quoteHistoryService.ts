import dayjs from 'dayjs';
import OpenAI from 'openai';
import { pool } from '../server';
import { GeneratedQuote, QuoteItem } from '../models/Quote';
import { ProjectContext } from '../utils/contextAnalyzer';

export interface QuoteHistoryRecordInput {
  ownerId: string;
  quoteId?: number;
  clientName?: string;
  clientEmail?: string;
  sector?: string;
  priceRange?: string;
  qualityLevel?: string;
  projectDescription?: string;
  projectLocation?: string;
  generatedBy?: string;
  generatedQuote: GeneratedQuote;
  projectContext?: ProjectContext;
}

export interface QuoteHistorySummary {
  id: number;
  ownerId: string;
  sector?: string;
  title?: string;
  projectDescription?: string;
  projectLocation?: string;
  priceRange?: string;
  qualityLevel?: string;
  totalAmount?: number;
  itemCount?: number;
  items: QuoteItem[];
  projectContext?: ProjectContext | null;
  embedding?: number[] | null;
  createdAt: string;
}

export interface PriceSuggestionResult {
  suggestedAverage?: number;
  low?: number;
  high?: number;
  similarQuotes: Array<{
    id: number;
    title?: string;
    totalAmount?: number;
    score: number;
  }>;
}

export class QuoteHistoryService {
  static async recordGeneration(input: QuoteHistoryRecordInput): Promise<void> {
    const {
      ownerId,
      quoteId,
      clientName,
      clientEmail,
      sector,
      priceRange,
      qualityLevel,
      projectDescription,
      projectLocation,
      generatedBy,
      generatedQuote,
      projectContext
    } = input;

    if (!ownerId) {
      console.warn('[QuoteHistoryService] ownerId ausente, se omite registro de historial.');
      return;
    }

    try {
      const itemCount = generatedQuote.items?.length ?? 0;
      const embeddingText = this.buildEmbeddingText({
        projectDescription: projectDescription ?? generatedQuote.projectDescription,
        sector: sector ?? generatedQuote.sector,
        items: generatedQuote.items,
        summary: generatedQuote.summary
      });
      const embeddingVector = embeddingText
        ? await this.generateEmbedding(embeddingText)
        : null;
      const embeddingJson = embeddingVector ? JSON.stringify(embeddingVector) : null;
      const insertQuery = `
        INSERT INTO quote_history (
          owner_id,
          quote_id,
          client_name,
          client_email,
          sector,
          title,
          project_description,
          project_location,
          price_range,
          quality_level,
          total_amount,
          item_count,
          items,
          project_context,
          embedding,
          generated_by,
          created_at
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW()
        )
      `;

      const values = [
        ownerId.trim().toLowerCase(),
        quoteId ?? null,
        clientName ?? generatedQuote.clientName ?? null,
        clientEmail ?? null,
        (sector ?? generatedQuote.sector ?? '').toLowerCase() || null,
        generatedQuote.title ?? null,
        projectDescription ?? generatedQuote.projectDescription ?? null,
        projectLocation ?? projectContext?.locationHint ?? null,
        priceRange ?? null,
        qualityLevel ?? generatedQuote.meta?.qualityLevel ?? null,
        generatedQuote.total ?? null,
        itemCount || null,
        generatedQuote.items ? JSON.stringify(generatedQuote.items) : null,
        projectContext ? JSON.stringify(projectContext) : null,
        embeddingJson,
        generatedBy ?? generatedQuote.meta?.generatedBy ?? null
      ];

      await pool.query(insertQuery, values);
    } catch (error) {
      console.error('[QuoteHistoryService] Error registrando historial:', error);
    }
  }

  static async findRelevantHistory(
    ownerId: string,
    sector?: string,
    limit: number = 5
  ): Promise<QuoteHistorySummary[]> {
    if (!ownerId) return [];

    const normalizedOwner = ownerId.trim().toLowerCase();
    const conditions: string[] = ['owner_id = $1'];
    const params: any[] = [normalizedOwner];

    if (sector) {
      conditions.push('sector = $2');
      params.push(sector.toLowerCase());
    }

    const sql = `
      SELECT
        id,
        owner_id,
        sector,
        title,
        project_description,
        project_location,
        price_range,
        quality_level,
        total_amount,
        item_count,
        items,
        project_context,
        embedding,
        created_at
      FROM quote_history
      WHERE ${conditions.join(' AND ')}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;

    try {
      const result = await pool.query(sql, params);

      return result.rows.map((row: any) => ({
        id: row.id,
        ownerId: row.owner_id,
        sector: row.sector ?? undefined,
        title: row.title ?? undefined,
        projectDescription: row.project_description ?? undefined,
        projectLocation: row.project_location ?? undefined,
        priceRange: row.price_range ?? undefined,
        qualityLevel: row.quality_level ?? undefined,
        totalAmount: row.total_amount !== null ? Number(row.total_amount) : undefined,
        itemCount: row.item_count ?? undefined,
        items: Array.isArray(row.items)
          ? row.items
          : row.items
            ? JSON.parse(row.items)
            : [],
        projectContext: row.project_context
          ? (typeof row.project_context === 'object'
            ? row.project_context
            : JSON.parse(row.project_context))
          : null,
        embedding: this.parseEmbedding(row.embedding),
        createdAt: row.created_at ? dayjs(row.created_at).toISOString() : dayjs().toISOString()
      })) as QuoteHistorySummary[];
    } catch (error) {
      console.error('[QuoteHistoryService] Error obteniendo historial:', error);
      return [];
    }
  }

  static buildPromptSnippets(history: QuoteHistorySummary[]): string[] {
    return history.map(entry => {
      const createdLabel = entry.createdAt
        ? dayjs(entry.createdAt).format('DD/MM/YYYY')
        : 'Reciente';
      const title = entry.title || 'Proyecto similar';
      const total = typeof entry.totalAmount === 'number'
        ? `$${entry.totalAmount.toLocaleString('es-MX', { minimumFractionDigits: 0 })}`
        : 'sin total registrado';
      const quality = entry.qualityLevel ? `nivel ${entry.qualityLevel}` : '';
      const location = entry.projectLocation ? `ubicado en ${entry.projectLocation}` : '';
      const items = (entry.items || []).slice(0, 3).map(item => item.description).filter(Boolean);
      const itemsText = items.length > 0 ? `Ítems destacados: ${items.join(' | ')}` : '';

      const components = [
        `${createdLabel} · ${title}`,
        location,
        quality,
        `Total aproximado: ${total}`,
        itemsText
      ].filter(Boolean);

      return `- ${components.join(' · ')}`;
    });
  }

  static buildPricingNote(suggestion?: PriceSuggestionResult): string | undefined {
    if (!suggestion || !suggestion.suggestedAverage) {
      return undefined;
    }

    const formattedAvg = this.formatCurrency(suggestion.suggestedAverage);
    const formattedLow = suggestion.low ? this.formatCurrency(suggestion.low) : undefined;
    const formattedHigh = suggestion.high ? this.formatCurrency(suggestion.high) : undefined;
    const count = suggestion.similarQuotes?.length ?? 0;

    if (formattedLow && formattedHigh) {
      return `REFERENCIA HISTÓRICA DE PRECIOS: el usuario tiene proyectos similares (n=${count}) entre ${formattedLow} y ${formattedHigh}, con un promedio de ${formattedAvg}. Usa esta banda para validar el total propuesto.`;
    }

    return `REFERENCIA HISTÓRICA DE PRECIOS: el usuario registra proyectos similares con un promedio cercano a ${formattedAvg}. Considera esta cifra como guía.`;
  }

  static async suggestPriceFromHistory(
    ownerId: string,
    projectDescription: string,
    sector?: string,
    limit: number = 3
  ): Promise<PriceSuggestionResult> {
    const result: PriceSuggestionResult = { similarQuotes: [] };
    if (!ownerId || !projectDescription) {
      return result;
    }

    try {
      const embeddingText = this.buildEmbeddingText({ projectDescription, sector });
      const targetEmbedding = embeddingText ? await this.generateEmbedding(embeddingText) : null;
      if (!targetEmbedding) {
        return result;
      }

      const normalizedOwner = ownerId.trim().toLowerCase();
      const params: any[] = [normalizedOwner];
      const conditions: string[] = ['owner_id = $1'];
      if (sector) {
        conditions.push('sector = $2');
        params.push(sector.toLowerCase());
      }

      const historyQuery = `
        SELECT id, title, total_amount, embedding
        FROM quote_history
        WHERE ${conditions.join(' AND ')}
        AND embedding IS NOT NULL
        ORDER BY created_at DESC
        LIMIT 30
      `;
      const historyRows = await pool.query(historyQuery, params);

      type ScoredQuote = { id: number; title?: string; totalAmount?: number; score: number };
      const scored: ScoredQuote[] = [];
      for (const row of historyRows.rows) {
        const embedding = this.parseEmbedding(row.embedding);
        if (!embedding || embedding.length === 0) continue;
        const score = this.cosineSimilarity(targetEmbedding, embedding);
        if (score <= 0.15) continue;
        scored.push({
          id: Number(row.id),
          title: row.title ?? undefined,
          totalAmount: row.total_amount !== null ? Number(row.total_amount) : undefined,
          score
        });
      }

      scored.sort((a, b) => b.score - a.score);
      result.similarQuotes = scored.slice(0, limit);

      const numericTotals = result.similarQuotes
        .map(entry => entry.totalAmount)
        .filter((value): value is number => typeof value === 'number' && !Number.isNaN(value));

      if (numericTotals.length > 0) {
        const sum = numericTotals.reduce((acc, value) => acc + value, 0);
        result.suggestedAverage = sum / numericTotals.length;
        result.low = Math.min(...numericTotals);
        result.high = Math.max(...numericTotals);
      }

      return result;
    } catch (error) {
      console.error('[QuoteHistoryService] Error generando sugerencia de precios:', error);
      return result;
    }
  }

  private static parseEmbedding(value: any): number[] | null {
    if (!value) return null;
    if (Array.isArray(value)) {
      return value.map(num => Number(num)).filter(num => Number.isFinite(num));
    }
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed)
          ? parsed.map((num: any) => Number(num)).filter((num: number) => Number.isFinite(num))
          : null;
      } catch {
        return null;
      }
    }
    if (typeof value === 'object') {
      const arr = Object.values(value);
      return arr.map(num => Number(num)).filter(num => Number.isFinite(num));
    }
    return null;
  }

  private static buildEmbeddingText(input: {
    projectDescription?: string | null;
    sector?: string | null;
    items?: QuoteItem[] | null;
    summary?: string | null;
  }): string | null {
    const segments: string[] = [];
    if (input.sector) {
      segments.push(`Sector: ${input.sector}`);
    }
    if (input.projectDescription) {
      segments.push(`Descripción: ${input.projectDescription}`);
    }
    if (input.summary) {
      segments.push(`Resumen: ${input.summary}`);
    }
    if (input.items && input.items.length > 0) {
      const itemsText = input.items
        .map(item => `${item.description} (${item.quantity} x ${item.unitPrice})`)
        .join('; ');
      segments.push(`Items: ${itemsText}`);
    }
    const combined = segments.join('\n').trim();
    return combined.length > 0 ? combined : null;
  }

  private static async generateEmbedding(text: string): Promise<number[] | null> {
    const sanitized = text?.replace(/\s+/g, ' ').trim();
    if (!sanitized) return null;

    const truncated = sanitized.length > 6000 ? sanitized.slice(0, 6000) : sanitized;
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return this.simpleEmbedding(truncated);
    }

    try {
      const openai = new OpenAI({ apiKey });
      const response = await openai.embeddings.create({
        model: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
        input: truncated
      });
      const embedding = response.data?.[0]?.embedding;
      if (embedding && Array.isArray(embedding) && embedding.length > 0) {
        return this.normalizeVector(embedding.map(Number));
      }
    } catch (error) {
      console.warn('[QuoteHistoryService] Error generando embedding con OpenAI, usando fallback simple:', (error as Error)?.message || error);
    }

    return this.simpleEmbedding(truncated);
  }

  private static simpleEmbedding(text: string): number[] {
    const vector = new Array(this.BASIC_VOCAB.length).fill(0);
    const words = text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .split(/[^a-z0-9]+/)
      .filter(Boolean);

    for (const word of words) {
      const index = this.BASIC_VOCAB.indexOf(word);
      if (index >= 0) {
        vector[index] += 1;
      }
    }

    return this.normalizeVector(vector);
  }

  private static normalizeVector(vector: number[]): number[] {
    const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
    if (!Number.isFinite(norm) || norm === 0) {
      return vector;
    }
    return vector.map(value => value / norm);
  }

  private static cosineSimilarity(a: number[], b: number[]): number {
    if (!a.length || !b.length) return 0;
    const length = Math.min(a.length, b.length);
    if (!length) return 0;

    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < length; i++) {
      const ai = a[i];
      const bi = b[i];
      dot += ai * bi;
      normA += ai * ai;
      normB += bi * bi;
    }
    if (!normA || !normB) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private static formatCurrency(value: number): string {
    return `$${Math.round(value).toLocaleString('es-MX', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })}`;
  }

  private static readonly BASIC_VOCAB: string[] = [
    'software',
    'marketing',
    'construccion',
    'consultoria',
    'ecommerce',
    'arquitectura',
    'diseno',
    'ingenieria',
    'desarrollo',
    'estrategia',
    'implementacion',
    'mantenimiento',
    'soporte',
    'produccion',
    'eventos',
    'capacitacion',
    'training',
    'industrial',
    'obra',
    'interiores'
  ];
}


