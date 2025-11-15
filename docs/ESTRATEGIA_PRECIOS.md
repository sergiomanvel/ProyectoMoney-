# 💰 Estrategia de Precios - AutoQuote

## 📊 Análisis del Sistema Actual

### Estado Actual del Sistema de Precios

El sistema actual utiliza una **combinación híbrida** de:

1. **Lógica Interna (60%)**: Multiplicadores, ajustes y pesos sectoriales
2. **Histórico del Usuario (40%)**: Promedio de cotizaciones similares del mismo usuario
3. **Rangos por Sector**: `ticketRanges` definidos en `sectorCostProfiles.ts`
4. **Metadata de Auditoría**: Ya existe en `meta.estimateDetail` pero puede mejorarse

---

## 🎯 Respuestas a tus Preguntas Estratégicas

### 1. ¿Qué criterios deberían influir más en el precio final?

#### **Recomendación: Sistema de Pesos por Criterio**

Basado en el análisis del código actual, propongo el siguiente orden de importancia:

| Criterio | Peso Actual | Peso Recomendado | Justificación |
|----------|-------------|------------------|---------------|
| **Sector** | 🔴 Alto | **35%** | Define el rango base y benchmarks específicos |
| **Histórico del Usuario** | 🟡 Medio | **25%** | Aprende de cotizaciones previas similares |
| **Ubicación/Región** | 🟡 Medio | **15%** | Ajusta según mercado local (Madrid vs Murcia) |
| **Calidad (Nivel)** | 🟢 Bajo | **10%** | Básico (-10%), Estándar (0%), Premium (+10%) |
| **Urgencia** | 🟢 Bajo | **8%** | Multiplicador 1.15-1.20 para proyectos urgentes |
| **Perfil de Cliente** | 🟢 Bajo | **5%** | Autónomo (-15%), Enterprise (+20%) |
| **Tipo de Proyecto** | 🟢 Bajo | **2%** | MVP (-15%), Enterprise (+35%) |

**Fórmula Propuesta:**
```
Precio Final = (
  (Base Sector × 0.35) +
  (Histórico Usuario × 0.25) +
  (Ajuste Ubicación × 0.15) +
  (Ajuste Calidad × 0.10) +
  (Ajuste Urgencia × 0.08) +
  (Ajuste Perfil Cliente × 0.05) +
  (Ajuste Tipo Proyecto × 0.02)
) × Multiplicadores Adicionales
```

---

### 2. ¿Lógica Interna 100% o APIs Externas?

#### **Recomendación: Híbrido con Fallback a Lógica Interna**

**Estrategia Propuesta:**

```
┌─────────────────────────────────────────────────┐
│ 1. Intentar APIs Externas (Opcional)            │
│    - APIs de precios de mercado                │
│    - APIs de costos de materiales (construcción)│
│    - APIs de tarifas horarias por sector        │
└─────────────────────────────────────────────────┘
                    ↓ (si falla o no disponible)
┌─────────────────────────────────────────────────┐
│ 2. Histórico del Usuario (40% peso)            │
│    - Embeddings para encontrar similares       │
│    - Promedio de cotizaciones previas           │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 3. Lógica Interna (60% peso base)              │
│    - Rangos por sector (ticketRanges)          │
│    - Benchmarks unitarios                       │
│    - Multiplicadores contextuales               │
└─────────────────────────────────────────────────┘
```

**Ventajas del Enfoque Híbrido:**
- ✅ **Confiabilidad**: Si falla API externa, usa lógica interna
- ✅ **Aprendizaje**: Histórico del usuario mejora con el tiempo
- ✅ **Flexibilidad**: Puedes activar/desactivar APIs externas
- ✅ **Costo**: No depende 100% de APIs pagas

**APIs Externas Recomendadas (Opcionales):**
1. **Construcción**: APIs de costos de materiales (ej: API de proveedores)
2. **Software**: APIs de tarifas de desarrolladores (ej: Stack Overflow Salary)
3. **Marketing**: APIs de costos de publicidad (ej: Google Ads API)
4. **General**: APIs de inflación y costos de vida por región

