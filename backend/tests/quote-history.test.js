const { QuoteHistoryService } = require('../dist/services/quoteHistoryService');
const { pool } = require('../dist/server');

const BASIC_VOCAB = [
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

function buildTestEmbedding(text) {
  const vector = new Array(BASIC_VOCAB.length).fill(0);
  const normalized = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

  for (const word of normalized) {
    const idx = BASIC_VOCAB.indexOf(word);
    if (idx >= 0) {
      vector[idx] += 1;
    }
  }

  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  if (!norm) return vector;
  return vector.map(value => value / norm);
}

describe('QuoteHistoryService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('sugiere precios basados en historial similar', async () => {
    delete process.env.OPENAI_API_KEY;

    const historicalEmbedding = buildTestEmbedding(
      'Sector: software\nDescripción: desarrollo de software web\nItems: desarrollo backend (1 x 12000)'
    );

    jest.spyOn(pool, 'query').mockResolvedValue({
      rows: [
        {
          id: 42,
          title: 'Desarrollo portal web',
          total_amount: 12000,
          embedding: JSON.stringify(historicalEmbedding)
        }
      ]
    });

    const result = await QuoteHistoryService.suggestPriceFromHistory(
      'cliente@acme.com',
      'Proyecto de desarrollo de software web con soporte',
      'software',
      3
    );

    expect(result.similarQuotes).toHaveLength(1);
    expect(result.similarQuotes[0].id).toBe(42);
    expect(result.suggestedAverage).toBeGreaterThan(0);
    expect(result.low).toBe(12000);
    expect(result.high).toBe(12000);
  });
});

