# AI Quote Generator — Visión Técnica

## Resumen
La funcionalidad de AutoQuote permite generar cotizaciones profesionales combinando datos proporcionados por el usuario con servicios de IA (OpenAI `gpt-4o-mini`). El frontend en Angular orquesta la captura de información y la visualización de resultados, mientras que el backend en Node/Express aplica un pipeline de validaciones, enriquecimiento con IA, persistencia en PostgreSQL, generación de PDFs y envío opcional por correo. Desde la fase 4 el sistema registra cada cotización en un historial vectorizado que alimenta sugerencias de precios, contexto semántico en los prompts y metadatos `historicalPricing` para mejorar la coherencia a lo largo del tiempo. Este documento describe el flujo real de datos, las dependencias y los puntos críticos para detectar oportunidades de mejora.

## Arquitectura General
```
[Usuario]
  └─ completa formulario → `QuoteFormComponent` (Angular)
        └─ usa → `QuoteService` (HttpClient /auth headers opcionales)
              └─ POST → `/api/generate-quote` (`quote.ts`, Express)
                    ├─ `requirePlan()` → valida suscripción activa (`PlanGuard` en frontend)
                    ├─ `AIService.generateQuoteEnterprise()`
                    │     ├─ Sanitiza input / items del usuario
                    │     ├─ Consulta historial vectorizado (`QuoteHistoryService`)
                    │     ├─ Ajusta prompts/objetivos con OpenAI `gpt-4o-mini`
                    │     └─ Fallbacks locales (`sectorTemplates`, `priceDistributor`, embeddings simples)
                    ├─ Registra histórico (`quote_history`, embeddings JSONB)
                    ├─ Genera folio (`generateNextFolio`) y vigencia
                    ├─ Persiste en PostgreSQL (`quotes`, `quote_items`, `quote_history`)
                    ├─ Produce PDF (`PDFGenerator` con pdfkit)
                    └─ Opcional: `nodemailer` via SMTP → cliente
```
-Componentes auxiliares:
- `BillingService` y `PlanGuard` (frontend) + `requirePlan` (backend) habilitan/limitam la ruta según `BILLING_ENFORCE` y estado de suscripción.
- `QuoteViewerComponent` permite editar conceptos después de guardar; interactúa con `QuoteItemsService` y recalcula totales.
- `QuoteHistoryService` persiste cada cotización con embeddings (OpenAI o fallback TF-IDF) y provee búsquedas semánticas por usuario para reutilizar lenguaje y totales.
- `getAppConfig` expone variables de branding (`APP_NAME`, `COMPANY_NAME`, `DEFAULT_TAX_PERCENT`, colores, URL pública del frontend).

## Secuencia de Eventos (Generar → PDF / Email)
1. El usuario completa el formulario `/generate-quote` y opcionalmente ingresa conceptos manuales (`defineItems`).
2. `QuoteFormComponent` valida campos obligatorios en el cliente y envía la carga a `QuoteService.generateQuote()` (`POST /api/generate-quote`).  
   ```
   ```60:62:frontend/src/app/services/quote.service.ts
   generateQuote(request: QuoteRequest): Observable<QuoteResponse> {
     return this.http.post<QuoteResponse>(`${this.apiUrl}/generate-quote`, request);
   }
   ```
3. Middleware `requirePlan` verifica si se debe exigir suscripción (`BILLING_ENFORCE=true`); si la verificación falla responde `402` (`Se requiere suscripción activa`).  
4. El handler principal procesa la solicitud, invoca el pipeline de IA y, si no hay errores, calcula folio/vigencia, guarda la cotización en PostgreSQL y prepara el PDF.  
   ```
   ```188:274:backend/src/routes/quote.ts
   router.post('/generate-quote', requirePlan(), async (req, res) => {
     const { clientName, clientEmail, projectDescription, priceRange, sector, items } = req.body;
     // ... validaciones básicas ...
     const quoteResult = await AIService.generateQuoteEnterprise(
       projectDescription, clientName, priceRange, sector, items
     );
     // ... genera folio, PDF, inserta en DB y responde con {success, quoteId, quote, pdfUrl}
   });
   ```
5. La respuesta incluye la estructura `GeneratedQuote`, identificador de la cotización y la URL para descargar el PDF. El frontend muestra el resultado con `QuoteViewerComponent` y habilita opciones de descarga, envío por email y edición de conceptos.
6. Para enviar el PDF por correo (`POST /api/quotes/:id/send-email`), el backend usa `nodemailer` y genera un enlace público firmado mediante `signQuoteToken`. En modo demo o sin SMTP configurado, se omite el envío y se retorna el enlace al frontend.
7. Las ediciones posteriores en `QuoteViewerComponent` migran los ítems a la tabla `quote_items`, recalculan totales y actualizan `generated_content` cuando se confirma la recotización.

