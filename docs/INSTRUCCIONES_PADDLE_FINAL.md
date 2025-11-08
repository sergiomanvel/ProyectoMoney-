# 🚀 Instrucciones Finales - Integración Paddle Billing Completa

## ✅ Cambios Implementados

### Backend

1. **Provider Expandido** (`backend/src/payments/paddleClient.ts`)
   - ✅ Checkout con `locale`, `currency`, `custom_data`
   - ✅ Soporte para subdominio personalizado
   - ✅ Buyer Portal (`getPortalUrl`)
   - ✅ CARL compliance automático si está habilitado

2. **Nuevo Endpoint** (`backend/src/routes/paddle.routes.ts`)
   - ✅ `POST /api/billing/portal` - Genera URL de Buyer Portal

3. **Rate Limit Mejorado** (`backend/src/server.ts`)
   - ✅ Usa `X-Forwarded-For` cuando `TRUST_PROXY=true`
   - ✅ Excluye `/health` del rate limit

4. **Variables de Entorno Nuevas**
   - ✅ `PADDLE_DEFAULT_LOCALE`, `PADDLE_DEFAULT_CURRENCY`
   - ✅ `PADDLE_PRICE_*_KRW` (para Corea)
   - ✅ `PADDLE_CHECKOUT_SUBDOMAIN`
   - ✅ `PADDLE_CARL_ENABLED`

### Frontend

1. **BillingService Expandido**
   - ✅ `openPortal(customerId)` - Abre Buyer Portal

2. **BillingStatusComponent Mejorado**
   - ✅ Botón "Gestionar Suscripción" que abre Buyer Portal

### Documentación

1. **BILLING_PADDLE.md Expandido**
   - ✅ Guía completa de configuración de Prices
   - ✅ Instrucciones para métodos de pago coreanos
   - ✅ Buyer Portal setup
   - ✅ Subdominio personalizado
   - ✅ CARL compliance
   - ✅ Troubleshooting avanzado

2. **AUDITORIA_PADDLE_BILLING.md**
   - ✅ Informe completo de auditoría
   - ✅ Checklist de mejoras

---

## 📋 Comandos de Puesta en Marcha

### 1. Build y Migraciones

```bash
# Backend
cd backend
npm install
npm run build
node dist/migrations/createBillingTables.js

# Frontend
cd ../frontend
npm install
```

### 2. Variables de Entorno

**Para Tests** (`backend/.env`):
```env
NODE_ENV=test
PORT=3001
DEMO_MODE=true
PAYMENTS_PROVIDER=paddle
PADDLE_ENV=sandbox
PADDLE_SIGNING_SECRET=test_secret
ALLOWED_ORIGINS=http://localhost:4200
BILLING_ENFORCE=false
TRUST_PROXY=false
```

**Para Producción (Railway)**:
```env
NODE_ENV=production
PORT=8080
PAYMENTS_PROVIDER=paddle
PADDLE_ENV=live
PADDLE_API_KEY=<tu-api-key-live>
PADDLE_SIGNING_SECRET=<tu-signing-secret-live>
PADDLE_PRICE_STARTER=<price-id-starter>
PADDLE_PRICE_PRO=<price-id-pro>
PADDLE_PRICE_ENTERPRISE=<price-id-enterprise>
PADDLE_DEFAULT_LOCALE=es_ES
PADDLE_DEFAULT_CURRENCY=USD
BILLING_SUCCESS_URL=https://<tu-front>/billing/success
BILLING_CANCEL_URL=https://<tu-front>/billing/cancel
ALLOWED_ORIGINS=https://<tu-front>,http://localhost:4200
TRUST_PROXY=true
BILLING_ENFORCE=true
```

**Para Corea (KRW)** - Añadir:
```env
PADDLE_DEFAULT_LOCALE=ko_KR
PADDLE_DEFAULT_CURRENCY=KRW
PADDLE_PRICE_STARTER_KRW=<price-id-starter-krw>
PADDLE_PRICE_PRO_KRW=<price-id-pro-krw>
PADDLE_PRICE_ENTERPRISE_KRW=<price-id-enterprise-krw>
```

### 3. Iniciar Servidores

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm start
```

### 4. Verificar Health

```bash
curl http://localhost:3000/health
# Debe responder: {"ok":true,"db":true,...}
```

---

## 🧪 Pruebas End-to-End

### Sandbox (Checkout + Webhook)

1. **Abre** `http://localhost:4200/billing/plans`
2. **Elige un plan** → redirige a checkout sandbox
3. **Completa pago** con tarjeta de prueba: `4242 4242 4242 4242`
4. **Verifica**:
   - `GET /api/billing/subscription` → estado `active`
   - UI `/billing/status` muestra plan activo
5. **Buyer Portal**:
   - Click en "Gestionar Suscripción"
   - Se abre Buyer Portal de Paddle
   - Puedes reactivar/cambiar plan desde allí