**Implementación Sugerida:**
- Variable de entorno `USE_EXTERNAL_PRICING_APIS=true/false`
- Timeout de 2 segundos para APIs externas
- Fallback automático a lógica interna si falla

---

### 3. ¿Rangos Mínimos/Máximos por Sector?

#### **Recomendación: Sí, con Validación Estricta**

**Estado Actual:**
Ya tienes `ticketRanges` definidos en `sectorCostProfiles.ts`, pero **no se validan estrictamente**.

**Mejora Propuesta:**

```typescript
// Validación estricta después de calcular precio final
function validatePriceRange(
  finalPrice: number,
  sector: string,
  scale: ProjectScale
): number {
  const profile = sectorCostProfiles[sector] || sectorCostProfiles['general'];
  const range = profile.ticketRanges[scale];
  
  // Si está por debajo del mínimo, ajustar al mínimo
  if (finalPrice < range.min) {
    console.warn(`⚠️ Precio ${finalPrice} por debajo del mínimo ${range.min} para ${sector} ${scale}`);
    return range.min;
  }
  
  // Si está por encima del máximo, ajustar al máximo
  if (finalPrice > range.max) {
    console.warn(`⚠️ Precio ${finalPrice} por encima del máximo ${range.max} para ${sector} ${scale}`);
    return range.max;
  }
  
  return finalPrice;
}
```

**Rangos Actuales (MXN):**

| Sector | Small | Standard | Enterprise |
|--------|-------|----------|------------|
| Software | 18K - 45K | 45K - 120K | 120K - 320K |
| Marketing | 8K - 20K | 20K - 55K | 55K - 120K |
| Construcción | 60K - 140K | 140K - 320K | 320K - 780K |
| Consultoría | 12K - 28K | 28K - 75K | 75K - 180K |
| Ecommerce | 9K - 22K | 22K - 55K | 55K - 120K |
| Eventos | 9K - 26K | 26K - 62K | 62K - 140K |
| Comercio | 8K - 20K | 20K - 50K | 50K - 110K |
| Manufactura | 25K - 60K | 60K - 150K | 150K - 350K |
| Formación | 4K - 12K | 12K - 32K | 32K - 75K |

**Recomendación:**
- ✅ **Mantener rangos actuales** (están bien calibrados)
- ✅ **Añadir validación estricta** después de calcular precio final
- ✅ **Logs de advertencia** cuando se ajusta por rango
- ✅ **Metadata** indicando si se aplicó ajuste por rango

---

### 4. ¿Modo Auditable para Explicar el Precio?

#### **Recomendación: Sí, Mejorar el Sistema Actual**

**Estado Actual:**
Ya existe `meta.estimateDetail` con información básica, pero puede mejorarse.

**Mejora Propuesta:**

```typescript
interface PricingBreakdown {
  // Base
  baseTotal: number;
  baseSource: 'ticketRange' | 'priceRange' | 'historical' | 'api';
  
  // Ajustes aplicados
  adjustments: {
    sector: { value: number; multiplier: number; description: string };
    historical: { value: number; weight: number; similarQuotes: number[] };
    location: { value: number; multiplier: number; region: string };
    quality: { value: number; multiplier: number; level: string };
    urgency: { value: number; multiplier: number; reason?: string };
    clientProfile: { value: number; multiplier: number; profile: string };
    projectType: { value: number; multiplier: number; type: string };
  };
  
  // Validaciones
  validations: {
    minPriceApplied?: { original: number; adjusted: number; reason: string };
    maxPriceApplied?: { original: number; adjusted: number; reason: string };
    rangeValidation: { passed: boolean; range: { min: number; max: number } };
  };
  
  // Resultado final
  finalTotal: number;
  calculationMethod: 'internal' | 'hybrid' | 'external';
  confidence: 'high' | 'medium' | 'low';
}
```

