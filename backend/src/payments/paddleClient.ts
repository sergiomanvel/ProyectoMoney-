import crypto from 'crypto';
import { PaymentsProvider, CreateCheckoutInput, CheckoutSession, SubscriptionRecord } from './provider';

type PaddleEnv = 'sandbox' | 'live';

interface PaddleClientOptions {
  demoMode?: boolean;
}

export function createPaddleClient(opts: PaddleClientOptions = {}): PaymentsProvider {
  const demoMode = !!opts.demoMode;
  const env: PaddleEnv = ((process.env.PADDLE_ENV as PaddleEnv) || 'sandbox');
  const apiKey = process.env.PADDLE_API_KEY || '';

  const baseUrl = env === 'live' ? 'https://api.paddle.com' : 'https://sandbox-api.paddle.com';

  async function http<T>(path: string, init?: any): Promise<T> {
    if (demoMode) {
      // Simulaciones en DEMO_MODE
      // @ts-ignore
      return {} as T;
    }
    const res = await fetch(`${baseUrl}${path}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      ...(init || {})
    } as any);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Paddle API error ${res.status}: ${text}`);
    }
    return (await res.json()) as T;
  }

  return {
    async createCheckoutSession(input: CreateCheckoutInput): Promise<CheckoutSession> {
      if (demoMode) {
        const subdomain = process.env.PADDLE_CHECKOUT_SUBDOMAIN;
        const baseUrl = subdomain 
          ? `https://${subdomain}/checkout`
          : 'https://sandbox-checkout.paddle.com/demo/checkout';
        return { checkoutUrl: baseUrl, id: `demo_${Date.now()}` };
      }

      // Construir checkout URL con subdominio personalizado si está configurado
      const subdomain = process.env.PADDLE_CHECKOUT_SUBDOMAIN;
      const baseCheckoutUrl = subdomain 
        ? `https://${subdomain}/checkout`
        : (env === 'live' ? 'https://checkout.paddle.com' : 'https://sandbox-checkout.paddle.com');

      const payload: any = {
        items: [
          {
            price_id: input.planId,
            quantity: 1
          }
        ],
        customer: {
          id: input.customerId
        },
        success_url: input.successUrl,
        cancel_url: input.cancelUrl
      };

      // Añadir locale si está disponible
      if (input.locale) {
        payload.locale = input.locale;
      }

      // Añadir currency si está disponible
      if (input.currency) {
        payload.currency = input.currency;
      }

      // Añadir custom_data (CARL compliance, tracking, etc.)
      if (input.customData) {
        payload.custom_data = input.customData;
      }

      // Paddle Billing API: usar /transactions para crear checkout
      const res = await http<any>('/v1/transactions', {
        method: 'POST',
        body: JSON.stringify(payload)
      } as any);

      // Paddle devuelve checkout URL en diferentes formatos según la API
      const checkoutUrl = res?.data?.checkout?.url || res?.data?.checkout_url || res?.data?.url || res?.url || '';
      const id = res?.data?.id || res?.id;
      
      if (!checkoutUrl) {
        // Si no hay URL directa, construir desde base URL con transaction ID
        if (id) {
          return { checkoutUrl: `${baseCheckoutUrl}?transaction_id=${id}`, id };
        }
        throw new Error('Paddle no devolvió checkout URL ni transaction ID');
      }
      
      return { checkoutUrl, id };
    },

    async getPortalUrl(customerId: string, returnUrl: string): Promise<{ portalUrl: string }> {
      if (demoMode) {
        return { portalUrl: 'https://sandbox-buyer.paddle.com/demo/portal' };
      }

      const payload = {
        customer_id: customerId,
        return_url: returnUrl
      };

      const res = await http<any>('/v1/customers/' + customerId + '/portal', {
        method: 'POST',
        body: JSON.stringify(payload)
      } as any);

      const portalUrl = res?.data?.url || res?.url || '';
      if (!portalUrl) {
        throw new Error('Paddle no devolvió portal URL');
      }
      return { portalUrl };
    },

    async getSubscription(subscriptionId: string): Promise<SubscriptionRecord | null> {
      if (demoMode) {
        return {
          id: subscriptionId,
          status: 'active',
          currentPeriodStart: new Date().toISOString(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        };
      }
      const res = await http<any>(`/v1/subscriptions/${subscriptionId}`);
      const s = res?.data || res;
      if (!s) return null;
      return {
        id: s.id,
        status: s.status,
        planId: s.items?.[0]?.price?.id,
        currentPeriodStart: s.current_billing_period?.starts_at,
        currentPeriodEnd: s.current_billing_period?.ends_at,
        cancelAt: s.scheduled_change?.effective_at || null
      } as SubscriptionRecord;
    },

    async cancelSubscription(subscriptionId: string): Promise<{ success: boolean }> {
      if (demoMode) {
        return { success: true };
      }
      await http<any>(`/v1/subscriptions/${subscriptionId}/cancel`, { method: 'POST' } as any);
      return { success: true };
    },

    async listPrices(): Promise<Array<{ id: string; name?: string }>> {
      if (demoMode) {
        return [
          { id: process.env.PADDLE_PRICE_ID || 'price_main' }
        ];
      }
      const res = await http<any>('/v1/prices');
      const prices = res?.data || res || [];
      return prices.map((p: any) => ({ id: p.id, name: p.name }));
    }
  };
}

export function verifyPaddleSignature(rawBody: string, signature: string, timestampHeader?: string): boolean {
  const signingSecret = process.env.PADDLE_SIGNING_SECRET || '';
  if (!signingSecret) return false;

  // Rechazo por clock skew > 5 min
  if (timestampHeader) {
    const ts = Number(timestampHeader) || 0;
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - ts) > 300) return false;
  }

  const hmac = crypto.createHmac('sha256', signingSecret);
  hmac.update(rawBody, 'utf8');
  const digest = hmac.digest('hex');
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}


