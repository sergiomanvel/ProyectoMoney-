import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { Pool } from 'pg';

// Importar rutas
import quoteRoutes from './routes/quote';

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configurar pool de conexiones a PostgreSQL
// Railway puede usar DATABASE_URL o variables individuales
let poolConfig: any = {};

if (process.env.DATABASE_URL) {
  // Railway usa DATABASE_URL
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  };
} else {
  // Variables individuales
  poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'autoquote',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS || '',
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false
    } : false
  };
}

export const pool = new Pool(poolConfig);

// Middleware de seguridad
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP
  message: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.'
});
app.use(limiter);

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:4200',
  credentials: true
}));

// Middleware para parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api', quoteRoutes);

// Ruta de salud
app.get('/health', async (req, res) => {
  try {
    const result = await pool.query("SELECT 1 as ok");
    return res.json({ 
      ok: true, 
      db: true, 
      timestamp: new Date().toISOString(),
      service: 'AutoQuote API'
    });
  } catch (err) {
    return res.status(500).json({ 
      ok: false, 
      db: false, 
      error: (err as Error).message,
      timestamp: new Date().toISOString(),
      service: 'AutoQuote API'
    });
  }
});

// Middleware de manejo de errores
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo salió mal'
  });
});

// Ruta 404
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint no encontrado' });
});

// Iniciar servidor
app.listen(PORT, async () => {
  console.log(`🚀 Servidor AutoQuote ejecutándose en puerto ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  
  // Test conexión a PostgreSQL
  try {
    await pool.connect();
    console.log('✅ Conectado a PostgreSQL en Railway');
  } catch (err) {
    console.error('❌ Error conectando a PostgreSQL en Railway:', err);
  }
});

// Manejo de cierre graceful
process.on('SIGTERM', () => {
  console.log('🛑 Cerrando servidor...');
  pool.end(() => {
    console.log('✅ Conexiones a BD cerradas');
    process.exit(0);
  });
});
