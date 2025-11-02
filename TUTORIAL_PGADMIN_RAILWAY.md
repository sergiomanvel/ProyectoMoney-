# 📖 Tutorial Detallado: Conectar pgAdmin a Railway y Restaurar Datos

Este tutorial te guiará paso a paso para:
1. Conectar pgAdmin a tu base de datos Railway
2. Restaurar tus datos exportados

---

## 🎯 Paso 1: Abrir pgAdmin

1. Abre **pgAdmin 4** en tu computadora
2. Si te pide contraseña, ingrésala

---

## 🎯 Paso 2: Conectar pgAdmin a Railway

### 2.1 Agregar Nuevo Servidor

1. En el panel izquierdo, busca **"Servers"**
2. Click derecho en **"Servers"** → **"Register"** → **"Server..."**

### 2.2 Configurar General Tab

Se abrirá una ventana. Primera pestaña "**General**":

- **Name:** `Railway Production` (o cualquier nombre que quieras)
- Las demás casillas déjalas vacías

Click en la pestaña **"Connection"**

### 2.3 Configurar Connection Tab

Aquí es donde va la información importante:

| Campo | Valor |
|-------|-------|
| **Host name/address** | `switchback.proxy.rlwy.net` |
| **Port** | `47831` |
| **Maintenance database** | `railway` |
| **Username** | `postgres` |
| **Password** | `PSQGBLMBQXLOmcNyLWzBNuPzLWzpgOyT` |

**IMPORTANTE:** 
- ✅ Marca la casilla **"Save password"** para que no tengas que ingresarla cada vez

### 2.4 Configurar SSL Tab (Opcional pero recomendado)

1. Click en la pestaña **"SSL"**
2. Marca la casilla **"Use SSL/TLS"**
3. En **"Client certificate"** selecciona: **"Allow"**

### 2.5 Guardar Configuración

1. Click en el botón **"Save"** en la parte inferior
2. Espera a que se conecte (puede tardar unos segundos)

---

## ✅ Paso 3: Verificar Conexión

Si todo salió bien:

1. En el panel izquierdo, verás expandirse **"Railway Production"**
2. Expande: **Railway Production** → **Databases** → **railway** → **Schemas** → **public** → **Tables**
3. Deberías ver estas tablas:
   - ✅ `quotes`
   - ✅ `quote_items`

Si ves las tablas, ¡la conexión funciona! 🎉

---

## 📦 Paso 4: Exportar Datos desde Local (Si aún no lo hiciste)

Antes de restaurar, necesitas exportar tus datos locales:

### 4.1 Conectar a Base de Datos Local

Si ya no tienes conexión a localhost:

1. Click derecho en **"Servers"** → **"Register"** → **"Server..."**
2. En **General:**
   - **Name:** `Local`
3. En **Connection:**
   - **Host:** `localhost` (o `127.0.0.1`)
   - **Port:** `5432`
   - **Database:** `autoquote` (o el nombre de tu base de datos local)
   - **Username:** `postgres`
   - **Password:** Tu contraseña local
4. Click **Save**

### 4.2 Exportar Tabla `quotes`

1. Expande: **Local** → **Databases** → **autoquote** → **Schemas** → **public** → **Tables**
2. Click derecho en **`quotes`** → **"Backup..."**
3. Se abrirá una ventana de backup
4. En la pestaña **"General":**
   - **Filename:** Busca un lugar fácil (Escritorio o Documentos) y nombra: `quotes-backup.sql`
   - **Format:** Selecciona **"Plain"**
   - **Encoding:** Selecciona **"UTF8"**
5. En la pestaña **"Data Options":**
   - ✅ Marca **"Use INSERT Commands"** (Importante para que funcione)
   - ✅ Marca **"Include Column Names"** (Recomendado)
6. Click en el botón **"Backup"** en la esquina inferior derecha
7. Espera a que termine (verás un progreso)
8. Cuando diga "Backup completed successfully", click **"Close"**

### 4.3 Exportar Tabla `quote_items` (Si tienes datos)

Repite el mismo proceso pero para la tabla `quote_items`:
- Filename: `items-backup.sql`
- Resto igual

---

## 🚂 Paso 5: Restaurar Datos en Railway

Ahora vamos a cargar esos datos en Railway:

### 5.1 Restaurar Tabla `quotes`

1. En el panel izquierdo, asegúrate de estar conectado a **Railway Production**
2. Expande: **Railway Production** → **Databases** → **railway** → **Schemas** → **public** → **Tables**
3. Click derecho en **`quotes`** → **"Restore..."**
4. Se abrirá una ventana de restore
5. En la pestaña **"General":**
   - **Filename:** Busca y selecciona tu archivo `quotes-backup.sql`
   - **Format:** Debe estar en **"Custom or tar"** o **"Plain"** (ajustará automáticamente)