## Flujo IA Paso a Paso
### 1. Entrada de usuario
- Formulario Angular valida nombre, email, sector, descripción ≥20 caracteres y rango de precio. Si el usuario marca “Quiero definir yo los conceptos”, se exige al menos un ítem válido.  
  ```
  ```440:471:frontend/src/app/components/quote-form/quote-form.component.ts
  const request: QuoteRequest = {
    clientName: formValue.clientName,
    clientEmail: formValue.clientEmail,
    projectDescription: formValue.projectDescription,
    priceRange: formValue.priceRange,
    sector: formValue.sector,
    items: this.defineItems && this.userItems.length > 0
      ? this.userItems.map(item => ({ description: item.description.trim(), quantity: item.quantity, unitPrice: item.unitPrice || 0 }))
      : undefined
  };
  ```
### 2. Recepción en backend
- `quote.ts` valida que los campos obligatorios existan, que el email cumpla con el regex y registra la operación.

### 3. Pipeline de IA (`AIService.generateQuoteEnterprise`)
1. **Validación anti-troll** (`validateDescriptionQuality`): rechaza textos demasiado cortos, vulgares, de fantasía o sin vocabulario profesional.  
2. **Identidad del propietario (`ownerId`)**: se detecta por headers/boby/email; con ese ID se consulta `QuoteHistoryService` para obtener embeddings y cotizaciones previas del mismo usuario (ordenadas por similitud coseno).
3. **Modo demo / ausencia de API key** (`DEMO_MODE` o sin `OPENAI_API_KEY`): se delega a `generateFallbackQuoteWithItems`, que usa plantillas y distribuciones locales para garantizar un resultado seguro.
4. **Detección de sector**: si el usuario no lo proporcionó, la función intenta clasificarlo con OpenAI (`classifySector`) y cae en un clasificador por palabras clave si la llamada falla.
5. **Detección de contexto arquitectónico** (`detectArchitectureContext`): fuerza reglas específicas si el texto incluye palabras clave de arquitectura (modos `architect` o `contractor`, con submodo `anteproyecto`). Esto determina qué plantillas y pesos de precio utilizar.
6. **Ajuste histórico de precio objetivo**: `blendHistoricTotal` combina (60/40) el estimador de costes (`estimateProjectCost`) con el promedio de los proyectos similares encontrados en el historial del usuario; también genera `pricingNote` para reutilizarlo en los prompts.
7. **Items proporcionados por el usuario**: se sanitizan (`sanitizeUserItems`) y, si faltan precios, se distribuyen con `distributePricesToUserItems`. La IA se usa solo para enriquecer título/términos/resumen (`buildEnrichmentPrompt`).  
   ```
   ```883:905:backend/src/services/aiService.ts
   if (sanitizedItems && sanitizedItems.length > 0) {
     quote = await this.generateFromUserItems(
       projectDescription, clientName, priceRange, sector,
       sanitizedItems, apiKey, archContext
     );
   } else {
     quote = await this.generateFullQuoteWithAI(...);
   }
   ```
8. **Generación completa con IA** (cuando no hay items del usuario):  
   - Se parte de plantillas por sector (`sectorTemplates` o `ARCHITECTURE_TEMPLATES`).  
   - Se contextualiza cada concepto con OpenAI (`contextualizeItemsWithOpenAI`), incluyendo el bloque de referencias históricas y la nota de precios; si falla, se usa reescritura local (`contextualizeItemsLocal`).  
   - Se distribuyen precios en función de pesos semánticos y del rango objetivo ajustado (`distributeTotalsByWeight`), con ajustes estéticos para evitar totales redondos.  
   - Se generan título profesional, términos, resumen comercial y cronograma con utilidades (`buildQuoteTitle`, `buildQuoteTerms`, `generateCommercialSummary`, `buildQuoteTimeline`), también condicionados por la nota de precio.
9. **Validación JSON**: el pipeline original (`generateQuote`) ejecutaba un `Ajv` contra `generatedQuote.schema.json`. La variante “enterprise” se basa en estructuras TypeScript y utilidades propias; hoy no vuelve a correr `Ajv` después de enriquecer datos, lo que deja una oportunidad de homogenizar la validación.
10. **Metadatos enriquecidos**: se agrega `meta.generatedBy` y `meta.historicalPricing` (promedio, rango y IDs de proyectos similares) para trazabilidad y visualización.

### 4. Normalización y cálculos
- Una vez que el pipeline entrega `GeneratedQuote`, el handler recalcula vigencia (30 días por defecto) y genera el folio incremental (`generateNextFolio`). Los impuestos se obtienen de `getAppConfig().defaultTaxPercent` (variable `DEFAULT_TAX_PERCENT`).

