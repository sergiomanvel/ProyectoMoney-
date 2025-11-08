import { Request, Response, NextFunction } from 'express';
import { pool } from '../server';

/**
 * Middleware binario: verifica que exista una suscripción activa o en trial.
 * No hay niveles de plan; solo requiere suscripción activa/trialing.
 */
export function requirePlan() {
  return async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const enforce = String(process.env.BILLING_ENFORCE || 'false').toLowerCase() === 'true';
      if (!enforce) return next();

      // Verificar que existe una suscripción con status activa o trialing
      const subRes = await pool.query(
        `SELECT s.status FROM subscriptions s
         WHERE s.status IN ('active', 'trialing')
         ORDER BY s.updated_at DESC NULLS LAST, s.created_at DESC
         LIMIT 1`
      );
      
      if (subRes.rows.length === 0) {
        return res.status(402).json({ error: 'Se requiere suscripción activa' });
      }
      
      const sub = subRes.rows[0];
      if (!['active', 'trialing'].includes(String(sub.status))) {
        return res.status(402).json({ error: 'Suscripción no activa' });
      }
      
      next();
    } catch (e: any) {
      return res.status(500).json({ error: e?.message || 'Error validando suscripción' });
    }
  };
}


