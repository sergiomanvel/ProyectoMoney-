# 🤖 Sistema de IA Mejorado: Pipeline de 3 Etapas

## 🎯 Objetivo

Generar cotizaciones **REALISTAS, CONTEXTUALES Y SEGURAS** que:
- ✅ Rechacen inputs troll/vulgares
- ✅ Detecten el sector del servicio
- ✅ Generen desglose específico por sector
- ✅ NO repitan siempre los mismos 3 conceptos
- ✅ Respete el rango de precio solo si la descripción es comercial

---

## 🟣 ETAPA 1: PRE-VALIDATION (TypeScript)

### Función `validateDescription(desc: string)`

**Filtros aplicados:**
1. Longitud mínima: 10 caracteres
2. Palabras prohibidas:
   - Vulgares: "caca", "pedo", "mierda", "pene", "puta"
   - Troll: "jajaja", "lol", "lmao", "xd", "monkey poop", "broma", "troll"
   - Testing: "prueba", "testing", "testeo"
   - Genéricas: "no sé", "cualquier cosa", "nose"
3. Descripciones que NO son comerciales (empiezan con "ayuda", "como", "que")

### Respuesta si INVALID:
```json
{
  "error": true,
  "type": "INVALID_DESCRIPTION",
  "message": "La descripción no parece un servicio o producto comercial..."
}
```

---

## 🟣 ETAPA 2: AI PROMPT CON SECTOR DETECTION

### Prompt Principal

```
Eres un asistente experto en elaboración de cotizaciones comerciales reales...

Tarea:
1) Detecta el SECTOR del servicio
2) Genera una cotización COMPLETA en JSON

Sectores posibles: software, marketing, construccion, consultoria, general

DEVUELVE SOLO JSON, SIN TEXTO ANTES NI DESPUÉS.
```

### Tablas Sector → Conceptos

#### Software / Desarrollo / SaaS
- Análisis y definición de requerimientos
- Diseño UI/UX o arquitectura
- Desarrollo / implementación
- Pruebas y documentación
- Soporte y puesta en marcha

#### Marketing / Redes / Contenidos
- Auditoría y planificación
- Producción / diseño de piezas
- Programación y publicación
- Optimización y reporting

#### Construcción / Servicios Técnicos / Instalaciones
- Materiales y suministros
- Mano de obra especializada
- Desplazamiento / logística
- Puesta en marcha y pruebas
- Garantía / mantenimiento

#### Consultoría / Formación
- Sesión de levantamiento
- Elaboración de informe / propuesta
- Presentación de resultados
- Seguimiento

#### General (si no encaja)
- Entre 3 y 6 ítems REALISTAS
- Usar palabras clave de la descripción
- NO repetir siempre "análisis, desarrollo, implementación"

### Reglas Críticas
- **NO repitas siempre los mismos 3 conceptos genéricos**
- **Ajusta los nombres al contexto del cliente**
- Genera entre 3 y 6 ítems según el sector
- Distribuye precios para llegar al total dentro del rango

### JSON Esperado

```json
{
  "title": "string",
  "sector": "string",
  "client": {
    "name": "string",
    "email": "string"
  },
  "items": [
    {
      "description": "string",
      "quantity": 1,
      "unitPrice": 0,
      "total": 0
    }
  ],
  "subtotal": 0,
  "taxPercent": 16,
  "taxAmount": 0,
  "total": 0,
  "validUntil": "YYYY-MM-DD",
  "terms": ["string"],
  "summary": "string"
}
```

---

## 🟣 ETAPA 3: JSON SCHEMA VALIDATION + FALLBACK

### Validación con Ajv

Schema actualizado con:
- `sector` REQUIRED (enum: software, marketing, construccion, consultoria, general)
- `items` minItems: 3, maxItems: 7
- `items[].description` minLength: 5
- `summary` REQUIRED minLength: 10

### Fallback Inteligente por Sector

Si la validación falla, se genera un fallback usando `generateFallbackBySector()`:

1. Detecta sector de `raw.sector` o keywords de la descripción
2. Genera items específicos del sector
3. Calcula totales correctamente
4. Retorna objeto válido

### Detección de Sector (KeyWords)

```typescript
software: web, pagina, sitio, app, aplicacion, software, desarrollo, programacion, tienda online, ecommerce, sistema, plataforma, dashboard, api

marketing: marketing, redes sociales, facebook, instagram, contenidos, publicidad, seo, ppc, community, influencer, banner, video

construccion: construccion, obra, instalacion, montaje, reforma, pintura, electricidad, plomeria, azulejo, techo, pared

consultoria: consultoria, asesoria, asesor, capacitacion, formacion, curso, auditoria, evaluacion, diagnostico
```

---

## 📋 EJEMPLOS

### ✅ EJEMPLO 1: VÁLIDO

**Input:**
```
Descripción: "Diseño y desarrollo de página web para cafetería con pasarela de pago y carta digital"
Precio: "1200 - 1800"
```

**Proceso:**
1. ✅ Validación pasa (es comercial)
2. ✅ IA detecta sector: "software"
3. ✅ IA genera items específicos de software
4. ✅ JSON válido