6. En la pestaña **"Restore Options":**
   - ✅ Marca **"Pre-data"** (creará estructura)
   - ✅ Marca **"Data"** (importará datos)
   - ✅ Marca **"Post-data"** (índices y secuencias)
   - ⚠️ Desmarca **"Clean before restore"** (para no borrar lo que ya existe)
7. Click en el botón **"Restore"** en la esquina inferior derecha
8. Espera a que termine (verás un progreso)
9. Cuando diga "Restore completed successfully", click **"Close"**

### 5.2 Restaurar Tabla `quote_items` (Si exportaste)

Repite el mismo proceso para `items-backup.sql`

---

## ✅ Paso 6: Verificar que los Datos se Importaron

### 6.1 Verificar Número de Registros

1. Click derecho en la tabla **`quotes`** en Railway
2. Selecciona **"View/Edit Data"** → **"All Rows"**
3. Deberías ver tus datos
4. En la parte inferior verás cuántos registros hay

### 6.2 Verificar con Query

1. Click derecho en **railway** → **Query Tool**
2. Escribe:
```sql
SELECT COUNT(*) as total FROM quotes;
```
3. Click en el botón ▶️ o presiona F5
4. Deberías ver el número total de registros

### 6.3 Ver Algunos Registros

```sql
SELECT id, client_name, project_description, created_at 
FROM quotes 
ORDER BY created_at DESC 
LIMIT 10;
```

---

## 🆘 Solución de Problemas

### Error: "Could not connect to server"

**Causa:** Railway rechazó la conexión

**Solución:**
1. Verifica que los datos sean correctos:
   - Host: `switchback.proxy.rlwy.net`
   - Port: `47831`
   - Username: `postgres`
   - Password: `PSQGBLMBQXLOmcNyLWzBNuPzLWzpgOyT`
2. Verifica tu conexión a Internet
3. Espera unos minutos y vuelve a intentar

### Error: "permission denied for table"

**Causa:** No tienes permisos o la tabla no existe

**Solución:**
1. Verifica que las tablas existan: **railway** → **Tables**
2. Si no existen, ejecuta:
   ```bash
   node backend/create-tables-railway.js
   ```

### Error: "duplicate key value violates unique constraint"

**Causa:** Ya hay datos en Railway con esos IDs

**Solución:**
- Opción 1: Borra los datos existentes y vuelve a importar
  ```sql
  TRUNCATE TABLE quotes, quote_items CASCADE;
  ```
- Opción 2: Usa `ON CONFLICT DO NOTHING` en tu SQL

### Error: "syntax error at or near INSERT"

**Causa:** El archivo SQL está corrupto o en formato incorrecto

**Solución:**
1. Re-exporta desde pgAdmin
2. Asegúrate de exportar en formato **"Plain"** con **"INSERT Commands"**

---

## 📸 Capturas de Pantalla de Referencia

### Ventana de Agregar Servidor:
```
┌─────────────────────────────────────────┐
│ Register - Server                       │
├─────────────────────────────────────────┤
│ General | Connection | SSL | Advanced   │
├─────────────────────────────────────────┤
│ Name: Railway Production                │
└─────────────────────────────────────────┘
```

### Ventana de Conexión:
```
┌─────────────────────────────────────────┐
│ Connection                              │
├─────────────────────────────────────────┤
│ Host name/address:                      │
│ [switchback.proxy.rlwy.net]            │
│                                         │
│ Port: [47831]                           │
│ Maintenance database: [railway]         │
│ Username: [postgres]                    │
│ Password: [PSQGBLMBQXLOmcNyLWzBNuPz...] │
│ ☑ Save password                         │
└─────────────────────────────────────────┘
```

---

## ✅ Checklist de Verificación

Después de completar todos los pasos:

- [ ] Conectado a Railway Production en pgAdmin
- [ ] Tablas `quotes` y `quote_items` visibles
- [ ] Datos exportados desde local
- [ ] Archivos `.sql` guardados
- [ ] Datos restaurados en Railway
- [ ] Verificados con COUNT(*)
- [ ] Verificados visualmente con View/Edit Data

---

## 🎉 ¡Completado!

Si llegaste hasta aquí, tienes:
- ✅ Conexión a Railway funcionando
- ✅ Tablas creadas
- ✅ Datos importados
- ✅ Todo listo para usar

**Próximo paso:** Desplegar tu aplicación backend y frontend siguiendo `GUIA_RAILWAY_PGADMIN.md`

---

## 📝 Notas Importantes

1. **Backup:** Guarda siempre copias de tus archivos `.sql`
2. **Seguridad:** No compartas las credenciales de Railway
3. **Testing:** Prueba primero con unos pocos registros
4. **Verificación:** Siempre verifica con COUNT(*) después de importar

---

**¿Necesitas ayuda?** Revisa `MIGRAR_DATOS_A_RAILWAY.md` para alternativas.

