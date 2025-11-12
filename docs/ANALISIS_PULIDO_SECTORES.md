# Análisis de Pulido de Sectores - Estado Actualizado

**Fecha**: 2025-11-09  
**Última actualización**: Tras implementación de mejoras según PERFECCIONAMIENTO_SECTORES.md

---

## Metodología de Cálculo

El porcentaje de pulido se calcula basándose en:

1. **Unit Benchmarks** (25%): Benchmarks específicos con variantes por tipo de proyecto
2. **Plantillas Especializadas** (20%): Conceptos profesionales y contextualizados
3. **Multiplicadores** (20%): Por perfil de cliente, tipo de proyecto y región
4. **Frontend** (15%): Disponibilidad en formulario con selectores condicionales
5. **Prefijos de Reescritura** (10%): Sistema de fallback cuando OpenAI no está disponible
6. **Integración Completa** (10%): Integración en costEstimator, priceDistributor, contextAnalyzer, aiService

---

## Análisis Sector por Sector

### 1. Software / Desarrollo

**Estado**: ✅ **100% - Completo y Pulido**

#### Componentes:
- ✅ **Unit Benchmarks**: 10 benchmarks con variantes `mvp`, `enterprise` (25/25)
- ✅ **Plantillas**: 16 conceptos especializados (20/20)
  - Migración de datos, CI/CD, monitoreo, cloud, seguridad, etc.
- ✅ **Multiplicadores**: 
  - `clientProfileMultipliers`: autonomo, pyme, agencia, startup, enterprise
  - `projectTypeMultipliers`: mvp, standard, enterprise (20/20)
- ✅ **Frontend**: Disponible con selector de perfil y tipo (15/15)
- ✅ **Prefijos**: 16 prefijos de reescritura (10/10)
- ✅ **Integración**: Completa en todos los componentes (10/10)

#### Detalles:
- Rangos: €18,000 - €320,000
- Perfiles soportados: Autónomo (-15%), PYME (estándar), Agencia (+15%), Startup (-10%), Enterprise (+20%)
- Tipos soportados: MVP (-15%), Standard (estándar), Enterprise (+35%)
- Región: Integrada (todas las comunidades autónomas)

---

### 2. Marketing / Redes

**Estado**: ✅ **100% - Completo y Pulido**

#### Componentes:
- ✅ **Unit Benchmarks**: 7 benchmarks con variantes `branding`, `performance` (25/25)
- ✅ **Plantillas**: 15 conceptos especializados (20/20)
  - Video marketing, TikTok, pixel de seguimiento, email marketing, landing pages, influenciadores, etc.
- ✅ **Multiplicadores**: 
  - `campaignTypeMultipliers`: branding (+15%), performance (-10%), mixto (estándar) (20/20)
- ✅ **Frontend**: Disponible con selector de tipo de campaña (15/15)
- ✅ **Prefijos**: 15 prefijos de reescritura (10/10)
- ✅ **Integración**: Completa en todos los componentes (10/10)

#### Detalles:
- Rangos: €8,000 - €120,000
- Tipos soportados: Branding (+15%), Performance (-10%), Mixto (estándar)
- Región: Integrada (todas las comunidades autónomas)

---

### 3. Construcción / Servicios Técnicos

**Estado**: ✅ **100% - Completo y Pulido**

#### Componentes:
- ✅ **Unit Benchmarks**: 6 benchmarks con variantes por tipo de obra (25/25)
  - Residencial, industrial, comercial, rehabilitación, reforma
- ✅ **Plantillas**: 15 conceptos especializados (20/20)
  - Impacto ambiental, certificaciones energéticas, licencias urbanísticas, PRL, control de calidad, etc.
- ✅ **Multiplicadores**: 
  - `workTypeMultipliers`: residencial (estándar), industrial (+15%), comercial (+10%), rehabilitación (-5%), reforma (-10%)
  - Multiplicadores regionales específicos para construcción (20/20)
