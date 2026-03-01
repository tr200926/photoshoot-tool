import { Router, Request, Response } from 'express';
import { asyncHandler } from '@middleware/errorHandler';
import { AppError } from '@middleware/errorHandler';
import { getPrismaClient } from '@config/database';

const router = Router();
const prisma = getPrismaClient();

// List projects for workspace
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  if (!req.workspaceId) throw new AppError('Workspace required', 400, 'NO_WORKSPACE');

  const projects = await prisma.project.findMany({
    where: { workspaceId: req.workspaceId, isArchived: false },
    include: {
      _count: { select: { assets: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ success: true, projects });
}));

// Get single project
router.get('/:projectId', asyncHandler(async (req: Request, res: Response) => {
  const { projectId } = req.params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      assets: {
        include: { variants: true },
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
      _count: { select: { assets: true } },
    },
  });

  if (!project) throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');
  if (project.workspaceId !== req.workspaceId) throw new AppError('Unauthorized', 403, 'FORBIDDEN');

  res.json({ success: true, project });
}));

// Create project
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  if (!req.workspaceId) throw new AppError('Workspace required', 400, 'NO_WORKSPACE');

  const { name, description } = req.body;
  if (!name) throw new AppError('Project name is required', 400, 'VALIDATION_ERROR');

  const project = await prisma.project.create({
    data: {
      name,
      description,
      workspaceId: req.workspaceId,
    },
    include: { _count: { select: { assets: true } } },
  });

  res.status(201).json({ success: true, project });
}));

// Update project
router.patch('/:projectId', asyncHandler(async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const { name, description, isArchived } = req.body;

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');
  if (project.workspaceId !== req.workspaceId) throw new AppError('Unauthorized', 403, 'FORBIDDEN');

  const updated = await prisma.project.update({
    where: { id: projectId },
    data: {
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(isArchived !== undefined && { isArchived }),
    },
    include: { _count: { select: { assets: true } } },
  });

  res.json({ success: true, project: updated });
}));

// Delete project
router.delete('/:projectId', asyncHandler(async (req: Request, res: Response) => {
  const { projectId } = req.params;

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');
  if (project.workspaceId !== req.workspaceId) throw new AppError('Unauthorized', 403, 'FORBIDDEN');

  await prisma.project.delete({ where: { id: projectId } });

  res.json({ success: true, message: 'Project deleted' });
}));

export default router;
