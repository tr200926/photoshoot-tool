import { Router, Request, Response } from 'express';
import { asyncHandler } from '@middleware/errorHandler';
import { AppError } from '@middleware/errorHandler';
import { getPrismaClient } from '@config/database';
import { upload, uploadAsset } from './uploadService';

const router = Router();
const prisma = getPrismaClient();

// List assets for workspace
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  if (!req.workspaceId) throw new AppError('Workspace not found', 400, 'NO_WORKSPACE');

  const { projectId, status, limit = '20', offset = '0', search } = req.query;

  const where: any = {
    workspaceId: req.workspaceId,
    ...(projectId && { projectId: projectId as string }),
    ...(status && { status: status as string }),
    ...(search && {
      originalFileName: { contains: search as string, mode: 'insensitive' },
    }),
  };

  const [assets, total] = await Promise.all([
    prisma.asset.findMany({
      where,
      include: {
        variants: true,
        project: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    }),
    prisma.asset.count({ where }),
  ]);

  res.json({
    success: true,
    assets,
    pagination: { total, limit: parseInt(limit as string), offset: parseInt(offset as string) },
  });
}));

// Get single asset
router.get('/:assetId', asyncHandler(async (req: Request, res: Response) => {
  const { assetId } = req.params;

  const asset = await prisma.asset.findUnique({
    where: { id: assetId },
    include: {
      variants: true,
      jobs: { orderBy: { createdAt: 'desc' }, take: 10 },
      project: { select: { id: true, name: true } },
    },
  });

  if (!asset) throw new AppError('Asset not found', 404, 'ASSET_NOT_FOUND');
  if (asset.workspaceId !== req.workspaceId) throw new AppError('Unauthorized', 403, 'FORBIDDEN');

  res.json({ success: true, asset });
}));

// Upload asset (real multipart)
router.post('/upload', upload.single('file'), asyncHandler(async (req: Request, res: Response) => {
  if (!req.userId || !req.workspaceId) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');

  const { projectId } = req.body;
  const { asset, qualityScore } = await uploadAsset(req, {
    userId: req.userId,
    workspaceId: req.workspaceId,
    projectId: projectId || undefined,
  });

  res.status(201).json({
    success: true,
    asset,
    qualityScore,
    message:
      qualityScore < 80
        ? 'Image uploaded but quality score is low — consider a higher resolution image.'
        : 'Image uploaded successfully.',
  });
}));

// Update asset (rename, reassign project)
router.patch('/:assetId', asyncHandler(async (req: Request, res: Response) => {
  const { assetId } = req.params;
  const { originalFileName, projectId } = req.body;

  const asset = await prisma.asset.findUnique({ where: { id: assetId } });
  if (!asset) throw new AppError('Asset not found', 404, 'ASSET_NOT_FOUND');
  if (asset.workspaceId !== req.workspaceId) throw new AppError('Unauthorized', 403, 'FORBIDDEN');

  const updated = await prisma.asset.update({
    where: { id: assetId },
    data: {
      ...(originalFileName && { originalFileName }),
      ...(projectId !== undefined && { projectId }),
    },
    include: { variants: true },
  });

  res.json({ success: true, asset: updated });
}));

// Delete asset
router.delete('/:assetId', asyncHandler(async (req: Request, res: Response) => {
  const { assetId } = req.params;

  const asset = await prisma.asset.findUnique({ where: { id: assetId } });
  if (!asset) throw new AppError('Asset not found', 404, 'ASSET_NOT_FOUND');
  if (asset.workspaceId !== req.workspaceId) throw new AppError('Unauthorized', 403, 'FORBIDDEN');

  await prisma.asset.delete({ where: { id: assetId } });

  res.json({ success: true, message: 'Asset deleted successfully' });
}));

export default router;
