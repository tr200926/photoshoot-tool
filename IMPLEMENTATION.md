# AI CREATIVE ENGINE
## Implementation Guide & Getting Started
### From Zero to Development Environment

**Document Version:** 1.0  
**Date:** March 1, 2026  
**Status:** Ready to Execute  
**Target:** Development environment running by March 3, 2026

---

## OVERVIEW

This guide walks you through setting up the **complete development environment** for AI Creative Engine. By the end, you'll have:

- ✅ Backend API running locally (Node.js + PostgreSQL)
- ✅ Frontend running locally (Next.js)
- ✅ Database with schema initialized
- ✅ Docker containers ready for deployment
- ✅ GitHub repos configured with CI/CD
- ✅ Development team prepared to start building

**Time to completion:** 4-6 hours (one person, first time)

---

## PART 1: PREREQUISITES & SETUP (1 hour)

### Step 1.1: Verify Prerequisites

Before starting, confirm your system has:

```bash
# Check Node.js (v20+)
node --version
# Expected: v20.x.x or higher

# Check npm (v10+)
npm --version
# Expected: v10.x.x or higher

# Check Docker (for local postgres + containers)
docker --version
# Expected: Docker version 24.x or higher

# Check Git
git --version
# Expected: git version 2.x or higher
```

**If anything is missing:**
- Install Node.js: https://nodejs.org/en/ (LTS version 20+)
- Install Docker: https://www.docker.com/products/docker-desktop
- Install Git: https://git-scm.com

---

### Step 1.2: Create Project Directories

```bash
# Create main project directory (if not already done)
mkdir -p ~/projects/ai-creative-engine
cd ~/projects/ai-creative-engine

# Create frontend + backend subdirectories
mkdir -p backend frontend shared
mkdir -p shared/types shared/utils

# Initialize git
git init
echo "node_modules/" > .gitignore
echo ".env.local" >> .gitignore
echo ".env*.local" >> .gitignore
echo ".next/" >> .gitignore
echo "dist/" >> .gitignore
```

---

### Step 1.3: Set Up Environment Variables

**Create `.env.local` (development):**

```bash
cat > .env.local << 'EOF'
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ai_creative_dev"
POSTGRES_PASSWORD=postgres
POSTGRES_DB=ai_creative_dev

# Backend
NODE_ENV=development
PORT=3001
API_URL=http://localhost:3001
API_SECRET=dev-secret-key-change-in-production

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_NAME="AI Creative Engine"

# AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=ai-creative-engine-dev

# AI APIs
OPENAI_API_KEY=sk-your-openai-key
STABLE_DIFFUSION_API_KEY=your-sd-key
BRIA_API_KEY=your-bria-key

# Authentication
JWT_SECRET=your-jwt-secret-key-change-in-production
GITHUB_CLIENT_ID=your-github-id
GITHUB_CLIENT_SECRET=your-github-secret

# Email
SENDGRID_API_KEY=your-sendgrid-key
SENDER_EMAIL=noreply@aicreatice.engine

# Analytics
MIXPANEL_TOKEN=your-mixpanel-token
SENTRY_DSN=your-sentry-dsn
EOF

cat .env.local
```

---

## PART 2: BACKEND SETUP (2.5 hours)

### Step 2.1: Initialize Backend Project

```bash
cd backend

# Initialize Node project
npm init -y

# Update package.json with project name
npm pkg set name="@ai-creative/backend"
npm pkg set description="Backend API for AI Creative Engine"
npm pkg set version="0.1.0"
```

---

### Step 2.2: Install Backend Dependencies

```bash
cd backend

# Core dependencies
npm install express fastify @fastify/cors @fastify/jwt @fastify/helmet

# Database
npm install prisma @prisma/client pg

# Validation & utilities
npm install zod joi bcryptjs jsonwebtoken dotenv

# Image processing
npm install sharp canvas node-canvas

# AI integrations
npm install openai replicate axios

# Async job queue
npm install bull redis

# Logging & monitoring
npm install pino pino-pretty winston sentry/node

# TypeScript & dev dependencies
npm install -D typescript @types/node @types/express ts-node nodemon
npm install -D @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint prettier
npm install -D jest @types/jest ts-jest supertest @types/supertest
```

---

### Step 2.3: Create Backend TypeScript Configuration

**`backend/tsconfig.json`:**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

