# ✅ Checklist de Pruebas - AutoQuote 1.0

Esta checklist verifica que AutoQuote está **100% listo para vender** en modo demo y producción.

---

## 📋 FASE 1: Instalación y Setup Inicial

### Test 1.1: Instalación Limpia
- [ ] Clonar repositorio desde cero
- [ ] Ejecutar `cd backend && cp _env.example .env`
- [ ] Verificar que `.env` tiene todas las variables necesarias
- [ ] Ejecutar `npm install` en backend
- [ ] Ejecutar `npm install` en frontend
- [ ] Verificar que no hay errores de dependencias

### Test 1.2: Setup de Base de Datos
- [ ] Crear base de datos PostgreSQL: `createdb autoquote`
- [ ] Ejecutar `npm run setup-db` en backend
- [ ] Verificar que las tablas se crearon correctamente
- [ ] Ejecutar `npm run seed:demo`
- [ ] Verificar que se insertaron 2-3 cotizaciones de ejemplo
- [ ] Consultar BD: `psql -U postgres -d autoquote -c "SELECT COUNT(*) FROM quotes;"`

### Test 1.3: Primer Run Completo
- [ ] Ejecutar `npm run first-run` en backend
- [ ] Verificar que backend inicia en puerto 3000
- [ ] Ejecutar `npm start` en frontend
- [ ] Verificar que frontend inicia en puerto 4200
- [ ] Abrir http://localhost:4200 y verificar que carga
- [ ] Verificar que no hay errores en consola del navegador

**Resultado esperado**: ✅ Aplicación funciona sin errores

---

## 📋 FASE 2: Modo Demo (Sin Claves Externas)

### Test 2.1: Modo Demo - OpenAI
- [ ] En `.env`, comentar o eliminar `OPENAI_API_KEY`
- [ ] Opcionalmente poner `DEMO_MODE=true`
- [ ] Reiniciar backend
- [ ] Desde frontend, generar una nueva cotización
- [ ] Verificar en logs: "⚠️ OPENAI_API_KEY ausente: generando con fallback local"
- [ ] Verificar que la cotización se genera exitosamente
- [ ] Verificar que tiene items, subtotal, impuesto y total
- [ ] Verificar que tiene folio (ej: `AQ-2025-0001`)

**Resultado esperado**: ✅ Cotización generada con fallback local, sin errores

### Test 2.2: Modo Demo - SMTP
- [ ] En `.env`, comentar `SMTP_EMAIL` y `SMTP_PASS`
- [ ] Reiniciar backend
- [ ] Desde frontend, enviar una cotización por email
- [ ] Verificar que recibe respuesta `{ success: true, demo: true, link: "..." }`
- [ ] Verificar que el estado cambió a "sent"
- [ ] Verificar que el link incluye un token válido
- [ ] Copiar el link y acceder desde navegador anónimo
- [ ] Verificar que la vista pública muestra la cotización

**Resultado esperado**: ✅ Email no enviado pero link generado, estado actualizado

---

## 📋 FASE 3: API Endpoints - Funcionalidad Básica

### Test 3.1: GET /api/config
```bash
curl http://localhost:3000/api/config
```
- [ ] Responde 200 OK
- [ ] Contiene `appName`, `companyName`, `primaryColor`, `defaultTaxPercent`
- [ ] Valores coinciden con `.env`

### Test 3.2: POST /api/generate-quote
```bash
curl -X POST http://localhost:3000/api/generate-quote \
  -H "Content-Type: application/json" \
  -d '{
    "clientName": "Test Cliente",
    "clientEmail": "test@example.com",
    "projectDescription": "Sitio web corporativo",
    "priceRange": "50000 - 80000"
  }'
```
- [ ] Responde 200 OK
- [ ] Contiene `success: true`
- [ ] Contiene `quoteId`, `folio`, `validUntil`
- [ ] `quote` tiene estructura válida (title, items, subtotal, tax, total)
- [ ] `pdfUrl` está presente

### Test 3.3: GET /api/quotes
```bash
curl http://localhost:3000/api/quotes
```
- [ ] Responde 200 OK
- [ ] Array de cotizaciones con: `id`, `folio`, `status`, `valid_until`, `client_name`, `total_amount`
- [ ] Ordenadas por `created_at DESC`

### Test 3.4: GET /api/quotes/:id
```bash
curl http://localhost:3000/api/quotes/1
```
- [ ] Responde 200 OK
- [ ] Contiene todos los campos de la cotización
- [ ] `generated_content` está parseado como objeto

### Test 3.5: GET /api/quotes/:id/pdf
```bash
curl http://localhost:3000/api/quotes/1/pdf -o test.pdf
```
- [ ] Responde 200 OK con Content-Type: application/pdf
- [ ] El archivo PDF se descarga correctamente
- [ ] El PDF se puede abrir sin errores
- [ ] El PDF contiene: folio, fecha, vigencia, items, totales
- [ ] El PDF usa el branding personalizado (nombre, color, empresa)

