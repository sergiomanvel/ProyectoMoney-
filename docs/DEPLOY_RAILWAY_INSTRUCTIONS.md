# 🚀 Instrucciones para Desplegar en Railway

## ✅ Estado Actual

- **Railway CLI**: ✅ Instalado (versión 4.11.0)
- **Proyecto vinculado**: ✅ `ravishing-vitality`
- **Servicio**: ✅ `ProyectoMoney-`
- **Ambiente**: ✅ `production`
- **Commit actual**: ✅ `bfd320b` - "feat: Perfeccionamiento completo de todos los sectores al 100%"

---

## 🚀 Comandos para Desplegar

### Opción 1: Desplegar desde el Directorio Raíz (Recomendado)

```bash
# Desde el directorio raíz del proyecto
railway up --service ProyectoMoney- --environment production
```

### Opción 2: Desplegar sin Especificar Servicio

```bash
# Railway detectará automáticamente el servicio vinculado
railway up
```

### Opción 3: Desplegar desde el Backend

```bash
# Si necesitas desplegar solo el backend
cd backend
railway up --service ProyectoMoney- --environment production
```

---

## 📋 Verificación del Despliegue

### 1. Ver Logs del Despliegue

```bash
# Ver logs en tiempo real
railway logs --service ProyectoMoney- --environment production --tail

# Ver últimos 100 logs
railway logs --service ProyectoMoney- --environment production --tail 100

# Ver todos los logs
railway logs --service ProyectoMoney- --environment production
```

### 2. Ver Estado del Proyecto

```bash
# Ver estado del proyecto
railway status

# Ver información del servicio
railway service
```

### 3. Ver Despliegues Recientes

```bash
# Ver despliegues recientes
railway deployments
```

---

## 🔍 Monitoreo del Despliegue

### 1. Ver Logs de Build

Durante el despliegue, Railway proporcionará un enlace a los logs de build. Ejemplo:

```
Build Logs: https://railway.com/project/96731377-e649-44bd-a299-eeb474543ebf/service/928bcd76-9f92-4b97-828a-90645846caf5?id=7cdcacaa-0a7c-4475-a95f-c861dce2de94
```

### 2. Verificar Errores de TypeScript

Si hay errores de TypeScript, aparecerán en los logs de build. Los errores más comunes son:

- `ownerId` no existe en `QuoteLearningEvent`
- `traceId` no existe en `QuoteHistoryRecordInput`
- `generateCommercialSummary` espera 3-5 argumentos pero se pasan 6
- `findRelevantHistory` espera 1-3 argumentos pero se pasan 4

**Nota**: Estos errores deberían estar resueltos en el commit `bfd320b`.

### 3. Verificar que el Servidor se Inicie Correctamente

Después del despliegue, verifica que el servidor se inicie correctamente:

```bash
# Ver logs del servidor
railway logs --service ProyectoMoney- --environment production --tail

# Buscar mensajes de inicio
railway logs --service ProyectoMoney- --environment production | Select-String "Server started|Listening on"
```

---

## 🛠️ Solución de Problemas

### Problema 1: Railway CLI No Está Instalado

**Solución**:
```bash
# Instalar Railway CLI globalmente
npm install -g @railway/cli

# Verificar instalación
railway --version
```

### Problema 2: Error de Política de Ejecución en PowerShell

**Solución**:
```powershell
# Cambiar política de ejecución temporalmente
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process -Force

# Verificar que Railway CLI funciona
railway --version
```

### Problema 3: Proyecto No Está Vinculado

**Solución**:
```bash
# Vincular proyecto a Railway
railway link

# Seleccionar el proyecto y servicio
railway service
```

### Problema 4: Errores de TypeScript Durante el Build

**Solución**:
1. Verificar que el código local compila correctamente:
   ```bash
   cd backend
   npm run build
   ```

2. Si hay errores, corregirlos localmente y hacer commit:
   ```bash
   git add .
   git commit -m "fix: Corregir errores de TypeScript"
   git push origin master
   ```

3. Volver a desplegar:
   ```bash
   railway up --service ProyectoMoney- --environment production
   ```

### Problema 5: Despliegue Se Interrumpe

**Solución**:
1. Verificar que hay cambios para desplegar:
   ```bash
   git status
   git log --oneline -5
   ```

2. Volver a intentar el despliegue:
   ```bash
   railway up --service ProyectoMoney- --environment production
   ```

3. Monitorear los logs:
   ```bash
   railway logs --service ProyectoMoney- --environment production --tail
   ```

---

## 📝 Notas Importantes

1. **Railway usa el código del repositorio Git**: Railway despliega el código del repositorio Git, no los cambios locales sin commitear.

2. **Cambios locales sin commitear**: Si tienes cambios locales sin commitear, necesitas hacer commit y push antes de desplegar:
   ```bash
   git add .
   git commit -m "feat: Descripción de los cambios"
   git push origin master
   ```

3. **Commit actual**: El commit `bfd320b` debería tener todos los cambios necesarios para corregir los errores de TypeScript.

4. **Monitoreo**: Durante el despliegue, monitorea los logs para detectar errores temprano.

5. **Tiempo de despliegue**: El despliegue puede tardar varios minutos, especialmente si hay que compilar TypeScript y construir el Docker image.

---

## 🔗 Enlaces Útiles

- **Railway Dashboard**: https://railway.app
- **Railway CLI Docs**: https://docs.railway.app/develop/cli
- **Railway Logs**: Ver logs en tiempo real en el dashboard de Railway

---

## ✅ Checklist de Verificación Post-Despliegue

- [ ] Despliegue completado sin errores
- [ ] Servidor iniciado correctamente
- [ ] No hay errores de TypeScript en los logs
- [ ] Backend responde correctamente
- [ ] Nuevos sectores disponibles (Eventos, Comercio, Manufactura, Formación)
- [ ] Selectores de perfil, tipo y región funcionan
- [ ] Logs sin errores críticos
- [ ] Base de datos conectada correctamente

---

## 📅 Última Actualización

**Fecha**: 2025-11-12  
**Commit**: `bfd320b` - "feat: Perfeccionamiento completo de todos los sectores al 100%"  
**Estado**: ✅ Despliegue en proceso

