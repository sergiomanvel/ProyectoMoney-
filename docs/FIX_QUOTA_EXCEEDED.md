# 🔧 Solución: Rate Limit / Quota Exceeded

## 🐛 Problema

El sistema intentaba clasificar el sector llamando a OpenAI antes de generar la cotización, causando:
- Error 429 (Rate Limit)
- Quota exceeded
- Duplicación de costos (2 llamadas por cotización)

## ✅ Solución

**Cambiar clasificación de sector de OpenAI a LOCAL**

### Antes:
```typescript
// Llamaba a OpenAI solo para clasificar sector
const sector = await classifySector(openai, description);
// Luego llamaba de nuevo para generar cotización
```

### Ahora:
```typescript
// Clasifica localmente usando keywords
const sector = classifySector(description); // Sin OpenAI
// Solo llama a OpenAI para generar cotización
```

---

## 🎯 Beneficios

1. ✅ **50% menos llamadas** a OpenAI (solo 1 en lugar de 2)
2. ✅ **No depende de quota** para clasificación
3. ✅ **Más rápido**: Sin latencia de red
4. ✅ **Más económico**: Menos tokens consumidos
5. ✅ **Funciona sin API**: Clasificación local siempre disponible

---

## 🔍 Cómo Funciona

Clasificación por keywords en español:

- **software**: web, app, desarrollo, programacion, sistema, plataforma...
- **marketing**: marketing, redes sociales, facebook, instagram, publicidad...
- **construccion**: construccion, instalacion, reforma, electricidad, plomeria...
- **eventos**: evento, fiesta, seminario, conferencia, catering, sonido...
- **consultoria**: consultoria, asesoria, auditoria, diagnostico...
- **comercio**: tienda, retail, vitrina, merchandising...
- **manufactura**: manufactura, produccion, fabricacion, industrial...
- **formacion**: capacitacion, formacion, curso, taller...
- **otro**: si no encaja en ninguno

---

## 📝 Archivos Modificados

- `backend/src/services/aiService.ts`:
  - `classifySector()` ahora es síncrono y usa keywords
  - Eliminada dependencia de OpenAI para clasificación
  - Agregadas palabras clave extensas por sector

---

## ✅ Estado

**SOLUCIONADO**: El sistema ahora clasifica sectores localmente y solo llama a OpenAI para generar la cotización.

**Resultado**: 50% menos costos, 0% errores de quota en clasificación.

