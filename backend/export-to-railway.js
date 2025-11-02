/**
 * Exporta datos de la base de datos local a archivos SQL
 * Para importarlos en Railway después
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'autoquote',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASS || '',
});

async function exportData() {
  try {
    console.log('📦 Exportando datos de la base de datos local...\n');

    // 1. Exportar estructura de tablas (schema)
    console.log('📋 Exportando estructura de tablas...');
    const structureSQL = `
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

-- Tabla de items editables
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
`;
    
    fs.writeFileSync(path.join(__dirname, '../railway-export-structure.sql'), structureSQL);
    console.log('✅ Estructura exportada a railway-export-structure.sql');

    // 2. Exportar datos de quotes
    console.log('\n📊 Exportando datos de cotizaciones...');
    const quotesResult = await pool.query('SELECT * FROM quotes ORDER BY id');
    
    if (quotesResult.rows.length > 0) {
      const quotesSQL = quotesResult.rows.map(quote => {
        const fields = Object.keys(quote).filter(k => k !== 'updated_at').join(', ');
        const values = Object.values(quote).map((v, i) => {
          const key = Object.keys(quote)[i];
          if (key === 'updated_at') return null;
          if (v === null) return 'NULL';
          if (typeof v === 'string') return `'${v.replace(/'/g, "''")}'`;
          if (typeof v === 'object') return `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
          return v;
        }).filter(v => v !== null).join(', ');
        return `INSERT INTO quotes (${fields}) VALUES (${values});`;
      }).join('\n');
      
      fs.writeFileSync(path.join(__dirname, '../railway-export-quotes.sql'), quotesSQL);
      console.log(`✅ ${quotesResult.rows.length} cotizaciones exportadas a railway-export-quotes.sql`);
    } else {
      console.log('ℹ️  No hay cotizaciones para exportar');
    }

    // 3. Exportar datos de quote_items si existen
    try {
      const itemsResult = await pool.query('SELECT * FROM quote_items ORDER BY id');
      if (itemsResult.rows.length > 0) {
        const itemsSQL = itemsResult.rows.map(item => {
          const fields = Object.keys(item).filter(k => k !== 'updated_at').join(', ');
          const values = Object.values(item).map((v, i) => {
            const key = Object.keys(item)[i];
            if (key === 'updated_at') return null;
            if (v === null) return 'NULL';
            if (typeof v === 'string') return `'${v.replace(/'/g, "''")}'`;
            return v;
          }).filter(v => v !== null).join(', ');
          return `INSERT INTO quote_items (${fields}) VALUES (${values});`;
        }).join('\n');
        
        fs.writeFileSync(path.join(__dirname, '../railway-export-items.sql'), itemsSQL);
        console.log(`✅ ${itemsResult.rows.length} items exportados a railway-export-items.sql`);
      }
    } catch (error) {
      console.log('ℹ️  Tabla quote_items no existe aún (se creará con la migración)');
    }

    // 4. Crear archivo SQL consolidado para Railway
    console.log('\n📁 Creando archivo SQL consolidado para Railway...');
    const structureContent = fs.readFileSync(path.join(__dirname, '../railway-export-structure.sql'), 'utf8');
    const quotesContent = quotesResult.rows.length > 0 
      ? fs.readFileSync(path.join(__dirname, '../railway-export-quotes.sql'), 'utf8')
      : '-- No hay datos de cotizaciones';
    const itemsContent = fs.existsSync(path.join(__dirname, '../railway-export-items.sql'))
      ? fs.readFileSync(path.join(__dirname, '../railway-export-items.sql'), 'utf8')
      : '';
    
    const consolidatedSQL = [
      '-- =========================================',
      '-- EXPORTACIÓN DE BASE DE DATOS PARA RAILWAY',
      '-- =========================================',
      '-- Ejecuta este archivo en Railway PostgreSQL con:',
      '-- psql $DATABASE_URL < railway-import-complete.sql',
      '',
      '-- 1. Estructura de tablas',
      structureContent,
      '',
      '-- 2. Datos de cotizaciones',
      quotesContent,
      itemsContent ? '\n-- 3. Datos de items' : '',
      itemsContent,
      '',
      '-- 4. Ajustar secuencias de IDs',
      "SELECT setval('quotes_id_seq', COALESCE((SELECT MAX(id) FROM quotes), 1) + 1, false);",
      "SELECT setval('quote_items_id_seq', COALESCE((SELECT MAX(id) FROM quote_items), 1) + 1, false);",
      '',
      '-- ✅ Importación completada'
    ].join('\n');
    
    fs.writeFileSync(path.join(__dirname, '../railway-import-complete.sql'), consolidatedSQL);
    console.log('✅ Archivo consolidado railway-import-complete.sql creado\n');

    console.log('🎉 Exportación completada exitosamente!');
    console.log('\n📝 Próximos pasos:');
    console.log('   1. Despliega tu proyecto en Railway');
    console.log('   2. Añade el plugin PostgreSQL a tu proyecto');
    console.log('   3. Ejecuta: psql $DATABASE_URL < railway-import-complete.sql');
    console.log('   4. Tus datos estarán disponibles en Railway 🚀\n');

  } catch (error) {
    console.error('❌ Error exportando datos:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

exportData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 Error:', error);
    process.exit(1);
  });

