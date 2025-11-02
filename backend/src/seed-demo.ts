import { Pool } from 'pg';
import dotenv from 'dotenv';
import { createTables } from './migrations/createTables';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'autoquote',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASS || '',
});

async function ensureTables() {
  try {
    await pool.query('SELECT 1 FROM quotes LIMIT 1');
  } catch {
    await createTables();
  }
}

async function seed() {
  await ensureTables();

  const examples = [
    {
      client_name: 'ACME Corp',
      client_email: 'compras@acmecorp.com',
      project_description: 'Tienda online con catálogo, carrito y pagos.',
      price_range: '50,000 - 100,000',
      generated_content: {
        title: 'COTIZACIÓN - E-commerce',
        clientName: 'ACME Corp',
        projectDescription: 'Tienda online con catálogo, carrito y pagos.',
        items: [
          { description: 'Análisis y planificación', quantity: 1, unitPrice: 15000, total: 15000 },
          { description: 'Desarrollo e implementación', quantity: 1, unitPrice: 25000, total: 25000 },
          { description: 'Testing y entrega final', quantity: 1, unitPrice: 10000, total: 10000 }
        ],
        subtotal: 50000,
        tax: 8000,
        total: 58000,
        validUntil: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
        terms: [
          'Pago del 50% al iniciar el proyecto',
          'Pago del 50% restante al finalizar',
          'Válido por 30 días',
          'Precios no incluyen IVA'
        ]
      },
      total_amount: 58000
    },
    {
      client_name: 'GreenDelivery',
      client_email: 'contacto@greendelivery.io',
      project_description: 'App móvil logística con tracking y notificaciones push.',
      price_range: '100,000+',
      generated_content: {
        title: 'COTIZACIÓN - App logística',
        clientName: 'GreenDelivery',
        projectDescription: 'App móvil logística con tracking y notificaciones push.',
        items: [
          { description: 'Arquitectura y diseño', quantity: 1, unitPrice: 50000, total: 50000 },
          { description: 'Desarrollo mobile y backend', quantity: 1, unitPrice: 70000, total: 70000 }
        ],
        subtotal: 120000,
        tax: 19200,
        total: 139200,
        validUntil: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
        terms: [
          'Pago del 50% al iniciar el proyecto',
          'Pago del 50% restante al finalizar',
          'Válido por 30 días',
          'Precios no incluyen IVA'
        ]
      },
      total_amount: 139200
    }
  ];

  for (const ex of examples) {
    await pool.query(
      `INSERT INTO quotes (client_name, client_email, project_description, price_range, generated_content, total_amount, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,NOW())`,
      [
        ex.client_name,
        ex.client_email,
        ex.project_description,
        ex.price_range,
        JSON.stringify(ex.generated_content),
        ex.total_amount
      ]
    );
  }

  console.log('✅ Seed demo insertado');
}

seed()
  .then(() => process.exit(0))
  .catch((e) => { console.error(e); process.exit(1); });


