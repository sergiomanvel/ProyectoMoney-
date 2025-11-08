export interface CreateCheckoutInput {
  planId: string;
  customerId: string;
  successUrl: string;
  cancelUrl: string;
  locale?: string;
  currency?: string;
  customData?: Record<string, any>;
}

export interface CheckoutSession {
  checkoutUrl: string;
  id?: string;
}

export interface PortalSession {
  portalUrl: string;
}

export interface SubscriptionRecord {
  id: string;
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'paused';
  planId?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAt?: string | null;
}

export interface PaymentsProvider {
  createCheckoutSession(input: CreateCheckoutInput): Promise<CheckoutSession>;
  getSubscription(subscriptionId: string): Promise<SubscriptionRecord | null>;
  cancelSubscription(subscriptionId: string): Promise<{ success: boolean }>;
  listPrices(): Promise<Array<{ id: string; name?: string }>>;
  getPortalUrl(customerId: string, returnUrl: string): Promise<PortalSession>;
}

export class PaymentsProviderDisabledError extends Error {
  constructor(message = 'Payments provider is disabled') {
    super(message);
    this.name = 'PaymentsProviderDisabledError';
  }
}


