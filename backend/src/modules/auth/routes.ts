import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { asyncHandler } from '@middleware/errorHandler';
import { generateToken } from '@middleware/auth';
import { getPrismaClient } from '@config/database';
import { AppError } from '@middleware/errorHandler';

const router = Router();
const prisma = getPrismaClient();

interface SignupRequest {
  email: string;
  name: string;
  password: string;
  workspaceName?: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

// Signup
router.post('/signup', asyncHandler(async (req: Request, res: Response) => {
  const { email, name, password, workspaceName } = req.body as SignupRequest;

  // Validation
  if (!email || !name || !password) {
    throw new AppError('Missing required fields', 400, 'VALIDATION_ERROR');
  }

  if (password.length < 8) {
    throw new AppError('Password must be at least 8 characters', 400, 'WEAK_PASSWORD');
  }

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new AppError('User already exists', 409, 'USER_EXISTS');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user and workspace
  const user = await prisma.user.create({
    data: {
      email,
      name,
      password: hashedPassword,
      workspaces: {
        create: {
          workspace: {
            create: {
              name: workspaceName || `${name}'s Workspace`,
              slug: `${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
            },
          },
          role: 'admin',
        },
      },
    },
    include: {
      workspaces: {
        include: {
          workspace: true,
        },
      },
    },
  });

  const workspace = user.workspaces[0].workspace;
  const token = generateToken(user.id, workspace.id, 'admin');

  res.status(201).json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    workspace: {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
    },
    token,
  });
}));

// Login
router.post('/login', asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as LoginRequest;

  if (!email || !password) {
    throw new AppError('Missing email or password', 400, 'VALIDATION_ERROR');
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      workspaces: {
        include: {
          workspace: true,
        },
      },
    },
  });

  if (!user) {
    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) {
    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  if (user.workspaces.length === 0) {
    throw new AppError('User has no workspace', 500, 'NO_WORKSPACE');
  }

  const workspace = user.workspaces[0].workspace;
  const role = user.workspaces[0].role;
  const token = generateToken(user.id, workspace.id, role);

  res.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    workspace: {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
    },
    token,
  });
}));

// Get current user
router.get('/me', asyncHandler(async (req: Request, res: Response) => {
  if (!req.userId) {
    throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
  }

  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: {
      id: true,
      email: true,
      name: true,
      avatar: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  res.json({
    success: true,
    user,
  });
}));

export default router;
