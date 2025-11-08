import { PaymentsProvider, PaymentsProviderDisabledError } from './provider';
import { createPaddleClient } from './paddleClient';

export function getPaymentsProvider(): PaymentsProvider {
  const provider = (process.env.PAYMENTS_PROVIDER || 'none').toLowerCase();
  const demoMode = String(process.env.DEMO_MODE || '').toLowerCase() === 'true';

  if (provider === 'paddle') {
    return createPaddleClient({ demoMode });
  }

  // noop client for none/disabled providers
  return {
    async createCheckoutSession() {
      throw new PaymentsProviderDisabledError('Payments provider is not paddle');
    },
    async getSubscription() {
      throw new PaymentsProviderDisabledError('Payments provider is not paddle');
    },
    async cancelSubscription() {
      throw new PaymentsProviderDisabledError('Payments provider is not paddle');
    },
    async listPrices() {
      throw new PaymentsProviderDisabledError('Payments provider is not paddle');
    },
    async getPortalUrl() {
      throw new PaymentsProviderDisabledError('Payments provider is not paddle');
    }
  };
}