### 5. Persistencia y edición posterior
- Se guarda la cotización en `quotes` (`generated_content` como JSON, totales agregados). La tabla `quote_items` almacena versiones editables; `QuoteItemsService.ensureItemsInDb` migra los ítems del JSON inicial al primer intento de edición.
- `QuoteHistoryService.recordGeneration` inserta un registro adicional en `quote_history`, almacenando propietario, sector, totales, contexto y el embedding (OpenAI `text-embedding-3-small` o fallback vectorial) para acelerar búsquedas futuras.
  ```
  ```241:255:backend/src/routes/quote.ts
  const query = `
    INSERT INTO quotes (client_name, client_email, project_description, price_range, generated_content, total_amount, created_at, folio, valid_until, status)
    VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7, $8, 'draft')
    RETURNING id
  `;
  ```
- `QuoteViewerComponent` trabaja siempre con los datos persistidos en la base, permitiendo añadir/actualizar/eliminar conceptos y recalcular totales mediante `QuoteItemsService.recalculateQuoteTotals`.

### 6. Salidas (PDF y correo)
- `PDFGenerator.generateQuotePDF` renderiza el documento con `pdfkit`, colores corporativos (`APP_PRIMARY_COLOR`) y formateo en MXN; si existen items editados en la base, se recalculan totales antes de dibujar. La nota de precios históricos queda disponible vía `meta.historicalPricing` para integrar disclaimers en el PDF en futuras iteraciones.  
  ```
  ```29:104:backend/src/utils/pdfGenerator.ts
  static async generateQuotePDF(quote: GeneratedQuote, folio?: string, validUntil?: string, editedItems?: QuoteItem[]): Promise<Buffer> {
    // ... compone PDF con header, cliente, descripción, tabla de items, totales y términos ...
  }
  ```
- `PDFGenerator.savePDFToFile` almacena el archivo en `uploads/`. La respuesta HTTP expone `pdfUrl` (`/api/quotes/:id/pdf`), que regenera el PDF on demand y ofrece download.
- Para correos, `nodemailer` usa `SMTP_*` y solo se activa si `DEMO_MODE` es `false` y la configuración está completa; de lo contrario, retorna éxito simulado + enlace público firmado (`signQuoteToken`).  
  ```
  ```457:517:backend/src/routes/quote.ts
  const mailOptions = {
    from: process.env.SMTP_EMAIL,
    to: quote.client_email,
    subject: `Cotización - ${generatedContent.title}`,
    html: buildQuoteEmailHTML({...}),
    attachments: [{ filename: `cotizacion_${id}.pdf`, content: pdfBuffer, contentType: 'application/pdf' }]
  };
  ```

## Configuración y Banderas Relevantes
- `OPENAI_API_KEY` y `OPENAI_MODEL` (default `gpt-4o-mini`) → habilitan llamadas a OpenAI.
- `DEMO_MODE=true` → desactiva OpenAI y SMTP; usa generadores locales pero mantiene el flujo completo para demos.
- `DEFAULT_TAX_PERCENT` → IVA base aplicado en distribución de precios y PDF.
- `APP_NAME`, `COMPANY_NAME`, `APP_PRIMARY_COLOR`, `FRONTEND_PUBLIC_URL` → branding y enlaces.
- `BILLING_ENFORCE` → fuerza comprobación de suscripciones (backend) y complementado por `PlanGuard` en Angular.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_EMAIL`, `SMTP_PASS` → configuración de envío de correo.

## Oportunidades de Mejora
- **Validación homogénea del JSON final**: reintroducir el `Ajv` después de `generateQuoteEnterprise` (actualmente solo se usa en el pipeline antiguo) para garantizar integridad del esquema.
- **Gestión de errores OpenAI**: centralizar el manejo de `429/401` y traducir mensajes más consistentes al frontend (hoy los controladores devuelven diferentes estructuras según endpoint).
- **Sincronización de ítems**: cuando `QuoteItemsService.recalculateQuoteTotals` actualiza `generated_content`, convendría mantener metadatos (`meta`) y campos opcionales (p. ej. `timeline`) para que el frontend no los pierda.
- **Distribución de precios determinista**: guardar los pesos utilizados en `generated_content.meta` para depurar o recalcular sin depender de números aleatorios.
- **Pruebas automatizadas**: no hay tests específicos del pipeline de IA/persistencia; definir suites que validen casos con y sin items del usuario, modo demo y sectores especiales (arquitectura), además de tests unitarios para `QuoteHistoryService.suggestPriceFromHistory` con embeddings simulados.
- **Experiencia de usuario**: exponer las bandas históricas (`meta.historicalPricing`) en el frontend (p. ej. banner informativo y tooltip por ítem) y permitir seleccionar/editar `ownerId` cuando se trabajen varias cuentas.

## Estado del Documento
- Última revisión: 8 de noviembre de 2025.
- Fuente: Código en `frontend/src/app` y `backend/src` de Proyecto Money (AutoQuote).
*** End Patch

