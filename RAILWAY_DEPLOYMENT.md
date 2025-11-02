# 🚂 Guía de Despliegue en Railway para AutoQuote

Esta guía te ayudará a desplegar AutoQuote en Railway **preservando todos tus datos existentes** de la base de datos local.

## 📋 Requisitos Previos

1. ✅ Cuenta en [Railway](https://railway.app)
2. ✅ Datos existentes en tu base de datos local (pgAdmin)
3. ✅ Node.js instalado localmente
4. ✅ PostgreSQL funcionando localmente

---

## 🎯 Paso 1: Exportar Datos Locales

### 1.1 Configura tu archivo `.env` local

Crea un archivo `backend/.env` basado en `backend/_env.example`:

```env
# Database Configuration (local)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=autoquote
DB_USER=postgres
DB_PASS=9890
```

### 1.2 Exporta los datos

```bash
# Desde la raíz del proyecto
cd backend
node ../export-db-to-railway.js
```

Esto creará 3 archivos SQL:
- `railway-export-structure.sql` - Estructura de tablas
- `railway-export-quotes.sql` - Datos de cotizaciones
- `railway-import-complete.sql` - **Archivo consolidado** (este usaremos en Railway)

---

## 🚂 Paso 2: Desplegar en Railway

### 2.1 Crear proyecto en Railway

1. Ve a [railway.app](https://railway.app)
2. Click en **"New Project"**
3. Selecciona **"Deploy from GitHub repo"** (conecta tu repositorio)
   - O usa **"Empty Project"** si prefieres subir manualmente

### 2.2 Añadir servicio PostgreSQL

1. En tu proyecto de Railway, click en **"+ New"**
2. Selecciona **"Database"** → **"Add PostgreSQL"**
3. Railway creará automáticamente una base de datos PostgreSQL
4. **Guarda la URL de conexión** que aparece (ejemplo):
   ```
   postgresql://postgres:PSQGBLMBQXLOmcNyLWzBNuPzLWzpg0yT@switchback.proxy.rlwy.net:47831/railway
   ```

---

## 🗄️ Paso 3: Importar Datos en Railway

### Opción A: Usando Railway CLI (Recomendado)

```bash
# Instala Railway CLI
npm install -g @railway/cli

# Login
railway login

# Selecciona tu proyecto
railway link

# Importa la base de datos
railway connect postgres < railway-import-complete.sql
```

### Opción B: Usando psql localmente

```bash
# Desde tu terminal (usa la URL de Railway)
psql postgresql://postgres:PSQGBLMBQXLOmcNyLWzBNuPzLWzpg0yT@switchback.proxy.rlwy.net:47831/railway < railway-import-complete.sql
```

### Opción C: Usando Railway Dashboard

1. En Railway, ve a tu servicio PostgreSQL
2. Click en **"Query"** o **"Connect"**
3. Copia y pega el contenido de `railway-import-complete.sql`
4. Ejecuta las queries

---

## ⚙️ Paso 4: Configurar Variables de Entorno

En Railway, ve a tu proyecto y añade estas variables de entorno:

### 4.1 Variables de Base de Datos

Railway genera automáticamente estas variables. **Cópialas** de tu servicio PostgreSQL:

- `DATABASE_URL` → Railway lo genera automático
- `PGHOST`
- `PGPORT`
- `PGDATABASE`
- `PGUSER`
- `PGPASSWORD`

**IMPORTANTE:** Tu aplicación usa variables personalizadas. Convierte `DATABASE_URL` a:

```env
# Extrae de DATABASE_URL: postgresql://user:pass@host:port/database
DB_HOST=switchback.proxy.rlwy.net
DB_PORT=47831
DB_NAME=railway
DB_USER=postgres
DB_PASS=PSQGBLMBQXLOmcNyLWzBNuPzLWzpg0yT
```

### 4.2 Variables de OpenAI

```env
OPENAI_API_KEY=sk-tu-clave-openai-aqui
OPENAI_MODEL=gpt-4o-mini
```

### 4.3 Variables de Email

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=sergioyawara@gmail.com
SMTP_PASS=tu-app-password-aqui
```

### 4.4 Variables del Servidor

```env
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://tu-dominio-frontend.railway.app
FRONTEND_PUBLIC_URL=https://tu-dominio-frontend.railway.app
JWT_SECRET=tu-clave-super-secreta-cambiar-en-produccion
DEMO_MODE=false
```

### 4.5 Branding

```env
APP_NAME=AutoQuote
APP_PRIMARY_COLOR=#2563eb
COMPANY_NAME=Tu Empresa S.A. de C.V.
DEFAULT_TAX_PERCENT=16
```

---

## 🚀 Paso 5: Desplegar Backend

### 5.1 Configurar Build Commands

En Railway, para tu servicio Backend, configura:

**Build Command:**
```bash
cd backend && npm install && npm run build
```

**Start Command:**
```bash
cd backend && npm start
```

**Root Directory:**
```
/
```

### 5.2 Configurar Puerto

Railway usa la variable `PORT` automáticamente, pero asegúrate de que en `backend/src/server.ts`:

```typescript
const PORT = process.env.PORT || 3000;
```

---

## 🎨 Paso 6: Desplegar Frontend

### Opción A: Angular en Railway (sin SSR)

**Build Command:**
```bash
cd frontend && npm install && npm run build -- --configuration production
```

**Start Command:**
```bash
cd frontend && npx http-server -p $PORT -c-1 dist/autoquote
```

Instala dependencia: añade a `package.json` del frontend:
```json
{
  "devDependencies": {
    "http-server": "^14.1.1"
  }
}
```

### Opción B: Angular con Vercel/Netlify (Recomendado)

El frontend Angular funciona mejor en Vercel o Netlify. Solo configura:
- **Build command:** `npm run build -- --configuration production`
- **Output directory:** `dist/autoquote`
- **Framework preset:** Angular

---

## 🔗 Paso 7: Configurar Dominios

### Backend (Railway)

1. En Railway, click en **"Settings"** → **"Generate Domain"**
2. Railway generará algo como: `tu-proyecto-backend.up.railway.app`
3. **Copia esta URL** y actualiza `FRONTEND_PUBLIC_URL` en variables de entorno

### Frontend (Vercel/Netlify)

1. Conecta tu repositorio
2. Configura build commands
3. Añade variable de entorno:
   ```env
   VITE_API_URL=https://tu-proyecto-backend.up.railway.app
   ```

---

## ✅ Paso 8: Verificar el Despliegue

### 8.1 Verificar Backend

```bash
curl https://tu-proyecto-backend.up.railway.app/api/quotes
```

Deberías ver tu lista de cotizaciones exportadas.

### 8.2 Verificar Base de Datos

En Railway, ve a tu servicio PostgreSQL → **"Query"**:

```sql
SELECT COUNT(*) FROM quotes;
```

Deberías ver el mismo número de registros que tenías localmente.

### 8.3 Verificar Frontend

Abre tu URL del frontend y prueba:
1. Generar una nueva cotización
2. Ver el historial
3. Descargar PDF
4. Enviar email

---

## 🔍 Troubleshooting

### Error: "Cannot connect to database"

**Solución:** Verifica que las variables de entorno en Railway estén configuradas correctamente:
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASS`

### Error: "Table does not exist"

**Solución:** La migración no se ejecutó. En Railway, ejecuta:
```bash
railway run cd backend && npm run migrate
```

### Error: "Email not sending"

**Solución:** Verifica:
- SMTP credentials correctas
- App Password de Gmail (no la contraseña normal)
- `FRONTEND_PUBLIC_URL` configurada

### Error: Frontend no conecta a Backend

**Solución:** Verifica CORS en `backend/src/server.ts`:
```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:4200'
}));
```

---

## 📊 Estructura Final en Railway

```
Proyecto AutoQuote
├── PostgreSQL Database (Plugin)
│   ├── Variables auto-generadas
│   └── DATABASE_URL
│
└── Backend Service
    ├── Variables de entorno (DB, OpenAI, SMTP, etc.)
    ├── Build: cd backend && npm install && npm run build
    └── Start: cd backend && npm start
```

---

## 🎯 Checklist Final

- [ ] Datos exportados de la base de datos local
- [ ] Proyecto creado en Railway
- [ ] PostgreSQL añadido como servicio
- [ ] Datos importados en Railway PostgreSQL
- [ ] Variables de entorno configuradas
- [ ] Backend desplegado y funcionando
- [ ] Frontend desplegado (Railway/Vercel/Netlify)
- [ ] Dominios configurados
- [ ] CORS configurado correctamente
- [ ] Emails funcionando
- [ ] PDFs generándose correctamente
- [ ] Datos verificados (mismo número de registros)

---

## 🆘 Soporte

Si tienes problemas:
1. Revisa los logs de Railway: Click en tu servicio → **"Logs"**
2. Verifica variables de entorno: Settings → **"Variables"**
3. Revisa la base de datos: PostgreSQL → **"Query"**

---

**¡Felicitaciones! 🎉 AutoQuote está desplegado en Railway con todos tus datos intactos.**