---

### Step 2.4: Create Backend Folder Structure

```bash
cd backend

# Create src directory structure
mkdir -p src/{config,controllers,services,middleware,routes,types,utils,jobs,tests}

# Create config files
mkdir -p src/config
```

**`backend/src/config/env.ts`:**

```typescript
import dotenv from 'dotenv';

dotenv.config({ path: '../.env.local' });

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  apiUrl: process.env.API_URL || 'http://localhost:3001',

  // Database
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/ai_creative_dev',

  // JWT
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  jwtExpiry: '7d',

  // AWS
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    s3Bucket: process.env.AWS_S3_BUCKET || 'ai-creative-engine-dev',
  },

  // AI APIs
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  stableDiffusionApiKey: process.env.STABLE_DIFFUSION_API_KEY || '',
  briaApiKey: process.env.BRIA_API_KEY || '',

  // Email
  sendgridApiKey: process.env.SENDGRID_API_KEY || '',
  senderEmail: process.env.SENDER_EMAIL || 'noreply@aicreative.engine',
};
```

**`backend/src/config/database.ts`:**

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query', 'error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
```

---

### Step 2.5: Initialize Prisma Schema

```bash
cd backend

# Initialize Prisma
npx prisma init

# This creates schema.prisma and .env.example
```

**`backend/prisma/schema.prisma`:**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String     @id @default(cuid())
  email     String     @unique
  name      String?
  password  String?
  avatar    String?
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt

  workspaces WorkspaceMember[]
  @@index([email])
}

model Workspace {
  id        String     @id @default(cuid())
  name      String
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt

  members WorkspaceMember[]
  projects Project[]
  assets   Asset[]

  @@fulltext([name])
}

model WorkspaceMember {
  id          String     @id @default(cuid())
  userId      String
  workspaceId String
  role        String     @default("editor") // admin, editor, viewer
  createdAt   DateTime   @default(now())

  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@unique([userId, workspaceId])
  @@index([userId])
  @@index([workspaceId])
}

model Project {
  id          String     @id @default(cuid())
  workspaceId String
  name        String
  description String?
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  assets    Asset[]

  @@index([workspaceId])
}

model Asset {
  id              String     @id @default(cuid())
  workspaceId     String
  projectId       String?
  originalUrl     String     // S3 URL to original image
  isolatedUrl     String?    // S3 URL to background-removed image
  generatedUrl    String?    // S3 URL to final composite
  format          String     // 1:1, 4:5, 9:16
  environment     String?    // White Studio, Luxury Marble, etc.
  angle           String?    // Front, 45°, Top-down
  qualityScore    Float?     // 0-100
  metadata        Json?      // Generation parameters
  isFavorite      Boolean    @default(false)
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt
  deletedAt       DateTime?  // Soft delete

  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  project   Project?  @relation(fields: [projectId], references: [id], onDelete: SetNull)

  @@index([workspaceId])
  @@index([projectId])
  @@index([createdAt])
}

model GenerationJob {
  id              String     @id @default(cuid())
  workspaceId     String
  type            String     // background-removal, environment, export
  status          String     @default("pending") // pending, processing, completed, failed
  inputUrl        String
  outputUrl       String?
  progress        Int        @default(0) // 0-100
  error           String?
  metadata        Json?
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt

  @@index([workspaceId])
  @@index([status])
  @@index([createdAt])
}
```

---

### Step 2.6: Create Database Migrations

```bash
cd backend

# Create migration
npx prisma migrate dev --name init

# This will:
# 1. Create PostgreSQL database
# 2. Run migration
# 3. Generate Prisma Client
```

---

### Step 2.7: Create Simple Express Server

**`backend/src/index.ts`:**

```typescript
import express from 'express';
import cors from 'cors';
import { config } from './config/env';
import { prisma } from './config/database';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Basic API routes (placeholder)
app.get('/api/users/me', (req, res) => {
  res.json({ message: 'User endpoint' });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message });
});

// Start server
app.listen(config.port, () => {
  console.log(`✅ Backend running at ${config.apiUrl}`);
  console.log(`Environment: ${config.nodeEnv}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});
