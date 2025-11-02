const { Pool } = require('pg');
require('dotenv').config();

// Primero conectamos a la base de datos 'postgres' para crear nuestra base de datos
const adminPool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: 'postgres', // Conectamos a la base de datos por defecto
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASS || '',
});

async function setupDatabase() {
  try {
    console.log('🔧 Configurando base de datos...');
    
    // Crear la base de datos si no existe
    await adminPool.query(`CREATE DATABASE ${process.env.DB_NAME || 'autoquote'}`);
    console.log('✅ Base de datos "autoquote" creada');
    
  } catch (error) {
    if (error.code === '42P04') {
      console.log('ℹ️  La base de datos "autoquote" ya existe');
    } else {
      console.error('❌ Error creando base de datos:', error.message);
      throw error;
    }
  } finally {
    await adminPool.end();
  }

  // Ahora conectamos a nuestra base de datos para crear las tablas
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'autoquote',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS || '',
  });

  try {
    console.log('🔧 Creando tablas...');

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
    console.log('📊 Base de datos "autoquote" lista para usar');

  } catch (error) {
    console.error('❌ Error creando tablas:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

setupDatabase()
  .then(() => {
    console.log('🎉 Configuración completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error en configuración:', error);
    process.exit(1);
  });
