const request = require('supertest');
const crypto = require('crypto');
const { app, pool } = require('../dist/server');

function sign(body, secret) {
  const h = crypto.createHmac('sha256', secret);
  h.update(body, 'utf8');
  return h.digest('hex');
}

describe('Billing Webhook (Paddle)', () => {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    id: 'evt_test_1',
    type: 'subscription.updated',
    data: {
      id: 'sub_test_1',
      status: 'active',
      items: [{ price: { id: 'price_starter' } }],
      current_billing_period: {
        starts_at: '2025-01-01T00:00:00Z',
        ends_at: '2025-02-01T00:00:00Z'
      }
    }
  };
  const body = JSON.stringify(payload);

  beforeAll(() => {
    // Mock pool.query to avoid real DB
    jest.spyOn(pool, 'query').mockImplementation(async (sql, params) => {
      if (/SELECT id FROM webhook_events/.test(sql)) {
        return { rows: [] };
      }
      if (/INSERT INTO webhook_events/.test(sql)) {
        return { rows: [] };
      }
      if (/SELECT id FROM plans/.test(sql) || /SELECT id FROM subscriptions/.test(sql)) {
        return { rows: [] };
      }
      if (/INSERT INTO subscriptions/.test(sql)) {
        return { rows: [] };
      }
      if (/UPDATE subscriptions/.test(sql)) {
        return { rows: [] };
      }
      return { rows: [] };
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('acepta firma válida', async () => {
    const sig = sign(body, process.env.PADDLE_SIGNING_SECRET);
    const res = await request(app)
      .post('/api/billing/webhook')
      .set('Content-Type', 'application/json')
      .set('Paddle-Signature', sig)
      .set('Paddle-Request-Time', String(now))
      .send(body);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('rechaza firma inválida', async () => {
    const res = await request(app)
      .post('/api/billing/webhook')
      .set('Content-Type', 'application/json')
      .set('Paddle-Signature', 'bad')
      .set('Paddle-Request-Time', String(now))
      .send(body);
    expect(res.status).toBe(400);
  });

  it('idempotencia: segundo envío responde duplicate', async () => {
    const sig = sign(body, process.env.PADDLE_SIGNING_SECRET);
    // Primera vez: INSERT
    const res1 = await request(app)
      .post('/api/billing/webhook')
      .set('Content-Type', 'application/json')
      .set('Paddle-Signature', sig)
      .set('Paddle-Request-Time', String(now))
      .send(body);
    expect(res1.status).toBe(200);

    // Simular que ya existe en DB
    pool.query.mockImplementationOnce(async (sql, params) => {
      if (/SELECT id FROM webhook_events/.test(sql)) {
        return { rows: [{ id: 1 }] };
      }
      return { rows: [] };
    });

    const res2 = await request(app)
      .post('/api/billing/webhook')
      .set('Content-Type', 'application/json')
      .set('Paddle-Signature', sig)
      .set('Paddle-Request-Time', String(now))
      .send(body);
    expect(res2.status).toBe(200);
    expect(res2.body.duplicate).toBe(true);
  });
});


