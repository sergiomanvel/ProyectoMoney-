# Plan de Perfeccionamiento Sectorial - AutoQuote

**Fecha**: 2025-11-09  
**Objetivo**: Afinar y perfeccionar al 100% la generación de conceptos y precios de las cotizaciones, asegurando su realismo y competitividad en el mercado español.

---

## Índice

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Metodología de Análisis](#metodología-de-análisis)
3. [Análisis Sector por Sector](#análisis-sector-por-sector)
   - [1. Software / Desarrollo](#1-software--desarrollo)
   - [2. Marketing / Redes](#2-marketing--redes)
   - [3. Construcción / Servicios Técnicos](#3-construcción--servicios-técnicos)
   - [4. Consultoría](#4-consultoría)
   - [5. Ecommerce / Retail](#5-ecommerce--retail)
   - [6. Eventos](#6-eventos)
   - [7. Comercio](#7-comercio)
   - [8. Manufactura](#8-manufactura)
   - [9. Formación](#9-formación)
   - [10. General (Fallback)](#10-general-fallback)
4. [Checklist Técnico General](#checklist-técnico-general)
5. [Resumen de Estado](#resumen-de-estado)

---

## Resumen Ejecutivo

### Estado Actual

- **Sectores Optimizados (85-95%)**: Software, Marketing, Construcción, Consultoría
- **Sectores Básicos (55-60%)**: Ecommerce, Eventos, Comercio, Manufactura, Formación
- **Sector Genérico (30%)**: General

### Carencias Identificadas

1. **Unit Benchmarks faltantes** (40% del peso): 5 sectores sin benchmarks específicos
2. **Disponibilidad en Frontend** (10% del peso): 4 sectores no disponibles en formulario
3. **Variables regionales**: Falta integración de multiplicadores por comunidad autónoma
4. **Perfiles de cliente**: No se diferencian autónomos, PYMEs, agencias
5. **Escalabilidad**: Falta lógica para proyectos pequeños vs enterprise

### Prioridades

1. **🔴 Alta Prioridad**: Añadir unit benchmarks a Ecommerce, Eventos, Comercio, Manufactura, Formación
2. **🟡 Media Prioridad**: Integrar multiplicadores por comunidad autónoma española
3. **🟢 Baja Prioridad**: Añadir perfiles de cliente (autónomo, PYME, agencia)

---

## Metodología de Análisis

Cada sector se analiza según:

1. **Diagnóstico Actual**: Estado de implementación (benchmarks, plantillas, prefijos, frontend)
2. **Propuesta de Mejoras**: Mejoras específicas con ejemplos
3. **Variables Clave**: Factores que afectan el precio (urgencia, ubicación, calidad, escalabilidad)
4. **Rangos Realistas**: Valores medios, altos y bajos según perfiles de cliente
5. **Checklist Técnico**: Ajustes requeridos en código

---

## Análisis Sector por Sector

---

## 1. Software / Desarrollo

### 📊 Diagnóstico Actual

**Estado**: ✅ **95% - Completo y Pulido**

- ✅ **Unit Benchmarks**: 10 conceptos con precios de referencia
- ✅ **Plantillas**: 10 conceptos profesionales
- ✅ **Prefijos de Reescritura**: Sistema completo
- ✅ **Frontend**: Disponible en formulario
- ✅ **Rangos de Precio**: 
  - Small: €18,000 - €45,000
  - Standard: €45,000 - €120,000
  - Enterprise: €120,000 - €320,000

**Fortalezas**:
- Sector más completo y probado
- Benchmarks realistas y actualizados
- Bien integrado con el sistema de IA
- Vocabulario técnico preciso

**Debilidades**:
- No diferencia perfiles de cliente (autónomo vs PYME vs agencia)
- No incluye multiplicadores por comunidad autónoma
- Falta lógica para proyectos MVP vs Enterprise

### 🎯 Propuesta de Mejoras

#### 1.1. Añadir Multiplicadores por Perfil de Cliente

```typescript
// backend/src/config/sectorCostProfiles.ts
software: {
  ticketRanges: {
    small: { min: 18000, max: 45000 },
    standard: { min: 45000, max: 120000 },
    enterprise: { min: 120000, max: 320000 }
  },
  defaultScale: 'standard',
  unitBenchmarks: {
    'descubrimiento de requerimientos': { average: 6000 },
    // ... resto de benchmarks
  },
  clientProfileMultipliers: {
    'autonomo': 0.85,      // 15% descuento para autónomos
    'pyme': 1.0,           // Precio estándar
    'agencia': 1.15,       // 15% recargo para agencias (mayor exigencia)
    'startup': 0.90,       // 10% descuento para startups
    'enterprise': 1.20     // 20% recargo para enterprise (mayor complejidad)
  }
}
```

#### 1.2. Añadir Multiplicadores por Comunidad Autónoma

```typescript
// backend/src/utils/contextAnalyzer.ts
const SPAIN_REGIONAL_MULTIPLIERS: Record<string, number> = {
  'madrid': 1.25,          // Madrid: +25%
  'cataluña': 1.20,        // Barcelona: +20%
  'baleares': 1.15,        // Baleares: +15%
  'país vasco': 1.18,      // País Vasco: +18%
  'andalucía': 0.95,       // Andalucía: -5%
  'valencia': 1.05,        // Valencia: +5%
  'murcia': 0.90,          // Murcia: -10%
  'castilla y león': 0.92, // Castilla y León: -8%
  'galicia': 0.93,         // Galicia: -7%
  'asturias': 0.94,        // Asturias: -6%
  'cantabria': 0.95,       // Cantabria: -5%
  'aragón': 0.96,          // Aragón: -4%
  'extremadura': 0.88,     // Extremadura: -12%
  'castilla la mancha': 0.89, // Castilla-La Mancha: -11%
  'la rioja': 0.97,        // La Rioja: -3%
  'navarra': 1.10,         // Navarra: +10%
  'canarias': 1.08         // Canarias: +8%
};
```

#### 1.3. Mejorar Benchmarks por Tipo de Proyecto

```typescript
// Añadir benchmarks específicos para tipos de proyecto
unitBenchmarks: {
  'descubrimiento de requerimientos': { 
    average: 6000,
    mvp: 4000,           // MVP: -33%
    enterprise: 12000    // Enterprise: +100%
  },
  'arquitectura técnica': { 
    average: 12000,
    mvp: 8000,
    enterprise: 25000
  },
  // ... resto de benchmarks con variantes
}
```

#### 1.4. Añadir Conceptos Especializados

**Conceptos a añadir**:
- "Migración de datos y transformación de legacy"
- "Implementación de CI/CD y pipelines de despliegue"
- "Configuración de monitoreo y alertas (Sentry, DataDog)"
- "Optimización de rendimiento y escalabilidad"
- "Integración con servicios cloud (AWS, Azure, GCP)"
- "Implementación de seguridad y cumplimiento (GDPR, ISO 27001)"

### 🔧 Checklist Técnico

#### Ajustes en `estimateProjectCost`

- [ ] Añadir parámetro `clientProfile?: 'autonomo' | 'pyme' | 'agencia' | 'startup' | 'enterprise'`
- [ ] Aplicar multiplicador según perfil de cliente
- [ ] Integrar multiplicadores por comunidad autónoma española
- [ ] Ajustar benchmarks según tipo de proyecto (MVP vs Enterprise)

#### Ajustes en `distributePricesToUserItems`

- [ ] Ajustar pesos según perfil de cliente
  - Autónomo: Más peso en desarrollo, menos en documentación
  - Enterprise: Más peso en arquitectura y documentación
- [ ] Aplicar márgenes según perfil
  - Autónomo: Margen del 10%
  - PYME: Margen del 12%
  - Enterprise: Margen del 15%

#### Ajustes en `blendHistoricTotal`

- [ ] Priorizar histórico del mismo perfil de cliente
- [ ] Ajustar blending según comunidad autónoma

#### Ajustes en Prompts de OpenAI

- [ ] Añadir contexto de perfil de cliente en prompts
- [ ] Ajustar tono según perfil (técnico para enterprise, práctico para autónomos)
- [ ] Incluir jerga sectorial específica (APIs REST, microservicios, cloud-native)

#### Ajustes en `meta.estimateDetail`

- [ ] Exponer perfil de cliente usado
- [ ] Exponer multiplicador de comunidad autónoma aplicado
- [ ] Exponer tipo de proyecto (MVP, Standard, Enterprise)
- [ ] Exponer benchmarks específicos usados

### 📈 Rangos Realistas por Perfil

| Perfil | Small | Standard | Enterprise |
|--------|-------|----------|------------|
| **Autónomo** | €15,000 - €38,000 | €38,000 - €102,000 | €102,000 - €272,000 |
| **PYME** | €18,000 - €45,000 | €45,000 - €120,000 | €120,000 - €320,000 |
| **Agencia** | €21,000 - €52,000 | €52,000 - €138,000 | €138,000 - €368,000 |
| **Startup** | €16,000 - €41,000 | €41,000 - €108,000 | €108,000 - €288,000 |
| **Enterprise** | €22,000 - €54,000 | €54,000 - €144,000 | €144,000 - €384,000 |

### 💡 Ejemplos de Conceptos Mejorados

**Antes**:
```
"Desarrollo backend y gestión de base de datos"
```

**Después (Autónomo)**:
```
"Desarrollo de API REST con Node.js y base de datos PostgreSQL para gestión de inventarios"
```

**Después (Enterprise)**:
```
"Arquitectura de microservicios con Spring Boot, gestión de base de datos distribuida con PostgreSQL y Redis, implementación de patrones de resilencia y circuit breakers"
```

---

## 2. Marketing / Redes

### 📊 Diagnóstico Actual

**Estado**: ✅ **90% - Completo y Pulido**

- ✅ **Unit Benchmarks**: 7 conceptos con precios de referencia
- ✅ **Plantillas**: 9 conceptos profesionales
- ✅ **Prefijos de Reescritura**: Sistema completo
- ✅ **Frontend**: Disponible en formulario
- ✅ **Rangos de Precio**: 
  - Small: €8,000 - €20,000
  - Standard: €20,000 - €55,000
  - Enterprise: €55,000 - €120,000

**Fortalezas**:
- Muy completo y bien estructurado
- Cubre todos los aspectos del marketing digital
- Benchmarks realistas

**Debilidades**:
- Falta diferenciación por tipo de campaña (branding vs performance)
- No incluye conceptos de video marketing y producción
- Falta lógica para redes sociales específicas (Instagram, TikTok, LinkedIn)

### 🎯 Propuesta de Mejoras

#### 2.1. Añadir Benchmarks por Tipo de Campaña

```typescript
marketing: {
  unitBenchmarks: {
    'auditoría de marca': { average: 5000 },
    'estrategia integral': { average: 7000 },
    'contenido': { 
      average: 4500,
      branding: 6000,      // Branding: +33%
      performance: 3500    // Performance: -22%
    },
    'pauta': { 
      average: 8000,
      branding: 10000,     // Branding: +25%
      performance: 6000    // Performance: -25%
    },
    // ... resto de benchmarks
  },
  campaignTypes: {
    'branding': 1.15,      // +15% para campañas de branding
    'performance': 0.90,   // -10% para campañas de performance
    'mixto': 1.0           // Precio estándar
  }
}
```

#### 2.2. Añadir Conceptos Especializados

**Conceptos a añadir**:
- "Producción de video marketing y edición profesional"
- "Gestión de campañas en TikTok y Reels"
- "Configuración de pixel de seguimiento y conversiones"
- "Implementación de automatizaciones de email marketing"
- "Creación de landing pages optimizadas para conversión"
- "Gestión de influenciadores y colaboraciones"

#### 2.3. Añadir Benchmarks por Plataforma

```typescript
socialMediaBenchmarks: {
  'instagram': 5500,
  'facebook': 4500,
  'tiktok': 6500,
  'linkedin': 7000,
  'twitter': 4000,
  'youtube': 8000
}
```

### 🔧 Checklist Técnico

#### Ajustes en `estimateProjectCost`

- [ ] Añadir parámetro `campaignType?: 'branding' | 'performance' | 'mixto'`
- [ ] Aplicar multiplicador según tipo de campaña
- [ ] Ajustar benchmarks según plataformas utilizadas

#### Ajustes en `distributePricesToUserItems`

- [ ] Ajustar pesos según tipo de campaña
  - Branding: Más peso en creatividad y estrategia
  - Performance: Más peso en pauta y analítica
- [ ] Aplicar márgenes según plataforma
  - LinkedIn: Margen del 15%
  - TikTok: Margen del 12%
  - Instagram: Margen del 10%

#### Ajustes en Prompts de OpenAI

- [ ] Añadir contexto de tipo de campaña en prompts
- [ ] Ajustar tono según plataforma (profesional para LinkedIn, creativo para TikTok)
- [ ] Incluir métricas específicas por plataforma (impresiones, engagement, conversiones)

### 📈 Rangos Realistas por Tipo de Campaña

| Tipo | Small | Standard | Enterprise |
|------|-------|----------|------------|
| **Branding** | €9,000 - €23,000 | €23,000 - €63,000 | €63,000 - €138,000 |
| **Performance** | €7,000 - €18,000 | €18,000 - €50,000 | €50,000 - €108,000 |
| **Mixto** | €8,000 - €20,000 | €20,000 - €55,000 | €55,000 - €120,000 |

### 💡 Ejemplos de Conceptos Mejorados

**Antes**:
```
"Gestión de pauta publicitaria y optimización de campañas"
```

**Después (Performance)**:
```
"Configuración y optimización de campañas de performance en Meta Ads y Google Ads, implementación de píxeles de seguimiento y conversiones, optimización de pujas y audiencias para maximizar ROAS"
```

**Después (Branding)**:
```
"Estrategia de branding omnicanal con producción creativa premium, gestión de campañas de awareness en Instagram y TikTok, desarrollo de identidad visual y tono de marca"
```

---

## 3. Construcción / Servicios Técnicos

### 📊 Diagnóstico Actual

**Estado**: ✅ **95% - Completo y Pulido** (incluye sub-sectores)

- ✅ **Unit Benchmarks**: 6 conceptos con precios de referencia
- ✅ **Plantillas**: 8 conceptos profesionales
- ✅ **Prefijos de Reescritura**: Sistema completo
- ✅ **Frontend**: Disponible en formulario
- ✅ **Sub-sectores Especiales**:
  - **Arquitectura (modo architect)**: 8 conceptos especializados
  - **Contratista (modo contractor)**: 8 conceptos especializados
- ✅ **Rangos de Precio**: 
  - Small: €60,000 - €140,000
  - Standard: €140,000 - €320,000
  - Enterprise: €320,000 - €780,000

**Fortalezas**:
- El único sector con sub-sectores especializados
- Detección automática de arquitectura vs contratista
- Sistema de sanitización de vocabulario
- Pesos de distribución específicos por modo

**Debilidades**:
- No diferencia tipos de obra (residencial vs industrial vs comercial)
- Falta lógica para rehabilitación y reformas
- No incluye multiplicadores por comunidad autónoma (crítico en construcción)

### 🎯 Propuesta de Mejoras

#### 3.1. Añadir Multiplicadores por Tipo de Obra

```typescript
construccion: {
  unitBenchmarks: {
    'movimiento de tierras': { average: 28000 },
    // ... resto de benchmarks
  },
  workTypeMultipliers: {
    'residencial': 1.0,      // Precio estándar
    'industrial': 1.15,      // +15% para obra industrial
    'comercial': 1.10,       // +10% para obra comercial
    'rehabilitacion': 0.95,  // -5% para rehabilitación
    'reforma': 0.90          // -10% para reformas
  }
}
```

#### 3.2. Añadir Multiplicadores por Comunidad Autónoma (Crítico)

```typescript
// Los precios en construcción varían significativamente por región
const CONSTRUCTION_REGIONAL_MULTIPLIERS: Record<string, number> = {
  'madrid': 1.30,           // Madrid: +30% (mayor costo de materiales y mano de obra)
  'cataluña': 1.25,         // Barcelona: +25%
  'baleares': 1.35,         // Baleares: +35% (mayor costo de transporte)
  'país vasco': 1.28,       // País Vasco: +28%
  'canarias': 1.32,         // Canarias: +32% (mayor costo de transporte)
  'andalucía': 0.92,        // Andalucía: -8%
  'valencia': 1.05,         // Valencia: +5%
  'murcia': 0.88,           // Murcia: -12%
  'castilla y león': 0.90,  // Castilla y León: -10%
  'galicia': 0.93,          // Galicia: -7%
  'asturias': 0.94,         // Asturias: -6%
  'cantabria': 0.95,        // Cantabria: -5%
  'aragón': 0.96,           // Aragón: -4%
  'extremadura': 0.85,      // Extremadura: -15%
  'castilla la mancha': 0.87, // Castilla-La Mancha: -13%
  'la rioja': 0.97,          // La Rioja: -3%
  'navarra': 1.12,          // Navarra: +12%
  'ceuta': 1.20,            // Ceuta: +20%
  'melilla': 1.20           // Melilla: +20%
};
```

#### 3.3. Añadir Benchmarks para Arquitectura y Contratista

```typescript
// Benchmarks específicos para arquitectura
architectureBenchmarks: {
  'levantamiento topográfico': { average: 8000 },
  'anteproyecto': { average: 15000 },
  'proyecto ejecutivo': { average: 25000 },
  'coordinación de especialidades': { average: 12000 },
  'supervisión de obra': { average: 18000 },
  'documentación final': { average: 10000 }
}

// Benchmarks específicos para contratista
contractorBenchmarks: {
  'suministro de materiales': { average: 35000 },
  'mano de obra especializada': { average: 28000 },
  'ejecución de obra civil': { average: 48000 },
  'instalaciones especializadas': { average: 42000 },
  'acabados finos': { average: 31000 },
  'puesta en marcha': { average: 15000 }
}
```

#### 3.4. Añadir Conceptos Especializados

**Conceptos a añadir (Arquitectura)**:
- "Estudio de impacto ambiental y sostenibilidad"
- "Coordinación de certificaciones energéticas (LEED, BREEAM)"
- "Gestión de licencias urbanísticas y permisos"
- "Supervisión de cumplimiento normativo (CTE, DB-SI)"

**Conceptos a añadir (Contratista)**:
- "Suministro de materiales certificados y homologados"
- "Gestión de seguridad y salud en obra (PRL)"
- "Control de calidad y ensayos de materiales"
- "Puesta en marcha de instalaciones y pruebas funcionales"

### 🔧 Checklist Técnico

#### Ajustes en `estimateProjectCost`

- [ ] Añadir parámetro `workType?: 'residencial' | 'industrial' | 'comercial' | 'rehabilitacion' | 'reforma'`
- [ ] Aplicar multiplicador según tipo de obra
- [ ] Integrar multiplicadores por comunidad autónoma (crítico)
- [ ] Ajustar benchmarks según modo (arquitecto vs contratista)

#### Ajustes en `distributePricesToUserItems`

- [ ] Ajustar pesos según modo
  - Arquitecto: Más peso en proyecto y documentación (60%)
  - Contratista: Más peso en ejecución y materiales (75%)
- [ ] Aplicar márgenes según tipo de obra
  - Residencial: Margen del 12%
  - Industrial: Margen del 15%
  - Rehabilitación: Margen del 10%

#### Ajustes en Prompts de OpenAI

- [ ] Añadir contexto de tipo de obra en prompts
- [ ] Ajustar tono según modo (técnico para arquitecto, práctico para contratista)
- [ ] Incluir normativas específicas por comunidad autónoma (CTE, ordenanzas locales)

### 📈 Rangos Realistas por Tipo de Obra

| Tipo | Small | Standard | Enterprise |
|------|-------|----------|------------|
| **Residencial** | €60,000 - €140,000 | €140,000 - €320,000 | €320,000 - €780,000 |
| **Industrial** | €69,000 - €161,000 | €161,000 - €368,000 | €368,000 - €897,000 |
| **Comercial** | €66,000 - €154,000 | €154,000 - €352,000 | €352,000 - €858,000 |
| **Rehabilitación** | €57,000 - €133,000 | €133,000 - €304,000 | €304,000 - €741,000 |
| **Reforma** | €54,000 - €126,000 | €126,000 - €288,000 | €288,000 - €702,000 |

### 💡 Ejemplos de Conceptos Mejorados

**Antes (Arquitecto)**:
```
"Coordinación de ingenierías estructurales, instalaciones y sostenibilidad"
```

**Después (Arquitecto, Madrid)**:
```
"Coordinación integral de especialidades estructurales, instalaciones y sostenibilidad para proyecto residencial en Madrid, cumplimiento de CTE y ordenanzas municipales, gestión de licencias urbanísticas"
```

**Antes (Contratista)**:
```
"Suministro de materiales certificados y gestión de proveedores"
```

**Después (Contratista, Andalucía)**:
```
"Suministro de materiales certificados y homologados para obra residencial en Andalucía, gestión de proveedores locales, control de calidad y ensayos de materiales según normativa vigente"
```

---

## 4. Consultoría

### 📊 Diagnóstico Actual

**Estado**: ✅ **85% - Bien Implementado**

- ✅ **Unit Benchmarks**: 5 conceptos con precios de referencia
- ✅ **Plantillas**: 8 conceptos profesionales
- ✅ **Prefijos de Reescritura**: Sistema completo
- ✅ **Frontend**: Disponible en formulario
- ✅ **Rangos de Precio**: 
  - Small: €12,000 - €28,000
  - Standard: €28,000 - €75,000
  - Enterprise: €75,000 - €180,000

**Fortalezas**:
- Bien estructurado
- Cubre los aspectos principales de consultoría

**Debilidades**:
- No diferencia tipos de consultoría (IT, financiera, estratégica, RRHH)
- Falta lógica para proyectos cortos vs largos
- No incluye multiplicadores por perfil de consultor (junior, senior, partner)

### 🎯 Propuesta de Mejoras

#### 4.1. Añadir Benchmarks por Tipo de Consultoría

```typescript
consultoria: {
  unitBenchmarks: {
    'diagnóstico': { 
      average: 9000,
      it: 12000,           // IT: +33%
      financiera: 15000,   // Financiera: +67%
      estrategica: 10000,  // Estratégica: +11%
      rrhh: 8000           // RRHH: -11%
    },
    'plan estratégico': { 
      average: 14000,
      it: 18000,
      financiera: 22000,
      estrategica: 16000,
      rrhh: 12000
    },
    // ... resto de benchmarks
  },
  consultingTypes: {
    'it': 1.20,            // +20% para consultoría IT
    'financiera': 1.35,    // +35% para consultoría financiera
    'estrategica': 1.10,   // +10% para consultoría estratégica
    'rrhh': 0.90,          // -10% para consultoría RRHH
    'general': 1.0         // Precio estándar
  }
}
```

#### 4.2. Añadir Multiplicadores por Perfil de Consultor

```typescript
consultantProfileMultipliers: {
  'junior': 0.75,          // -25% para consultores junior
  'senior': 1.0,           // Precio estándar
  'partner': 1.50,         // +50% para partners
  'big4': 1.80             // +80% para Big 4
}
```

#### 4.3. Añadir Conceptos Especializados

**Conceptos a añadir**:
- "Análisis de procesos y optimización operativa"
- "Implementación de metodologías ágiles y transformación digital"
- "Due diligence y análisis de mercado"
- "Gestión de cambio organizacional y comunicación interna"
- "Diseño de estructura organizacional y roles"

### 🔧 Checklist Técnico

#### Ajustes en `estimateProjectCost`

- [ ] Añadir parámetro `consultingType?: 'it' | 'financiera' | 'estrategica' | 'rrhh' | 'general'`
- [ ] Añadir parámetro `consultantProfile?: 'junior' | 'senior' | 'partner' | 'big4'`
- [ ] Aplicar multiplicadores según tipo y perfil

#### Ajustes en `distributePricesToUserItems`

- [ ] Ajustar pesos según tipo de consultoría
  - IT: Más peso en implementación y tecnología
  - Financiera: Más peso en análisis y reporting
  - Estratégica: Más peso en diagnóstico y plan
- [ ] Aplicar márgenes según perfil
  - Junior: Margen del 10%
  - Senior: Margen del 15%
  - Partner: Margen del 20%

### 📈 Rangos Realistas por Tipo y Perfil

| Tipo | Junior | Senior | Partner |
|------|--------|--------|---------|
| **IT** | €9,000 - €21,600 | €14,400 - €36,000 | €21,600 - €54,000 |
| **Financiera** | €10,800 - €25,200 | €17,280 - €43,200 | €25,920 - €64,800 |
| **Estratégica** | €8,640 - €20,160 | €13,824 - €34,560 | €20,736 - €51,840 |
| **RRHH** | €7,200 - €16,800 | €11,520 - €28,800 | €17,280 - €43,200 |

### 💡 Ejemplos de Conceptos Mejorados

**Antes**:
```
"Análisis diagnósticos y benchmarking sectorial"
```

**Después (IT, Senior)**:
```
"Análisis diagnóstico de arquitectura tecnológica y procesos IT, benchmarking sectorial y mejores prácticas, identificación de gaps y oportunidades de mejora"
```

**Después (Financiera, Partner)**:
```
"Due diligence financiera y análisis de viabilidad, benchmarking sectorial y análisis de mercado, identificación de riesgos y oportunidades de optimización financiera"
```

---

## 5. Ecommerce / Retail

### 📊 Diagnóstico Actual

**Estado**: ⚠️ **60% - Implementación Básica**

- ❌ **Unit Benchmarks**: NO tiene benchmarks específicos
- ✅ **Plantillas**: 8 conceptos profesionales
- ✅ **Prefijos de Reescritura**: Sistema completo
- ✅ **Frontend**: Disponible en formulario
- ✅ **Rangos de Precio**: 
  - Small: €9,000 - €22,000
  - Standard: €22,000 - €55,000
  - Enterprise: €55,000 - €120,000

**Fortalezas**:
- Tiene plantillas y prefijos
- Está disponible en frontend

**Debilidades**:
- **CRÍTICO**: Falta unit benchmarks (40% del peso)
- No diferencia tipos de ecommerce (B2C, B2B, marketplace)
- Falta lógica para integraciones (ERP, CRM, logística)
- No incluye conceptos de dropshipping y fulfillment

### 🎯 Propuesta de Mejoras

#### 5.1. Añadir Unit Benchmarks (CRÍTICO)

```typescript
ecommerce: {
  ticketRanges: {
    small: { min: 9000, max: 22000 },
    standard: { min: 22000, max: 55000 },
    enterprise: { min: 55000, max: 120000 }
  },
  defaultScale: 'standard',
  unitBenchmarks: {
    'configuración de plataforma': { average: 8000 },
    'diseño de experiencia de usuario': { average: 12000 },
    'carga de catálogo de productos': { average: 6000 },
    'integración de pasarelas de pago': { average: 5000 },
    'integración de logística y envíos': { average: 7000 },
    'automatizaciones de marketing': { average: 5500 },
    'configuración de analítica y CRM': { average: 4500 },
    'capacitación y soporte': { average: 4000 },
    'optimización de conversiones': { average: 5000 },
    'integración con ERP': { average: 10000 },
    'integración con marketplace': { average: 8000 }
  }
}
```

#### 5.2. Añadir Multiplicadores por Tipo de Ecommerce

```typescript
ecommerceTypes: {
  'b2c': 1.0,              // Precio estándar
  'b2b': 1.25,             // +25% para B2B (mayor complejidad)
  'marketplace': 1.35,     // +35% para marketplace (mayor complejidad)
  'dropshipping': 0.85,    // -15% para dropshipping (menor complejidad)
  'subscription': 1.15     // +15% para subscription (mayor complejidad)
}
```

#### 5.3. Añadir Conceptos Especializados

**Conceptos a añadir**:
- "Configuración de multi-idioma y multi-moneda"
- "Implementación de programas de fidelización y puntos"
- "Integración con marketplaces (Amazon, eBay, Wallapop)"
- "Configuración de fulfillment y almacén"
- "Implementación de sistemas de recomendación y personalización"
- "Configuración de A/B testing y optimización de conversiones"

### 🔧 Checklist Técnico

#### Ajustes en `estimateProjectCost`

- [ ] Añadir unit benchmarks (CRÍTICO)
- [ ] Añadir parámetro `ecommerceType?: 'b2c' | 'b2b' | 'marketplace' | 'dropshipping' | 'subscription'`
- [ ] Aplicar multiplicador según tipo de ecommerce

#### Ajustes en `distributePricesToUserItems`

- [ ] Ajustar pesos según tipo de ecommerce
  - B2C: Más peso en diseño y marketing
  - B2B: Más peso en integraciones y ERP
  - Marketplace: Más peso en configuración y logística
- [ ] Aplicar márgenes según tipo
  - B2C: Margen del 12%
  - B2B: Margen del 15%
  - Marketplace: Margen del 18%

#### Ajustes en Prompts de OpenAI

- [ ] Añadir contexto de tipo de ecommerce en prompts
- [ ] Ajustar tono según tipo (comercial para B2C, técnico para B2B)
- [ ] Incluir jerga sectorial específica (conversión, AOV, LTV, CAC)

### 📈 Rangos Realistas por Tipo

| Tipo | Small | Standard | Enterprise |
|------|-------|----------|------------|
| **B2C** | €9,000 - €22,000 | €22,000 - €55,000 | €55,000 - €120,000 |
| **B2B** | €11,250 - €27,500 | €27,500 - €68,750 | €68,750 - €150,000 |
| **Marketplace** | €12,150 - €29,700 | €29,700 - €74,250 | €74,250 - €162,000 |
| **Dropshipping** | €7,650 - €18,700 | €18,700 - €46,750 | €46,750 - €102,000 |
| **Subscription** | €10,350 - €25,300 | €25,300 - €63,250 | €63,250 - €138,000 |

### 💡 Ejemplos de Conceptos Mejorados

**Antes**:
```
"Configuración técnica y seguridad de la plataforma ecommerce"
```

**Después (B2C)**:
```
"Configuración técnica de plataforma Shopify/WooCommerce con certificados SSL, configuración de multi-idioma y multi-moneda, implementación de pasarelas de pago (Stripe, PayPal) y sistemas de fidelización"
```

**Después (B2B)**:
```
"Configuración técnica de plataforma B2B con integración ERP (SAP, Oracle), gestión de catálogos personalizados por cliente, implementación de sistemas de aprobación y facturación electrónica"
```

---

## 6. Eventos

### 📊 Diagnóstico Actual

**Estado**: ⚠️ **55% - Implementación Básica**

- ❌ **Unit Benchmarks**: NO tiene benchmarks específicos
- ✅ **Plantillas**: 9 conceptos profesionales
- ✅ **Prefijos de Reescritura**: Sistema completo
- ❌ **Frontend**: NO está disponible en formulario
- ✅ **Rangos de Precio**: 
  - Small: €9,000 - €26,000
  - Standard: €26,000 - €62,000
  - Enterprise: €62,000 - €140,000

**Fortalezas**:
- Tiene plantillas completas
- Cubre todos los aspectos de un evento

**Debilidades**:
- **CRÍTICO**: Falta unit benchmarks (40% del peso)
- **CRÍTICO**: No está disponible en frontend (10% del peso)
- No diferencia tipos de evento (corporate, social, cultural)
- Falta lógica para eventos virtuales/híbridos
- No incluye conceptos de catering y hospitality

### 🎯 Propuesta de Mejoras

#### 6.1. Añadir Unit Benchmarks (CRÍTICO)

```typescript
eventos: {
  ticketRanges: {
    small: { min: 9000, max: 26000 },
    standard: { min: 26000, max: 62000 },
    enterprise: { min: 62000, max: 140000 }
  },
  defaultScale: 'standard',
  unitBenchmarks: {
    'conceptualización y diseño': { average: 5000 },
    'plan de producción y cronograma': { average: 4000 },
    'selección y negociación de proveedores': { average: 3500 },
    'diseño de escenografía y ambientación': { average: 8000 },
    'montaje técnico (audio, video, iluminación)': { average: 12000 },
    'catering y hospitality': { average: 15000 },
    'operación en sitio y control': { average: 6000 },
    'desmontaje y cierre logístico': { average: 4000 },
    'memorias fotográficas y KPIs': { average: 3000 },
    'gestión de streaming y eventos virtuales': { average: 10000 }
  }
}
```

#### 6.2. Añadir Multiplicadores por Tipo de Evento

```typescript
eventTypes: {
  'corporate': 1.0,        // Precio estándar
  'social': 1.15,          // +15% para eventos sociales (mayor complejidad)
  'cultural': 0.90,        // -10% para eventos culturales
  'deportivo': 1.20,       // +20% para eventos deportivos (mayor complejidad)
  'virtual': 0.70,         // -30% para eventos virtuales
  'hibrido': 1.25          // +25% para eventos híbridos (mayor complejidad)
}
```

#### 6.3. Añadir Conceptos Especializados

**Conceptos a añadir**:
- "Producción de contenido audiovisual para streaming"
- "Configuración de plataformas virtuales (Zoom, Hopin, etc.)"
- "Gestión de acreditaciones y control de acceso"
- "Coordinación de transporte y alojamiento para invitados"
- "Producción de material gráfico y señalética"
- "Gestión de permisos y licencias para eventos públicos"

### 🔧 Checklist Técnico

#### Ajustes en `estimateProjectCost`

- [ ] Añadir unit benchmarks (CRÍTICO)
- [ ] Añadir parámetro `eventType?: 'corporate' | 'social' | 'cultural' | 'deportivo' | 'virtual' | 'hibrido'`
- [ ] Aplicar multiplicador según tipo de evento

#### Ajustes en `distributePricesToUserItems`

- [ ] Ajustar pesos según tipo de evento
  - Corporate: Más peso en producción y logística
  - Social: Más peso en catering y ambientación
  - Virtual: Más peso en tecnología y streaming
- [ ] Aplicar márgenes según tipo
  - Corporate: Margen del 15%
  - Social: Margen del 18%
  - Virtual: Margen del 12%

#### Ajustes en Frontend

- [ ] **CRÍTICO**: Añadir "Eventos" al formulario del frontend
- [ ] Añadir selector de tipo de evento
- [ ] Añadir campos específicos (número de asistentes, duración, ubicación)

#### Ajustes en Prompts de OpenAI

- [ ] Añadir contexto de tipo de evento en prompts
- [ ] Ajustar tono según tipo (profesional para corporate, creativo para social)
- [ ] Incluir jerga sectorial específica (rider técnico, hospitality, desmontaje)

### 📈 Rangos Realistas por Tipo

| Tipo | Small | Standard | Enterprise |
|------|-------|----------|------------|
| **Corporate** | €9,000 - €26,000 | €26,000 - €62,000 | €62,000 - €140,000 |
| **Social** | €10,350 - €29,900 | €29,900 - €71,300 | €71,300 - €161,000 |
| **Cultural** | €8,100 - €23,400 | €23,400 - €55,800 | €55,800 - €126,000 |
| **Deportivo** | €10,800 - €31,200 | €31,200 - €74,400 | €74,400 - €168,000 |
| **Virtual** | €6,300 - €18,200 | €18,200 - €43,400 | €43,400 - €98,000 |
| **Híbrido** | €11,250 - €32,500 | €32,500 - €77,500 | €77,500 - €175,000 |

### 💡 Ejemplos de Conceptos Mejorados

**Antes**:
```
"Coordinación de montaje técnico (audio, video, iluminación)"
```

**Después (Corporate)**:
```
"Coordinación integral de montaje técnico con sistema de audio profesional, video mapping y iluminación escénica, configuración de streaming en vivo para transmisión online, rider técnico completo y pruebas de sonido"
```

**Después (Virtual)**:
```
"Configuración de plataforma virtual (Hopin/Zoom Events) con salas de networking, producción de contenido audiovisual para streaming, gestión de acreditaciones y control de acceso, soporte técnico en tiempo real"
```

---

## 7. Comercio

### 📊 Diagnóstico Actual

**Estado**: ⚠️ **55% - Implementación Básica**

- ❌ **Unit Benchmarks**: NO tiene benchmarks específicos
- ✅ **Plantillas**: 8 conceptos profesionales
- ✅ **Prefijos de Reescritura**: Sistema completo
- ❌ **Frontend**: NO está disponible en formulario
- ✅ **Rangos de Precio**: 
  - Small: €7,000 - €18,000
  - Standard: €18,000 - €45,000
  - Enterprise: €45,000 - €90,000

**Fortalezas**:
- Tiene plantillas y prefijos
- Cubre aspectos de retail y omnicanal

**Debilidades**:
- **CRÍTICO**: Falta unit benchmarks (40% del peso)
- **CRÍTICO**: No está disponible en frontend (10% del peso)
- Está mezclado con ecommerce (deberían separarse)
- No diferencia tipos de comercio (físico, omnicanal, franchising)
- Falta lógica para visual merchandising y planogramas

### 🎯 Propuesta de Mejoras

#### 7.1. Añadir Unit Benchmarks (CRÍTICO)

```typescript
comercio: {
  ticketRanges: {
    small: { min: 7000, max: 18000 },
    standard: { min: 18000, max: 45000 },
    enterprise: { min: 45000, max: 90000 }
  },
  defaultScale: 'standard',
  unitBenchmarks: {
    'diagnóstico de operación comercial': { average: 5000 },
    'optimización de layout y planogramas': { average: 8000 },
    'visual merchandising y diseño de tienda': { average: 12000 },
    'implementación de estrategias omnicanal': { average: 10000 },
    'gestión de inventarios y abastecimiento': { average: 7000 },
    'campañas de fidelización y lealtad': { average: 6000 },
    'capacitación comercial y protocolos': { average: 5000 },
    'automatización de reportes y tableros': { average: 4500 },
    'seguimiento de indicadores y recomendaciones': { average: 4000 }
  }
}
```

#### 7.2. Separar de Ecommerce

**Recomendación**: Separar completamente "Comercio" (retail físico) de "Ecommerce" (online). Son sectores diferentes con necesidades distintas.

#### 7.3. Añadir Multiplicadores por Tipo de Comercio

```typescript
commerceTypes: {
  'fisico': 1.0,           // Precio estándar
  'omnicanal': 1.25,       // +25% para omnicanal (mayor complejidad)
  'franchising': 1.15,     // +15% para franchising
  'popup': 0.80,           // -20% para pop-up stores
  'concept store': 1.30    // +30% para concept stores (mayor complejidad)
}
```

#### 7.4. Añadir Conceptos Especializados

**Conceptos a añadir**:
- "Diseño de experiencia de compra y customer journey"
- "Implementación de sistemas de punto de venta (POS)"
- "Gestión de escaparatismo y vitrinas"
- "Optimización de flujos de tráfico en tienda"
- "Implementación de programas de fidelización con tarjetas"
- "Gestión de eventos y activaciones en tienda"

### 🔧 Checklist Técnico

#### Ajustes en `estimateProjectCost`

- [ ] Añadir unit benchmarks (CRÍTICO)
- [ ] Separar de ecommerce (crear sector independiente)
- [ ] Añadir parámetro `commerceType?: 'fisico' | 'omnicanal' | 'franchising' | 'popup' | 'concept'`
- [ ] Aplicar multiplicador según tipo de comercio

#### Ajustes en Frontend

- [ ] **CRÍTICO**: Añadir "Comercio" al formulario del frontend
- [ ] Separar de "Ecommerce" (crear opción independiente)
- [ ] Añadir selector de tipo de comercio
- [ ] Añadir campos específicos (metros cuadrados, número de tiendas, ubicación)

#### Ajustes en Prompts de OpenAI

- [ ] Añadir contexto de tipo de comercio en prompts
- [ ] Ajustar tono según tipo (comercial para físico, técnico para omnicanal)
- [ ] Incluir jerga sectorial específica (planogramas, visual merchandising, omnicanal)

### 📈 Rangos Realistas por Tipo

| Tipo | Small | Standard | Enterprise |
|------|-------|----------|------------|
| **Físico** | €7,000 - €18,000 | €18,000 - €45,000 | €45,000 - €90,000 |
| **Omnicanal** | €8,750 - €22,500 | €22,500 - €56,250 | €56,250 - €112,500 |
| **Franchising** | €8,050 - €20,700 | €20,700 - €51,750 | €51,750 - €103,500 |
| **Pop-up** | €5,600 - €14,400 | €14,400 - €36,000 | €36,000 - €72,000 |
| **Concept Store** | €9,100 - €23,400 | €23,400 - €58,500 | €58,500 - €117,000 |

### 💡 Ejemplos de Conceptos Mejorados

**Antes**:
```
"Optimización de layout, planogramas y visual merchandising"
```

**Después (Físico)**:
```
"Optimización de layout de tienda y diseño de planogramas por categoría, implementación de visual merchandising y escaparatismo, análisis de flujos de tráfico y experiencia de compra"
```

**Después (Omnicanal)**:
```
"Implementación de estrategia omnicanal con integración de canales físico y online, sincronización de inventarios en tiempo real, programas de click & collect y envíos desde tienda"
```

---

## 8. Manufactura

### 📊 Diagnóstico Actual

**Estado**: ⚠️ **55% - Implementación Básica**

- ❌ **Unit Benchmarks**: NO tiene benchmarks específicos
- ✅ **Plantillas**: 8 conceptos profesionales
- ✅ **Prefijos de Reescritura**: Sistema completo
- ❌ **Frontend**: NO está disponible en formulario
- ✅ **Rangos de Precio**: 
  - Small: €20,000 - €55,000
  - Standard: €55,000 - €140,000
  - Enterprise: €140,000 - €320,000

**Fortalezas**:
- Tiene plantillas y prefijos
- Cubre aspectos de Lean y mejora continua

**Debilidades**:
- **CRÍTICO**: Falta unit benchmarks (40% del peso)
- **CRÍTICO**: No está disponible en frontend (10% del peso)
- No diferencia tipos de manufactura (discreta, continua, por lotes)
- Falta lógica para Industry 4.0 y automatización
- No incluye conceptos de certificaciones (ISO, IATF)

### 🎯 Propuesta de Mejoras

#### 8.1. Añadir Unit Benchmarks (CRÍTICO)

```typescript
manufactura: {
  ticketRanges: {
    small: { min: 20000, max: 55000 },
    standard: { min: 55000, max: 140000 },
    enterprise: { min: 140000, max: 320000 }
  },
  defaultScale: 'standard',
  unitBenchmarks: {
    'mapeo y análisis de procesos': { average: 12000 },
    'rediseño de layout y balanceo': { average: 18000 },
    'implementación de metodologías Lean': { average: 15000 },
    'automatización de controles de calidad': { average: 20000 },
    'gestión de mantenimiento preventivo': { average: 14000 },
    'estandarización de procedimientos': { average: 10000 },
    'capacitación del personal': { average: 8000 },
    'implementación de indicadores OEE': { average: 12000 },
    'implementación de Industry 4.0': { average: 35000 },
    'certificaciones ISO/IATF': { average: 25000 }
  }
}
```

#### 8.2. Añadir Multiplicadores por Tipo de Manufactura

```typescript
manufacturingTypes: {
  'discreta': 1.0,         // Precio estándar
  'continua': 1.20,        // +20% para manufactura continua
  'por lotes': 0.95,       // -5% para manufactura por lotes
  'custom': 1.35,          // +35% para manufactura custom
  'automotriz': 1.40,      // +40% para automotriz (mayor complejidad)
  'farmaceutica': 1.50     // +50% para farmacéutica (mayor complejidad)
}
```

#### 8.3. Añadir Conceptos Especializados

**Conceptos a añadir**:
- "Implementación de sistemas MES (Manufacturing Execution Systems)"
- "Integración de IoT y sensores para monitoreo en tiempo real"
- "Implementación de sistemas de trazabilidad y lotes"
- "Certificaciones ISO 9001, ISO 14001, IATF 16949"
- "Implementación de sistemas de gestión de calidad (SPC)"
- "Optimización de cadena de suministro y logística"

### 🔧 Checklist Técnico

#### Ajustes en `estimateProjectCost`

- [ ] Añadir unit benchmarks (CRÍTICO)
- [ ] Añadir parámetro `manufacturingType?: 'discreta' | 'continua' | 'por lotes' | 'custom' | 'automotriz' | 'farmaceutica'`
- [ ] Aplicar multiplicador según tipo de manufactura

#### Ajustes en Frontend

- [ ] **CRÍTICO**: Añadir "Manufactura" al formulario del frontend
- [ ] Añadir selector de tipo de manufactura
- [ ] Añadir campos específicos (número de líneas, volumen de producción, certificaciones)

#### Ajustes en Prompts de OpenAI

- [ ] Añadir contexto de tipo de manufactura en prompts
- [ ] Ajustar tono según tipo (técnico para automotriz, práctico para discreta)
- [ ] Incluir jerga sectorial específica (OEE, TPM, Lean, Six Sigma, Industry 4.0)

### 📈 Rangos Realistas por Tipo

| Tipo | Small | Standard | Enterprise |
|------|-------|----------|------------|
| **Discreta** | €20,000 - €55,000 | €55,000 - €140,000 | €140,000 - €320,000 |
| **Continua** | €24,000 - €66,000 | €66,000 - €168,000 | €168,000 - €384,000 |
| **Por Lotes** | €19,000 - €52,250 | €52,250 - €133,000 | €133,000 - €304,000 |
| **Custom** | €27,000 - €74,250 | €74,250 - €189,000 | €189,000 - €432,000 |
| **Automotriz** | €28,000 - €77,000 | €77,000 - €196,000 | €196,000 - €448,000 |
| **Farmacéutica** | €30,000 - €82,500 | €82,500 - €210,000 | €210,000 - €480,000 |

### 💡 Ejemplos de Conceptos Mejorados

**Antes**:
```
"Mapeo y análisis de procesos productivos"
```

**Después (Discreta)**:
```
"Mapeo y análisis de procesos productivos con metodología VSM (Value Stream Mapping), identificación de cuellos de botella y oportunidades de mejora, diseño de flujos optimizados"
```

**Después (Automotriz)**:
```
"Mapeo y análisis de procesos productivos según estándares IATF 16949, identificación de riesgos y oportunidades de mejora, implementación de sistemas de control estadístico de procesos (SPC)"
```

---

## 9. Formación

### 📊 Diagnóstico Actual

**Estado**: ⚠️ **55% - Implementación Básica**

- ❌ **Unit Benchmarks**: NO tiene benchmarks específicos
- ✅ **Plantillas**: 8 conceptos profesionales
- ✅ **Prefijos de Reescritura**: Sistema completo
- ❌ **Frontend**: NO está disponible en formulario
- ✅ **Rangos de Precio**: 
  - Small: €4,000 - €12,000
  - Standard: €12,000 - €32,000
  - Enterprise: €32,000 - €75,000

**Fortalezas**:
- Tiene plantillas y prefijos
- Cubre aspectos de diseño instruccional y evaluación

**Debilidades**:
- **CRÍTICO**: Falta unit benchmarks (40% del peso)
- **CRÍTICO**: No está disponible en frontend (10% del peso)
- Está mezclado con consultoría (deberían separarse)
- No diferencia tipos de formación (presencial, online, blended)
- Falta lógica para plataformas LMS y e-learning

### 🎯 Propuesta de Mejoras

#### 9.1. Añadir Unit Benchmarks (CRÍTICO)

```typescript
formacion: {
  ticketRanges: {
    small: { min: 4000, max: 12000 },
    standard: { min: 12000, max: 32000 },
    enterprise: { min: 32000, max: 75000 }
  },
  defaultScale: 'standard',
  unitBenchmarks: {
    'detección de necesidades': { average: 3000 },
    'diseño instruccional': { average: 8000 },
    'producción de materiales didácticos': { average: 10000 },
    'impartición de sesiones presenciales': { average: 12000 },
    'impartición de sesiones online': { average: 8000 },
    'evaluación y retroalimentación': { average: 5000 },
    'acompañamiento práctico': { average: 6000 },
    'certificación y constancias': { average: 3000 },
    'seguimiento post-capacitación': { average: 4000 },
    'configuración de plataforma LMS': { average: 15000 }
  }
}
```

#### 9.2. Separar de Consultoría

**Recomendación**: Separar completamente "Formación" de "Consultoría". Son sectores diferentes con necesidades distintas.

#### 9.3. Añadir Multiplicadores por Tipo de Formación

```typescript
trainingTypes: {
  'presencial': 1.0,       // Precio estándar
  'online': 0.75,          // -25% para formación online
  'blended': 1.15,         // +15% para blended (mayor complejidad)
  'e-learning': 0.70,      // -30% para e-learning
  'coaching': 1.40,        // +40% para coaching (mayor complejidad)
  'workshop': 1.10         // +10% para workshops
}
```

#### 9.4. Añadir Conceptos Especializados

**Conceptos a añadir**:
- "Diseño de experiencia de aprendizaje (LX Design)"
- "Producción de contenido multimedia (videos, interactivos)"
- "Configuración de plataformas LMS (Moodle, Blackboard, etc.)"
- "Implementación de sistemas de gamificación"
- "Diseño de programas de mentoring y acompañamiento"
- "Evaluación de impacto y ROI de la formación"

### 🔧 Checklist Técnico

#### Ajustes en `estimateProjectCost`

- [ ] Añadir unit benchmarks (CRÍTICO)
- [ ] Separar de consultoría (crear sector independiente)
- [ ] Añadir parámetro `trainingType?: 'presencial' | 'online' | 'blended' | 'e-learning' | 'coaching' | 'workshop'`
- [ ] Aplicar multiplicador según tipo de formación

#### Ajustes en Frontend

- [ ] **CRÍTICO**: Añadir "Formación" al formulario del frontend
- [ ] Separar de "Consultoría" (crear opción independiente)
- [ ] Añadir selector de tipo de formación
- [ ] Añadir campos específicos (número de participantes, duración, modalidad)

#### Ajustes en Prompts de OpenAI

- [ ] Añadir contexto de tipo de formación en prompts
- [ ] Ajustar tono según tipo (didáctico para presencial, técnico para online)
- [ ] Incluir jerga sectorial específica (LX Design, LMS, gamificación, microlearning)

### 📈 Rangos Realistas por Tipo

| Tipo | Small | Standard | Enterprise |
|------|-------|----------|------------|
| **Presencial** | €4,000 - €12,000 | €12,000 - €32,000 | €32,000 - €75,000 |
| **Online** | €3,000 - €9,000 | €9,000 - €24,000 | €24,000 - €56,250 |
| **Blended** | €4,600 - €13,800 | €13,800 - €36,800 | €36,800 - €86,250 |
| **E-learning** | €2,800 - €8,400 | €8,400 - €22,400 | €22,400 - €52,500 |
| **Coaching** | €5,600 - €16,800 | €16,800 - €44,800 | €44,800 - €105,000 |
| **Workshop** | €4,400 - €13,200 | €13,200 - €35,200 | €35,200 - €82,500 |

### 💡 Ejemplos de Conceptos Mejorados

**Antes**:
```
"Diseño instruccional y estructura curricular"
```

**Después (Presencial)**:
```
"Diseño instruccional y estructura curricular con metodología ADDIE, desarrollo de materiales didácticos y recursos interactivos, diseño de actividades prácticas y casos de estudio"
```

**Después (E-learning)**:
```
"Diseño instruccional y estructura curricular para plataforma LMS, producción de contenido multimedia (videos, interactivos, quizzes), implementación de gamificación y sistemas de progreso"
```

---

## 10. General (Fallback)

### 📊 Diagnóstico Actual

**Estado**: ⚠️ **30% - Básico (Fallback)**

- ❌ **Unit Benchmarks**: NO tiene benchmarks específicos
- ⚠️ **Plantillas**: 3 conceptos básicos (muy genéricos)
- ✅ **Prefijos de Reescritura**: Sistema básico
- ✅ **Frontend**: Disponible en formulario (como opción genérica)
- ✅ **Rangos de Precio**: 
  - Small: €6,000 - €15,000
  - Standard: €15,000 - €38,000
  - Enterprise: €38,000 - €85,000

**Fortalezas**:
- Funciona como fallback cuando no se puede clasificar el sector
- Está disponible en frontend

**Debilidades**:
- **CRÍTICO**: Plantillas muy genéricas (solo 3 conceptos)
- No tiene benchmarks
- No ayuda al usuario a entender qué sector elegir

### 🎯 Propuesta de Mejoras

#### 10.1. Mejorar Plantillas (CRÍTICO)

**Opción A: Mejorar plantillas genéricas**
```typescript
general: {
  ticketRanges: {
    small: { min: 6000, max: 15000 },
    standard: { min: 15000, max: 38000 },
    enterprise: { min: 38000, max: 85000 }
  },
  defaultScale: 'standard',
  unitBenchmarks: {
    'análisis de necesidades': { average: 4000 },
    'diseño de solución': { average: 6000 },
    'implementación del servicio': { average: 12000 },
    'seguimiento y soporte': { average: 5000 },
    'documentación y entrega': { average: 3000 }
  }
}
```

**Opción B: Eliminar y forzar clasificación**
- Eliminar opción "General" del frontend
- Mejorar detección automática de sectores
- Forzar al usuario a elegir un sector específico

#### 10.2. Recomendación: Opción B (Eliminar)

**Razones**:
1. Mejora la precisión de las cotizaciones
2. Fuerza al usuario a pensar en su sector
3. Permite aplicar benchmarks específicos
4. Mejora la experiencia del usuario

### 🔧 Checklist Técnico

#### Ajustes en Frontend

- [ ] **CRÍTICO**: Eliminar opción "General" del formulario
- [ ] Mejorar mensaje de error cuando no se puede clasificar el sector
- [ ] Añadir ayuda para elegir el sector correcto

#### Ajustes en `classifySector`

- [ ] Mejorar detección automática de sectores
- [ ] Añadir más keywords por sector
- [ ] Mejorar mensaje de error cuando no se puede clasificar

---

## Checklist Técnico General

### Ajustes en `backend/src/config/sectorCostProfiles.ts`

- [ ] Añadir unit benchmarks a Ecommerce
- [ ] Añadir unit benchmarks a Eventos
- [ ] Añadir unit benchmarks a Comercio
- [ ] Añadir unit benchmarks a Manufactura
- [ ] Añadir unit benchmarks a Formación
- [ ] Añadir multiplicadores por perfil de cliente (Software, Marketing)
- [ ] Añadir multiplicadores por tipo de proyecto (Software, Marketing, Construcción)
- [ ] Añadir multiplicadores por comunidad autónoma (todos los sectores)
- [ ] Añadir benchmarks para Arquitectura (modo architect)
- [ ] Añadir benchmarks para Contratista (modo contractor)

### Ajustes en `backend/src/utils/costEstimator.ts`

- [ ] Añadir parámetro `clientProfile?: string`
- [ ] Añadir parámetro `projectType?: string`
- [ ] Añadir parámetro `region?: string`
- [ ] Integrar multiplicadores por perfil de cliente
- [ ] Integrar multiplicadores por tipo de proyecto
- [ ] Integrar multiplicadores por comunidad autónoma
- [ ] Exponer información en `meta.estimateDetail`

### Ajustes en `backend/src/utils/priceDistributor.ts`

- [ ] Ajustar pesos según perfil de cliente
- [ ] Ajustar pesos según tipo de proyecto
- [ ] Ajustar márgenes según perfil de cliente
- [ ] Ajustar márgenes según tipo de proyecto
- [ ] Exponer información en `meta.debug.distribution`

### Ajustes en `backend/src/utils/contextAnalyzer.ts`

- [ ] Añadir multiplicadores por comunidad autónoma española
- [ ] Mejorar detección de ubicación (ciudad, comunidad autónoma)
- [ ] Añadir lógica para detectar perfil de cliente
- [ ] Añadir lógica para detectar tipo de proyecto

### Ajustes en `backend/src/services/aiService.ts`

- [ ] Añadir contexto de perfil de cliente en prompts
- [ ] Añadir contexto de tipo de proyecto en prompts
- [ ] Añadir contexto de comunidad autónoma en prompts
- [ ] Ajustar tono según perfil de cliente
- [ ] Ajustar tono según tipo de proyecto
- [ ] Incluir jerga sectorial específica por sector

### Ajustes en `frontend/src/app/components/quote-form/quote-form.component.ts`

- [ ] Añadir "Eventos" al formulario
- [ ] Añadir "Comercio" al formulario
- [ ] Añadir "Manufactura" al formulario
- [ ] Añadir "Formación" al formulario
- [ ] Eliminar "General" del formulario
- [ ] Añadir selector de perfil de cliente (Software, Marketing)
- [ ] Añadir selector de tipo de proyecto (según sector)
- [ ] Añadir selector de comunidad autónoma (todos los sectores)

### Ajustes en `backend/src/models/Quote.ts`

- [ ] Añadir `clientProfile?: string` a `GeneratedQuote.meta`
- [ ] Añadir `projectType?: string` a `GeneratedQuote.meta`
- [ ] Añadir `region?: string` a `GeneratedQuote.meta`
- [ ] Exponer información en `meta.estimateDetail`
- [ ] Exponer información en `meta.debug`

---

## Resumen de Estado

### Sectores Optimizados (85-95%)

1. **Software / Desarrollo**: 95% ✅
   - **Pendiente**: Multiplicadores por perfil de cliente y comunidad autónoma
   - **Prioridad**: Media

2. **Marketing / Redes**: 90% ✅
   - **Pendiente**: Benchmarks por tipo de campaña y plataforma
   - **Prioridad**: Media

3. **Construcción / Servicios Técnicos**: 95% ✅
   - **Pendiente**: Multiplicadores por comunidad autónoma (crítico)
   - **Prioridad**: Alta

4. **Consultoría**: 85% ✅
   - **Pendiente**: Benchmarks por tipo de consultoría y perfil
   - **Prioridad**: Media

### Sectores Básicos (55-60%)

5. **Ecommerce / Retail**: 60% ⚠️
   - **Pendiente**: Unit benchmarks (CRÍTICO)
   - **Prioridad**: Alta

6. **Eventos**: 55% ⚠️
   - **Pendiente**: Unit benchmarks (CRÍTICO) + Frontend (CRÍTICO)
   - **Prioridad**: Alta

7. **Comercio**: 55% ⚠️
   - **Pendiente**: Unit benchmarks (CRÍTICO) + Frontend (CRÍTICO) + Separar de Ecommerce
   - **Prioridad**: Alta

8. **Manufactura**: 55% ⚠️
   - **Pendiente**: Unit benchmarks (CRÍTICO) + Frontend (CRÍTICO)
   - **Prioridad**: Alta

9. **Formación**: 55% ⚠️
   - **Pendiente**: Unit benchmarks (CRÍTICO) + Frontend (CRÍTICO) + Separar de Consultoría
   - **Prioridad**: Alta

### Sector Genérico (30%)

10. **General (Fallback)**: 30% ⚠️
    - **Pendiente**: Eliminar del frontend (CRÍTICO)
    - **Prioridad**: Alta

---

## Próximos Pasos

### Fase 1: Críticos (1-2 semanas)
1. Añadir unit benchmarks a Ecommerce, Eventos, Comercio, Manufactura, Formación
2. Añadir Eventos, Comercio, Manufactura, Formación al frontend
3. Eliminar "General" del frontend
4. Separar Comercio de Ecommerce
5. Separar Formación de Consultoría

### Fase 2: Mejoras (2-4 semanas)
6. Integrar multiplicadores por comunidad autónoma española
7. Añadir multiplicadores por perfil de cliente (Software, Marketing)
8. Añadir multiplicadores por tipo de proyecto (todos los sectores)
9. Añadir benchmarks para Arquitectura y Contratista

### Fase 3: Optimizaciones (1-2 meses)
10. Mejorar detección automática de sectores
11. Añadir más conceptos especializados por sector
12. Implementar sistema de A/B testing para precios
13. Crear sistema de benchmarks dinámicos basados en histórico

---

## Conclusión

Este documento proporciona un plan completo para perfeccionar al 100% la generación de conceptos y precios de las cotizaciones en AutoQuote. Las mejoras propuestas asegurarán:

1. **Realismo**: Precios competitivos y realistas según el mercado español
2. **Precisión**: Benchmarks específicos por sector y tipo de proyecto
3. **Flexibilidad**: Multiplicadores por perfil de cliente, tipo de proyecto y ubicación
4. **Profesionalismo**: Vocabulario y conceptos específicos por sector
5. **Trazabilidad**: Información completa en `meta.estimateDetail` y `meta.debug`

Con la implementación de estas mejoras, todos los sectores alcanzarán un nivel de pulido del **90-100%**, asegurando que AutoQuote sea una herramienta profesional y confiable para generar cotizaciones realistas y competitivas.

