## Resumen General

- Se instrumentó el backend para trazabilidad completa en `AIService`, `priceDistributor` y `quoteHistoryService`, incluyendo `traceId`, métricas de tiempo, flags de fallback y distribución de precios.
- Se robustecieron los fallbacks: validaciones de rango de precios, estimaciones seguras, uso de `contextualizeItemsLocal`, control de errores en OpenAI y almacenamiento de metadatos de auditoría (`meta.estimateDetail`, `meta.debug`).
- Se amplió la interfaz `GeneratedQuote.meta.debug` para exponer distribución de precios y se adaptaron los consumidores.
- El frontend (`QuoteViewerComponent`) ahora ofrece un modo debug con visor de metadatos, advertencias de fallback y detalle de multiplicadores, tiempos y pesos aplicados.
- `distributePricesToUserItems` maneja entradas incompletas, garantiza montos válidos y añade logging con `traceId`.

## Cambios Destacados

- `backend/src/services/aiService.ts`
  - Registro estructurado por etapa (`console.time`, `console.debug`, `console.error`) con prefijos `traceId`.
  - `generateFallbackQuote` y `generateFallbackQuoteWithItems` devuelven `meta.estimateDetail` y `meta.debug` enriquecidos (historical blending, flags, distribución).
  - `distributePricesToUserItems` usa `traceId`, valida `priceRange`, calcula `resolvedBasePrice` y evita NaN.
- `backend/src/utils/priceDistributor.ts`
  - Devuelve pesos, multiplicadores y mínimos en `DistributionResult`; logs con `traceId`.
- `backend/src/services/quoteHistoryService.ts`
  - Fallbacks al generar embeddings y sugerencias, logs cronológicos e inclusión de `traceId`.
- `backend/src/models/Quote.ts`
  - `meta.debug` expone `distribution` (pesos, márgenes, overhead, mínimos).
- `frontend/src/app/components/quote-viewer/quote-viewer.component.ts`
  - Nuevo panel debug con toggle, badges de fallback, listado de flags, timings, multiplicadores, IDs históricos y datos de distribución.
- Documentación y scripts:
  - `docs/AI_QUOTE_SYSTEM_UPDATE_2025-11-09.md` (este documento) consolida la fase de mejoras.

## Tests Ejecutados

- Backend: `npx.cmd tsc --noEmit`
- Frontend: `npm.cmd run lint`

## Guía de Despliegue

1. **Preparar entorno**
   - Verificar variables en Railway (API keys OpenAI, `DATABASE_URL`, `DB_SSL`, `TRUST_PROXY`, etc.).
   - Confirmar que la CLI de Railway esté actualizada (`npm i -g @railway/cli`).
2. **Compilar Backend**
   ```bash
   cd backend
   npm install
   npm run build
   ```
3. **Migraciones**
   ```bash
   node dist/migrations/createTables.js
   ```
4. **Compilar Frontend**
   ```bash
   cd ../frontend
   npm install
   npm run build
   ```
5. **Despliegue**
   ```bash
   cd ..
   railway up
   ```
   - Monitorear logs: `railway logs --service backend`
6. **Verificación**
   - Generar cotización con `curl`:
     ```bash
     curl -X POST "$API_URL/api/generate-quote" \
       -H "Content-Type: application/json" \
       -H "X-Request-ID: debug-manual" \
       -d '{"clientName":"QA","clientEmail":"qa@example.com","projectDescription":"Diseño de app móvil", "priceRange":"5,000 - 10,000","sector":"software"}'
     ```
   - Revisar logs en Railway filtrando el `traceId` retornado.

## Troubleshooting

- **500 en `/generate-quote`**
  - Revisar logs con `traceId` del body de respuesta.
  - Confirmar conectividad a PostgreSQL (`railway connect`, `pg-test.js`).
  - Verificar claves OpenAI y cuotas.
- **Errores de SSL**
  - Asegurar `DB_SSL=true` y URLs con `?sslmode=require` cuando se usa el proxy público.
  - Para hosts internos (`*.railway.internal`), permitir `rejectUnauthorized: false`.
- **Paddle Tests o Webhooks**
  - Definir variables dummy (`PADDLE_SIGNING_SECRET`, `PADDLE_API_KEY`, etc.) durante pruebas locales.
- **Fallo en `contextualizeItemsWithOpenAI`**
  - Se activa fallback local; revisar `meta.debug.flags` y `meta.debug.timings`.
  - Ajustar `OPENAI_MODEL` o reducir temperatura si la API responde lento.
- **Frontend sin datos de debug**
  - Asegurarse de ejecutar en modo autenticado; el backend debe retornar `meta.debug`.
  - Confirmar que no se está usando una cotización antigua sin metadatos (regenerar).

