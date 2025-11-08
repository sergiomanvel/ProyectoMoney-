import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BillingService {
  private api = environment.apiUrl.replace(/\/$/, '');

  constructor(private http: HttpClient) {}

  async startCheckout(): Promise<void> {
    const successUrl = (window.location.origin + '/billing/success');
    const cancelUrl = (window.location.origin + '/billing/cancel');
    const res = await this.http.post<{ checkoutUrl: string }>(`${this.api}/billing/create-checkout-session`, {
      successUrl,
      cancelUrl
    }).toPromise();
    const url = res?.checkoutUrl;
    if (url) {
      window.location.href = url;
    }
  }

  getSubscription() {
    return this.http.get<{ subscription: any }>(`${this.api}/billing/subscription`);
  }

  cancel(paddleSubscriptionId: string) {
    return this.http.post<{ success: boolean }>(`${this.api}/billing/cancel`, { paddle_subscription_id: paddleSubscriptionId });
  }

  openPortal(customerId: string): Promise<void> {
    const returnUrl = window.location.origin + '/billing/status';
    return this.http.post<{ portalUrl: string }>(`${this.api}/billing/portal`, {
      customerId,
      returnUrl
    }).toPromise().then(res => {
      const url = res?.portalUrl;
      if (url) {
        window.location.href = url;
      }
    });
  }
}


