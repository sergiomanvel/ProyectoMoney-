# 📋 Informe de Auditoría - Integración Paddle Billing (AutoQuote)

**Fecha:** 2025-01-XX  
**Staff Engineer Audit**  
**Estado:** ✅ Base implementada | ⚠️ Mejoras requeridas para producción avanzada

---

## 1. Mapeo del Repositorio

### Estructura Actual

```
ProyectoMoney/
├── backend/
│   ├── src/
│   │   ├── payments/              ✅ EXISTE
│   │   │   ├── provider.ts        ✅ Interfaces base
│   │   │   ├── index.ts           ✅ Selector de provider
│   │   │   └── paddleClient.ts   ⚠️  Básico, necesita mejoras
│   │   ├── routes/
│   │   │   ├── paddle.routes.ts  ✅ Endpoints básicos
│   │   │   └── quote.ts          ✅ Protegido con requirePlan
│   │   ├── services/
│   │   │   └── subscription.service.ts  ✅ Procesa webhooks
│   │   ├── middleware/
│   │   │   └── requirePlan.ts     ✅ Middleware de plan
│   │   ├── migrations/
│   │   │   └── createBillingTables.ts  ✅ Tablas SQL
│   │   └── server.ts              ✅ Configurado (CORS, trust proxy, rate-limit)
│   ├── tests/
│   │   ├── billing.webhook.test.js  ✅ Tests existentes
│   │   └── billing.checkout.test.js  ✅ Tests existentes
│   └── package.json               ✅ Scripts test/build/migrate
├── frontend/
│   └── src/app/
│       ├── services/
│       │   └── billing.service.ts  ✅ Servicio básico
│       ├── components/
│       │   ├── billing-plans/     ✅ Componente básico
│       │   └── billing-status/    ✅ Componente básico
│       └── plan.guard.ts           ✅ Guard de plan
└── docs/
    └── BILLING_PADDLE.md           ⚠️  Básico, necesita expansión
```

---

## 2. Hallazgos de Auditoría

### ✅ Implementado y Funcional

1. **Provider Desacoplado**
   - `PaymentsProvider` interface con implementación Paddle
   - `DEMO_MODE` soportado
   - Feature flag `PAYMENTS_PROVIDER`

2. **Endpoints REST Básicos**
   - `POST /api/billing/create-checkout-session`
   - `POST /api/billing/webhook` (firma HMAC, idempotencia)
   - `GET /api/billing/subscription`
   - `POST /api/billing/cancel`

3. **Persistencia**
   - Tablas: `plans`, `subscriptions`, `webhook_events`
   - Migraciones con seed opcional
   - Índices apropiados

4. **Seguridad**
   - Verificación HMAC-SHA256 con `timingSafeEqual`
   - Clock skew protection (≤ 5 min)
   - Idempotencia por `event_id`
   - CORS whitelist configurable
   - `trust proxy` condicional

5. **Webhooks**
   - Eventos: `subscription.*`, `invoice.*`, `refund.created`
   - Upsert seguro en transacciones

6. **Tests**
   - Jest + Supertest configurados
   - Tests de firma válida/inválida/idempotencia
   - Tests de checkout en DEMO_MODE

### ⚠️ Mejoras Requeridas (Producción Avanzada)

#### 2.1 Buyer Portal / Customer Portal
**Estado:** ❌ NO IMPLEMENTADO  
**Ruta:** `backend/src/routes/paddle.routes.ts`  
**Acción:** Añadir `POST /api/billing/portal` que genera URL de Buyer Portal de Paddle.

#### 2.2 Soporte Internacional (KRW, Corea)
**Estado:** ⚠️ PARCIAL  
**Problema:** 
- No hay configuración de moneda/locale en checkout
- No hay soporte explícito para métodos coreanos (KakaoPay, Naver Pay, Payco, Samsung Pay)
- No hay variables de entorno para Price IDs en KRW

**Acción:**
- Añadir `currency` y `locale` a `CreateCheckoutInput`
- Añadir variables `PADDLE_PRICE_*_KRW` opcionales
- Documentar configuración de métodos de pago coreanos en Paddle Dashboard

#### 2.3 Subdominio Personalizado de Checkout
**Estado:** ❌ NO IMPLEMENTADO  
**Problema:** No hay soporte para checkout alojado con subdominio personalizado (early access).  
**Acción:** Añadir variable `PADDLE_CHECKOUT_SUBDOMAIN` y pasarla en checkout session si está disponible.

#### 2.4 CARL Compliance (California)
**Estado:** ❌ NO IMPLEMENTADO  
**Problema:** No hay checkbox de consentimiento para suscripciones recurrentes (requerido en CA).  
**Acción:** 
- Añadir campo `custom_data` con `carl_consent` en checkout
- Documentar requisito legal

#### 2.5 Rate Limit con Trust Proxy
**Estado:** ⚠️ MEJORABLE  
**Problema:** `rateLimit` tiene `validate.trustProxy: false` pero `app.set('trust proxy', true)` puede estar activo.  
**Acción:** Ajustar configuración de rate-limit para usar `X-Forwarded-For` cuando `TRUST_PROXY=true`.

