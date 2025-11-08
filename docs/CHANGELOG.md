## Billing (Paddle) - Añadido
- Proveedor Paddle con wrapper e interfaz
- Rutas `/api/billing/*` (checkout, webhook, subscription, cancel)
- Migraciones `plans`, `subscriptions`, `webhook_events`
- Middleware `requirePlan` con flag `BILLING_ENFORCE`
- DEMO_MODE soportado (simulación)
- UI Angular: componentes de planes y estado, servicio y guard
# Changelog - AutoQuote

## 1.0.0 (Ready to Sell)

- Modo DEMO seguro (sin OpenAI/SMTP) con logs claros
- Token JWT y visor público de cotizaciones
- Folio incremental y vigencia en BD, PDF y UI
- Validación de IA con JSON Schema + fallback
- Script `first-run` para levantar en 1 comando
- README y DEPLOY actualizados para instalación y despliegue

