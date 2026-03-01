import { Router, Request, Response } from 'express';
import { asyncHandler } from '@middleware/errorHandler';
import { AppError } from '@middleware/errorHandler';
import { getPrismaClient } from '@config/database';
import { getBackgroundRemovalQueue, getEnvironmentGenerationQueue } from '@services/queueService';
import { ENVIRONMENTS, CAMERA_ANGLES, EnvironmentKey, AngleKey } from '@services/environmentGenerationService';
import { exportAssetVariants, FORMAT_SPECS, FormatKey } from '@services/exportService';

const router = Router();
const prisma = getPrismaClient();

// List generation jobs
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  if (!req.workspaceId) throw new AppError('Workspace not found', 400, 'NO_WORKSPACE');

  const { status, jobType, assetId, limit = '20', offset = '0' } = req.query;

  const where: any = {
    workspaceId: req.workspaceId,
    ...(status && { status: status as string }),
    ...(jobType && { jobType: jobType as string }),
    ...(assetId && { assetId: assetId as string }),
  };

  const [jobs, total] = await Promise.all([
    prisma.generationJob.findMany({
      where,
      include: {
        asset: { select: { id: true, originalFileName: true, originalUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    }),
    prisma.generationJob.count({ where }),
  ]);

  res.json({
    success: true,
    jobs,
    pagination: { total, limit: parseInt(limit as string), offset: parseInt(offset as string) },
  });
}));

// Get job details
router.get('/:jobId', asyncHandler(async (req: Request, res: Response) => {
  const { jobId } = req.params;

  const job = await prisma.generationJob.findUnique({
    where: { id: jobId },
    include: { asset: { select: { id: true, originalFileName: true, originalUrl: true } } },
  });

  if (!job) throw new AppError('Job not found', 404, 'JOB_NOT_FOUND');
  if (job.workspaceId !== req.workspaceId) throw new AppError('Unauthorized', 403, 'FORBIDDEN');

  res.json({ success: true, job });
}));

// ── Background Removal ──────────────────────────────────────────────────────

router.post('/background-removal', asyncHandler(async (req: Request, res: Response) => {
  if (!req.userId || !req.workspaceId) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');

  const { assetId } = req.body;
  if (!assetId) throw new AppError('assetId is required', 400, 'VALIDATION_ERROR');

  const asset = await prisma.asset.findUnique({ where: { id: assetId } });
  if (!asset || asset.workspaceId !== req.workspaceId) {
    throw new AppError('Asset not found', 404, 'ASSET_NOT_FOUND');
  }

  const job = await prisma.generationJob.create({
    data: {
      jobType: 'background-removal',
      status: 'pending',
      workspaceId: req.workspaceId,
      assetId,
      userId: req.userId,
      creditsUsed: 50,
      estimatedCost: 0.003,
    },
  });

  // Enqueue Bull job
  const queue = getBackgroundRemovalQueue();
  await queue.add({ jobId: job.id, assetId, workspaceId: req.workspaceId }, { jobId: job.id });

  res.status(201).json({ success: true, job, message: 'Background removal job queued' });
}));

// ── Environment Generation ──────────────────────────────────────────────────

router.post('/environment-generation', asyncHandler(async (req: Request, res: Response) => {
  if (!req.userId || !req.workspaceId) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');

  const {
    assetId,
    environment,
    angles = ['front'],
    lightingIntensity = 50,
    colorTone = 0,
  } = req.body;

  if (!assetId) throw new AppError('assetId is required', 400, 'VALIDATION_ERROR');
  if (!environment || !ENVIRONMENTS[environment as EnvironmentKey]) {
    throw new AppError(
      `Invalid environment. Choose: ${Object.keys(ENVIRONMENTS).join(', ')}`,
      400,
      'VALIDATION_ERROR',
    );
  }

  const asset = await prisma.asset.findUnique({ where: { id: assetId } });
  if (!asset || asset.workspaceId !== req.workspaceId) {
    throw new AppError('Asset not found', 404, 'ASSET_NOT_FOUND');
  }

  const validAngles = (angles as string[]).filter(a => CAMERA_ANGLES[a as AngleKey]);
  if (validAngles.length === 0) throw new AppError('No valid angles provided', 400, 'VALIDATION_ERROR');

  const queue = getEnvironmentGenerationQueue();
  const jobs = [];

  for (const angle of validAngles) {
    const job = await prisma.generationJob.create({
      data: {
        jobType: 'environment-generation',
        status: 'pending',
        workspaceId: req.workspaceId,
        assetId,
        userId: req.userId,
        parameters: { environment, angle, lightingIntensity, colorTone },
        creditsUsed: 100,
        estimatedCost: 0.006,
      },
    });

    await queue.add(
      { jobId: job.id, assetId, workspaceId: req.workspaceId, environment, angle, lightingIntensity, colorTone },
      { jobId: job.id },
    );

    jobs.push(job);
  }

  res.status(201).json({
    success: true,
    jobs,
    message: `${validAngles.length} environment generation job(s) queued`,
  });
}));

// ── Export ──────────────────────────────────────────────────────────────────

router.post('/export', asyncHandler(async (req: Request, res: Response) => {
  if (!req.userId || !req.workspaceId) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');

  const { assetId, variantIds = [], formats = ['square', 'portrait', 'stories'], scale = 1 } = req.body;
  if (!assetId) throw new AppError('assetId is required', 400, 'VALIDATION_ERROR');

  const validFormats = (formats as string[]).filter(f => FORMAT_SPECS[f as FormatKey]) as FormatKey[];
  if (validFormats.length === 0) throw new AppError('No valid formats provided', 400, 'VALIDATION_ERROR');

  const zipBuffer = await exportAssetVariants(
    assetId,
    req.workspaceId,
    variantIds,
    validFormats,
    scale as 1 | 2 | 4,
  );

  res.set({
    'Content-Type': 'application/zip',
    'Content-Disposition': `attachment; filename="export-${assetId}.zip"`,
    'Content-Length': zipBuffer.length,
  });
  res.send(zipBuffer);
}));

// ── Cancel Job ──────────────────────────────────────────────────────────────

router.post('/:jobId/cancel', asyncHandler(async (req: Request, res: Response) => {
  const { jobId } = req.params;

  const job = await prisma.generationJob.findUnique({ where: { id: jobId } });
  if (!job) throw new AppError('Job not found', 404, 'JOB_NOT_FOUND');
  if (job.workspaceId !== req.workspaceId) throw new AppError('Unauthorized', 403, 'FORBIDDEN');
  if (['completed', 'failed'].includes(job.status)) {
    throw new AppError('Cannot cancel a completed or failed job', 400, 'INVALID_JOB_STATE');
  }

  await prisma.generationJob.update({
    where: { id: jobId },
    data: { status: 'failed', error: 'Cancelled by user' },
  });

  res.json({ success: true, message: 'Job cancelled' });
}));

// ── Metadata: available environments and angles ─────────────────────────────

router.get('/meta/options', asyncHandler(async (_req: Request, res: Response) => {
  res.json({
    success: true,
    environments: Object.entries(ENVIRONMENTS).map(([key, val]) => ({
      key,
      name: val.name,
    })),
    angles: Object.entries(CAMERA_ANGLES).map(([key, val]) => ({
      key,
      name: val.name,
    })),
    formats: Object.entries(FORMAT_SPECS).map(([key, val]) => ({
      key,
      ...val,
    })),
  });
}));

export default router;
