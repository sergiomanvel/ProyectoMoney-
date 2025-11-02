# 🚂 Guía: Migrar datos de pgAdmin a Railway

Esta guía te ayudará a **exportar tus datos de pgAdmin** y **desplegarlos en Railway** sin perder nada.

---

## 📋 Paso 1: Preparar Archivo .env Local

Primero necesitas crear un archivo de configuración para que los scripts funcionen:

```bash
# Navega a la carpeta backend
cd backend

# Copia el archivo de ejemplo
copy _env.example .env
```

Luego edita `backend/.env` y asegúrate de tener tus credenciales correctas:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=autoquote
DB_USER=postgres
DB_PASS=9890
```

---

## 📦 Paso 2: Exportar Datos desde pgAdmin

### Opción A: Exportar usando pgAdmin (Visual)

1. Abre **pgAdmin** y conecta a tu base de datos `autoquote`
2. Click derecho en la tabla **"quotes"**
3. Selecciona **"Backup..."**
4. Configura:
   - **Format:** `Plain`
   - **Encoding:** `UTF8`
   - **File:** `C:\Users\TuUsuario\Documents\quotes-backup.sql`
5. Click en **"Backup"**
6. Repite el proceso para la tabla **"quote_items"** (si existe)

### Opción B: Exportar usando Script Node.js

Ejecuta el script automatizado:

```bash
# Desde la raíz del proyecto
node export-db-to-railway.js
```

Esto generará archivos SQL listos para importar.

---

## 🚂 Paso 3: Crear Proyecto en Railway

1. Ve a **[railway.app](https://railway.app)** e inicia sesión
2. Click en **"New Project"**
3. Selecciona **"Deploy from GitHub repo"** (recomendado)
   - O **"Empty Project"** si prefieres subir archivos manualmente

---

## 🗄️ Paso 4: Añadir Base de Datos PostgreSQL

1. En tu proyecto Railway, click en **"+ New"**
2. Selecciona **"Database"** → **"Add PostgreSQL"**
3. Railway creará automáticamente una base de datos PostgreSQL

**IMPORTANTE:** Guarda estas variables de entorno que Railway genera:

```
DATABASE_URL=postgresql://postgres:PSQGBLMBQXLOmcNyLWzBNuPzLWzpg0yT@switchback.proxy.rlwy.net:47831/railway
PGHOST=switchback.proxy.rlwy.net
PGPORT=47831
PGDATABASE=railway
PGUSER=postgres
PGPASSWORD=PSQGBLMBQXLOmcNyLWzBNuPzLWzpg0yT
```

---

## 📥 Paso 5: Importar Datos a Railway

### Opción A: Usando Railway CLI (Más fácil)

```bash
# Instala Railway CLI
npm install -g @railway/cli

# Inicia sesión
railway login

# Vincula tu proyecto local con Railway
railway link

# Importa los datos
railway connect postgres < railway-migration-complete.sql
```

### Opción B: Usando pgAdmin (Recomendado si prefieres visual)

1. Abre pgAdmin
2. Agrega un nuevo servidor:
   - **Name:** Railway Database
   - **Host:** `switchback.proxy.rlwy.net`
   - **Port:** `47831`
   - **Database:** `railway`
   - **Username:** `postgres`
   - **Password:** `PSQGBLMBQXLOmcNyLWzBNuPzLWzpg0yT`
3. Conecta al servidor
4. Click derecho en la base de datos **"railway"** → **"Restore..."**
5. Selecciona tu archivo `.sql` de backup
6. Click en **"Restore"**

### Opción C: Usando psql en terminal

```bash
psql postgresql://postgres:PSQGBLMBQXLOmcNyLWzBNuPzLWzpg0yT@switchback.proxy.rlwy.net:47831/railway < railway-migration-complete.sql
```

---

## ⚙️ Paso 6: Configurar Variables de Entorno en Railway

En tu proyecto de Railway, ve a **Settings** → **Variables** y añade:

### Base de Datos (Extrae de Railway)

```env
DB_HOST=switchback.proxy.rlwy.net
DB_PORT=47831
DB_NAME=railway
DB_USER=postgres
DB_PASS=PSQGBLMBQXLOmcNyLWzBNuPzLWzpg0yT
```

### OpenAI

```env
OPENAI_API_KEY=sk-tu-clave-real-de-openai
OPENAI_MODEL=gpt-4o-mini
```

### Email (Gmail)

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=sergioyawara@gmail.com
SMTP_PASS=tu-app-password-gmail
```