**Output esperado:**
```json
{
  "title": "COTIZACIÓN - Desarrollo de página web para cafetería",
  "sector": "software",
  "client": { "name": "...", "email": "..." },
  "items": [
    { "description": "Análisis de requerimientos y diseño UX", "quantity": 1, "unitPrice": 300, "total": 300 },
    { "description": "Diseño de interfaz responsive", "quantity": 1, "unitPrice": 350, "total": 350 },
    { "description": "Desarrollo frontend (HTML, CSS, JS)", "quantity": 1, "unitPrice": 500, "total": 500 },
    { "description": "Integración pasarela de pago", "quantity": 1, "unitPrice": 250, "total": 250 },
    { "description": "Carta digital con gestión de menú", "quantity": 1, "unitPrice": 200, "total": 200 },
    { "description": "Pruebas y puesta en marcha", "quantity": 1, "unitPrice": 100, "total": 100 }
  ],
  "subtotal": 1700,
  "taxPercent": 16,
  "taxAmount": 272,
  "total": 1972,
  "validUntil": "2025-12-01",
  "terms": ["...", "..."],
  "summary": "Desarrollo completo de página web con pasarela de pago y carta digital para cafetería"
}
```

---

### ❌ EJEMPLO 2: INVÁLIDO

**Input:**
```
Descripción: "caca de mono"
Precio: "3000 - 5000"
```

**Proceso:**
1. ❌ Validación falla (palabra prohibida: "caca")
2. ⚠️ NO se llama a OpenAI
3. ⚠️ NO se respeta el precio
4. ❌ Retorna error inmediatamente

**Output:**
```json
{
  "success": false,
  "error": "INVALID_DESCRIPTION",
  "message": "La descripción no parece un servicio o producto comercial. Por favor, describe el proyecto, servicio o producto que quieres cotizar."
}
```

---

### ✅ EJEMPLO 3: VÁLIDO - Otro Sector

**Input:**
```
Descripción: "Necesito una campaña de marketing en redes sociales para mi tienda de ropa, con fotografía profesional y gestión mensual de contenido"
Precio: "800 - 1200"
```

**Output esperado:**
```json
{
  "title": "COTIZACIÓN - Servicios de Marketing",
  "sector": "marketing",
  "items": [
    { "description": "Auditoría y análisis de la competencia", "quantity": 1, "unitPrice": 200, "total": 200 },
    { "description": "Estrategia de contenidos y calendario editorial", "quantity": 1, "unitPrice": 180, "total": 180 },
    { "description": "Sesión de fotografía profesional de productos", "quantity": 1, "unitPrice": 450, "total": 450 },
    { "description": "Gestión y publicación mensual de redes sociales", "quantity": 1, "unitPrice": 300, "total": 300 }
  ],
  "subtotal": 1130,
  "taxPercent": 16,
  "taxAmount": 181,
  "total": 1311
}
```

---

## 🔄 FLUJO COMPLETO

```
1. Usuario envía descripción
   ↓
2. ETAPA 1: validateDescription()
   ↓ ¿Es válida?
   ├─ NO → Retorna error JSON (status 200)
   └─ SÍ → Continúa
       ↓
3. ETAPA 2: OpenAI API con prompt mejorado
   ↓ ¿Respuesta válida?
   ├─ NO → Fallback inteligente por sector
   └─ SÍ → JSON validado
       ↓
4. ETAPA 3: Validación con JSON Schema
   ↓ ¿Schema válido?
   ├─ NO → Fallback inteligente por sector
   └─ SÍ → Retorna cotización
       ↓
5. Backend genera PDF y guarda en BD
   ↓
6. Frontend muestra cotización
```

---

## ✅ Beneficios

1. **Anti-Troll**: Rechaza inputs no comerciales antes de llamar a OpenAI
2. **Ahorro de Costos**: No gasta tokens en descripciones inválidas
3. **Realismo**: Desglose específico por sector
4. **Variedad**: No repite los mismos 3 conceptos
5. **Contexto**: Usa palabras clave del cliente
6. **Fallback Robusto**: Siempre retorna algo válido
7. **Backward Compatible**: Mantiene estructura existente

---

## 📝 Archivos Modificados

- ✅ `backend/src/services/aiService.ts` - Pipeline completo
- ✅ `backend/src/schemas/generatedQuote.schema.json` - Schema actualizado
- ✅ `backend/src/routes/quote.ts` - Manejo de errores

---

## 🧪 Testing

Para probar:

1. **Descripción inválida**: "caca de mono"
   - Esperado: Error JSON sin llamar a OpenAI

2. **Descripción software**: "página web para tienda"
   - Esperado: 5 items de software, sector correcto

3. **Descripción marketing**: "campaña en redes sociales"
   - Esperado: 4 items de marketing, sector correcto

4. **Descripción construcción**: "reforma de baño"
   - Esperado: Items con materiales y mano de obra

5. **Descripción general**: "servicio de limpieza profesional"
   - Esperado: Items usando palabras clave del cliente

---

**Estado**: ✅ **IMPLEMENTADO Y FUNCIONAL**

