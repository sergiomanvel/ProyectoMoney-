@echo off
REM Script de pruebas automatizadas para AutoQuote API (Windows CMD)
REM Ejecutar: test-api.bat

echo 🧪 Iniciando pruebas de API - AutoQuote
echo ========================================
echo.
echo Asegurate de que el backend esté corriendo en http://localhost:3000
echo.
pause

powershell -ExecutionPolicy Bypass -File "%~dp0test-api.ps1"

pause

