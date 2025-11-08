import express from 'express';
import { getPaymentsProvider } from '../payments';
import { PaymentsProviderDisabledError } from '../payments/provider';
import { verifyPaddleSignature } from '../payments/paddleClient';
import { processWebhookEvent } from '../services/subscription.service';
import { pool } from '../server';

const router = express.Router();

router.post('/billing/create-checkout-session', async (req, res) => {
  try {
    const { customerId, successUrl, cancelUrl, locale, currency, customData } = req.body || {};
    if (!successUrl || !cancelUrl) {
      return res.status(400).json({ error: 'successUrl y cancelUrl son requeridos' });
    }

    // Usar siempre PADDLE_PRICE_ID (ignorar planId del frontend si viene)
    const planId = process.env.PADDLE_PRICE_ID;
    if (!planId) {
      return res.status(500).json({ error: 'PADDLE_PRICE_ID no configurado' });
    }

    // customerId fallback demo: sin auth real
    const cid = customerId || 'demo-user';
    
    // Obtener locale/currency desde variables de entorno si no se proporcionan
    const defaultLocale = locale || process.env.PADDLE_DEFAULT_LOCALE || 'es_ES';
    const defaultCurrency = currency || process.env.PADDLE_DEFAULT_CURRENCY || 'USD';
    
    // Añadir CARL compliance si está habilitado
    const carlEnabled = String(process.env.PADDLE_CARL_ENABLED || 'false').toLowerCase() === 'true';
    const finalCustomData = {
      ...customData,
      ...(carlEnabled ? { carl_consent: true } : {})
    };

    const provider = getPaymentsProvider();
    const session = await provider.createCheckoutSession({ 
      planId, 
      customerId: cid, 
      successUrl, 
      cancelUrl,
      locale: defaultLocale,
      currency: defaultCurrency,
      customData: Object.keys(finalCustomData).length > 0 ? finalCustomData : undefined
    });
    return res.json({ checkoutUrl: session.checkoutUrl, id: session.id });
  } catch (e: any) {
    if (e instanceof PaymentsProviderDisabledError) {
      return res.status(400).json({ error: e.message });
    }
    return res.status(500).json({ error: e?.message || 'Error creando checkout' });
  }
});

router.post('/billing/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.header('Paddle-Signature') || req.header('x-paddle-signature') || '';
    const timestamp = req.header('Paddle-Request-Time') || req.header('x-paddle-request-time') || '';
    const raw = (req as any).body?.toString?.('utf8') || (req as any).body; // express.raw
    if (!raw || typeof raw !== 'string') {
      return res.status(400).json({ error: 'Cuerpo inválido' });
    }
    if (!verifyPaddleSignature(raw, signature, timestamp)) {
      return res.status(400).json({ error: 'Firma inválida' });
    }

    const payload = JSON.parse(raw);
    const eventId = payload?.event_id || payload?.id || payload?.data?.id;
    const eventType = payload?.event_type || payload?.type;
    if (!eventId || !eventType) {
      return res.status(400).json({ error: 'Evento inválido' });
    }

    // Idempotencia por tabla webhook_events
    const exists = await pool.query(`SELECT id FROM webhook_events WHERE event_id = $1`, [eventId]);
    if (exists.rows.length > 0) {
      return res.status(200).json({ ok: true, duplicate: true });
    }

    await processWebhookEvent(pool, {
      eventId,
      type: eventType,
      raw: payload,
      signature
    });

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Error procesando webhook' });
  }
});

router.get('/billing/subscription', async (_req, res) => {
  try {
    // Usuario demo mientras no haya auth real
    const result = await pool.query(
      `SELECT s.*, p.paddle_price_id, p.name AS plan_name FROM subscriptions s
       LEFT JOIN plans p ON p.id = s.plan_id
       ORDER BY s.updated_at DESC NULLS LAST, s.created_at DESC
       LIMIT 1`
    );
    if (result.rows.length === 0) {
      return res.json({ subscription: null });
    }
    return res.json({ subscription: result.rows[0] });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Error leyendo suscripción' });
  }
});

router.post('/billing/cancel', async (req, res) => {
  try {
    const { paddle_subscription_id } = req.body || {};
    if (!paddle_subscription_id) {
      return res.status(400).json({ error: 'paddle_subscription_id requerido' });
    }
    const provider = getPaymentsProvider();
    await provider.cancelSubscription(paddle_subscription_id);
    await pool.query(
      `UPDATE subscriptions SET status = 'canceled', cancel_at = NOW(), updated_at = NOW() WHERE paddle_subscription_id = $1`,
      [paddle_subscription_id]
    );
    return res.json({ success: true });
  } catch (e: any) {
    if (e instanceof PaymentsProviderDisabledError) {
      return res.status(400).json({ error: e.message });
    }
    return res.status(500).json({ error: e?.message || 'Error cancelando suscripción' });
  }
});

router.post('/billing/portal', async (req, res) => {
  try {
    const { customerId, returnUrl } = req.body || {};
    if (!customerId || !returnUrl) {
      return res.status(400).json({ error: 'customerId y returnUrl son requeridos' });
    }
    const provider = getPaymentsProvider();
    const portal = await provider.getPortalUrl(customerId, returnUrl);
    return res.json({ portalUrl: portal.portalUrl });
  } catch (e: any) {
    if (e instanceof PaymentsProviderDisabledError) {
      return res.status(400).json({ error: e.message });
    }
    return res.status(500).json({ error: e?.message || 'Error generando portal URL' });
  }
});

export default router;