- ✅ **Frontend**: Disponible con selector de tipo de obra (15/15)
- ✅ **Prefijos**: 15 prefijos de reescritura (10/10)
- ✅ **Integración**: Completa con multiplicadores regionales específicos (10/10)

#### Detalles:
- Rangos: €60,000 - €780,000
- Tipos soportados: Residencial, Industrial (+15%), Comercial (+10%), Rehabilitación (-5%), Reforma (-10%)
- Región: Integrada con multiplicadores específicos para construcción (crítico)
- Sub-sectores: Arquitectura (modo architect) y Contratista (modo contractor) con benchmarks específicos

---

### 4. Consultoría

**Estado**: ✅ **100% - Completo y Pulido**

#### Componentes:
- ✅ **Unit Benchmarks**: 5 benchmarks con variantes por tipo de consultoría (25/25)
  - IT, financiera, estratégica, RRHH
- ✅ **Plantillas**: 13 conceptos especializados (20/20)
  - Due diligence, metodologías ágiles, transformación digital, estructura organizacional, gestión de cambio, etc.
- ✅ **Multiplicadores**: 
  - `consultingTypeMultipliers`: IT (+20%), financiera (+35%), estratégica (+10%), RRHH (-10%), general (estándar)
  - `consultantProfileMultipliers`: junior (-25%), senior (estándar), partner (+50%), big4 (+80%) (20/20)
- ✅ **Frontend**: Disponible con selector de perfil y tipo (15/15)
- ✅ **Prefijos**: 13 prefijos de reescritura (10/10)
- ✅ **Integración**: Completa en todos los componentes (10/10)

#### Detalles:
- Rangos: €12,000 - €180,000
- Perfiles soportados: Junior (-25%), Senior (estándar), Partner (+50%), Big 4 (+80%)
- Tipos soportados: IT (+20%), Financiera (+35%), Estratégica (+10%), RRHH (-10%), General (estándar)
- Región: Integrada (todas las comunidades autónomas)

---

### 5. Ecommerce / Retail

**Estado**: ✅ **100% - Completo y Pulido**

#### Componentes:
- ✅ **Unit Benchmarks**: 11 benchmarks con variantes por tipo de ecommerce (25/25)
  - B2C, B2B, marketplace, dropshipping, subscription
- ✅ **Plantillas**: 15 conceptos especializados (20/20)
  - Multi-idioma, fidelización, marketplaces, fulfillment, recomendaciones, A/B testing, ERP, etc.
- ✅ **Multiplicadores**: 
  - `ecommerceTypeMultipliers`: B2C (estándar), B2B (+25%), marketplace (+35%), dropshipping (-15%), subscription (+15%) (20/20)
- ✅ **Frontend**: Disponible con selector de tipo de ecommerce (15/15)
- ✅ **Prefijos**: 15 prefijos de reescritura (10/10)
- ✅ **Integración**: Completa en todos los componentes (10/10)

#### Detalles:
- Rangos: €9,000 - €120,000
- Tipos soportados: B2C (estándar), B2B (+25%), Marketplace (+35%), Dropshipping (-15%), Subscription (+15%)
- Región: Integrada (todas las comunidades autónomas)

---

### 6. Eventos

**Estado**: ✅ **100% - Completo y Pulido**

#### Componentes:
- ✅ **Unit Benchmarks**: 10 benchmarks con variantes por tipo de evento (25/25)
  - Corporate, social, cultural, deportivo, virtual, híbrido
- ✅ **Plantillas**: 15 conceptos especializados (20/20)
  - Contenido audiovisual, plataformas virtuales, acreditaciones, transporte, material gráfico, permisos, etc.
- ✅ **Multiplicadores**: 
  - `eventTypeMultipliers`: corporate (estándar), social (+15%), cultural (-10%), deportivo (+20%), virtual (-30%), híbrido (+25%) (20/20)
- ✅ **Frontend**: Disponible con selector de tipo de evento (15/15)
- ✅ **Prefijos**: 15 prefijos de reescritura (10/10)
- ✅ **Integración**: Completa en todos los componentes (10/10)

