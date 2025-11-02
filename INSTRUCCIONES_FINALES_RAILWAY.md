# 🎯 Instrucciones Finales: Migrar a Railway

Perfecto, ya tienes tu base de datos configurada en Railway. Ahora necesitas **extraer tus datos locales** y **importarlos** a Railway.

---

## 🔍 Paso 1: Identificar tu base de datos local

Según la imagen que compartiste, tu `.env` de Railway ya está configurado. Necesitas identificar tu base de datos LOCAL en pgAdmin.

### Opción A: Ya tienes datos en Railway

Si ya exportaste los datos anteriormente, solo necesitas verificar que todo funcione:

```bash
# En Railway → PostgreSQL → Query
SELECT COUNT(*) FROM quotes;
```

### Opción B: Necesitas exportar desde pgAdmin

Si tus datos están en pgAdmin local (localhost), sigue estos pasos:

---

## 📦 Paso 2: Exportar desde pgAdmin (Si tus datos están en localhost)

### 2.1 Identificar tu base de datos local

1. Abre **pgAdmin**
2. Verifica qué servidor estás usando:
   - Servidor local: `localhost` o `127.0.0.1`
   - Puerto: generalmente `5432`
   - Base de datos: podría ser `autoquote`, `postgres` u otra

### 2.2 Crear archivo `.env` para conectar a LOCAL

**IMPORTANTE:** Necesitas DOS archivos `.env`:
1. Uno para LOCAL (conecta a pgAdmin)
2. Uno para Railway (ya lo tienes)

**Crea un archivo temporal `backend/.env.local`:**

```env
# Base de datos LOCAL (pgAdmin)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=autoquote
DB_USER=postgres
DB_PASS=tu_contraseña_local
```

### 2.3 Modificar el script de exportación

Edita `backend/export-to-railway.js` temporalmente:

```javascript
// Cambiar línea 10
require('dotenv').config({ path: '.env.local' });
```

### 2.4 Ejecutar exportación

```bash
cd backend
node export-to-railway.js
```

Esto creará los archivos SQL con tus datos.

### 2.5 Restaurar configuración original

Vuelve a cambiar `export-to-railway.js` a `.env` normal y resguarda tu `.env` de Railway.

---

## 🚂 Paso 3: Importar datos a Railway

### Opción A: Usando Railway Dashboard

1. Ve a **Railway** → **PostgreSQL** → **"Query"** (o "Connect")
2. Copia el contenido de `railway-import-complete.sql`
3. Pégalo y ejecuta

### Opción B: Usando psql localmente

```bash
# Usa tu DATABASE_URL de Railway
psql postgresql://postgres:PSQGBLMBQXLOmcNyLWzBNuPzLWzpg0yT@switchback.proxy.rlwy.net:47831/railway < railway-import-complete.sql
```

### Opción C: Usando pgAdmin (Recomendado si prefieres visual)

1. En pgAdmin, agrega un nuevo servidor:
   ```
   Name: Railway Production
   Host: switchback.proxy.rlwy.net
   Port: 47831
   Database: railway
   Username: postgres
   Password: PSQGBLMBQXLOmcNyLWzBNuPzLWzpg0yT
   ```

2. Click derecho en la base de datos **"railway"**
3. Selecciona **"Restore..."** o **"Query Tool"**
4. Si usas Restore: selecciona tu archivo `.sql`
5. Si usas Query: copia y pega el contenido

---

## 🎯 Alternativa Rápida: Solo Crear Tablas

Si prefieres empezar desde cero y tus datos locales ya están en Railway, simplemente ejecuta:

```sql
-- En Railway → PostgreSQL → Query
-- Ejecuta railway-migration-complete.sql

-- Esto creará las tablas vacías
-- Tus datos locales ya deberían estar allí
```

---

## ✅ Verificar Importación

```sql
-- Verificar registros
SELECT COUNT(*) FROM quotes;
SELECT COUNT(*) FROM quote_items;

-- Ver última cotización
SELECT * FROM quotes ORDER BY created_at DESC LIMIT 5;

-- Verificar estructura
\d quotes
\d quote_items
```

---

## 📝 Checklist Final

- [ ] Datos exportados de pgAdmin local
- [ ] Archivo `railway-import-complete.sql` generado
- [ ] Tablas creadas en Railway
- [ ] Datos importados en Railway
- [ ] Verificación exitosa de registros
- [ ] Backend configurado con variables de Railway
- [ ] Frontend desplegado
- [ ] Todo funcionando en producción

---

## 🆘 Si algo falla

### Error: "Cannot connect to database"

**Solución:** Verifica que `.env` tenga las credenciales de Railway:

```env
DB_HOST=switchback.proxy.rlwy.net
DB_PORT=47831
DB_NAME=railway
DB_USER=postgres
DB_PASS=PSQGBLMBQXLOmcNyLWzBNuPzLWzpg0yT
```

### Error: "Table already exists"

**Solución:** Usa `DROP TABLE` primero o usa los comandos con `IF NOT EXISTS`.

### Error: "Permission denied"

**Solución:** Verifica que uses el usuario `postgres` correcto.

---

**¡Todo listo! 🎉** Sigue la guía `GUIA_RAILWAY_PGADMIN.md` para el resto del despliegue.

