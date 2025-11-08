import { Pool } from 'pg';

type WebhookInput = {
  eventId: string;
  type: string;
  raw: any;
  signature?: string;
};

function mapPaddleStatus(paddleStatus: string): string {
  const s = (paddleStatus || '').toLowerCase();
  if (['active', 'trialing', 'past_due', 'paused', 'canceled', 'unpaid'].includes(s)) return s;
  if (s === 'cancelled') return 'canceled';
  return 'active';
}

export async function processWebhookEvent(pool: Pool, input: WebhookInput): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `INSERT INTO webhook_events (event_id, type, raw_payload, signature, processed_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [input.eventId, input.type, JSON.stringify(input.raw), input.signature || null]
    );

    const type = input.type;
    const data = input.raw?.data || input.raw;

    if (type.startsWith('subscription.')) {
      const subId = data?.id || data?.subscription_id;
      const priceId = data?.items?.[0]?.price?.id || data?.price_id;
      const status = mapPaddleStatus(data?.status);
      const currentStart = data?.current_billing_period?.starts_at || data?.current_period_start;
      const currentEnd = data?.current_billing_period?.ends_at || data?.current_period_end;
      const cancelAt = data?.scheduled_change?.effective_at || null;

      // Asegurar plan
      let planId: number | null = null;
      if (priceId) {
        const planRes = await client.query(`SELECT id FROM plans WHERE paddle_price_id = $1`, [priceId]);
        if (planRes.rows.length > 0) {
          planId = planRes.rows[0].id;
        }
      }

      // Upsert subscription por paddle_subscription_id
      await client.query(
        `INSERT INTO subscriptions (paddle_subscription_id, plan_id, status, current_period_start, current_period_end, cancel_at, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
         ON CONFLICT (paddle_subscription_id)
         DO UPDATE SET plan_id = EXCLUDED.plan_id, status = EXCLUDED.status, current_period_start = EXCLUDED.current_period_start,
           current_period_end = EXCLUDED.current_period_end, cancel_at = EXCLUDED.cancel_at, updated_at = NOW()`,
        [subId, planId, status, currentStart, currentEnd, cancelAt]
      );
    }

    if (type === 'invoice.paid') {
      // Nada adicional por ahora; estado ya seteado en subscription.updated
    }

    if (type === 'invoice.payment_failed') {
      const subId = data?.subscription_id || data?.subscription?.id;
      if (subId) {
        await client.query(`UPDATE subscriptions SET status = 'past_due', updated_at = NOW() WHERE paddle_subscription_id = $1`, [subId]);
      }
    }

    if (type === 'refund.created') {
      // Se puede auditar aparte si se desea
    }

    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}