**Resultado esperado**: ✅ Todos los endpoints responden correctamente

---

## 📋 FASE 4: API Endpoints - Funcionalidad Avanzada

### Test 4.1: POST /api/quotes/:id/mark-sent
```bash
curl -X POST http://localhost:3000/api/quotes/1/mark-sent
```
- [ ] Responde 200 OK con `{ success: true, message: "..." }`
- [ ] En BD, el `status` cambió a "sent"

### Test 4.2: POST /api/quotes/:id/accept
```bash
curl -X POST http://localhost:3000/api/quotes/1/accept
```
- [ ] Responde 200 OK con `{ success: true, message: "..." }`
- [ ] En BD, el `status` cambió a "accepted"
- [ ] `accepted_at` tiene fecha actual

### Test 4.3: POST /api/quotes/:id/send-email (Demo)
```bash
curl -X POST http://localhost:3000/api/quotes/1/send-email
```
- [ ] Sin SMTP: responde 200 con `{ success: true, demo: true, link: "..." }`
- [ ] El `link` contiene un token válido
- [ ] El estado cambió a "sent"

### Test 4.4: GET /api/quotes/view/:token
```bash
# Primero generar token (ver test 4.3 y copiar link)
curl http://localhost:3000/api/quotes/view/TOKEN_AQUI
```
- [ ] Con token válido: responde 200 OK
- [ ] Contiene `quote` con todos los campos necesarios
- [ ] Con token inválido: responde 400/401
- [ ] Con token de cotización inexistente: responde 404

**Resultado esperado**: ✅ Endpoints avanzados funcionan correctamente

---

## 📋 FASE 5: Modo Real (Con Claves)

### Test 5.1: Generación con OpenAI Real
- [ ] Configurar `OPENAI_API_KEY` válida en `.env`
- [ ] Poner `DEMO_MODE=false` o eliminar variable
- [ ] Reiniciar backend
- [ ] Generar cotización desde frontend
- [ ] Verificar en logs que se llama a OpenAI
- [ ] Verificar que la cotización generada es diferente al fallback
- [ ] Verificar que tiene estructura JSON válida según schema
- [ ] Verificar que items, precios y términos son realistas

### Test 5.2: Envío de Email Real
- [ ] Configurar `SMTP_EMAIL` y `SMTP_PASS` válidos en `.env`
- [ ] Reiniciar backend
- [ ] Probar SMTP: `curl http://localhost:3000/api/email/test`
- [ ] Verificar respuesta `{ success: true, message: "SMTP listo" }`
- [ ] Enviar cotización por email desde frontend
- [ ] Verificar que el email llega al destinatario
- [ ] Verificar que el email contiene PDF adjunto
- [ ] Verificar que el email contiene CTA con link válido
- [ ] Verificar que el link lleva a la vista pública

**Resultado esperado**: ✅ Integraciones externas funcionan en modo real

---

## 📋 FASE 6: Frontend Completo

### Test 6.1: Formulario de Cotización
- [ ] Formulario carga correctamente
- [ ] Validación de campos requeridos funciona
- [ ] Validación de email funciona
- [ ] Botón "Generar Cotización" funciona
- [ ] Muestra loading mientras genera
- [ ] Muestra error si falla

### Test 6.2: Visor de Cotización
- [ ] Muestra la cotización generada
- [ ] Muestra folio correctamente
- [ ] Muestra vigencia (`validUntil`)
- [ ] Muestra items con formato correcto
- [ ] Muestra totales (subtotal, impuesto, total) en MXN
- [ ] Botón "Descargar PDF" funciona
- [ ] Botón "Enviar por Email" funciona

### Test 6.3: Historial de Cotizaciones
- [ ] Lista todas las cotizaciones
- [ ] Muestra folio, cliente, descripción, total, vigencia, estado
- [ ] Búsqueda por cliente/folio funciona
- [ ] Filtro por estado funciona (draft/sent/accepted/expired)
- [ ] Botones de acción funcionan (PDF, Email, Aceptar)
- [ ] Contador de resultados funciona

### Test 6.4: Cambio de Estados
- [ ] Marcar como "enviada" funciona
- [ ] Marcar como "aceptada" funciona
- [ ] Estados se actualizan en la tabla
- [ ] Badges de estado tienen colores correctos

### Test 6.5: Vista Pública (Desde Email)
- [ ] Acceder con link de token válido
- [ ] Muestra cotización completa
- [ ] No requiere login
- [ ] Botón "Aceptar Cotización" funciona (si estado es "sent")
- [ ] Descargar PDF funciona desde vista pública
- [ ] Con token inválido muestra error amigable

