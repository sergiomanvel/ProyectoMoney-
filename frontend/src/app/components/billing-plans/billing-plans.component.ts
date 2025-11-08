import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BillingService } from '../../services/billing.service';

@Component({
  selector: 'app-billing-plans',
  standalone: true,
  imports: [CommonModule],
  template: `
  <div class="max-w-md mx-auto p-6 border rounded-lg shadow-md">
    <h3 class="text-2xl font-semibold mb-4 text-center">Suscripción AutoQuote</h3>
    <p class="text-gray-600 mb-6 text-center">Acceso completo a todas las funcionalidades</p>
    <button (click)="subscribe()" class="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition">
      Suscribirme
    </button>
  </div>
  `
})
export class BillingPlansComponent {
  constructor(private billing: BillingService) {}

  subscribe() {
    this.billing.startCheckout();
  }
}


