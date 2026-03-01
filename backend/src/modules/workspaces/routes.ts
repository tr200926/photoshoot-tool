import { Router, Request, Response } from 'express';
import { asyncHandler } from '@middleware/errorHandler';
import { AppError } from '@middleware/errorHandler';
import { getPrismaClient } from '@config/database';

const router = Router();
const prisma = getPrismaClient();

// Get current workspace
router.get('/current', asyncHandler(async (req: Request, res: Response) => {
  if (!req.workspaceId) throw new AppError('Workspace not found', 400, 'NO_WORKSPACE');

  const workspace = await prisma.workspace.findUnique({
    where: { id: req.workspaceId },
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, avatar: true } },
        },
      },
      projects: {
        where: { isArchived: false },
        select: { id: true, name: true, description: true },
        orderBy: { createdAt: 'desc' },
      },
      _count: { select: { assets: true, jobs: true } },
    },
  });

  if (!workspace) throw new AppError('Workspace not found', 404, 'WORKSPACE_NOT_FOUND');

  res.json({ success: true, workspace });
}));

// Update workspace settings
router.put('/current', asyncHandler(async (req: Request, res: Response) => {
  if (!req.workspaceId) throw new AppError('Workspace not found', 400, 'NO_WORKSPACE');

  const { name, description } = req.body;

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: req.userId, workspaceId: req.workspaceId },
  });
  if (!membership || membership.role !== 'admin') throw new AppError('Unauthorized', 403, 'FORBIDDEN');

  const workspace = await prisma.workspace.update({
    where: { id: req.workspaceId },
    data: { ...(name && { name }), ...(description !== undefined && { description }) },
  });

  res.json({ success: true, workspace });
}));

// Get workspace analytics / usage stats
router.get('/current/analytics', asyncHandler(async (req: Request, res: Response) => {
  if (!req.workspaceId) throw new AppError('Workspace not found', 400, 'NO_WORKSPACE');

  const workspaceId = req.workspaceId;

  const [
    totalAssets,
    totalJobs,
    completedJobs,
    failedJobs,
    recentJobs,
    workspace,
    jobsByType,
  ] = await Promise.all([
    prisma.asset.count({ where: { workspaceId } }),
    prisma.generationJob.count({ where: { workspaceId } }),
    prisma.generationJob.count({ where: { workspaceId, status: 'completed' } }),
    prisma.generationJob.count({ where: { workspaceId, status: 'failed' } }),
    prisma.generationJob.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { id: true, jobType: true, status: true, createdAt: true, completedAt: true },
    }),
    prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { monthlyCredits: true, creditsUsed: true, plan: true },
    }),
    prisma.generationJob.groupBy({
      by: ['jobType'],
      where: { workspaceId, status: 'completed' },
      _count: true,
    }),
  ]);

  res.json({
    success: true,
    analytics: {
      assets: { total: totalAssets },
      jobs: {
        total: totalJobs,
        completed: completedJobs,
        failed: failedJobs,
        successRate: totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : 0,
        byType: jobsByType.map(j => ({ type: j.jobType, count: j._count })),
      },
      credits: {
        monthly: workspace?.monthlyCredits || 1000,
        used: workspace?.creditsUsed || 0,
        remaining: (workspace?.monthlyCredits || 1000) - (workspace?.creditsUsed || 0),
      },
      recentJobs,
    },
  });
}));

// List workspace members
router.get('/current/members', asyncHandler(async (req: Request, res: Response) => {
  if (!req.workspaceId) throw new AppError('Workspace not found', 400, 'NO_WORKSPACE');

  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId: req.workspaceId },
    include: {
      user: { select: { id: true, name: true, email: true, avatar: true } },
    },
  });

  res.json({ success: true, members });
}));

// Invite member
router.post('/current/members/invite', asyncHandler(async (req: Request, res: Response) => {
  if (!req.workspaceId) throw new AppError('Workspace not found', 400, 'NO_WORKSPACE');

  const { email, role = 'editor' } = req.body;
  if (!email) throw new AppError('Email is required', 400, 'VALIDATION_ERROR');

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: req.userId, workspaceId: req.workspaceId },
  });
  if (!membership || membership.role !== 'admin') throw new AppError('Unauthorized', 403, 'FORBIDDEN');

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new AppError('User not found. They must create an account first.', 404, 'USER_NOT_FOUND');

  const existing = await prisma.workspaceMember.findFirst({
    where: { userId: user.id, workspaceId: req.workspaceId },
  });
  if (existing) throw new AppError('User is already a member of this workspace', 409, 'ALREADY_MEMBER');

  const newMember = await prisma.workspaceMember.create({
    data: { userId: user.id, workspaceId: req.workspaceId, role },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  res.status(201).json({ success: true, member: newMember });
}));

// Remove member
router.delete('/current/members/:userId', asyncHandler(async (req: Request, res: Response) => {
  if (!req.workspaceId) throw new AppError('Workspace not found', 400, 'NO_WORKSPACE');

  const { userId } = req.params;
  if (userId === req.userId) throw new AppError('You cannot remove yourself', 400, 'CANNOT_REMOVE_SELF');

  const callerMembership = await prisma.workspaceMember.findFirst({
    where: { userId: req.userId, workspaceId: req.workspaceId },
  });
  if (!callerMembership || callerMembership.role !== 'admin') throw new AppError('Unauthorized', 403, 'FORBIDDEN');

  await prisma.workspaceMember.deleteMany({
    where: { userId, workspaceId: req.workspaceId },
  });

  res.json({ success: true, message: 'Member removed' });
}));

export default router;
