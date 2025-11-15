import fs from 'fs';
import path from 'path';

export type QuoteLearningEventType =
  | 'quote_generated'
  | 'items_created'
  | 'items_updated'
  | 'items_deleted'
  | 'quote_recalculated'
  | 'quote_accepted';

export interface QuoteLearningEvent {
  type: QuoteLearningEventType;
  quoteId?: number;
  ownerId?: string;
  timestamp?: string;
  payload?: Record<string, any>;
}

function getLogFilePath(): string {
  const customPath = process.env.LEARNING_LOG_PATH;
  if (customPath) {
    return customPath;
  }
  const analyticsDir = path.join(process.cwd(), 'analytics');
  if (!fs.existsSync(analyticsDir)) {
    fs.mkdirSync(analyticsDir, { recursive: true });
  }
  return path.join(analyticsDir, 'quote-events.log');
}

/**
 * Registra eventos relevantes del pipeline (generación, edición, aceptación) para aprendizaje posterior.
 * Se usa formato JSONL para facilitar ingestión futura.
 */
export async function logQuoteEvent(event: QuoteLearningEvent): Promise<void> {
  try {
    const filepath = getLogFilePath();
    const enrichedEvent: QuoteLearningEvent = {
      ...event,
      timestamp: event.timestamp || new Date().toISOString()
    };
    await fs.promises.appendFile(filepath, JSON.stringify(enrichedEvent) + '\n', 'utf8');
  } catch (error) {
    console.warn('⚠️ No se pudo registrar evento de aprendizaje:', error);
  }
}


