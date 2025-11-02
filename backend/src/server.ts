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
const PORT = process.env.PORT || 8080;

// Configurar pool de conexiones a PostgreSQL
// Railway puede usar DATABASE_PUBLIC_URL, DATABASE_URL o variables individuales
let poolConfig: any = {};

// Detectar si DATABASE_PUBLIC_URL contiene URL interna (no funciona desde contenedores)
const dbPublicUrl = process.env.DATABASE_PUBLIC_URL;
const dbUrl = process.env.DATABASE_URL;
const isInternalUrl = dbPublicUrl?.includes('railway.internal') || dbUrl?.includes('railway.internal');

if (isInternalUrl) {
  console.log('⚠️  Detectada URL interna de Railway. Usando variables individuales o construyendo URL pública.');
}

if (dbPublicUrl && !isInternalUrl) {
  // Railway usa DATABASE_PUBLIC_URL (URL pública - recomendado)
  console.log('📊 Usando DATABASE_PUBLIC_URL para conectar a PostgreSQL');
  poolConfig = {
    connectionString: dbPublicUrl,
    ssl: {
      rejectUnauthorized: false
    }
  };
} else if (dbUrl && !isInternalUrl) {
  // Railway usa DATABASE_URL (URL pública)
  console.log('📊 Usando DATABASE_URL para conectar a PostgreSQL');
  poolConfig = {
    connectionString: dbUrl,
    ssl: {
      rejectUnauthorized: false
    }
  };
} else {
  // Variables individuales
  const useSSL = process.env.NODE_ENV === 'production' || process.env.DB_HOST?.includes('railway') || process.env.DB_HOST?.includes('rlwy');
  console.log(`📊 Conectando a PostgreSQL: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
  console.log(`🔒 SSL requerido: ${useSSL}`);
  poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'autoquote',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS || '',
    ssl: useSSL ? {
      rejectUnauthorized: false
    } : false
  };
}

export const pool = new Pool(poolConfig);

// Trust proxy para Railway (necesario para rate limiting)
app.set('trust proxy', true);

// Middleware de seguridad
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP
  message: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.',
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    trustProxy: false // Evitamos warnings en Railway
  }
});
app.use(limiter);

// CORS - Permitir cualquier origen en producción
const corsOptions = {
  origin: true, // Permitir cualquier origen
  credentials: false,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Middleware para parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api', quoteRoutes);

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    ok: true,
    service: "AutoQuote API",
    version: "1.0.0",
    endpoints: [
      "/health",
      "/api/generate-quote",
      "/api/quotes",
      "/api/quotes/:id",
      "/api/quotes/:id/pdf"
    ]
  });
});

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