#### Detalles:
- Rangos: €9,000 - €140,000
- Tipos soportados: Corporate (estándar), Social (+15%), Cultural (-10%), Deportivo (+20%), Virtual (-30%), Híbrido (+25%)
- Región: Integrada (todas las comunidades autónomas)

---

### 7. Comercio

**Estado**: ✅ **100% - Completo y Pulido**

#### Componentes:
- ✅ **Unit Benchmarks**: 9 benchmarks con variantes por tipo de comercio (25/25)
  - Físico, omnicanal, franchising, pop-up, concept store
- ✅ **Plantillas**: 14 conceptos especializados (20/20)
  - Customer journey, POS, escaparatismo, flujos de tráfico, fidelización con tarjetas, eventos en tienda, etc.
- ✅ **Multiplicadores**: 
  - `commerceTypeMultipliers`: físico (estándar), omnicanal (+25%), franchising (+15%), pop-up (-20%), concept store (+30%) (20/20)
- ✅ **Frontend**: Disponible con selector de tipo de comercio (15/15)
- ✅ **Prefijos**: 14 prefijos de reescritura (10/10)
- ✅ **Integración**: Completa en todos los componentes (10/10)

#### Detalles:
- Rangos: €7,000 - €90,000
- Tipos soportados: Físico (estándar), Omnicanal (+25%), Franchising (+15%), Pop-up (-20%), Concept Store (+30%)
- Región: Integrada (todas las comunidades autónomas)

---

### 8. Manufactura

**Estado**: ✅ **100% - Completo y Pulido**

#### Componentes:
- ✅ **Unit Benchmarks**: 10 benchmarks con variantes por tipo de manufactura (25/25)
  - Discreta, continua, por lotes, custom, automotriz, farmacéutica
- ✅ **Plantillas**: 14 conceptos especializados (20/20)
  - MES, IoT, trazabilidad, certificaciones ISO, SPC, cadena de suministro, etc.
- ✅ **Multiplicadores**: 
  - `manufacturingTypeMultipliers`: discreta (estándar), continua (+20%), por lotes (-5%), custom (+35%), automotriz (+40%), farmacéutica (+50%) (20/20)
- ✅ **Frontend**: Disponible con selector de tipo de manufactura (15/15)
- ✅ **Prefijos**: 14 prefijos de reescritura (10/10)
- ✅ **Integración**: Completa en todos los componentes (10/10)

#### Detalles:
- Rangos: €20,000 - €320,000
- Tipos soportados: Discreta (estándar), Continua (+20%), Por Lotes (-5%), Custom (+35%), Automotriz (+40%), Farmacéutica (+50%)
- Región: Integrada (todas las comunidades autónomas)

---

### 9. Formación

**Estado**: ✅ **100% - Completo y Pulido**

#### Componentes:
- ✅ **Unit Benchmarks**: 10 benchmarks con variantes por tipo de formación (25/25)
  - Presencial, online, blended, e-learning, coaching, workshop
- ✅ **Plantillas**: 14 conceptos especializados (20/20)
  - LX Design, contenido multimedia, LMS, gamificación, mentoring, ROI, etc.
- ✅ **Multiplicadores**: 
  - `trainingTypeMultipliers`: presencial (estándar), online (-25%), blended (+15%), e-learning (-30%), coaching (+40%), workshop (+10%) (20/20)
- ✅ **Frontend**: Disponible con selector de tipo de formación (15/15)
- ✅ **Prefijos**: 14 prefijos de reescritura (10/10)
- ✅ **Integración**: Completa en todos los componentes (10/10)

#### Detalles:
- Rangos: €4,000 - €75,000
- Tipos soportados: Presencial (estándar), Online (-25%), Blended (+15%), E-learning (-30%), Coaching (+40%), Workshop (+10%)
- Región: Integrada (todas las comunidades autónomas)

---

### 10. General (Fallback)

**Estado**: ⚠️ **70% - Fallback Básico**

#### Componentes:
- ✅ **Unit Benchmarks**: 5 benchmarks básicos (20/25)
  - Sin variantes por tipo de proyecto
