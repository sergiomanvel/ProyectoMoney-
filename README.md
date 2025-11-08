# AutoQuote - Generador de Cotizaciones Profesionales con IA

![AutoQuote](https://img.shields.io/badge/Version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/License-MIT-green.svg)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-brightgreen.svg)

Una aplicación **SaaS completa** que genera cotizaciones profesionales automáticamente usando **Inteligencia Artificial (OpenAI)**. Perfecta para freelancers, agencias y empresas que buscan automatizar y mejorar su proceso de cotización.

## ⏱️ Instalación rápida (modo demo en 5 minutos)

```bash
git clone <tu-repo-url>
cd ProyectoMoney/backend && cp _env.example .env && npm run first-run
# En otra terminal
cd ../frontend && npm start
# Abre: http://localhost:4200
```

Notas:
- Si no pones claves de OpenAI/SMTP, se activa el modo demo automáticamente (genera cotizaciones localmente y no envía emails reales).
- Para modo real, edita `backend/.env` con tus claves y reinicia.

## 🎯 ¿Qué es AutoQuote?

AutoQuote es una solución lista para producción que te permite:
- **Generar cotizaciones automáticamente** con IA usando solo una descripción del proyecto
- **Crear PDFs profesionales** con diseño moderno y personalizable
- **Enviar cotizaciones por email** con enlaces firmados para visualización online
- **Gestionar un historial completo** con estados (borrador, enviada, aceptada, expirada)
- **Personalizar completamente** la marca (nombre, colores, empresa, impuestos)

## ✨ Características Principales

### 🤖 Generación Inteligente con IA
- Generación automática de items, precios y términos basados en descripción del proyecto
- Validación robusta con JSON Schema + fallback seguro
- Soporte para múltiples modelos de OpenAI (gpt-4o-mini, gpt-3.5-turbo, etc.)
- Formato de moneda mexicana (MXN) con locale es-MX

### 📄 PDFs Profesionales
- Diseño moderno y limpio con branding personalizable
- Incluye folio incremental (ej: `AQ-2025-0001`)
- Fecha de emisión y vigencia automáticas
- Formato monetario profesional (MXN)
- Items detallados con subtotales, impuestos y totales

### 📧 Sistema de Email Completo
- Envío de cotizaciones con PDF adjunto
- Email HTML responsive con plantilla profesional
- **CTA con enlace firmado** para visualización online sin login
- Modo demo seguro (funciona sin SMTP para testing)
- Links firmados con JWT (válidos por 7 días)

### 🎨 Personalización Total
- **Nombre de la app** personalizable
- **Color primario** para branding
- **Nombre de empresa** en PDFs y emails
- **Porcentaje de impuesto** configurable
- Todo configurado desde `.env`

### 📊 Gestión de Cotizaciones
- Historial completo con búsqueda y filtros
- Estados: Draft, Enviada, Aceptada, Expirada
- Folios incrementales por año
- Fechas de vigencia configurables
- Vista pública para clientes (con token)

### ✏️ Edición de Conceptos (Versión PRO)
- **Edita items generados por IA** antes de enviar
- **Añade, modifica o elimina conceptos** fácilmente
- **Recalcula totales automáticamente** al editar
- **Compatibilidad total**: Las cotizaciones antiguas siguen funcionando
- **La base de datos es la fuente de verdad** una vez editada
- Todos los cambios se reflejan en el PDF y en el email enviado

### 🔒 Seguridad
- Helmet para protección HTTP
- Rate limiting en endpoints
- Validación de entrada robusta
- CORS configurado
- JWT para links públicos

## 🛠️ Stack Tecnológico

### Backend
- **Node.js** 18+ con Express
- **TypeScript** para type safety
- **PostgreSQL** para persistencia
- **OpenAI SDK** para generación con IA
- **PDFKit** para generación de PDFs
- **Nodemailer** para envío de emails
- **JWT** para links firmados
- **Ajv** para validación JSON Schema

### Frontend
- **Angular 17** con componentes standalone
- **TypeScript** para type safety
- **Diseño responsive** con CSS moderno
- **Locale español (México)** para formato de moneda/fecha
- Routing con lazy loading

## 📦 Instalación Rápida (5 minutos)

### Prerrequisitos
- ✅ Node.js 18 o superior
- ✅ PostgreSQL 12+ instalado y corriendo
- ✅ Cuenta de OpenAI (API Key)
- ✅ (Opcional) Credenciales SMTP para envío de emails

### Paso 1: Clonar e Instalar
```bash
# Clonar el repositorio
git clone <tu-repo-url>
cd ProyectoMoney

# Instalar dependencias del backend
cd backend
npm install

# Instalar dependencias del frontend
cd ../frontend
npm install
```

### Paso 2: Configurar Base de Datos
```bash
# Crear la base de datos PostgreSQL
createdb autoquote

# O usando psql:
psql -U postgres -c "CREATE DATABASE autoquote;"
```

### Paso 3: Configurar Variables de Entorno
```bash
# Copiar el archivo de ejemplo
cd backend
cp _env.example .env

# Editar .env con tus credenciales
nano .env  # o usa tu editor preferido
```

**Configuración mínima requerida:**
```env
# OpenAI (OBLIGATORIO)
OPENAI_API_KEY=sk-tu-api-key-aqui

# Base de datos (OBLIGATORIO)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=autoquote
DB_USER=postgres
DB_PASS=tu_password

# Servidor
PORT=3000
NODE_ENV=development

# Frontend URLs
FRONTEND_URL=http://localhost:4200
FRONTEND_PUBLIC_URL=http://localhost:4200

# Personalización (opcional, tiene valores por defecto)
APP_NAME="AutoQuote"
APP_PRIMARY_COLOR="#2563eb"
COMPANY_NAME="Tu Empresa S.A. de C.V."
DEFAULT_TAX_PERCENT=16

# JWT Secret (cambiar en producción)
JWT_SECRET=tu_secret_super_seguro_aqui

# Email (OPCIONAL - funciona en modo demo sin esto)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=tu-email@gmail.com
SMTP_PASS=tu-app-password
```

### Paso 4: Ejecutar Migraciones
```bash
cd backend
npm run setup-db
# Esto crea las tablas automáticamente
```

### Paso 5: (Opcional) Datos de Ejemplo
```bash
cd backend
npm run seed:demo
# Inserta 2-3 cotizaciones de ejemplo para probar
```

### Paso 6: Iniciar la Aplicación

**Opción A: Desarrollo (recomendado para empezar)**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm start
```

**Opción B: Scripts npm en la raíz (si existen)**
```bash
npm run dev  # Inicia ambos servicios
```

### Paso 7: Acceder
- **Frontend**: http://localhost:4200
- **Backend API**: http://localhost:3000/api

## 🎨 Personalización

### Cambiar Branding
Edita el archivo `backend/.env`:

```env
# Nombre de la aplicación (aparece en PDFs y emails)
APP_NAME="Mi Empresa"

# Color primario (hex)
APP_PRIMARY_COLOR="#0F766E"

# Nombre de la empresa
COMPANY_NAME="Mi Empresa S.A. de C.V."

# Porcentaje de impuesto por defecto
DEFAULT_TAX_PERCENT=16
```

### Cambiar Modelo de IA
```env
OPENAI_MODEL=gpt-4o-mini  # o gpt-3.5-turbo, gpt-4, etc.
```

### Configurar Email
**Para Gmail:**
1. Activa la verificación en 2 pasos
2. Genera una "Contraseña de aplicación" en tu cuenta de Google
3. Usa esa contraseña en `SMTP_PASS`

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=tu-email@gmail.com
SMTP_PASS=tu-app-password-de-16-caracteres
```

**Nota**: Si no configuras SMTP, la app funciona en modo demo (no envía emails reales, pero el resto funciona perfectamente).

## 📡 API Endpoints

### Cotizaciones
- `POST /api/generate-quote` - Generar nueva cotización con IA
- `GET /api/quotes` - Obtener todas las cotizaciones
- `GET /api/quotes/:id` - Obtener cotización específica
- `GET /api/quotes/:id/pdf` - Descargar PDF de cotización
- `POST /api/quotes/:id/send-email` - Enviar cotización por email
- `POST /api/quotes/:id/mark-sent` - Marcar como enviada
- `POST /api/quotes/:id/accept` - Marcar como aceptada

### Público
- `GET /api/quotes/view/:token` - Ver cotización con token JWT (sin login)

### Utilidades
- `GET /api/config` - Obtener configuración pública de la app
- `GET /api/email/test` - Probar conexión SMTP

### Billing (Paddle)
- `POST /api/billing/create-checkout-session` - Crea sesión de checkout (Paddle)
- `POST /api/billing/webhook` - Webhook seguro de Paddle (firma + idempotencia)
- `GET /api/billing/subscription` - Obtiene la suscripción actual (demo)
- `POST /api/billing/cancel` - Cancela la suscripción actual

### Ejemplo de Generación
```bash
curl -X POST http://localhost:3000/api/generate-quote \
  -H "Content-Type: application/json" \
  -d '{
    "clientName": "Juan Pérez",
    "clientEmail": "juan@example.com",
    "projectDescription": "Sitio web corporativo con e-commerce",
    "priceRange": "50000 - 80000"
  }'
```

## 📁 Estructura del Proyecto

```
ProyectoMoney/
├── backend/
│   ├── src/
│   │   ├── migrations/       # Migraciones de BD
│   │   ├── routes/           # Rutas de API
│   │   ├── services/         # Servicios (IA, etc.)
│   │   ├── utils/            # Utilidades (PDF, email, etc.)
│   │   ├── models/           # Modelos de datos
│   │   ├── schemas/          # JSON Schemas para validación
│   │   └── server.ts         # Servidor principal
│   ├── dist/                 # Código compilado
│   ├── _env.example          # Plantilla de variables de entorno
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/   # Componentes Angular
│   │   │   ├── services/     # Servicios Angular
│   │   │   └── app.component.ts
│   │   └── main.ts
│   └── package.json
└── README.md
```

## 🚀 Uso Básico

1. **Generar Cotización**
   - Completa el formulario en el frontend
   - La IA generará items, precios y términos automáticamente
   - Revisa y ajusta si es necesario

2. **Descargar PDF**
   - Haz clic en "Descargar PDF" en el visor de cotización
   - El PDF se generará con tu branding personalizado

3. **Enviar por Email**
   - Haz clic en "Enviar por Email"
   - El cliente recibirá el PDF adjunto y un enlace para ver online
   - El estado cambiará automáticamente a "enviada"

4. **Gestionar Historial**
   - Ve al "Historial de Cotizaciones"
   - Busca por cliente, folio o descripción
   - Filtra por estado
   - Descarga PDFs o reenvía emails

## 🧪 Testing

### Modo Demo (Sin SMTP)
La aplicación funciona completamente sin configuración de email:
- Los PDFs se generan normalmente
- El endpoint de email responde con éxito (pero no envía realmente)
- Puedes probar todo el flujo sin credenciales SMTP

### Probar Generación de Cotización
```bash
# 1. Asegúrate de tener OPENAI_API_KEY configurado
# 2. Inicia el backend: cd backend && npm run dev
# 3. Ve al frontend: http://localhost:4200
# 4. Completa el formulario y genera una cotización
```

### Probar Conexión SMTP
```bash
curl http://localhost:3000/api/email/test
# Responde con éxito si SMTP está configurado correctamente
```

## 🔧 Troubleshooting

### Error: "Falta OPENAI_API_KEY"
- Verifica que el archivo `.env` existe en `backend/`
- Asegúrate de que la variable está correctamente escrita (sin espacios)

### Error de conexión a PostgreSQL
- Verifica que PostgreSQL está corriendo: `pg_isready`
- Confirma credenciales en `.env`
- Intenta crear la BD manualmente: `createdb autoquote`

### PDF no se genera
- Verifica logs del backend
- Asegúrate de que la carpeta `uploads/` tiene permisos de escritura

### Email no se envía
- Si no configuraste SMTP, esto es normal (modo demo)
- Si configuraste SMTP, verifica credenciales
- Para Gmail, usa "Contraseña de aplicación" (no tu contraseña normal)

## 📝 Scripts Disponibles

### Backend
- `npm run dev` - Modo desarrollo con nodemon
- `npm run build` - Compilar TypeScript
- `npm run start` - Ejecutar versión compilada
- `npm run setup-db` - Crear tablas de BD
- `npm run seed:demo` - Insertar datos de ejemplo

### Frontend
- `npm start` - Servidor de desarrollo (puerto 4200)
- `npm run build` - Build de producción

## 📄 Licencia

MIT License - ver archivo `LICENSE` para más detalles.

## 💡 Soporte

Para preguntas, problemas o mejoras:
- Abre un issue en el repositorio
- Consulta la documentación en `DEPLOY.md` para instrucciones de despliegue

## 🎉 Características Avanzadas

- ✅ **Validación con JSON Schema**: Garantiza estructura correcta de respuestas de IA
- ✅ **Fallback seguro**: Si la IA falla, genera cotización básica automáticamente
- ✅ **Folios incrementales**: Sistema automático de numeración por año
- ✅ **Links firmados**: Enlaces públicos seguros con JWT para clientes
- ✅ **Estados de cotización**: Draft → Sent → Accepted → Expired
- ✅ **Búsqueda y filtros**: Encuentra cotizaciones rápidamente
- ✅ **Vista pública responsive**: Los clientes pueden ver y aceptar cotizaciones online

---

**Desarrollado con ❤️ para automatizar tu proceso de cotización**

---

### Modo demo confirmado
Probado sin claves externas: generación de cotizaciones y flujo completo OK.

### Changelog
Ver `docs/CHANGELOG.md`.

### Versión
1.0.0
