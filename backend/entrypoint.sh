#!/bin/sh
# Script de inicio para Railway - Ejecuta migración y luego el servidor

echo "🔧 Ejecutando migración de base de datos..."
node backend/dist/migrations/createTables.js || echo "⚠️  Migración falló o tablas ya existen"

echo "🚀 Iniciando servidor AutoQuote..."
exec node backend/dist/server.js

