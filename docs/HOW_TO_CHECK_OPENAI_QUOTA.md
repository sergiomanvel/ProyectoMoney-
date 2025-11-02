# 🔍 Cómo Verificar Tu Cuota de OpenAI

## 📊 3 Formas de Verificar

---

## 1️⃣ **Dashboard Web de OpenAI** (Recomendado)

### Pasos:
1. Ve a: **https://platform.openai.com/usage**
2. Inicia sesión con tu cuenta de OpenAI
3. Revisa:
   - **Usage this month**: Tokens usados este mes
   - **Rate limits**: Límites de requests/minuto
   - **Billing**: Información de facturación
4. Verás warnings si estás cerca del límite

### Capturas Importantes:
- **Usage** → Tokens consumidos
- **Billing** → Créditos disponibles
- **Rate Limits** → Requests permitidos

---

## 2️⃣ **Endpoint de Prueba de AutoQuote** ✨

### Nuevo Endpoint Creado:

**URL**: `GET http://localhost:3000/api/openai/test`

### Cómo Usarlo:

#### Opción A: Navegador
```
1. Abre tu navegador
2. Ve a: http://localhost:3000/api/openai/test
3. Verás el JSON con el estado
```

#### Opción B: Terminal (curl)
```bash
curl http://localhost:3000/api/openai/test
```

#### Opción C: Postman/Insomnia
```
GET http://localhost:3000/api/openai/test
```

---

## 3️⃣ **Logs del Backend**

Cuando la cuota está agotada, verás en los logs:

```
⚠️ OpenAI falló para clasificación de sector, usando fallback local
```

---

## 📋 Respuestas del Endpoint

### ✅ OpenAI Funciona Correctamente:

```json
{
  "success": true,
  "configured": true,
  "message": "OpenAI funcionando correctamente",
  "model": "gpt-4o-mini",
  "response": "OK",
  "demo": false
}
```

### ❌ API Key No Configurada:

```json
{
  "success": false,
  "configured": false,
  "error": "OPENAI_API_KEY no configurado en .env",
  "fallback": "Sistema funcionará con clasificación local + fallback",
  "demo": false
}
```

### ⚠️ Cuota Excedida (429):

```json
{
  "success": false,
  "configured": true,
  "error": "quota_exceeded",
  "message": "⚠️ Has excedido tu cuota de OpenAI",
  "details": "You exceeded your current quota, please check your plan...",
  "fallback": "✅ Sistema funcionará con clasificación local + fallback",
  "demo": false,
  "tip": "Aumenta tu límite en https://platform.openai.com/usage"
}
```

### ❌ API Key Inválida (401):

```json
{
  "success": false,
  "configured": true,
  "error": "invalid_api_key",
  "message": "❌ API Key inválida o incorrecta",
  "details": "Incorrect API key provided...",
  "fallback": "✅ Sistema funcionará con clasificación local + fallback",
  "demo": false
}
```

---

## 🔧 Cómo Solucionar Cuota Excedida

### Opción 1: Aumentar Límite
1. Ve a: https://platform.openai.com/account/billing
2. Configura límites de billing
3. Añade método de pago si es necesario
4. Establece límites mensuales más altos

### Opción 2: Usar Fallback Local (Ya Funciona)
- ✅ El sistema YA usa fallback automáticamente
- ✅ Clasificación local cuando OpenAI falla
- ✅ No necesita configuración adicional
- ⚠️ Ligeramente menos preciso (pero funciona)

### Opción 3: Usar Modo Demo
En `.env`:
```
DEMO_MODE=true
```
- Genera cotizaciones localmente sin OpenAI
- Útil para desarrollo y pruebas

---

## 🧪 Probar el Endpoint

### Ejemplo en Terminal:

```bash
# Windows PowerShell
Invoke-WebRequest -Uri http://localhost:3000/api/openai/test | Select-Object -ExpandProperty Content

# Linux/Mac
curl http://localhost:3000/api/openai/test

# Con formateo JSON
curl http://localhost:3000/api/openai/test | python -m json.tool
```

---

## 📊 Monitoreo Continuo

### Opción 1: Script de Monitoreo

Crea `check-quota.js`:
```javascript
const http = require('http');

function checkQuota() {
  http.get('http://localhost:3000/api/openai/test', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      const result = JSON.parse(data);
      console.log(new Date().toISOString(), result);
    });
  });
}

// Chequear cada hora
setInterval(checkQuota, 60 * 60 * 1000);
checkQuota();
```

### Opción 2: Dashboard Simple HTML

```html
<!DOCTYPE html>
<html>
<head>
    <title>AutoQuote - OpenAI Status</title>
</head>
<body>
    <h1>OpenAI Status</h1>
    <button onclick="check()">Verificar</button>
    <pre id="status">Haz clic en Verificar</pre>
    
    <script>
        async function check() {
            const res = await fetch('http://localhost:3000/api/openai/test');
            const data = await res.json();
            document.getElementById('status').textContent = JSON.stringify(data, null, 2);
        }
    </script>
</body>
</html>
```

---

## ✅ Resumen

**Métodos de Verificación:**
1. 🌐 Dashboard OpenAI: https://platform.openai.com/usage
2. 🔧 Endpoint AutoQuote: `GET /api/openai/test`
3. 📝 Logs del backend

**Cuando la Cuota se Agota:**
- ✅ Sistema automáticamente usa fallback local
- ✅ Logs muestran warning claro
- ✅ Usuario no percibe error
- ✅ Cotizaciones siguen generándose

**Soluciones:**
- Aumentar límite en OpenAI
- Usar modo demo (`DEMO_MODE=true`)
- Confiar en fallback (ya funciona)

---

**¡El sistema está diseñado para nunca fallar completamente!** 🚀

