# Script de pruebas automatizadas para AutoQuote API (Windows PowerShell)
# Ejecutar: powershell -ExecutionPolicy Bypass -File backend/test-api.ps1

$BASE_URL = "http://localhost:3000/api"
$GREEN = "`e[32m"
$RED = "`e[31m"
$YELLOW = "`e[33m"
$NC = "`e[0m" # No Color

Write-Host "🧪 Iniciando pruebas de API - AutoQuote" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Test 1: GET /api/config
Write-Host ""
Write-Host "Test 1: GET /api/config" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/config" -Method Get
    if ($response.appName) {
        Write-Host "✅ PASS" -ForegroundColor Green
        Write-Host "   App Name: $($response.appName)"
    } else {
        Write-Host "❌ FAIL" -ForegroundColor Red
        Write-Host $response
    }
} catch {
    Write-Host "❌ FAIL" -ForegroundColor Red
    Write-Host $_.Exception.Message
}

# Test 2: POST /api/generate-quote
Write-Host ""
Write-Host "Test 2: POST /api/generate-quote" -ForegroundColor Yellow
try {
    $body = @{
        clientName = "Test Cliente"
        clientEmail = "test@example.com"
        projectDescription = "Sitio web corporativo"
        priceRange = "50000 - 80000"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$BASE_URL/generate-quote" -Method Post -Body $body -ContentType "application/json"
    
    if ($response.success) {
        Write-Host "✅ PASS" -ForegroundColor Green
        $script:QUOTE_ID = $response.quoteId
        Write-Host "   Quote ID: $($response.quoteId)"
        Write-Host "   Folio: $($response.folio)"
    } else {
        Write-Host "❌ FAIL" -ForegroundColor Red
        Write-Host $response
        $script:QUOTE_ID = 1
    }
} catch {
    Write-Host "❌ FAIL" -ForegroundColor Red
    Write-Host $_.Exception.Message
    $script:QUOTE_ID = 1
}

# Test 3: GET /api/quotes
Write-Host ""
Write-Host "Test 3: GET /api/quotes" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/quotes" -Method Get
    if ($response.quotes) {
        Write-Host "✅ PASS" -ForegroundColor Green
        Write-Host "   Total cotizaciones: $($response.quotes.Count)"
    } else {
        Write-Host "❌ FAIL" -ForegroundColor Red
        Write-Host $response
    }
} catch {
    Write-Host "❌ FAIL" -ForegroundColor Red
    Write-Host $_.Exception.Message
}

# Test 4: GET /api/quotes/:id
Write-Host ""
Write-Host "Test 4: GET /api/quotes/$QUOTE_ID" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/quotes/$QUOTE_ID" -Method Get
    if ($response.quote) {
        Write-Host "✅ PASS" -ForegroundColor Green
    } else {
        Write-Host "❌ FAIL" -ForegroundColor Red
        Write-Host $response
    }
} catch {
    Write-Host "❌ FAIL" -ForegroundColor Red
    Write-Host $_.Exception.Message
}

# Test 5: POST /api/quotes/:id/mark-sent
Write-Host ""
Write-Host "Test 5: POST /api/quotes/$QUOTE_ID/mark-sent" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/quotes/$QUOTE_ID/mark-sent" -Method Post
    if ($response.success) {
        Write-Host "✅ PASS" -ForegroundColor Green
    } else {
        Write-Host "❌ FAIL" -ForegroundColor Red
        Write-Host $response
    }
} catch {
    Write-Host "❌ FAIL" -ForegroundColor Red
    Write-Host $_.Exception.Message
}

# Test 6: POST /api/quotes/:id/accept
Write-Host ""
Write-Host "Test 6: POST /api/quotes/$QUOTE_ID/accept" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/quotes/$QUOTE_ID/accept" -Method Post
    if ($response.success) {
        Write-Host "✅ PASS" -ForegroundColor Green
    } else {
        Write-Host "❌ FAIL" -ForegroundColor Red
        Write-Host $response
    }
} catch {
    Write-Host "❌ FAIL" -ForegroundColor Red
    Write-Host $_.Exception.Message
}

# Test 7: POST /api/quotes/:id/send-email
Write-Host ""
Write-Host "Test 7: POST /api/quotes/$QUOTE_ID/send-email" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/quotes/$QUOTE_ID/send-email" -Method Post
    if ($response.success) {
        Write-Host "✅ PASS" -ForegroundColor Green
        if ($response.link) {
            $token = ($response.link -split 'token=')[1]
            Write-Host "   Link generado: $($response.link.Substring(0, [Math]::Min(60, $response.link.Length)))..."
            $script:TOKEN = $token
        }
    } else {
        Write-Host "❌ FAIL" -ForegroundColor Red
        Write-Host $response
    }
} catch {
    Write-Host "❌ FAIL" -ForegroundColor Red
    Write-Host $_.Exception.Message
}

# Test 8: GET /api/quotes/view/:token (solo si hay token)
if ($TOKEN) {
    Write-Host ""
    Write-Host "Test 8: GET /api/quotes/view/$($TOKEN.Substring(0, [Math]::Min(20, $TOKEN.Length)))..." -ForegroundColor Yellow
    try {
        $response = Invoke-RestMethod -Uri "$BASE_URL/quotes/view/$TOKEN" -Method Get
        if ($response.quote) {
            Write-Host "✅ PASS" -ForegroundColor Green
        } else {
            Write-Host "❌ FAIL" -ForegroundColor Red
            Write-Host $response
        }
    } catch {
        Write-Host "❌ FAIL" -ForegroundColor Red
        Write-Host $_.Exception.Message
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Pruebas completadas" -ForegroundColor Green
Write-Host "Revisa los resultados arriba. Verifica manualmente los PDFs y emails." -ForegroundColor Cyan