```

---

### Step 2.8: Create Backend package.json Scripts

**Update `backend/package.json`:**

```json
{
  "scripts": {
    "dev": "ts-node src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "lint": "eslint src --ext .ts",
    "format": "prettier --write src/**/*.ts",
    "db:migrate": "prisma migrate dev",
    "db:seed": "ts-node prisma/seed.ts",
    "db:reset": "prisma migrate reset"
  }
}
```

---

## PART 3: FRONTEND SETUP (1.5 hours)

### Step 3.1: Create Next.js Frontend

```bash
cd frontend

# Create Next.js app with TypeScript
npx create-next-app@latest . --typescript --tailwind --eslint --app

# Or manually create it
npm init -y
npm install next react react-dom
npm install -D typescript @types/node @types/react
npm install -D tailwindcss postcss autoprefixer
npm install -D @typescript-eslint/eslint-plugin eslint @typescript-eslint/parser
```

---

### Step 3.2: Install Frontend Dependencies

```bash
cd frontend

# UI & Components
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu zustand
npm install react-dropzone

# Forms & validation
npm install react-hook-form zod

# HTTP client
npm install axios swr

# File handling
npm install sharp

# Analytics
npm install mixpanel-browser @sentry/nextjs

# Dev dependencies
npm install -D vitest @testing-library/react @testing-library/jest-dom
npm install -D @playwright/test
```

---

### Step 3.3: Create Frontend Folder Structure

```bash
cd frontend

mkdir -p app/{(auth),dashboard,api}
mkdir -p components/{ui,forms,layouts}
mkdir -p lib/{api,utils,hooks}
mkdir -p public/images
```

---

### Step 3.4: Create Next.js Configuration

**`frontend/next.config.js`:**

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 's3.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: '**.cloudfront.net',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  },
};

module.exports = nextConfig;
```

---

### Step 3.5: Create Basic Pages

**`frontend/app/page.tsx` (Homepage):**

```typescript
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold">AI Creative Engine</h1>
      <p className="mt-4 text-lg text-gray-600">
        Coming soon...
      </p>
    </main>
  );
}
```

**`frontend/app/layout.tsx`:**

```typescript
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Creative Engine',
  description: 'AI Photoshoot & Ad Creative Generator for E-commerce',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

**`frontend/package.json` scripts:**

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest",
    "test:e2e": "playwright test"
  }
}
```

---

## PART 4: DOCKER & DEPLOYMENT (1 hour)

### Step 4.1: Create Docker Compose for Local Development

**`docker-compose.yml` (root):**

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      PORT: 3001
      NODE_ENV: development
    ports:
      - "3001:3001"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./backend/src:/app/src
    command: npm run dev

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:3001
    ports:
      - "3000:3000"
    depends_on:
      - backend
    volumes:
      - ./frontend/app:/app/app
      - ./frontend/components:/app/components

volumes:
  postgres_data:
```

---

### Step 4.2: Create Docker Files

**`backend/Dockerfile`:**

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source
COPY src ./src
COPY tsconfig.json ./
COPY prisma ./prisma

# Build
RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
```

**`frontend/Dockerfile`:**

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

---

### Step 4.3: Create .dockerignore Files

**`backend/.dockerignore`:**

```
node_modules
npm-debug.log
dist
.env.local
.git
.gitignore
```

**`frontend/.dockerignore`:**

```
node_modules
npm-debug.log
.next
.env.local
.git
.gitignore
```

---

## PART 5: GIT SETUP & CI/CD (30 min)

### Step 5.1: Initialize Git Repository

```bash
cd ~/projects/ai-creative-engine

# Create .gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
package-lock.json
yarn.lock

# Environment
.env.local
.env.*.local

# Build outputs
dist/
build/
.next/
out/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Testing
coverage/
.nyc_output/

# Logs
logs/
*.log
npm-debug.log*
EOF

git add .
git commit -m "Initial commit: Project structure and configuration"
```

---

### Step 5.2: Create GitHub Actions CI/CD

**`.github/workflows/test.yml`:**

```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: ai_creative_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install backend dependencies
        run: npm install
        working-directory: backend

      - name: Run backend tests
        run: npm test
        working-directory: backend
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/ai_creative_test

      - name: Install frontend dependencies
        run: npm install
        working-directory: frontend

      - name: Run frontend tests
        run: npm test
        working-directory: frontend

      - name: Build frontend
        run: npm run build
        working-directory: frontend
```

---

## PART 6: STARTING DEVELOPMENT (30 min)

