# Billing con Paddle (Merchant of Record) - Guía Completa

## 📋 Requisitos

- Cuenta en Paddle (sandbox/live)
- **Un único Price creado** en Paddle Dashboard
- Webhook configurado apuntando a `/api/billing/webhook`
- (Opcional) Subdominio personalizado de checkout (early access)

**Nota**: Este proyecto usa un modelo de negocio con un único plan (no Starter/Pro/Enterprise).

---

## 🔧 Variables de Entorno

### Básicas

```env
PAYMENTS_PROVIDER=paddle
PADDLE_ENV=sandbox
PADDLE_VENDOR_ID=
PADDLE_API_KEY=
PADDLE_SIGNING_SECRET=
PADDLE_PRICE_ID=
BILLING_SUCCESS_URL=http://localhost:4200/billing/success
BILLING_CANCEL_URL=http://localhost:4200/billing/cancel
ALLOWED_ORIGINS=https://proyecto-money.vercel.app,http://localhost:4200
BILLING_ENFORCE=false
TRUST_PROXY=false
```

### Avanzadas (Localización, Buyer Portal)

```env
# Localización
PADDLE_DEFAULT_LOCALE=es_ES
PADDLE_DEFAULT_CURRENCY=USD

# Buyer Portal
PADDLE_BUYER_PORTAL_ENABLED=true

# Subdominio personalizado de checkout (early access)
PADDLE_CHECKOUT_SUBDOMAIN=checkout.tudominio.com

# CARL Compliance (California)
PADDLE_CARL_ENABLED=false
```

---

## 📦 Migraciones

```bash
npm run --prefix backend build
node backend/dist/migrations/createBillingTables.js
```

Esto creará `plans`, `subscriptions` y `webhook_events`. Si has definido `PADDLE_PRICE_ID`, se creará el plan único automáticamente.

---

## 🎯 Configuración en Paddle Dashboard

### 1. Crear Price (Producto)

1. Ve a **Products** → **Prices** en tu dashboard de Paddle
2. Crea **un único precio** (plan principal)
3. Copia el `price_id` → `PADDLE_PRICE_ID`

**Nota**: Este proyecto usa un modelo de negocio con un solo plan. Todos los usuarios suscritos tienen acceso completo.

### 2. Configurar Webhook

1. Ve a **Developer Tools** → **Webhooks**
2. Añade webhook:
   - **URL**: `https://<tu-backend>/api/billing/webhook`
   - **Método**: POST
   - **Content-Type**: `application/json`
   - **Firma**: Activar HMAC-SHA256
   - **Signing Secret**: Copia → `PADDLE_SIGNING_SECRET`
3. **Eventos a suscribir**:
   - `subscription.created`
   - `subscription.updated`
   - `subscription.canceled`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `refund.created`

### 3. Buyer Portal (Customer Portal)

1. Ve a **Settings** → **Buyer Portal**
2. Activa el portal
3. Configura `return_url` (por defecto: `https://<tu-front>/billing/status`)
4. El endpoint `POST /api/billing/portal` genera URLs automáticamente

### 4. Subdominio Personalizado de Checkout (Early Access)

1. Solicita acceso anticipado en Paddle
2. Configura DNS: `CNAME checkout.tudominio.com → checkout.paddle.com`
3. Añade variable: `PADDLE_CHECKOUT_SUBDOMAIN=checkout.tudominio.com`
4. El checkout usará tu subdominio automáticamente

### 5. Localización e Impuestos

1. Ve a **Settings** → **Tax**
2. Activa **localización automática** de impuestos
3. Paddle calcula impuestos según país del cliente
4. Para precios en KRW, asegúrate de configurar impuestos coreanos

---

## 🔐 Seguridad

### Verificación de Webhook

El backend verifica:
- **Firma HMAC-SHA256** del cuerpo con `PADDLE_SIGNING_SECRET`
- **Timestamp** con skew máximo de 5 minutos
- **Idempotencia** por `webhook_events.event_id`

### Troubleshooting de Firma