**Resultado esperado**: ✅ Frontend funciona completamente

---

## 📋 FASE 7: Personalización

### Test 7.1: Branding en PDF
- [ ] Cambiar `APP_NAME` en `.env`
- [ ] Cambiar `APP_PRIMARY_COLOR` en `.env`
- [ ] Cambiar `COMPANY_NAME` en `.env`
- [ ] Reiniciar backend
- [ ] Generar nueva cotización
- [ ] Descargar PDF
- [ ] Verificar que PDF muestra nuevo nombre de app
- [ ] Verificar que PDF usa nuevo color primario
- [ ] Verificar que PDF muestra nueva empresa

### Test 7.2: Impuesto Personalizado
- [ ] Cambiar `DEFAULT_TAX_PERCENT=8` en `.env`
- [ ] Reiniciar backend
- [ ] Generar nueva cotización
- [ ] Verificar que el impuesto aplicado es 8%
- [ ] Verificar en PDF que muestra "IVA (8%)"

### Test 7.3: Config Público
- [ ] Cambiar cualquier variable de branding
- [ ] Llamar `GET /api/config`
- [ ] Verificar que devuelve valores actualizados

**Resultado esperado**: ✅ Personalización funciona en PDFs, emails y API

---

## 📋 FASE 8: Validación y Seguridad

### Test 8.1: Validación de Inputs
- [ ] Enviar POST `/api/generate-quote` sin campos requeridos → 400
- [ ] Enviar email inválido → 400
- [ ] Enviar priceRange vacío → 400

### Test 8.2: Manejo de Errores
- [ ] Acceder a `/api/quotes/99999` → 404
- [ ] Acceder a `/api/quotes/view/INVALID_TOKEN` → 400/401
- [ ] Verificar que errores tienen mensajes claros en español

### Test 8.3: CORS
- [ ] Verificar que solo `FRONTEND_URL` puede hacer requests
- [ ] Desde otro origen, verificar que falla CORS

### Test 8.4: JWT Security
- [ ] Token expira después de 7 días
- [ ] Token firmado con JWT_SECRET correcto
- [ ] Token modificado falla verificación

**Resultado esperado**: ✅ Seguridad y validación funcionan

---

## 📋 FASE 9: Casos Edge

### Test 9.1: Folio Incremental
- [ ] Generar múltiples cotizaciones
- [ ] Verificar que folios son incrementales: AQ-2025-0001, AQ-2025-0002, etc.
- [ ] Verificar que se reinicia cada año

### Test 9.2: Vigencia
- [ ] Verificar que `validUntil` es 30 días por defecto
- [ ] Verificar formato de fecha en BD (TIMESTAMP)
- [ ] Verificar formato de fecha en frontend (shortDate)

### Test 9.3: PDF con Datos Largos
- [ ] Generar cotización con descripción muy larga
- [ ] Verificar que PDF se genera sin errores
- [ ] Verificar que texto se ajusta correctamente

### Test 9.4: Múltiples Items
- [ ] Generar cotización que tenga 5+ items
- [ ] Verificar que PDF muestra todos los items
- [ ] Verificar que totales se calculan correctamente

**Resultado esperado**: ✅ Casos edge manejados correctamente

---

## 📋 FASE 10: Documentación

### Test 10.1: README
- [ ] README tiene sección de instalación rápida
- [ ] README explica modo demo
- [ ] README tiene todos los endpoints documentados
- [ ] README tiene troubleshooting

### Test 10.2: DEPLOY.md
- [ ] DEPLOY.md tiene instrucciones para VPS
- [ ] DEPLOY.md tiene instrucciones para Railway/Render
- [ ] DEPLOY.md tiene sección de seguridad

### Test 10.3: CHANGELOG
- [ ] CHANGELOG.md existe
- [ ] Menciona versión 1.0.0
- [ ] Lista características principales

**Resultado esperado**: ✅ Documentación completa y clara

---

## 🎯 RESULTADO FINAL

### Checklist Pre-Venta
- [ ] Todas las pruebas de FASE 1-9 pasaron
- [ ] Modo demo funciona 100% sin claves
- [ ] Modo real funciona 100% con claves
- [ ] Frontend y backend sincronizados
- [ ] PDFs se generan correctamente
- [ ] Emails se envían correctamente (o modo demo funciona)
- [ ] Vista pública funciona
- [ ] Personalización funciona
- [ ] Documentación completa
- [ ] No hay errores en consola/logs
- [ ] Performance aceptable (< 3s para generar cotización)

### ✅ APROBADO PARA VENTA

**Fecha de prueba**: _______________
**Probado por**: _______________
**Versión**: 1.0.0

---

## 📝 Notas de Prueba

_Usa este espacio para anotar cualquier problema encontrado durante las pruebas:_