### Step 6.1: Start Local Development Environment

**Option A: Using Docker Compose** (Recommended)

```bash
# From project root
docker-compose up -d

# This starts:
# - PostgreSQL on port 5432
# - Redis on port 6379
# - Backend on port 3001
# - Frontend on port 3000
```

**Option B: Manual Setup** (For development with live reloading)

```bash
# Terminal 1: PostgreSQL
docker run --name postgres-dev \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=ai_creative_dev \
  -p 5432:5432 \
  postgres:16-alpine

# Terminal 2: Redis
docker run --name redis-dev \
  -p 6379:6379 \
  redis:7-alpine

# Terminal 3: Backend
cd backend
npm install
npm run db:migrate
npm run dev

# Terminal 4: Frontend
cd frontend
npm install
npm run dev
```

---

### Step 6.2: Verify Everything is Working

```bash
# Test Backend
curl http://localhost:3001/health
# Expected response: {"status":"ok","timestamp":"2026-03-01T..."}

# Test Frontend
open http://localhost:3000
# Expected: "AI Creative Engine" homepage loads

# Test Database
cd backend
npx prisma studio
# Opens Prisma Studio at http://localhost:5555
```

---

### Step 6.3: Create Initial Users (Optional)

**`backend/prisma/seed.ts`:**

```typescript
import { prisma } from '../src/config/database';
import bcrypt from 'bcryptjs';

async function main() {
  // Create test user
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: 'Test User',
      password: await bcrypt.hash('password123', 10),
    },
  });

  // Create workspace
  const workspace = await prisma.workspace.create({
    data: {
      name: 'Test Workspace',
      members: {
        create: {
          userId: user.id,
          role: 'admin',
        },
      },
    },
  });

  console.log('✅ Seed completed');
  console.log(`User: ${user.email}`);
  console.log(`Workspace: ${workspace.name}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

```bash
cd backend
npm run db:seed
```

---

## PART 7: NEXT STEPS FOR DEVELOPMENT

### Immediate Actions (After environment is set up)

1. **Task 1.1: Backend API Setup** (This part)
   - ✅ Database schema created
   - ✅ Express server running
   - ⏳ Add authentication routes
   - ⏳ Add file upload endpoints

2. **Task 1.2: Frontend Structure** (In parallel)
   - ✅ Next.js running
   - ⏳ Add login/signup pages
   - ⏳ Add dashboard layout

3. **Task 2.1: Product Upload Endpoint**
   - Start implementing S3 integration
   - Create `/api/products/upload` endpoint
   - Add file validation

4. **Task 2.5: Background Removal Integration**
   - Integrate BRIA API
   - Test with sample images
   - Add webhook handler

---

## TROUBLESHOOTING

### Issue: Port Already in Use

```bash
# Find process using port 3001
lsof -i :3001

# Kill process
kill -9 <PID>
```

### Issue: PostgreSQL Connection Fails

```bash
# Check if Docker container is running
docker ps | grep postgres

# Check logs
docker logs postgres-dev

# Restart
docker restart postgres-dev
```

### Issue: Node Modules Out of Date

```bash
# Clear and reinstall
rm -rf node_modules
npm install

# Or with Docker
docker-compose down
docker-compose up --build
```

---

## TEAM ONBOARDING

For new team members, they should:

1. Clone the repository
2. Copy `.env.local` template to their machine
3. Run `docker-compose up -d`
4. Run `npm install` in each folder
5. Run `npm run db:migrate` in backend
6. Start developing!

---

## SUCCESS CHECKLIST

By end of this implementation guide, verify:

- ✅ Backend running at http://localhost:3001/health
- ✅ Frontend running at http://localhost:3000
- ✅ PostgreSQL database created and accessible
- ✅ Prisma migrations completed
- ✅ Git repository initialized with commits
- ✅ Docker containers working
- ✅ Team has development environment instructions

---

## RECOMMENDED IDE SETUP

### VS Code Extensions

```
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension prisma.prisma
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension bradlc.vscode-tailwindcss
code --install-extension ms-azuretools.vscode-docker
code --install-extension github.copilot
```

### VS Code Settings (.vscode/settings.json)

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

---

**Document Prepared By:** Engineering Lead  
**Date:** March 1, 2026  
**Status:** Ready to Execute  
**Next Review:** March 3, 2026 (after environment setup)
