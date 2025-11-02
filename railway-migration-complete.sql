-- =========================================
-- MIGRACIÓN COMPLETA PARA RAILWAY
-- =========================================
-- Ejecuta este archivo en Railway PostgreSQL
-- Instrucciones: psql $DATABASE_URL < railway-migration-complete.sql
-- O copia y pega en pgAdmin/Railway Query

-- =========================================
-- 1. CREAR TABLAS
-- =========================================

-- Tabla de cotizaciones
CREATE TABLE IF NOT EXISTS quotes (
  id SERIAL PRIMARY KEY,
  client_name VARCHAR(255) NOT NULL,
  client_email VARCHAR(255) NOT NULL,
  project_description TEXT NOT NULL,
  price_range VARCHAR(100) NOT NULL,
  generated_content JSONB NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  folio VARCHAR(50),
  valid_until TIMESTAMP,
  status VARCHAR(20) DEFAULT 'draft',
  accepted_at TIMESTAMP
);

-- Índices para quotes
CREATE INDEX IF NOT EXISTS idx_quotes_client_email ON quotes(client_email);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes(created_at);

-- Tabla de items editables (versión PRO)
CREATE TABLE IF NOT EXISTS quote_items (
  id SERIAL PRIMARY KEY,
  quote_id INTEGER NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  position INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para quote_items
CREATE INDEX IF NOT EXISTS idx_quote_items_quote_id ON quote_items(quote_id);

-- =========================================
-- 2. IMPORTAR TUS DATOS AQUÍ
-- =========================================
-- Exporta tus datos desde pgAdmin usando:
-- Right-click en tabla "quotes" → Export/Import → Export Data
-- Selecciona "SQL" como formato y copia aquí abajo:

-- Ejemplo de formato:
-- INSERT INTO quotes (client_name, client_email, project_description, ...) VALUES (...);

-- =========================================
-- 3. AJUSTAR SECUENCIAS (IMPORTANTE)
-- =========================================

-- Ajustar secuencias para que los nuevos IDs no se dupliquen
SELECT setval('quotes_id_seq', COALESCE((SELECT MAX(id) FROM quotes), 1) + 1, false);
SELECT setval('quote_items_id_seq', COALESCE((SELECT MAX(id) FROM quote_items), 1) + 1, false);

-- =========================================
-- VERIFICACIÓN
-- =========================================

-- Verificar que las tablas se crearon
SELECT 
  'quotes' as table_name, 
  COUNT(*) as total_records 
FROM quotes
UNION ALL
SELECT 
  'quote_items' as table_name, 
  COUNT(*) as total_records 
FROM quote_items;

-- ✅ Migración completada!

