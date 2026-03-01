import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import config from '@config/env';
import { errorHandler, asyncHandler } from '@middleware/errorHandler';
import { authMiddleware } from '@middleware/auth';
import { getPrismaClient } from '@config/database';

// Import routes
import authRoutes from './modules/auth/routes';
import assetRoutes from './modules/assets/routes';
import jobRoutes from './modules/jobs/routes';
import workspaceRoutes from './modules/workspaces/routes';

const app: Express = express();

// Trust proxy
app.set('trust proxy', 1);

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://photoshoot.app'] 
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
}));
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// Health check
app.get('/health', asyncHandler(async (req: Request, res: Response) => {
  const prisma = getPrismaClient();
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: config.server.nodeEnv,
      database: 'connected',
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
    });
  }
}));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/assets', authMiddleware, assetRoutes);
app.use('/api/jobs', authMiddleware, jobRoutes);
app.use('/api/workspaces', authMiddleware, workspaceRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Not found',
      code: 'NOT_FOUND',
    },
  });
});

// Error handler (must be last)
app.use(errorHandler);

const PORT = config.server.port;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${config.server.nodeEnv}`);
  console.log(`🔗 Base URL: ${config.server.baseUrl}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(async () => {
    const prisma = getPrismaClient();
    await prisma.$disconnect();
    process.exit(0);
  });
});

export default app;
