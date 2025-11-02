/**
 * Script para importar datos SQL a Railway PostgreSQL
 * Uso: node import-data-railway.js archivo.sql
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

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

async function importData(filename) {
  try {
    console.log(`📂 Leyendo archivo: ${filename}\n`);

    // Buscar el archivo
    let filepath;
    if (path.isAbsolute(filename)) {
      filepath = filename;
    } else {
      // Buscar en directorio actual y padre
      filepath = fs.existsSync(filename) 
        ? path.resolve(filename) 
        : path.resolve(__dirname, '..', filename);
    }

    if (!fs.existsSync(filepath)) {
      console.error(`❌ No se encontró el archivo: ${filename}`);
      console.error(`   Buscado en: ${filepath}`);
      process.exit(1);
    }

    const sqlContent = fs.readFileSync(filepath, 'utf8');
    
    // Limpiar contenido: remover comentarios
    const cleanSQL = sqlContent
      .split('\n')
      .filter(line => {
        const trimmed = line.trim();
        return trimmed && !trimmed.startsWith('--') && !trimmed.startsWith('/*');
      })
      .join('\n');

    // Separar queries
    const queries = cleanSQL
      .split(';')
      .map(q => q.trim())
      .filter(q => q && q.length > 10);

    console.log(`📝 Encontrados ${queries.length} queries para ejecutar\n`);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      
      try {
        const fullQuery = query.endsWith(';') ? query : query + ';';
        await pool.query(fullQuery);
        successCount++;
        process.stdout.write(`✅ Query ${i + 1}/${queries.length}\r`);
      } catch (error) {
        const errorMsg = error.message.toLowerCase();
        if (errorMsg.includes('already exists') || 
            errorMsg.includes('duplicate') ||
            errorMsg.includes('violates unique constraint')) {
          skipCount++;
          process.stdout.write(`⚠️  Query ${i + 1}/${queries.length} (skip)\r`);
        } else {
          errorCount++;
          console.error(`\n❌ Error en query ${i + 1}:`, error.message);
        }
      }
    }

    console.log('\n');

    // Verificar importación
    console.log('\n📊 Verificando datos importados...');
    try {
      const result = await pool.query('SELECT COUNT(*) as total FROM quotes');
      console.log(`✅ Total de cotizaciones en Railway: ${result.rows[0].total}`);
    } catch (error) {
      console.log('⚠️  No se pudo verificar (tabla quizás vacía)');
    }

    console.log('\n📈 Resumen:');
    console.log(`   ✅ Exitosos: ${successCount}`);
    console.log(`   ⚠️  Omitidos: ${skipCount}`);
    console.log(`   ❌ Errores: ${errorCount}`);

    console.log('\n🎉 Importación completada!');

  } catch (error) {
    console.error('❌ Error fatal:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Verificar argumentos
const args = process.argv.slice(2);
if (args.length === 0) {
  console.log('❌ Uso: node import-data-railway.js <archivo.sql>');
  console.log('\nEjemplo:');
  console.log('   node import-data-railway.js quotes-backup.sql');
  process.exit(1);
}

const filename = args[0];
importData(filename)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 Error:', error);
    process.exit(1);
  });

