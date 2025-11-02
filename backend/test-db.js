const { Pool } = require('pg');
require('dotenv').config();

console.log('🔍 Probando conexión a la base de datos...');
console.log('Configuración:', {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || '5432',
  database: process.env.DB_NAME || 'autoquote',
  user: process.env.DB_USER || 'postgres'
});

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'autoquote',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASS || '',
});

async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('✅ Conexión exitosa a PostgreSQL');
    
    // Verificar si la base de datos existe
    const result = await client.query('SELECT current_database()');
    console.log('📊 Base de datos actual:', result.rows[0].current_database);
    
    client.release();
    await pool.end();
    
  } catch (error) {
    console.error('❌ Error conectando a la base de datos:', error.message);
    console.error('💡 Asegúrate de que:');
    console.error('   1. PostgreSQL esté ejecutándose');
    console.error('   2. La base de datos "autoquote" exista');
    console.error('   3. Las credenciales en .env sean correctas');
    process.exit(1);
  }
}

testConnection();
