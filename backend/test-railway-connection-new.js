const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:PSQGBLMBQXLOmcNyLWzBNuPzLWzpgOyT@mainline.proxy.rlwy.net:42602/railway',
  ssl: {
    rejectUnauthorized: false
  }
});

async function testConnection() {
  try {
    console.log('🔍 Probando conexión a Railway PostgreSQL...');
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Conexión exitosa a Railway PostgreSQL');
    console.log('📅 Hora del servidor:', result.rows[0].now);
    
    // Listar tablas
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `);
    console.log('\n📊 Tablas existentes:');
    if (tables.rows.length === 0) {
      console.log('  (no hay tablas)');
    } else {
      tables.rows.forEach(row => console.log('  -', row.table_name));
    }
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testConnection();

