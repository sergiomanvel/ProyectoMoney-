import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Configurar pool igual que en server.ts para Railway
const dbPublicUrl = process.env.DATABASE_PUBLIC_URL;
const dbUrl = process.env.DATABASE_URL;
const rawDbSsl = (process.env.DB_SSL || '').toLowerCase();
const forceSSL = rawDbSsl === 'true';
const disableSSL = rawDbSsl === 'false';

const shouldUseSSL = (host?: string) => {
  const normalizedHost = (host || '').toLowerCase();
  if (forceSSL) return true;
  if (disableSSL) return false;
  const isInternalHost = normalizedHost.includes('.railway.internal') || normalizedHost.includes('.internal');
  return !isInternalHost;
};

const buildPoolConfigFromUrl = (label: 'DATABASE_PUBLIC_URL' | 'DATABASE_URL', value: string) => {
  let host: string | undefined;
  try {
    host = new URL(value).hostname;
  } catch {
    host = undefined;
  }
  const useSSL = shouldUseSSL(host);
  console.log(`📊 [migrations] Usando ${label} (${host ?? 'host desconocido'})`);
  console.log(`🔒 [migrations] SSL requerido: ${useSSL}`);
  return {
    connectionString: value,
    ssl: useSSL ? { rejectUnauthorized: false } : false
  };
};

let poolConfig: any = {};
if (dbPublicUrl) {
  poolConfig = buildPoolConfigFromUrl('DATABASE_PUBLIC_URL', dbPublicUrl);
} else if (dbUrl) {
  poolConfig = buildPoolConfigFromUrl('DATABASE_URL', dbUrl);
} else {
  const dbHost = process.env.DB_HOST || process.env.PGHOST || 'localhost';
  const useSSL = shouldUseSSL(dbHost);
  console.log(`📊 [migrations] Conectando a PostgreSQL: ${dbHost}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
  console.log(`🔒 [migrations] SSL requerido: ${useSSL}`);
  poolConfig = {
    host: dbHost,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'autoquote',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS || '',
    ssl: useSSL ? { rejectUnauthorized: false } : false
  };
}

const pool = new Pool(poolConfig);

export async function createTables() {
  try {
    console.log('🔧 Creando tablas de la base de datos...');

    // Crear tabla de cotizaciones
    await pool.query(`
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
      )
    `);

    // Crear índices para mejor rendimiento
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_quotes_client_email ON quotes(client_email);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes(created_at);
    `);

    // Nuevas columnas para folio, vigencia y estado (si no existen)
    await pool.query(`
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
    `);

    // Campo accepted_at opcional
    await pool.query(`
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
    `);

    // Crear tabla de items editables (versión PRO)
    await pool.query(`
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
      )
    `);

    // Índices para quote_items
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_quote_items_quote_id ON quote_items(quote_id);
    `);

    // Historial de cotizaciones por usuario
    await pool.query(`
      CREATE TABLE IF NOT EXISTS quote_history (
        id SERIAL PRIMARY KEY,
        owner_id VARCHAR(191) NOT NULL,
        quote_id INTEGER REFERENCES quotes(id) ON DELETE SET NULL,
        client_name VARCHAR(255),
        client_email VARCHAR(255),
        sector VARCHAR(120),
        title TEXT,
        project_description TEXT,
        project_location VARCHAR(255),
        price_range VARCHAR(120),
        quality_level VARCHAR(20),
        total_amount NUMERIC(12,2),
        item_count INTEGER,
        items JSONB,
        project_context JSONB,
        embedding JSONB,
        generated_by VARCHAR(120),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_quote_history_owner ON quote_history(owner_id);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_quote_history_owner_sector ON quote_history(owner_id, sector);
    `);

    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name='quote_history' AND column_name='embedding'
        ) THEN
          ALTER TABLE quote_history ADD COLUMN embedding JSONB;
        END IF;
      END
      $$;
    `);

    console.log('✅ Tablas creadas exitosamente');
    console.log('📊 Tablas "quotes" y "quote_items" listas para usar');

  } catch (error) {
    console.error('❌ Error creando tablas:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Ejecutar si es llamado directamente (CommonJS)
if (require.main === module) {
  createTables()
    .then(() => {
      console.log('🎉 Migración completada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error en migración:', error);
      process.exit(1);
    });
}