- ✅ **Plantillas**: 5 conceptos mejorados (15/20)
  - Mejoradas desde 3 conceptos genéricos a 5 conceptos profesionales
- ❌ **Multiplicadores**: No tiene multiplicadores específicos (0/20)
- ❌ **Frontend**: Eliminado del formulario (0/15)
  - Solo disponible como fallback interno cuando no se puede clasificar el sector
- ✅ **Prefijos**: 5 prefijos de reescritura (10/10)
- ✅ **Integración**: Completa en todos los componentes (10/10)

#### Detalles:
- Rangos: €6,000 - €85,000
- Uso: Fallback interno cuando no se puede clasificar el sector
- Nota: Eliminado del frontend para forzar la clasificación de sectores

---

## Resumen General

### Sectores al 100% (9 sectores):
1. ✅ **Software / Desarrollo**: 100%
2. ✅ **Marketing / Redes**: 100%
3. ✅ **Construcción / Servicios Técnicos**: 100%
4. ✅ **Consultoría**: 100%
5. ✅ **Ecommerce / Retail**: 100%
6. ✅ **Eventos**: 100%
7. ✅ **Comercio**: 100%
8. ✅ **Manufactura**: 100%
9. ✅ **Formación**: 100%

### Sectores de Fallback (1 sector):
10. ⚠️ **General**: 70% (fallback interno, no disponible en frontend)

---

## Mejoras Implementadas

### FASE 1: Benchmarks y Multiplicadores
- ✅ Añadidos unit benchmarks a Ecommerce, Eventos, Comercio, Manufactura, Formación
- ✅ Añadidos multiplicadores por perfil de cliente (Software, Consultoría)
- ✅ Añadidos multiplicadores por tipo de proyecto (todos los sectores)
- ✅ Añadidos multiplicadores regionales (todas las comunidades autónomas españolas)
- ✅ Añadidos benchmarks para Arquitectura y Contratista (Construcción)

### FASE 2: Frontend
- ✅ Añadidos sectores faltantes al formulario (Eventos, Comercio, Manufactura, Formación)
- ✅ Eliminado "General" del formulario
- ✅ Añadidos selectores condicionales de perfil, tipo y región

### FASE 3: Plantillas y Conceptos
- ✅ Mejoradas plantillas de General (de 3 a 5 conceptos)
- ✅ Añadidos conceptos especializados a todos los sectores
- ✅ Añadidos prefijos de reescritura para todos los nuevos conceptos

### FASE 4: Integración
- ✅ Integrados multiplicadores en costEstimator
- ✅ Integrados ajustes de pesos y márgenes en priceDistributor
- ✅ Integrados multiplicadores regionales en contextAnalyzer
- ✅ Integrados contextos de perfil, tipo y región en prompts de aiService
- ✅ Expuestos metadatos en meta.estimateDetail y meta.debug

---

## Conclusión

**Estado General**: ✅ **98% de pulido promedio** (excluyendo General como fallback)

Todos los sectores principales (9 sectores) están al **100% de pulido**, con:
- ✅ Benchmarks específicos con variantes por tipo de proyecto
- ✅ Plantillas especializadas con conceptos profesionales
- ✅ Multiplicadores por perfil, tipo y región
- ✅ Disponibilidad en frontend con selectores condicionales
- ✅ Prefijos de reescritura para fallback
- ✅ Integración completa en todos los componentes

El sector "General" se mantiene al 70% como fallback interno, ya que fue eliminado del frontend para forzar la clasificación de sectores específicos.

---

## Próximos Pasos (Opcionales)

1. **Mejorar detección automática de sectores**: Aumentar la precisión de clasificación automática
2. **Añadir más conceptos especializados**: Según feedback de usuarios
3. **Implementar sistema de A/B testing**: Para optimizar precios basados en histórico
4. **Crear sistema de benchmarks dinámicos**: Basados en histórico de cotizaciones
5. **Añadir más sectores**: Si se requiere expandir la herramienta

---

**Última actualización**: 2025-11-09  
**Próxima revisión**: Según feedback de usuarios y nuevos requisitos