Si recibes 400 "Firma inválida":
1. ✅ Asegúrate de que `/api/billing/webhook` usa body crudo (`express.raw`) **antes** de `express.json`
2. ✅ Verifica que usas `PADDLE_SIGNING_SECRET` correcto (Paddle Billing, **no Classic**)
3. ✅ Revisa el clock-skew: el backend rechaza > 5 minutos de diferencia
4. ✅ Verifica que el webhook llega con `Content-Type: application/json`

---

## 🌍 Soporte Internacional (Corea)

### Métodos de Pago Coreanos

Paddle soporta automáticamente:
- **KakaoPay** (카카오페이)
- **Naver Pay** (네이버페이)
- **Payco** (페이코)
- **Samsung Pay** (삼성페이)
- **Tarjetas locales** (BC Card, Shinhan Card, etc.)

### Configuración

1. **Crea Prices en KRW** en Paddle Dashboard
2. **Activa métodos coreanos** en Settings → Payment Methods
3. **Configura variables**:
   ```env
   PADDLE_DEFAULT_LOCALE=ko_KR
   PADDLE_DEFAULT_CURRENCY=KRW
   PADDLE_PRICE_STARTER_KRW=price_starter_krw
   PADDLE_PRICE_PRO_KRW=price_pro_krw
   PADDLE_PRICE_ENTERPRISE_KRW=price_enterprise_krw
   ```
4. **En el frontend**, detecta locale del usuario y usa Price ID en KRW si aplica

### Ejemplo de Checkout con KRW

```typescript
// Frontend detecta locale
const locale = navigator.language; // ej: "ko-KR"
const currency = locale.startsWith('ko') ? 'KRW' : 'USD';
const planId = currency === 'KRW' 
  ? window.PADDLE_PRICE_STARTER_KRW 
  : window.PADDLE_PRICE_STARTER;

billingService.startCheckout(planId);
```

---

## 🏛️ CARL Compliance (California)

**CARL (California Automatic Renewal Law)** requiere consentimiento explícito para suscripciones recurrentes.

### Configuración

1. Activa en `.env`:
   ```env
   PADDLE_CARL_ENABLED=true
   ```
2. El backend añade automáticamente `custom_data.carl_consent: true` en checkout
3. Paddle muestra checkbox de consentimiento en checkout

**Nota**: Consulta con tu equipo legal si aplica CARL según tu modelo de negocio.

---

## 📡 Endpoints API

### Backend

- `POST /api/billing/create-checkout-session` - Crea sesión de checkout
- `POST /api/billing/webhook` - Webhook seguro (firma + idempotencia)
- `GET /api/billing/subscription` - Obtiene suscripción actual
- `POST /api/billing/cancel` - Cancela suscripción
- `POST /api/billing/portal` - Genera URL de Buyer Portal

### Frontend

- `/billing/plans` - Selección de planes
- `/billing/status` - Estado de suscripción (con botón Buyer Portal)
- `/billing/success` - Página de éxito post-checkout
- `/billing/cancel` - Página de cancelación

---

## 🧪 Pruebas Sandbox (End-to-End)

### 1. Configuración Inicial

```bash
# 1. Variables de entorno
cp backend/_env.example backend/.env
# Edita .env con tus credenciales de sandbox

# 2. Migraciones
npm run --prefix backend build
node backend/dist/migrations/createBillingTables.js

# 3. Inicia servidores
npm run --prefix backend dev
npm --prefix frontend start
```

### 2. Flujo de Prueba

1. **Abre** `http://localhost:4200/billing/plans`
2. **Elige un plan** → redirige a checkout sandbox
3. **Completa pago** con tarjeta de prueba:
   - Número: `4242 4242 4242 4242`
   - CVV: `123`
   - Fecha: cualquier fecha futura
4. **Verifica**:
   - `GET /api/billing/subscription` → estado `active`
   - UI `billing/status` muestra plan activo
5. **Simula fallo de pago**:
   - Desde Paddle Dashboard → Simulator → `invoice.payment_failed`
   - Verifica estado `past_due` en UI
