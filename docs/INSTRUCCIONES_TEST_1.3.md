# 📋 Instrucciones para FASE 1.3: Primer Run Completo

## ⚠️ IMPORTANTE: Restricciones de PowerShell

PowerShell en tu sistema tiene restricciones de ejecución. Usa **CMD** o **Git Bash** para ejecutar los comandos npm.

---

## ✅ PASOS COMPLETADOS

- ✅ Backend iniciado en segundo plano (puerto 3000)
- ✅ Backend responde correctamente: http://localhost:3000/api/config
- ✅ PID del proceso: 2448

---

## 🚀 PASOS PENDIENTES (Manual)

### Paso 28: Iniciar Frontend

**Abre una NUEVA terminal CMD** (no PowerShell):

```cmd
cd C:\xampp\htdocs\ProyectoMoney\frontend
npm start
```

**Deberías ver algo como:**
```
✔ Compiled successfully
** Angular Live Development Server is listening on localhost:4200 **
```

---

### Paso 29: Verificar Frontend

1. Espera a que compile (puede tardar 30-60 segundos la primera vez)
2. Deberías ver: `✔ Compiled successfully`
3. Debería decir: `listening on localhost:4200`

**Si ves errores**: Cópialos y páselos.

---

### Paso 30: Abrir en Navegador

1. Abre tu navegador
2. Ve a: **http://localhost:4200**
3. **Verifica** que:
   - La página carga (no está en blanco)
   - Ves el formulario de cotización
   - No hay errores en la consola del navegador (F12 → Console)

---

### Paso 31: Verificar Consola del Navegador

1. Presiona **F12** en tu navegador
2. Ve a la pestaña **Console**
3. **Verifica** que:
   - No hay errores en rojo
   - Solo warnings menores son aceptables
   - La app se carga sin problemas

---

## ✅ CHECKLIST COMPLETADA

Cuando completes todos los pasos:

- [x] Test 26: Backend iniciado (completado)
- [x] Test 27: Backend responde (completado)
- [ ] Test 28: Frontend iniciado (pendiente - hacer manual)
- [ ] Test 29: Frontend en puerto 4200 (pendiente - verificar manualmente)
- [ ] Test 30: Página carga (pendiente - verificar manualmente)
- [ ] Test 31: Sin errores en consola (pendiente - verificar manualmente)

---

## 🎯 RESULTADO ESPERADO

Al final deberías tener:
- Backend corriendo en http://localhost:3000
- Frontend corriendo en http://localhost:4200
- Página principal visible en el navegador
- Sin errores críticos en consola

**¿Todo funcionando? ✅ ¡Pasa a la FASE 2!**

---

## ⚠️ SOLUCIÓN A RESTRICCIONES DE POWERSHELL

Si quieres habilitar npm en PowerShell (OPCIONAL):

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Luego puedes usar npm normalmente en PowerShell.

**⚠️ Advertencia**: Esto reduce seguridad. Solo si realmente lo necesitas.

---

**Cuando termines, avísame y seguimos con la FASE 2** 🚀