**Ejemplo de Explicación Auditable:**

```json
{
  "pricingBreakdown": {
    "baseTotal": 45000,
    "baseSource": "ticketRange",
    "adjustments": {
      "sector": {
        "value": 45000,
        "multiplier": 1.0,
        "description": "Rango estándar para sector Software"
      },
      "historical": {
        "value": 52000,
        "weight": 0.4,
        "similarQuotes": [123, 456, 789],
        "description": "Promedio de 3 cotizaciones similares del usuario"
      },
      "location": {
        "value": 54000,
        "multiplier": 1.2,
        "region": "Madrid",
        "description": "Ajuste por mercado de Madrid (+20%)"
      },
      "quality": {
        "value": 59400,
        "multiplier": 1.1,
        "level": "premium",
        "description": "Nivel premium (+10%)"
      },
      "urgency": {
        "value": 68310,
        "multiplier": 1.15,
        "reason": "Entrega en 48h",
        "description": "Proyecto urgente (+15%)"
      }
    },
    "validations": {
      "rangeValidation": {
        "passed": true,
        "range": { "min": 45000, "max": 120000 }
      }
    },
    "finalTotal": 68310,
    "calculationMethod": "hybrid",
    "confidence": "high"
  }
}
```

**Visualización en Frontend (Modo Debug):**
- ✅ Mostrar desglose completo del precio
- ✅ Explicar cada ajuste aplicado
- ✅ Mostrar cotizaciones similares usadas
- ✅ Indicar nivel de confianza

---

## 🚀 Plan de Implementación

### Fase 1: Mejorar Sistema de Pesos (Prioridad Alta)

1. **Ajustar `blendHistoricTotal`** para usar pesos configurables
2. **Añadir validación de rangos** después de calcular precio final
3. **Mejorar metadata de auditoría** con desglose completo

### Fase 2: APIs Externas (Prioridad Media)

1. **Crear módulo `externalPricingService.ts`**
2. **Implementar fallback automático** a lógica interna
3. **Añadir timeout y manejo de errores**

### Fase 3: Modo Auditable (Prioridad Alta)

1. **Expandir `meta.estimateDetail`** con desglose completo
2. **Crear función `buildPricingExplanation`** para texto legible
3. **Añadir visualización en frontend** (modo debug)

---

## 📝 Recomendaciones Finales

### ✅ Implementar Inmediatamente

1. **Validación de Rangos**: Asegurar que precios estén dentro de `ticketRanges`
2. **Mejorar Metadata**: Expandir `meta.estimateDetail` con desglose completo
3. **Ajustar Pesos**: Configurar pesos por criterio según recomendación

### ⏳ Implementar en Fase 2

1. **APIs Externas**: Opcional, con fallback a lógica interna
2. **Visualización Auditable**: Modo debug en frontend
3. **Métricas de Confianza**: Indicar nivel de confianza del precio

### 🎯 Objetivo Final

**Sistema de Precios Híbrido, Auditable y Confiable:**
- 60% Lógica Interna (base sólida)
- 25% Histórico Usuario (aprendizaje)
- 15% Ajustes Contextuales (ubicación, urgencia, calidad)
- 100% Auditable (explicación completa del precio)

---

## 🔧 Archivos a Modificar

1. **`backend/src/utils/costEstimator.ts`**: Añadir validación de rangos
2. **`backend/src/services/aiService.ts`**: Mejorar `blendHistoricTotal` con pesos configurables
3. **`backend/src/models/Quote.ts`**: Expandir `meta.estimateDetail` con `PricingBreakdown`
4. **`backend/src/utils/pricingExplainer.ts`** (NUEVO): Generar explicación legible del precio
5. **`backend/src/services/externalPricingService.ts`** (NUEVO): Integración con APIs externas (opcional)

---

**¿Quieres que implemente alguna de estas mejoras ahora?**

