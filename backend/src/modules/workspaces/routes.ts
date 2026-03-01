import { Router, Request, Response } from 'express';
import { asyncHandler } from '@middleware/errorHandler';
import { AppError } from '@middleware/errorHandler';
import { getPrismaClient } from '@config/database';

const router = Router();
const prisma = getPrismaClient();

// Get current workspace
router.get('/current', asyncHandler(async (req: Request, res: Response) => {
  if (!req.workspaceId) {
    throw new AppError('Workspace not found', 400, 'NO_WORKSPACE');
  }

  const workspace = await prisma.workspace.findUnique({
    where: { id: req.workspaceId },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
        },
      },
      projects: {
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
    },
  });

  if (!workspace) {
    throw new AppError('Workspace not found', 404, 'WORKSPACE_NOT_FOUND');
  }

  res.json({
    success: true,
    workspace,
  });
}));

// Update workspace settings
router.put('/current', asyncHandler(async (req: Request, res: Response) => {
  if (!req.workspaceId) {
    throw new AppError('Workspace not found', 400, 'NO_WORKSPACE');
  }

  const { name, description } = req.body;

  // Verify user is admin
  const membership = await prisma.workspaceMember.findFirst({
    where: {
      userId: req.userId,
      workspaceId: req.workspaceId,
    },
  });

  if (!membership || membership.role !== 'admin') {
    throw new AppError('Unauthorized', 403, 'FORBIDDEN');
  }

  const workspace = await prisma.workspace.update({
    where: { id: req.workspaceId },
    data: {
      ...(name && { name }),
      ...(description && { description }),
    },
  });

  res.json({
    success: true,
    workspace,
  });
}));

// List workspace members
router.get('/current/members', asyncHandler(async (req: Request, res: Response) => {
  if (!req.workspaceId) {
    throw new AppError('Workspace not found', 400, 'NO_WORKSPACE');
  }

  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId: req.workspaceId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      },
    },
  });

  res.json({
    success: true,
    members,
  });
}));

// Invite member to workspace
router.post('/current/members/invite', asyncHandler(async (req: Request, res: Response) => {
  if (!req.workspaceId) {
    throw new AppError('Workspace not found', 400, 'NO_WORKSPACE');
  }

  const { email, role = 'editor' } = req.body;

  if (!email) {
    throw new AppError('Email is required', 400, 'VALIDATION_ERROR');
  }

  // Verify user is admin
  const membership = await prisma.workspaceMember.findFirst({
    where: {
      userId: req.userId,
      workspaceId: req.workspaceId,
    },
  });

  if (!membership || membership.role !== 'admin') {
    throw new AppError('Unauthorized', 403, 'FORBIDDEN');
  }

  // Find or create user
  let user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    // In production, would send invitation email first
    throw new AppError('User not found. Invitation feature coming soon.', 404, 'USER_NOT_FOUND');
  }

  // Add user to workspace
  const newMember = await prisma.workspaceMember.create({
    data: {
      userId: user.id,
      workspaceId: req.workspaceId,
      role,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  res.status(201).json({
    success: true,
    member: newMember,
  });
}));

export default router;
