-- Script de migración para Railway PostgreSQL
-- Ejecutar en pgAdmin conectado a Railway Production

-- Crear tabla de cotizaciones
CREATE TABLE IF NOT EXISTS quotes (
  id SERIAL PRIMARY KEY,
  client_name VARCHAR(255) NOT NULL,
  client_email VARCHAR(255) NOT NULL,
  project_description TEXT NOT NULL,
  price_range VARCHAR(100) NOT NULL,
  generated_content JSONB NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_quotes_client_email ON quotes(client_email);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes(created_at);

-- Nuevas columnas para folio, vigencia y estado (si no existen)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='quotes' AND column_name='folio'
  ) THEN
    ALTER TABLE quotes ADD COLUMN folio VARCHAR(50);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='quotes' AND column_name='valid_until'
  ) THEN
    ALTER TABLE quotes ADD COLUMN valid_until TIMESTAMP;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='quotes' AND column_name='status'
  ) THEN
    ALTER TABLE quotes ADD COLUMN status VARCHAR(20) DEFAULT 'draft';
  END IF;
END
$$;

-- Campo accepted_at opcional
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='quotes' AND column_name='accepted_at'
  ) THEN
    ALTER TABLE quotes ADD COLUMN accepted_at TIMESTAMP;
  END IF;
END
$$;

-- Crear tabla de items editables (versión PRO)
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

