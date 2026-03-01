import { Router, Request, Response } from 'express';
import { asyncHandler } from '@middleware/errorHandler';
import { AppError } from '@middleware/errorHandler';
import { getPrismaClient } from '@config/database';
import { uploadAsset } from './uploadService';

const router = Router();
const prisma = getPrismaClient();

// List assets for workspace
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  if (!req.workspaceId) {
    throw new AppError('Workspace not found', 400, 'NO_WORKSPACE');
  }

  const { projectId, limit = '20', offset = '0' } = req.query;

  const assets = await prisma.asset.findMany({
    where: {
      workspaceId: req.workspaceId,
      ...(projectId && { projectId: projectId as string }),
    },
    include: {
      variants: true,
      project: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: parseInt(limit as string),
    skip: parseInt(offset as string),
  });

  const total = await prisma.asset.count({
    where: {
      workspaceId: req.workspaceId,
      ...(projectId && { projectId: projectId as string }),
    },
  });

  res.json({
    success: true,
    assets,
    pagination: {
      total,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    },
  });
}));

// Get single asset
router.get('/:assetId', asyncHandler(async (req: Request, res: Response) => {
  const { assetId } = req.params;

  const asset = await prisma.asset.findUnique({
    where: { id: assetId },
    include: {
      variants: true,
      project: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!asset) {
    throw new AppError('Asset not found', 404, 'ASSET_NOT_FOUND');
  }

  if (asset.workspaceId !== req.workspaceId) {
    throw new AppError('Unauthorized', 403, 'FORBIDDEN');
  }

  res.json({
    success: true,
    asset,
  });
}));

// Upload asset
router.post('/upload', asyncHandler(async (req: Request, res: Response) => {
  if (!req.userId || !req.workspaceId) {
    throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
  }

  const { projectId } = req.body;
  const result = await uploadAsset(req, {
    userId: req.userId,
    workspaceId: req.workspaceId,
    projectId,
  });

  res.status(201).json({
    success: true,
    asset: result,
  });
}));

// Delete asset
router.delete('/:assetId', asyncHandler(async (req: Request, res: Response) => {
  const { assetId } = req.params;

  const asset = await prisma.asset.findUnique({
    where: { id: assetId },
  });

  if (!asset) {
    throw new AppError('Asset not found', 404, 'ASSET_NOT_FOUND');
  }

  if (asset.workspaceId !== req.workspaceId) {
    throw new AppError('Unauthorized', 403, 'FORBIDDEN');
  }

  await prisma.asset.delete({
    where: { id: assetId },
  });

  res.json({
    success: true,
    message: 'Asset deleted successfully',
  });
}));

export default router;
