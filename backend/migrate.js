const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'autoquote',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASS || '',
});

async function createTables() {
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

    console.log('✅ Tablas creadas exitosamente');
    console.log('📊 Tabla "quotes" lista para usar');

  } catch (error) {
    console.error('❌ Error creando tablas:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

createTables()
  .then(() => {
    console.log('🎉 Migración completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error en migración:', error);
    process.exit(1);
  });
