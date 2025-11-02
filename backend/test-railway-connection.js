/**
 * Script simple para probar conexión a Railway
 */

const { Pool } = require('pg');

const pool = new Pool({
  host: 'switchback.proxy.rlwy.net',
  port: 47831,
  database: 'railway',
  user: 'postgres',
  password: 'PSQGBLMBQXLOmcNyLWzBNuPzLWzpgOyT',
  ssl: {
    rejectUnauthorized: false
  }
});

async function test() {
  try {
    console.log('🔌 Conectando a Railway PostgreSQL...');
    
    // Test 1: Verificar conexión
    const testResult = await pool.query('SELECT NOW() as current_time, current_database() as database');
    console.log('✅ Conexión exitosa!');
    console.log('📅 Hora actual:', testResult.rows[0].current_time);
    console.log('🗄️  Base de datos:', testResult.rows[0].database);
    
    // Test 2: Verificar tablas existentes
    console.log('\n📋 Verificando tablas existentes...');
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    if (tablesResult.rows.length > 0) {
      console.log('✅ Tablas encontradas:');
      tablesResult.rows.forEach(row => console.log(`   - ${row.table_name}`));
    } else {
      console.log('⚠️  No hay tablas. Ejecuta "structure" para crearlas.');
    }
    
    // Test 3: Contar registros en quotes si existe
    try {
      const countResult = await pool.query('SELECT COUNT(*) as total FROM quotes');
      console.log(`\n📊 Total de cotizaciones: ${countResult.rows[0].total}`);
    } catch (error) {
      console.log('\n⚠️  La tabla quotes no existe aún.');
    }
    
    console.log('\n🎉 Verificación completada!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

test();

