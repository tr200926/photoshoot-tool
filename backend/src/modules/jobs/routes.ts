import { Router, Request, Response } from 'express';
import { asyncHandler } from '@middleware/errorHandler';
import { AppError } from '@middleware/errorHandler';
import { getPrismaClient } from '@config/database';

const router = Router();
const prisma = getPrismaClient();

// List generation jobs
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  if (!req.workspaceId) {
    throw new AppError('Workspace not found', 400, 'NO_WORKSPACE');
  }

  const { status, limit = '20', offset = '0' } = req.query;

  const jobs = await prisma.generationJob.findMany({
    where: {
      workspaceId: req.workspaceId,
      ...(status && { status: status as string }),
    },
    include: {
      asset: {
        select: {
          id: true,
          originalFileName: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: parseInt(limit as string),
    skip: parseInt(offset as string),
  });

  const total = await prisma.generationJob.count({
    where: {
      workspaceId: req.workspaceId,
      ...(status && { status: status as string }),
    },
  });

  res.json({
    success: true,
    jobs,
    pagination: {
      total,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    },
  });
}));

// Get job details
router.get('/:jobId', asyncHandler(async (req: Request, res: Response) => {
  const { jobId } = req.params;

  const job = await prisma.generationJob.findUnique({
    where: { id: jobId },
    include: {
      asset: {
        select: {
          id: true,
          originalFileName: true,
        },
      },
    },
  });

  if (!job) {
    throw new AppError('Job not found', 404, 'JOB_NOT_FOUND');
  }

  if (job.workspaceId !== req.workspaceId) {
    throw new AppError('Unauthorized', 403, 'FORBIDDEN');
  }

  res.json({
    success: true,
    job,
  });
}));

// Create background removal job
router.post('/background-removal', asyncHandler(async (req: Request, res: Response) => {
  if (!req.userId || !req.workspaceId) {
    throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
  }

  const { assetId } = req.body;

  if (!assetId) {
    throw new AppError('Asset ID is required', 400, 'VALIDATION_ERROR');
  }

  // Verify asset exists and belongs to workspace
  const asset = await prisma.asset.findUnique({
    where: { id: assetId },
  });

  if (!asset || asset.workspaceId !== req.workspaceId) {
    throw new AppError('Asset not found', 404, 'ASSET_NOT_FOUND');
  }

  // Create job
  const job = await prisma.generationJob.create({
    data: {
      jobType: 'background-removal',
      status: 'pending',
      workspaceId: req.workspaceId,
      assetId,
      userId: req.userId,
      creditsUsed: 50,
      estimatedCost: 0.01,
    },
  });

  // TODO: Enqueue job to Bull queue for processing

  res.status(201).json({
    success: true,
    job,
    message: 'Background removal job queued',
  });
}));

// Cancel job
router.post('/:jobId/cancel', asyncHandler(async (req: Request, res: Response) => {
  const { jobId } = req.params;

  const job = await prisma.generationJob.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    throw new AppError('Job not found', 404, 'JOB_NOT_FOUND');
  }

  if (job.workspaceId !== req.workspaceId) {
    throw new AppError('Unauthorized', 403, 'FORBIDDEN');
  }

  if (job.status === 'completed' || job.status === 'failed') {
    throw new AppError('Cannot cancel completed or failed job', 400, 'INVALID_JOB_STATE');
  }

  await prisma.generationJob.update({
    where: { id: jobId },
    data: { status: 'failed', error: 'Cancelled by user' },
  });

  res.json({
    success: true,
    message: 'Job cancelled',
  });
}));

export default router;
