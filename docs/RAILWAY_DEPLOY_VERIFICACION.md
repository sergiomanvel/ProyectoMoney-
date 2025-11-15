# 🚂 Verificación y Despliegue en Railway

## Estado Actual

✅ **Cambios subidos a Git**: `bfd320b` - "feat: Perfeccionamiento completo de todos los sectores al 100%"

⏳ **Railway**: Si está conectado a GitHub con auto-deploy, debería desplegar automáticamente.

---

## 🔍 Verificación del Despliegue en Railway

### Opción 1: Verificar Auto-Deploy (Recomendado)

1. **Abre Railway Dashboard**: [https://railway.app](https://railway.app)
2. **Selecciona tu proyecto**: `ProyectoMoney` (o el nombre de tu proyecto)
3. **Ve a la pestaña "Deployments"**:
   - Deberías ver un nuevo despliegue con el commit `bfd320b`
   - Estado: `Building` → `Deploying` → `Active`
4. **Si no hay despliegue automático**:
   - Ve a **Settings** → **Service**
   - Verifica que **"GitHub Repo"** esté conectado
   - Verifica que **"Auto Deploy"** esté habilitado

### Opción 2: Forzar Despliegue Manual

1. **En Railway Dashboard**:
   - Ve a tu servicio Backend
   - Click en **"Deployments"**
   - Click en **"Redeploy"** o **"Deploy"**
   - Selecciona la rama `master` y el commit `bfd320b`

### Opción 3: Verificar desde la Terminal (si Railway CLI funciona)

```bash
# Verificar estado del servicio
railway status

# Ver logs del despliegue
railway logs --service ProyectoMoney --environment production

# Verificar despliegues recientes
railway deployments --service ProyectoMoney
```

---

## 🎯 URL del Servicio

**Backend Railway**: `https://proyectomoney-production-ae41.up.railway.app`

**Frontend Environment**: Configurado en `frontend/src/environments/environment.prod.ts`

---

## ✅ Verificación Post-Despliegue

### 1. Verificar que el Backend está funcionando

```bash
# Verificar que el servidor responde
curl https://proyectomoney-production-ae41.up.railway.app/api/config

# Verificar que los nuevos sectores están disponibles
curl https://proyectomoney-production-ae41.up.railway.app/api/generate-quote \
  -H "Content-Type: application/json" \
  -d '{
    "clientName": "Test",
    "clientEmail": "test@example.com",
    "projectDescription": "Desarrollo ecommerce completo",
    "priceRange": "medio",
    "sector": "ecommerce",
    "projectLocation": "Madrid, España",
    "qualityLevel": "estandar"
  }'
```

### 2. Verificar Logs en Railway

1. **En Railway Dashboard**:
   - Ve a tu servicio Backend
   - Click en **"Logs"**
   - Verifica que no haya errores de compilación TypeScript
   - Verifica que el servidor se inicie correctamente

### 3. Verificar que los Nuevos Sectores Funcionan

Prueba generar una cotización con:
- **Sector**: Eventos, Comercio, Manufactura, Formación
- **Perfil de Cliente**: Autónomo, PYME, Agencia, Startup, Enterprise (Software)
- **Tipo de Proyecto**: Según el sector seleccionado
- **Región**: Comunidad autónoma española

---

## 🔧 Si el Despliegue Falla

### Error 1: Errores de Compilación TypeScript

**Solución**:
1. Verifica los logs en Railway
2. Asegúrate de que `npm run build` se ejecute correctamente
3. Verifica que todas las dependencias estén instaladas

### Error 2: Errores de Base de Datos

**Solución**:
1. Verifica que las variables de entorno de PostgreSQL estén configuradas
2. Verifica que la conexión a la base de datos funcione
3. Verifica que las migraciones se ejecuten correctamente

### Error 3: Errores de Variables de Entorno

**Solución**:
1. Verifica que todas las variables de entorno estén configuradas en Railway
2. Verifica que `OPENAI_API_KEY` esté configurada
3. Verifica que `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASS` estén configuradas

---

## 📋 Checklist de Verificación

- [ ] Cambios subidos a Git (`bfd320b`)
- [ ] Railway conectado a GitHub
- [ ] Auto-deploy habilitado en Railway
- [ ] Despliegue en curso o completado en Railway
- [ ] Backend responde correctamente
- [ ] Nuevos sectores disponibles (Eventos, Comercio, Manufactura, Formación)
- [ ] Selectores de perfil, tipo y región funcionan
- [ ] Logs sin errores críticos
- [ ] Base de datos conectada correctamente

---

## 🚀 Forzar Despliegue Manual

Si necesitas forzar un despliegue manual:

### Opción A: Desde Railway Dashboard

1. Ve a tu proyecto en Railway
2. Click en tu servicio Backend
3. Click en **"Deployments"**
4. Click en **"Redeploy"** o **"Deploy"**
5. Selecciona la rama `master`
6. Click en **"Deploy"**

### Opción B: Usando Railway CLI (si está disponible)

```bash
# Conectar al proyecto
railway link

# Desplegar manualmente
railway up

# Ver logs del despliegue
railway logs --tail
```

---

## 📝 Notas

- **Auto-deploy**: Railway normalmente hace auto-deploy cuando detecta cambios en la rama conectada (master/main)
- **Tiempo de despliegue**: Normalmente toma 2-5 minutos
- **Build time**: La compilación de TypeScript puede tomar 1-2 minutos
- **Variables de entorno**: Asegúrate de que todas las variables estén configuradas antes del despliegue

---

## 🔗 Enlaces Útiles

- **Railway Dashboard**: [https://railway.app](https://railway.app)
- **Railway Docs**: [https://docs.railway.app](https://docs.railway.app)
- **Railway CLI**: [https://docs.railway.app/develop/cli](https://docs.railway.app/develop/cli)

---

**Última actualización**: 2025-11-09  
**Commit**: `bfd320b` - "feat: Perfeccionamiento completo de todos los sectores al 100%"