6. **Cancela** desde UI → estado `canceled`
7. **Buyer Portal**:
   - Click en "Gestionar Suscripción"
   - Se abre Buyer Portal de Paddle
   - Puedes reactivar/cambiar plan desde allí

### 3. Pruebas con Métodos Coreanos (KRW) - Opcional

Si necesitas soporte para Corea:
1. **Crea Price en KRW** en Paddle Dashboard
2. **Configura variables**:
   ```env
   PADDLE_DEFAULT_LOCALE=ko_KR
   PADDLE_DEFAULT_CURRENCY=KRW
   ```
3. **Activa métodos de pago coreanos** en Settings → Payment Methods
4. **Inicia checkout** y verifica que aparecen métodos coreanos

---

## 🚀 Migración Sandbox → Live

### Checklist

- [ ] **Cambiar `PADDLE_ENV=sandbox` → `PADDLE_ENV=live`**
- [ ] **Obtener credenciales live**:
  - `PADDLE_API_KEY` (live)
  - `PADDLE_SIGNING_SECRET` (live)
  - `PADDLE_PRICE_*` (live)
- [ ] **Configurar webhook live** en Paddle Dashboard
- [ ] **Actualizar URLs**:
  - `BILLING_SUCCESS_URL=https://<tu-front-live>/billing/success`
  - `BILLING_CANCEL_URL=https://<tu-front-live>/billing/cancel`
- [ ] **CORS**: Añadir dominio live a `ALLOWED_ORIGINS`
- [ ] **Probar checkout** con tarjeta real (pequeña cantidad)
- [ ] **Verificar webhook** en logs
- [ ] **Monitorizar** errores en primeros días

---

## 🔧 Troubleshooting Avanzado

### CORS

**Problema**: Requests bloqueados por CORS

**Solución**:
1. Verifica `ALLOWED_ORIGINS` incluye tu dominio (sin barra final)
2. Para previews (Vercel/Netlify), añade URLs separadas por coma:
   ```env
   ALLOWED_ORIGINS=https://tu-app.vercel.app,https://tu-app--preview.vercel.app,http://localhost:4200
   ```

### Trust Proxy y Rate Limit

**Problema**: Rate limit bloquea todas las IPs (detrás de Railway/Vercel)

**Solución**:
1. Activa `TRUST_PROXY=true` si estás detrás de proxy
2. El rate-limit usa `X-Forwarded-For` automáticamente
3. Verifica que Railway/Vercel envía `X-Forwarded-For` correctamente

### Proxy Railway/Vercel

**Problema**: Health check falla o IPs incorrectas

**Solución**:
- Railway: `TRUST_PROXY=true` funciona automáticamente
- Vercel: `TRUST_PROXY=true` funciona automáticamente
- Si usas otro proxy, verifica que envía `X-Forwarded-For`

### Puertos

**Problema**: Backend no escucha en puerto correcto

**Solución**:
- Railway inyecta `PORT` automáticamente (usualmente 8080)
- El código usa `process.env.PORT || 8080`
- Verifica `GET /health` responde correctamente

### Webhook No Llega

**Problema**: Webhooks no se procesan

**Solución**:
1. Verifica que el webhook está configurado en Paddle Dashboard
2. Usa **Simulator** en Paddle Dashboard para probar
3. Revisa logs del backend para errores
4. Verifica que `PADDLE_SIGNING_SECRET` es correcto
5. Asegúrate de que el webhook usa `express.raw` antes de `express.json`

---

## 📚 Recursos Adicionales

- [Paddle Billing API Docs](https://developer.paddle.com/api-reference/overview)
- [Paddle Webhooks Guide](https://developer.paddle.com/webhooks)
- [Paddle Buyer Portal](https://developer.paddle.com/guides/how-tos/subscriptions/buyer-portal)
- [CARL Compliance](https://oag.ca.gov/autorenewal)

---

## ✅ Checklist Final

Antes de ir a producción:

- [ ] Price único creado en Paddle (`PADDLE_PRICE_ID` configurado)
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

**Fin de la Guía**
