# 🚀 Guía de Despliegue - AutoQuote

Esta guía te ayudará a desplegar AutoQuote en diferentes plataformas de producción.

## 📋 Tabla de Contenidos

- [Preparación General](#preparación-general)
- [Despliegue en VPS (Ubuntu/Debian)](#despliegue-en-vps-ubuntudebian)
- [Despliegue en Railway](#despliegue-en-railway)
- [Despliegue en Render](#despliegue-en-render)
- [Despliegue en Heroku](#despliegue-en-heroku)
- [Configuración de Dominio](#configuración-de-dominio)
- [Post-Despliegue](#post-despliegue)

---

## 🔧 Preparación General

### 1. Compilar el Backend

```bash
cd backend
npm install
npm run build
# Esto genera la carpeta dist/ con el código compilado
```

### 2. Compilar el Frontend

```bash
cd frontend
npm install
npm run build
# Esto genera la carpeta dist/ con los archivos estáticos
```

### 3. Variables de Entorno para Producción

Asegúrate de configurar estas variables en tu plataforma de despliegue:

```env
# OpenAI (OBLIGATORIO)
OPENAI_API_KEY=sk-tu-api-key-produccion

# Base de datos PostgreSQL (OBLIGATORIO)
DB_HOST=tu-host-postgres
DB_PORT=5432
DB_NAME=autoquote
DB_USER=tu_usuario
DB_PASS=tu_password_seguro

# Servidor
PORT=3000
NODE_ENV=production

# URLs Públicas (importante para CORS y links)
FRONTEND_URL=https://tu-dominio.com
FRONTEND_PUBLIC_URL=https://tu-dominio.com

# Personalización
APP_NAME="Mi Empresa"
APP_PRIMARY_COLOR="#2563eb"
COMPANY_NAME="Mi Empresa S.A. de C.V."
DEFAULT_TAX_PERCENT=16

# JWT Secret (CAMBIAR EN PRODUCCIÓN - usa un string largo y aleatorio)
JWT_SECRET=tu_secret_super_seguro_de_al_menos_32_caracteres

# Email SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=tu-email@gmail.com
SMTP_PASS=tu-app-password
```

---

## 🖥️ Despliegue en VPS (Ubuntu/Debian)

### Prerrequisitos

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Instalar PM2 (gestor de procesos)
sudo npm install -g pm2

# Instalar Nginx (proxy reverso)
sudo apt install nginx -y
```

### Paso 1: Configurar PostgreSQL

```bash
# Crear usuario y base de datos
sudo -u postgres psql

# En psql:
CREATE DATABASE autoquote;
CREATE USER autoquote_user WITH ENCRYPTED PASSWORD 'tu_password_seguro';
GRANT ALL PRIVILEGES ON DATABASE autoquote TO autoquote_user;
\q
```

### Paso 2: Desplegar Backend

```bash
# Clonar tu repositorio
git clone <tu-repo> /opt/autoquote
cd /opt/autoquote/backend

# Instalar dependencias
npm install --production

# Compilar
npm run build

# Crear archivo .env
nano .env
# Pegar variables de entorno de producción

# Ejecutar migraciones
npm run setup-db

# Iniciar con PM2
pm2 start dist/server.js --name autoquote-backend
pm2 save
pm2 startup  # Seguir instrucciones
```

### Paso 3: Desplegar Frontend

```bash
cd /opt/autoquote/frontend

# Instalar dependencias
npm install

# Build de producción
npm run build

# Los archivos estarán en dist/autoquote/
```

### Paso 4: Configurar Nginx

```bash
sudo nano /etc/nginx/sites-available/autoquote
```

**Configuración Nginx:**
```nginx
# Backend API
upstream backend {
    server localhost:3000;
}

server {
    listen 80;
    server_name api.tu-dominio.com;

    location / {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Frontend
server {
    listen 80;
    server_name tu-dominio.com www.tu-dominio.com;
    root /opt/autoquote/frontend/dist/autoquote;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Activar sitio
sudo ln -s /etc/nginx/sites-available/autoquote /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Paso 5: SSL con Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com
```

---

## 🚂 Despliegue en Railway

### Paso 1: Preparar Proyecto

1. Conecta tu repositorio GitHub a Railway
2. Crea un proyecto nuevo

### Paso 2: Desplegar Backend

1. Añade un servicio nuevo
2. Selecciona el repositorio
3. **Root Directory**: `backend`
4. **Start Command**: `npm start`
5. **Build Command**: `npm run build && npm run setup-db`

### Paso 3: Variables de Entorno

En la configuración del servicio backend, añade todas las variables de `.env`:

```
OPENAI_API_KEY=...
DB_HOST=...
DB_USER=...
DB_PASS=...
# etc.
```

### Paso 4: Base de Datos PostgreSQL

1. Añade un servicio PostgreSQL en Railway
2. Railway genera automáticamente variables como:
   - `PGHOST`
   - `PGPORT`
   - `PGDATABASE`
   - `PGUSER`
   - `PGPASSWORD`

3. Ajusta tu código o variables de entorno para usar estas variables

**Opción: Script de adaptación**

Si Railway usa variables `PG*` en lugar de `DB_*`, crea un script `adapt-env.js`:

```javascript
// backend/adapt-env.js
if (process.env.PGHOST) {
  process.env.DB_HOST = process.env.PGHOST;
  process.env.DB_PORT = process.env.PGPORT || '5432';
  process.env.DB_NAME = process.env.PGDATABASE;
  process.env.DB_USER = process.env.PGUSER;
  process.env.DB_PASS = process.env.PGPASSWORD;
}
```

### Paso 5: Desplegar Frontend

1. Añade otro servicio para el frontend
2. **Root Directory**: `frontend`
3. **Build Command**: `npm run build`
4. **Output Directory**: `dist/autoquote`

O usa **Railway Static** para servir archivos estáticos.

### Paso 6: Dominios

Railway asigna URLs automáticamente. Puedes añadir dominios custom en la configuración.

---

## 🌐 Despliegue en Render

### Paso 1: Backend

1. Nuevo **Web Service**
2. Conecta tu repositorio
3. **Root Directory**: `backend`
4. **Build Command**: `npm install && npm run build && npm run setup-db`
5. **Start Command**: `npm start`
6. **Environment**: `Node`

### Paso 2: Base de Datos

1. Crea un **PostgreSQL** en Render
2. Copia las credenciales de conexión
3. Añádelas como variables de entorno en el Web Service

### Paso 3: Variables de Entorno

En el Web Service, añade todas las variables necesarias desde el panel de configuración.

### Paso 4: Frontend

1. Crea un **Static Site**
2. **Root Directory**: `frontend`
3. **Build Command**: `npm install && npm run build`
4. **Publish Directory**: `dist/autoquote`

**Nota**: Para que el frontend acceda al backend API, necesitarás configurar el proxy o usar variables de entorno en Angular.

### Configurar API URL en Frontend

En `frontend/src/environments/environment.prod.ts`:

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://tu-backend.onrender.com/api'
};
```

---

## ⚡ Despliegue en Heroku

### Paso 1: Instalar Heroku CLI

```bash
# macOS
brew install heroku/brew/heroku

# Windows/Linux
# Descargar desde https://devcenter.heroku.com/articles/heroku-cli
```

### Paso 2: Login

```bash
heroku login
```

### Paso 3: Crear App Backend

```bash
cd backend
heroku create autoquote-backend
heroku addons:create heroku-postgresql:hobby-dev
```

### Paso 4: Configurar Variables

```bash
heroku config:set OPENAI_API_KEY=sk-tu-key
heroku config:set NODE_ENV=production
heroku config:set FRONTEND_URL=https://tu-frontend.herokuapp.com
heroku config:set FRONTEND_PUBLIC_URL=https://tu-frontend.herokuapp.com
# ... añadir todas las variables necesarias
```

### Paso 5: Desplegar Backend

```bash
# Asegúrate de tener el Procfile en backend/
echo "web: node dist/server.js" > Procfile

git init
git add .
git commit -m "Initial commit"
git push heroku main
```

### Paso 6: Ejecutar Migraciones

```bash
heroku run npm run setup-db
```

### Paso 7: Frontend

El frontend se puede desplegar en:
- **Heroku** (con buildpack estático)
- **Netlify**
- **Vercel** (recomendado)

**Para Vercel:**

```bash
npm i -g vercel
cd frontend
vercel
# Seguir instrucciones
```

---

## 🌍 Configuración de Dominio

### DNS

Configura estos registros en tu proveedor DNS:

```
A     @      → IP_de_tu_servidor (si es VPS)
CNAME api    → api.tu-dominio.com (si separas backend)
CNAME www    → tu-dominio.com
```

### Nginx con Subdominio para API

```nginx
# API en subdominio
server {
    listen 80;
    server_name api.tu-dominio.com;
    
    location / {
        proxy_pass http://localhost:3000;
        # ... resto de configuración proxy
    }
}

# Frontend en dominio principal
server {
    listen 80;
    server_name tu-dominio.com;
    root /ruta/al/frontend/dist;
    # ... configuración frontend
}
```

---

## ✅ Post-Despliegue

### Verificaciones

1. **API funciona:**
   ```bash
   curl https://api.tu-dominio.com/api/config
   ```

2. **Base de datos conectada:**
   ```bash
   # En el servidor
   pm2 logs autoquote-backend
   # Buscar mensajes de conexión exitosa
   ```

3. **Frontend carga:**
   - Abre https://tu-dominio.com
   - Verifica que no hay errores en consola del navegador

4. **Generar cotización de prueba:**
   - Completa el formulario
   - Verifica que se genera el PDF
   - Prueba descargar

### Monitoreo

**PM2 (si usas VPS):**
```bash
pm2 monit
pm2 logs
```

**Variables de entorno actualizadas:**
```bash
# Verificar que todas las variables están configuradas
pm2 env autoquote-backend
```

### Mantenimiento

**Actualizar aplicación:**
```bash
cd /opt/autoquote
git pull
cd backend && npm install && npm run build
pm2 restart autoquote-backend
cd ../frontend && npm install && npm run build
sudo systemctl restart nginx
```

**Backups de BD:**
```bash
# Backup diario (crear cron job)
pg_dump -U autoquote_user autoquote > backup_$(date +%Y%m%d).sql
```

---

## 🔒 Seguridad en Producción

1. **JWT_SECRET**: Usa un string largo y aleatorio
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **HTTPS**: Siempre usa SSL/TLS en producción

3. **Variables sensibles**: Nunca las subas a Git

4. **Rate Limiting**: Ya está configurado en el backend

5. **CORS**: Verifica que `FRONTEND_URL` está correctamente configurado

6. **Firewall**: En VPS, solo abre puertos necesarios
   ```bash
   sudo ufw allow 22/tcp   # SSH
   sudo ufw allow 80/tcp   # HTTP
   sudo ufw allow 443/tcp  # HTTPS
   sudo ufw enable
   ```

---

## 🐛 Troubleshooting

### Backend no inicia

```bash
# Ver logs
pm2 logs autoquote-backend

# Verificar puerto
netstat -tlnp | grep 3000

# Verificar variables de entorno
pm2 env autoquote-backend
```

### Error de conexión a BD

- Verifica credenciales en `.env`
- Verifica que PostgreSQL está corriendo: `sudo systemctl status postgresql`
- Verifica que la BD existe: `psql -U autoquote_user -d autoquote -c "\dt"`

### Frontend no carga

- Verifica que `npm run build` se ejecutó correctamente
- Verifica que los archivos están en `dist/autoquote/`
- Verifica configuración de Nginx
- Revisa logs de Nginx: `sudo tail -f /var/log/nginx/error.log`

---

## 📞 Recursos Adicionales

- **Railway Docs**: https://docs.railway.app
- **Render Docs**: https://render.com/docs
- **Heroku Docs**: https://devcenter.heroku.com
- **Nginx Docs**: https://nginx.org/en/docs/

---

**¡Listo para producción! 🎉**

Si tienes problemas, verifica los logs y las variables de entorno primero.

