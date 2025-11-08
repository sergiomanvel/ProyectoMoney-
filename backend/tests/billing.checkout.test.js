const request = require('supertest');
const { app } = require('../dist/server');

describe('Create Checkout Session', () => {
  it('DEMO_MODE devuelve checkoutUrl sandbox', async () => {
    process.env.DEMO_MODE = 'true';
    process.env.PAYMENTS_PROVIDER = 'paddle';
    const res = await request(app)
      .post('/api/billing/create-checkout-session')
      .send({ planId: 'price_starter', successUrl: 'http://localhost/success', cancelUrl: 'http://localhost/cancel' });
    expect(res.status).toBe(200);
    expect(res.body.checkoutUrl).toContain('sandbox');
  });

  it('proveedor deshabilitado devuelve error 400', async () => {
    process.env.DEMO_MODE = 'true';
    process.env.PAYMENTS_PROVIDER = 'none';
    const res = await request(app)
      .post('/api/billing/create-checkout-session')
      .send({ planId: 'price_starter', successUrl: 'http://localhost/success', cancelUrl: 'http://localhost/cancel' });
    expect(res.status).toBe(400);
  });
});