#### 2.6 Checkout Session Completo
**Estado:** ⚠️ BÁSICO  
**Problema:** 
- No se pasan `custom_data` (útil para tracking)
- No se configura `locale` automático
- No se soporta `customer_id` real (solo demo)

**Acción:** Expandir `createCheckoutSession` con más opciones de Paddle Billing API.

#### 2.7 Documentación
**Estado:** ⚠️ BÁSICA  
**Problema:** 
- No hay guía de configuración de Prices en Paddle Dashboard
- No hay instrucciones para métodos de pago coreanos
- No hay guía de Buyer Portal
- No hay troubleshooting avanzado

**Acción:** Expandir `docs/BILLING_PADDLE.md` con checklists completos.

---

## 3. Riesgos de Seguridad

### ✅ Mitigados
- ✅ Firma HMAC verificada con `timingSafeEqual`
- ✅ Clock skew protection
- ✅ Idempotencia en webhooks
- ✅ CORS whitelist
- ✅ Rate limiting activo

### ⚠️ A Considerar
1. **Rate Limit con Proxy**: Si `TRUST_PROXY=true`, el rate-limit debe validar IP real desde `X-Forwarded-For`.
2. **Secrets en Variables**: Asegurar que `PADDLE_SIGNING_SECRET` nunca se exponga en logs.
3. **Webhook Body Raw**: Verificar que `express.raw` se aplica ANTES de `express.json` (ya está correcto).

---

## 4. Plan de Mejoras (Checklist)

### Backend

- [ ] **Añadir Buyer Portal endpoint** (`POST /api/billing/portal`)
- [ ] **Expandir `createCheckoutSession`** con:
  - [ ] `currency` y `locale` (opcional)
  - [ ] `custom_data` (CARL, tracking)
  - [ ] `customer_id` real (cuando haya auth)
  - [ ] Subdominio personalizado si está configurado
- [ ] **Mejorar rate-limit** para usar `X-Forwarded-For` cuando `TRUST_PROXY=true`
- [ ] **Añadir variables de entorno** para KRW y locales
- [ ] **Documentar** métodos de pago coreanos y configuración

### Frontend

- [ ] **Añadir botón/link** a Buyer Portal en `BillingStatusComponent`
- [ ] **Mejorar UI** de planes con precios y moneda (KRW si aplica)
- [ ] **Añadir indicador** de métodos de pago disponibles (si Paddle.js está integrado)

### Documentación

- [ ] **Expandir `BILLING_PADDLE.md`** con:
  - [ ] Checklist de configuración de Prices (USD/KRW)
  - [ ] Configuración de métodos de pago coreanos
  - [ ] Buyer Portal setup
  - [ ] Subdominio personalizado (cuando esté disponible)
  - [ ] CARL compliance
  - [ ] Troubleshooting avanzado (CORS, trust proxy, rate-limit, proxies Railway/Vercel)

### Tests

- [ ] **Añadir test** de Buyer Portal
- [ ] **Añadir test** de checkout con locale/currency
- [ ] **Añadir test** de rate-limit con proxy

---

## 5. Archivos a Modificar/Crear

### Modificar

1. `backend/src/payments/paddleClient.ts` - Expandir checkout session
2. `backend/src/payments/provider.ts` - Añadir `getPortalUrl()`
3. `backend/src/routes/paddle.routes.ts` - Añadir endpoint Buyer Portal
4. `backend/src/server.ts` - Mejorar rate-limit con trust proxy
5. `docs/BILLING_PADDLE.md` - Documentación exhaustiva
6. `env.example` y `backend/_env.example` - Variables nuevas (KRW, locales, subdominio)
7. `frontend/src/app/services/billing.service.ts` - Añadir `openPortal()`
8. `frontend/src/app/components/billing-status/billing-status.component.ts` - Botón Buyer Portal

### Crear (Opcional)

- `backend/src/utils/paddleLocales.ts` - Helpers de locales/monedas
- `docs/PADDLE_COREANOS.md` - Guía específica para Corea

---

## 6. Variables de Entorno Requeridas

### Nuevas (Producción Avanzada)

```env
# Buyer Portal
PADDLE_BUYER_PORTAL_ENABLED=true

# Localización / Corea
PADDLE_DEFAULT_LOCALE=es_ES
PADDLE_DEFAULT_CURRENCY=USD
PADDLE_PRICE_STARTER_KRW=price_starter_krw
PADDLE_PRICE_PRO_KRW=price_pro_krw
PADDLE_PRICE_ENTERPRISE_KRW=price_enterprise_krw

# Subdominio personalizado (early access)
PADDLE_CHECKOUT_SUBDOMAIN=checkout.tudominio.com

# CARL Compliance
PADDLE_CARL_ENABLED=true
```

---

## 7. Próximos Pasos

1. ✅ **Aplicar mejoras** (ver patches siguientes)
2. ✅ **Actualizar documentación**
3. ✅ **Probar en sandbox** con métodos coreanos (si aplica)
4. ✅ **Configurar Buyer Portal** en Paddle Dashboard
5. ✅ **Validar rate-limit** detrás de proxy (Railway/Vercel)
6. ✅ **Migrar a live** cuando esté listo

---

**Fin del Informe**

