import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import config from '@config/env';
import swaggerDocument from '@config/swagger';
import { DEV_UPLOADS_DIR } from './modules/assets/uploadService';
import { errorHandler, asyncHandler } from '@middleware/errorHandler';
import { authMiddleware } from '@middleware/auth';
import { getPrismaClient } from '@config/database';
import { closeQueues } from '@services/queueService';
import { startBackgroundRemovalWorker } from './workers/backgroundRemovalWorker';
import { startEnvironmentGenerationWorker } from './workers/environmentGenerationWorker';

// Import routes
import authRoutes from './modules/auth/routes';
import assetRoutes from './modules/assets/routes';
import jobRoutes from './modules/jobs/routes';
import workspaceRoutes from './modules/workspaces/routes';
import projectRoutes from './modules/projects/routes';
import billingRoutes from './modules/billing/routes';

const app: Express = express();

app.set('trust proxy', 1);

// Global rate limiter
const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { message: 'Too many requests', code: 'RATE_LIMIT_EXCEEDED' } },
});

// Auth-specific stricter limiter
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { success: false, error: { message: 'Too many auth attempts', code: 'AUTH_RATE_LIMIT' } },
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: config.server.nodeEnv === 'production'
    ? ['https://photoshoot.app']
    : (_origin, cb) => cb(null, true), // allow all localhost origins in dev
  credentials: true,
}));
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(globalLimiter);

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// Dev static file server — serves uploaded images at /dev-uploads/*
if (config.server.nodeEnv !== 'production') {
  app.use('/dev-uploads', express.static(path.resolve(DEV_UPLOADS_DIR)));
}

// API Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customSiteTitle: 'PhotoshootAI API Docs',
  swaggerOptions: { persistAuthorization: true },
}));

// Health check
app.get('/health', asyncHandler(async (_req: Request, res: Response) => {
  const prisma = getPrismaClient();
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: config.server.nodeEnv,
      database: 'connected',
      version: '1.0.0',
    });
  } catch {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
    });
  }
}));

// Root welcome
app.get('/', (_req: Request, res: Response) => {
  res.json({
    name: 'PhotoshootAI API',
    version: '1.0.0',
    status: 'running',
    docs: '/api/docs',
    health: '/health',
  });
});

// API Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/assets', authMiddleware, assetRoutes);
app.use('/api/jobs', authMiddleware, jobRoutes);
app.use('/api/workspaces', authMiddleware, workspaceRoutes);
app.use('/api/projects', authMiddleware, projectRoutes);
// Billing: webhook needs raw body, all others use JSON
app.use('/api/billing/webhook', express.raw({ type: 'application/json' }), billingRoutes);
app.use('/api/billing', billingRoutes);

// 404
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: { message: 'Not found', code: 'NOT_FOUND' } });
});

app.use(errorHandler);

const PORT = config.server.port;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${config.server.nodeEnv}`);
  console.log(`🔗 Base URL: ${config.server.baseUrl}`);

  // Start background workers (only if Redis is available)
  try {
    startBackgroundRemovalWorker();
    startEnvironmentGenerationWorker();
  } catch (err) {
    console.warn('⚠️  Workers not started (Redis may not be available):', (err as Error).message);
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(async () => {
    const prisma = getPrismaClient();
    await prisma.$disconnect();
    await closeQueues();
    process.exit(0);
  });
});

export default app;