### Webhooks (Simulador Paddle)

1. Ve a **Paddle Dashboard** → **Developer Tools** → **Webhook Simulator**
2. **Simula eventos**:
   - `invoice.payment_failed` → estado `past_due`
   - `subscription.canceled` → estado `canceled`
3. **Verifica** en `/billing/status` que el estado cambió

### Corea (KRW) - Si Configurado

1. **Configura Prices en KRW** en Paddle Dashboard
2. **Añade variables**:
   ```env
   PADDLE_DEFAULT_LOCALE=ko_KR
   PADDLE_DEFAULT_CURRENCY=KRW
   PADDLE_PRICE_STARTER_KRW=price_starter_krw
   ```
3. **Inicia checkout** con Price ID en KRW
4. **Verifica** que aparecen métodos coreanos (KakaoPay, Naver Pay, etc.)

---

## 🔧 Configuración en Paddle Dashboard

### 1. Crear Prices

1. Ve a **Products** → **Prices**
2. Crea 3 precios (USD):
   - Starter → Copia `price_id` → `PADDLE_PRICE_STARTER`
   - Pro → Copia `price_id` → `PADDLE_PRICE_PRO`
   - Enterprise → Copia `price_id` → `PADDLE_PRICE_ENTERPRISE`
3. (Opcional) Crea precios en KRW para Corea

### 2. Activar Métodos de Pago Coreanos

1. Ve a **Settings** → **Payment Methods**
2. Activa:
   - KakaoPay
   - Naver Pay
   - Payco
   - Samsung Pay
3. Paddle los mostrará automáticamente si el locale es `ko_KR`

### 3. Configurar Webhook

1. Ve a **Developer Tools** → **Webhooks**
2. Añade webhook:
   - URL: `https://<tu-backend>/api/billing/webhook`
   - Firma: HMAC-SHA256
   - Signing Secret → `PADDLE_SIGNING_SECRET`
3. Eventos: `subscription.*`, `invoice.*`, `refund.created`

### 4. Buyer Portal

1. Ve a **Settings** → **Buyer Portal**
2. Activa el portal
3. Configura `return_url` (por defecto: `https://<tu-front>/billing/status`)

### 5. Subdominio Personalizado (Early Access)

1. Solicita acceso anticipado en Paddle
2. Configura DNS: `CNAME checkout.tudominio.com → checkout.paddle.com`
3. Añade: `PADDLE_CHECKOUT_SUBDOMAIN=checkout.tudominio.com`

---

## 🚨 Troubleshooting

### Error: "Firma inválida" en Webhook

1. ✅ Verifica que `/api/billing/webhook` usa `express.raw` **antes** de `express.json`
2. ✅ Confirma que `PADDLE_SIGNING_SECRET` es correcto (Billing, no Classic)
3. ✅ Revisa clock-skew: backend rechaza > 5 minutos

### Rate Limit Bloquea Todo (Railway/Vercel)

1. ✅ Activa `TRUST_PROXY=true`
2. ✅ El rate-limit usa `X-Forwarded-For` automáticamente
3. ✅ Verifica que Railway/Vercel envía `X-Forwarded-For`

### CORS Bloquea Requests

1. ✅ `ALLOWED_ORIGINS` debe incluir dominio exacto (sin barra final)
2. ✅ Para previews, añade URLs separadas por coma:
   ```env
   ALLOWED_ORIGINS=https://app.vercel.app,https://app--preview.vercel.app
   ```

### Buyer Portal No Funciona

1. ✅ Verifica que `PADDLE_BUYER_PORTAL_ENABLED=true`
2. ✅ Confirma que el `customerId` existe en Paddle
3. ✅ Revisa logs del backend para errores

---

## 📊 Checklist de Producción

Antes de ir a live:

- [ ] Prices creados en Paddle (USD y KRW si aplica)
- [ ] Webhook configurado y probado
- [ ] Buyer Portal activado
- [ ] Variables de entorno completas (sandbox → live)
- [ ] CORS configurado para dominios de producción
- [ ] Rate limit probado detrás de proxy
- [ ] Tests pasando (`npm test`)
- [ ] Health check respondiendo (`GET /health`)
- [ ] Checkout funciona end-to-end
- [ ] Webhooks se procesan correctamente
- [ ] Buyer Portal genera URLs válidas
- [ ] (Opcional) Subdominio personalizado configurado
- [ ] (Opcional) Métodos coreanos probados (si aplica)
- [ ] (Opcional) CARL compliance activado (si aplica)

---

## 📚 Archivos de Referencia

- **Informe de Auditoría**: `docs/AUDITORIA_PADDLE_BILLING.md`
- **Guía Completa**: `docs/BILLING_PADDLE.md`
- **Colección Postman**: `postman/AutoQuote-Billing.postman_collection.json`
- **Variables de Entorno**: `env.example`, `backend/_env.example`

---

**¡Listo para producción!** 🎉

