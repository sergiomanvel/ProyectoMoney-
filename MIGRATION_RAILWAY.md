# 🗄️ Migración de Base de Datos en Railway

## Paso a Paso para Crear las Tablas

1. **Abre pgAdmin 4** en tu computadora

2. **Conéctate a Railway Production**:
   - Host: `mainline.proxy.rlwy.net`
   - Port: `42602`
   - Database: `railway`
   - Username: `postgres`
   - Password: `SOGXEOjKuGLRVvmmwjyVGQvzpWXbDzZj`

3. **Abre el Query Tool**:
   - Click derecho en la base de datos `railway`
   - Selecciona "Query Tool"

4. **Copia el contenido de `migration-railway.sql`** y pégalo en el Query Tool

5. **Ejecuta la query** (F5 o botón Play)

6. **Verifica que se crearon las tablas**:
   - Click derecho en `railway` > Refresh
   - Deberías ver `quotes` y `quote_items` en "Tables"

¡Listo! Tu base de datos estará lista para que AutoQuote funcione en Railway.

