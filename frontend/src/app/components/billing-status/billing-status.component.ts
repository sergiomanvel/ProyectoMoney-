import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BillingService } from '../../services/billing.service';

@Component({
  selector: 'app-billing-status',
  standalone: true,
  imports: [CommonModule],
  template: `
  <div *ngIf="loading">Cargando suscripción...</div>
  <div *ngIf="!loading && !subscription">Sin suscripción</div>
  <div *ngIf="subscription" class="p-4 border rounded">
    <div class="mb-2"><b>Estado:</b> {{subscription.status}}</div>
    <div class="mb-2" *ngIf="subscription.current_period_end"><b>Vence:</b> {{subscription.current_period_end | date:'medium'}}</div>
    <div class="flex gap-2">
      <button *ngIf="subscription.paddle_subscription_id && canCancel()" (click)="cancel()" class="px-3 py-2 bg-red-600 text-white rounded">Cancelar</button>
      <button *ngIf="subscription.paddle_subscription_id" (click)="openPortal()" class="px-3 py-2 bg-blue-600 text-white rounded">Gestionar Suscripción</button>
    </div>
  </div>
  `
})
export class BillingStatusComponent implements OnInit {
  loading = false;
  subscription: any = null;

  constructor(private billing: BillingService) {}

  ngOnInit(): void {
    this.refresh();
  }

  refresh() {
    this.loading = true;
    this.billing.getSubscription().subscribe({
      next: (res) => { this.subscription = res.subscription; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  canCancel(): boolean {
    return ['active','trialing','past_due','paused'].includes(this.subscription?.status);
  }

  cancel() {
    this.billing.cancel(this.subscription.paddle_subscription_id).subscribe(() => this.refresh());
  }

  openPortal() {
    // Usar customer_id de la suscripción si existe, o un ID demo
    const customerId = this.subscription.customer_id || this.subscription.paddle_subscription_id || 'demo-user';
    this.billing.openPortal(customerId).catch(err => console.error('Error abriendo portal', err));
  }
}


