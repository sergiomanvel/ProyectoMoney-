# 📦 Migrar Datos de pgAdmin a Railway

Ya tienes las tablas creadas en Railway. Ahora necesitas **exportar tus datos locales** y **importarlos** a Railway.

## 🎯 Paso 1: Exportar desde pgAdmin

### Opción A: Usando pgAdmin (Más fácil)

1. Abre **pgAdmin**
2. Conecta a tu base de datos **local** (localhost)
3. Expande: **Databases** → **autoquote** → **Schemas** → **public** → **Tables**
4. Click derecho en **quotes** → **Backup...**
5. Configura:
   - **Format:** `Plain`
   - **Filename:** `quotes-backup.sql`
   - **Encoding:** `UTF8`
6. Click en **"Backup"**
7. Repite para **quote_items** (si tienes datos allí)

### Opción B: Usando Query Tool en pgAdmin

1. Click derecho en **quotes** → **View/Edit Data** → **All Rows**
2. Click en **Download/Export**
3. Selecciona **"SQL INSERT statements"**
4. Guarda como archivo

### Opción C: Usando psql (si tienes psql instalado)

```bash
# Windows
pg_dump -h localhost -U postgres -d autoquote -t quotes --data-only --column-inserts > quotes-data.sql
pg_dump -h localhost -U postgres -d autoquote -t quote_items --data-only --column-inserts > items-data.sql
```

---

## 🚂 Paso 2: Importar a Railway

### Opción A: Usando pgAdmin (Recomendado)

1. Abre pgAdmin
2. Agrega un nuevo servidor:
   ```
   Name: Railway Production
   Host: switchback.proxy.rlwy.net
   Port: 47831
   Database: railway
   Username: postgres
   Password: PSQGBLMBQXLOmcNyLWzBNuPzLWzpgOyT
   ```

3. Expande: **railway** → **Schemas** → **public** → **Tables**
4. Click derecho en **quotes** → **Restore...**
5. Selecciona tu archivo `quotes-backup.sql`
6. Configura: **Plain SQL** y click **Restore**
7. Espera a que termine
8. Repite para **quote_items**

### Opción B: Usando el Script Node.js

1. Copia tus datos SQL a un archivo `railway-data.sql`
2. Ejecuta:

```bash
node backend/import-data-railway.js railway-data.sql
```

(Necesitamos crear este script)

### Opción C: Usando Railway Dashboard

1. Ve a **Railway** → Tu proyecto → **PostgreSQL**
2. Click en **"Query"** o **"Connect"**
3. Abre el editor SQL
4. Copia y pega tu SQL exportado
5. Ejecuta

---

## ✅ Paso 3: Verificar

Después de importar, verifica:

```sql
-- En Railway PostgreSQL → Query
SELECT COUNT(*) FROM quotes;
SELECT COUNT(*) FROM quote_items;

-- Ver últimas cotizaciones
SELECT id, client_name, created_at FROM quotes ORDER BY created_at DESC LIMIT 5;
```

Si ves tus registros, ¡listo! 🎉

---

## 🔍 ¿Dónde están tus datos?

Si no sabes dónde están tus datos locales, verifica:

### Verificar conexión local

```bash
# En pgAdmin, conecta a:
# - Host: localhost
# - Port: 5432
# - Database: autoquote (o la que uses)
# - Username: postgres
# - Password: tu contraseña local

# Luego ejecuta:
SELECT COUNT(*) FROM quotes;
```

Si tienes datos allí, expórtalos usando la Opción A de arriba.

---

## 🆘 Problemas Comunes

### "No puedo conectar a Railway desde pgAdmin"

**Solución:** Verifica:
- Host: `switchback.proxy.rlwy.net` (correcto ✅)
- Port: `47831` (correcto ✅)
- Password: `PSQGBLMBQXLOmcNyLWzBNuPzLWzpgOyT` (verifica que sea correcto)

### "Las tablas no existen"

Ya las creamos. Verifica:
```bash
node backend/test-railway-connection.js
```

### "No tengo datos locales"

Si no tienes datos locales pero querías migrar, entonces:
1. Ya está todo listo en Railway ✅
2. Puedes empezar a usar la app directamente
3. Las nuevas cotizaciones se guardarán en Railway

---

¿Dónde están tus datos actualmente?
- pgAdmin localhost ✅ → Sigue Opción A
- Ya están en Railway ✅ → No necesitas hacer nada
- No tienes datos aún ✅ → Puedes empezar a usar la app

