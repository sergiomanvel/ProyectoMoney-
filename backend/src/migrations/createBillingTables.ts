import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

function getPoolConfig() {
  const dbPublicUrl = process.env.DATABASE_PUBLIC_URL;
  const dbUrl = process.env.DATABASE_URL;
  const isInternalUrl = dbPublicUrl?.includes('railway.internal') || dbUrl?.includes('railway.internal');
  let poolConfig: any = {};
  if (dbPublicUrl && !isInternalUrl) {
    poolConfig = { connectionString: dbPublicUrl, ssl: { rejectUnauthorized: false } };
  } else if (dbUrl && !isInternalUrl) {
    poolConfig = { connectionString: dbUrl, ssl: { rejectUnauthorized: false } };
  } else {
    const useSSL = process.env.NODE_ENV === 'production' || process.env.DB_HOST?.includes('railway') || process.env.DB_HOST?.includes('rlwy');
    poolConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'autoquote',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASS || '',
      ssl: useSSL ? { rejectUnauthorized: false } : false
    };
  }
  return poolConfig;
}

export async function createBillingTables() {
  const pool = new Pool(getPoolConfig());
  try {
    console.log('🔧 Creando tablas de billing (Paddle)...');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS plans (
        id SERIAL PRIMARY KEY,
        paddle_price_id TEXT UNIQUE NOT NULL,
        name TEXT,
        features JSONB,
        is_active BOOLEAN DEFAULT TRUE
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NULL,
        paddle_subscription_id TEXT UNIQUE,
        plan_id INTEGER REFERENCES plans(id),
        status TEXT,
        current_period_start TIMESTAMPTZ,
        current_period_end TIMESTAMPTZ,
        cancel_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status)
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS webhook_events (
        id SERIAL PRIMARY KEY,
        event_id TEXT UNIQUE,
        type TEXT,
        raw_payload JSONB,
        signature TEXT,
        processed_at TIMESTAMPTZ
      )
    `);

    console.log('✅ Tablas de billing creadas');

    // Seed del plan único a partir de PADDLE_PRICE_ID
    const priceId = process.env.PADDLE_PRICE_ID;
    if (priceId) {
      await pool.query(
        `INSERT INTO plans (paddle_price_id, name, features) VALUES ($1, $2, $3)
         ON CONFLICT (paddle_price_id) DO NOTHING`,
        [priceId, 'Main', JSON.stringify({})]
      );
      console.log('✅ Plan único creado:', priceId);
    } else {
      console.log('⚠️  PADDLE_PRICE_ID no configurado, plan no creado');
    }

  } finally {
    await (pool as any).end();
  }
}

if (require.main === module) {
  createBillingTables()
    .then(() => { console.log('🎉 Billing migration OK'); process.exit(0); })
    .catch((e) => { console.error('💥 Billing migration error', e); process.exit(1); });
}


