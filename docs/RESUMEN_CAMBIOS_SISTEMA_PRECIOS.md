# 📘 Resumen de Cambios - Sistema de Precios AutoQuote

## 1. Backend

### 1.1 Configuración de precios base
- Se incorporó `backend/src/config/spainPricingData.ts` con:
  - Rangos base nacionales (`BASE_TICKET_RANGES_ES`) para 10 sectores (`small`, `standard`, `enterprise`).
  - Mapeos de sector (`SECTOR_KEY_ALIASES`) y escalas (`PRICE_RANGE_SCALE_MAP`).
  - Funciones `resolveSectorKey`, `getBaseTicketRange`, `normalizePriceScaleInput`.
  - Placeholders para datos reales por comunidad autónoma y utilidades (`getSpainPricingProfile`, etc.).

### 1.2 Estimador de costos
- `backend/src/utils/costEstimator.ts`:
  - Usa los rangos base por sector cuando estima (`baseRange`, `baseRangeSource`).
  - Calcula `baseTotalBeforeAdjustments` y lo expone en `CostEstimateResult`.
  - `validatePriceRange` ahora acepta rangos personalizados y registra fuente (`spain_base_ticket` / `sector_profile`).
  - Devuelve metadatos adicionales (`sectorKey`, `priceScale`, `baseRange`, `rangeValidation`).

### 1.3 Lógica de AIService
- `backend/src/services/aiService.ts`:
  - `blendHistoricTotal` implementa pesos granulares (Sector 35%, Histórico 25%, Ubicación 15%, Calidad 10%, Urgencia 8%, Perfil 5%, Tipo 2%).
  - Se propaga `blendDetails`, `baseRange`, `priceScale` y `rangeValidation` a `meta.estimateDetail`.
  - En el flujo completo y el fallback se construye `PricingBreakdown` + `PricingExplanation` con la nueva info.
  - Se corrigieron colisiones de variables (`currency`, `pricingCurrency`/`quoteCurrency`) y referencias a variables inexistentes.

### 1.4 Explicaciones auditables
- `backend/src/utils/pricingExplainer.ts`:
  - `buildPricingBreakdown` acepta blend en formato legacy o granular.
  - Añade referencia explícita al rango usado (`rangeReference`) y a la fuente (`spainData` / `ticketRange`).
  - Usa `projectContext.urgencyReason` y refleja ajustes/multiplicadores en `adjustments`.

### 1.5 Modelo de cotización
- `backend/src/models/Quote.ts`:
  - `meta.estimateDetail` amplía campos (`sectorKey`, `priceScale`, `baseRange`, `baseRangeSource`, `blendDetails`, `pricingBreakdown`, `pricingExplanation`, etc.).

## 2. Frontend

### 2.1 Formulario de generación (`quote-form.component.ts`)
- El selector de “Rango de precio estimado” depende ahora del sector elegido.
- Se definió `FRONTEND_SECTOR_PRICE_PRESETS` con etiquetas amigables (`small`, `standard`, `enterprise`) para los 9 sectores iniciales.
- Al cambiar de sector se limpia `priceRange` y se muestran solo los presets válidos; el campo queda deshabilitado si no hay sector.

## 3. Despliegue
- Se ejecutó `railway up --service ProyectoMoney- --environment production` para publicar la versión actual en Railway (proyecto `ravishing-vitality`, entorno `production`).
- Se verificó el estado con `railway status` y se consultaron logs (`railway logs --tail 100`).

## 4. Estado de pruebas
- `npm run build` en `backend/` completa sin errores tras los ajustes (TypeScript).
- No se añadieron pruebas nuevas, pero se validaron manualmente los flujos clave:
  - Generación con IA completa (usa nuevos rangos y mezcla histórica).
  - Fallback local y fallback con ítems del usuario.
  - Selección de rangos en el formulario Angular por sector.

## 5. Próximos pasos sugeridos
1. Completar `spainPricingData` con datos reales por comunidad autónoma (fuente + fecha).
2. Activar el modo granular definitivo (`PRICING_MODE=granular`) cuando estén todos los sectores alimentados.
3. Añadir pruebas automatizadas (unit/integration) que cubran:
   - Selección de rangos por sector.
   - `blendHistoricTotal` con pesos granulares.
   - Validación de rangos (`validatePriceRange`) por sector y región.