### Servidor y URLs

```env
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://tu-frontend.up.railway.app
FRONTEND_PUBLIC_URL=https://tu-frontend.up.railway.app
JWT_SECRET=cambiar-esta-clave-secreta-en-produccion
DEMO_MODE=false
```

### Branding

```env
APP_NAME=AutoQuote
APP_PRIMARY_COLOR=#2563eb
COMPANY_NAME=Tu Empresa S.A. de C.V.
DEFAULT_TAX_PERCENT=16
```

---

## 🚀 Paso 7: Desplegar Backend

### 7.1 Configurar Build

En Railway, para tu servicio Backend, configura:

**Root Directory:**
```
backend
```

**Build Command:**
```bash
npm install && npm run build
```

**Start Command:**
```bash
npm start
```

**Watch Patterns:**
```
backend/**
```

---

## 🎨 Paso 8: Desplegar Frontend

### Opción A: Angular en Railway

**Root Directory:**
```
frontend
```

**Build Command:**
```bash
npm install && npm run build -- --configuration production
```

**Start Command:**
```bash
npx http-server -p $PORT dist/autoquote
```

**Instala http-server:**
Edita `frontend/package.json`:
```json
{
  "dependencies": {
    "http-server": "^14.1.1"
  }
}
```

### Opción B: Frontend en Vercel (Recomendado)

Angular funciona mejor en Vercel:

1. Ve a **[vercel.com](https://vercel.com)** y conecta tu repo
2. **Framework Preset:** Angular
3. **Build Command:** `cd frontend && npm run build -- --configuration production`
4. **Output Directory:** `frontend/dist/autoquote`
5. Añade variable de entorno:
   ```env
   VITE_API_URL=https://tu-backend.up.railway.app
   ```

---

## ✅ Paso 9: Verificar

### 9.1 Verificar Backend

```bash
curl https://tu-backend.up.railway.app/api/quotes
```

Deberías ver tu lista de cotizaciones.

### 9.2 Verificar Base de Datos en Railway

En Railway → PostgreSQL → **"Query"**:

```sql
SELECT COUNT(*) FROM quotes;
SELECT COUNT(*) FROM quote_items;
```

Deberías ver los mismos números que en tu base local.

### 9.3 Verificar Frontend

Abre tu URL del frontend y prueba:
- ✅ Ver cotizaciones
- ✅ Generar nueva cotización
- ✅ Descargar PDF
- ✅ Enviar email

---

## 🆘 Troubleshooting

### Error: "Cannot find module"

**Solución:** Verifica el Root Directory en Railway está configurado correctamente.

### Error: "Database connection failed"

**Solución:** Revisa que todas las variables de entorno de base de datos estén correctas.

### Error: "No data imported"

**Solución:** Verifica que el archivo SQL tenga el formato correcto y que esté ejecutado completo.

---

## 📝 Checklist Final

- [ ] Datos exportados desde pgAdmin
- [ ] Proyecto creado en Railway
- [ ] PostgreSQL añadido como servicio
- [ ] Datos importados en Railway
- [ ] Variables de entorno configuradas
- [ ] Backend desplegado y funcionando
- [ ] Frontend desplegado
- [ ] Datos verificados (mismas cantidades)
- [ ] PDFs generándose
- [ ] Emails enviándose

---

**¡Listo! 🎉 AutoQuote está desplegado en Railway con todos tus datos.**

