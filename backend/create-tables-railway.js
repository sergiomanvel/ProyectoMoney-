/**
 * Script para crear las tablas en Railway PostgreSQL
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

async function createTables() {
  try {
    console.log('🏗️  Creando tablas en Railway PostgreSQL...\n');

    // Leer el archivo SQL de migración
    const migrationFile = path.join(__dirname, '../railway-migration-complete.sql');
    
    if (!fs.existsSync(migrationFile)) {
      console.error('❌ No se encontró el archivo railway-migration-complete.sql');
      process.exit(1);
    }

    const sqlContent = fs.readFileSync(migrationFile, 'utf8');
    
    // Remover comentarios y separar queries
    let cleanSQL = sqlContent
      .split('\n')
      .filter(line => {
        const trimmed = line.trim();
        return trimmed && !trimmed.startsWith('--') && !trimmed.startsWith('/*');
      })
      .join('\n');

    // Separar queries por ;
    const queries = cleanSQL
      .split(';')
      .map(q => q.trim())
      .filter(q => q && q.length > 10); // Filtrar queries muy cortos

    console.log(`📝 Ejecutando ${queries.length} queries...\n`);

    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      if (!query) continue;
      
      try {
        const fullQuery = query.endsWith(';') ? query : query + ';';
        await pool.query(fullQuery);
        console.log(`✅ Query ${i + 1}/${queries.length} ejecutado`);
      } catch (error) {
        // Ignorar errores esperados
        const errorMsg = error.message.toLowerCase();
        if (errorMsg.includes('already exists') || 
            errorMsg.includes('does not exist') ||
            errorMsg.includes('duplicate')) {
          console.log(`⚠️  Query ${i + 1} (skip): ${error.message.split('\n')[0]}`);
        } else {
          console.error(`❌ Error en query ${i + 1}:`, error.message);
        }
      }
    }

    // Verificar que las tablas se crearon
    console.log('\n📋 Verificando tablas creadas...');
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    if (tablesResult.rows.length > 0) {
      console.log('✅ Tablas creadas exitosamente:');
      tablesResult.rows.forEach(row => console.log(`   - ${row.table_name}`));
    } else {
      console.log('⚠️  No se encontraron tablas');
    }

    console.log('\n🎉 Migración completada!');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

createTables()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });

