/**
 * Script para conectarse a Railway PostgreSQL y ejecutar comandos SQL
 * Uso: node connect-to-railway.js
 */

const { Pool } = require('pg');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

// Configuración de Railway
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

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'railway> '
});

console.log('🚂 Conectado a Railway PostgreSQL');
console.log('📝 Escribe comandos SQL o "exit" para salir\n');

// Función para ejecutar SQL
async function executeSQL(query) {
  try {
    const result = await pool.query(query);
    console.log('\n✅ Resultado:');
    if (result.rows && result.rows.length > 0) {
      console.table(result.rows);
    } else {
      console.log(`Filas afectadas: ${result.rowCount || 0}`);
    }
    console.log('');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('');
  }
}

// Variables para comandos multilínea
let multilineQuery = '';
let isMultiline = false;

rl.on('line', async (input) => {
  const line = input.trim();

  // Comandos especiales
  if (line === 'exit' || line === 'quit') {
    console.log('\n👋 Cerrando conexión...');
    await pool.end();
    process.exit(0);
  }

  if (line === 'help') {
    console.log('\n📚 Comandos disponibles:');
    console.log('  exit, quit  - Salir');
    console.log('  help        - Mostrar esta ayuda');
    console.log('  tables      - Listar todas las tablas');
    console.log('  count       - Contar registros en quotes');
    console.log('  structure   - Crear estructura de tablas');
    console.log('  import      - Importar archivo SQL');
    console.log('  Ejecuta cualquier comando SQL directamente\n');
    rl.prompt();
    return;
  }

  if (line === 'tables') {
    await executeSQL(`
      SELECT table_name, 
             (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as columns
      FROM information_schema.tables t
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    rl.prompt();
    return;
  }

  if (line === 'count') {
    await executeSQL('SELECT COUNT(*) as total FROM quotes;');
    rl.prompt();
    return;
  }

  if (line === 'structure') {
    console.log('\n🏗️  Creando estructura de tablas...');
    const structureFile = path.join(__dirname, '../railway-migration-complete.sql');
    if (fs.existsSync(structureFile)) {
      const sql = fs.readFileSync(structureFile, 'utf8');
      // Extraer solo la parte de creación de tablas (antes de "IMPORTAR TUS DATOS")
      const structureSQL = sql.split('-- 2. IMPORTAR TUS DATOS AQUÍ')[0];
      await executeSQL(structureSQL);
    } else {
      console.log('❌ No se encontró el archivo railway-migration-complete.sql');
    }
    rl.prompt();
    return;
  }

  if (line.startsWith('import ')) {
    const filename = line.substring(7).trim();
    const filepath = path.join(__dirname, '..', filename);
    if (fs.existsSync(filepath)) {
      console.log(`\n📂 Importando ${filename}...`);
      const sql = fs.readFileSync(filepath, 'utf8');
      await executeSQL(sql);
    } else {
      console.log(`❌ No se encontró el archivo ${filename}`);
    }
    rl.prompt();
    return;
  }

  // Comandos SQL normales
  if (!line || line.startsWith('--')) {
    rl.prompt();
    return;
  }

  // Si termina con ; entonces ejecutar
  if (line.endsWith(';')) {
    multilineQuery += line + '\n';
    await executeSQL(multilineQuery.trim());
    multilineQuery = '';
    isMultiline = false;
    rl.prompt();
  } else {
    // Comando multilínea
    multilineQuery += line + '\n';
    isMultiline = true;
  }
});

rl.on('close', async () => {
  console.log('\n👋 Cerrando conexión...');
  await pool.end();
  process.exit(0);
});

// Mostrar mensaje inicial
console.log('💡 Tip: Escribe "help" para ver comandos disponibles');
rl.prompt();

