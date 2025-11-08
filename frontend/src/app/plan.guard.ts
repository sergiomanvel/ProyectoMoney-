import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { BillingService } from './services/billing.service';
import { firstValueFrom } from 'rxjs';

/**
 * Guard binario: permite paso solo si hay suscripción activa o en trial.
 * No hay niveles de plan.
 */
export const PlanGuard: CanActivateFn = async () => {
  try {
    const billing = inject(BillingService);
    const router = inject(Router);
    const res = await firstValueFrom(billing.getSubscription());
    const sub = res.subscription;
    if (!sub || !['active','trialing'].includes(sub.status)) {
      await router.navigateByUrl('/');
      return false;
    }
    return true;
  } catch {
    return false;
  }
};


