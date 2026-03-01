# AI CREATIVE ENGINE
## Development Getting Started Checklist
### Step-by-Step to Running Code Locally

**Target Date:** March 3, 2026  
**Time Required:** 3-4 hours for first-time setup

---

## PRE-SETUP (30 minutes)

### ☐ System Requirements Check

```bash
# Verify Node.js 20+
node --version
# Should show: v20.x.x or higher

# Verify npm 10+
npm --version
# Should show: v10.x.x or higher

# Verify Docker is installed
docker --version
# Should show: Docker version 24.x or higher

# Verify Git is installed
git --version
# Should show: git version 2.x or higher
```

**If any tools are missing, download from:**
- Node.js: https://nodejs.org/en/ (LTS)
- Docker: https://www.docker.com/products/docker-desktop
- Git: https://git-scm.com/

### ☐ Clone Repository

```bash
# Navigate to your projects directory
cd ~/projects

# Clone the repo
git clone https://github.com/your-org/ai-creative-engine.git

# Navigate into project
cd ai-creative-engine
```

### ☐ Verify Project Structure

```bash
# Should see these directories
ls -la

# Expected output:
# backend/
# frontend/
# .github/
# docker-compose.yml
# .env.example
# README.md
# PRD.md
# CONSTITUTION.md
# TASKS.md
```

---

## ENVIRONMENT SETUP (15 minutes)

### ☐ Create .env.local

```bash
# Copy environment template
cp .env.example .env.local

# Open and verify (or leave defaults for local dev)
cat .env.local
```

### ☐ Update .env.local (Optional for local dev)

Most settings have defaults that work for local development. Only update if needed:

```bash
# Open with your editor
nano .env.local  # or vim, or VS Code

# At minimum, verify these entries exist:
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_creative_dev
# POSTGRES_PASSWORD=postgres
# NODE_ENV=development
# PORT=3001
```

### ☐ Create .gitignore (if not present)

```bash
# Verify .gitignore exists
cat .gitignore

# Should contain at least:
# node_modules/
# .env.local
# .next/
# dist/
```

---

## OPTION A: DOCKER SETUP (Recommended for most) (45 minutes)

### ☐ Start Docker Services

```bash
# From project root, start all services
docker-compose up -d

# Should output:
# [+] Running 4/4
# ✓ Container ai-creative-postgres   Started
# ✓ Container ai-creative-redis      Started
# ✓ Container ai-creative-backend    Started
# ✓ Container ai-creative-frontend   Started
```

### ☐ Verify Services Are Running

```bash
# Check all containers are up
docker-compose ps

# Should show all 4 containers as "Up"
```

### ☐ Watch Backend Logs (Optional)

```bash
# In a separate terminal, watch backend initialization
docker-compose logs -f backend

# Wait for output like:
# backend    | ✅ Backend running at http://localhost:3001
```

### ☐ Check Database Connection

```bash
# Wait 30 seconds for backend to start, then:
curl http://localhost:3001/health

# Expected response:
# {"status":"ok","timestamp":"2026-03-01T..."}
```

**If health check fails:**
```bash
# Check logs
docker-compose logs backend

# Common issue: Database not ready yet
# Solution: Wait another 30 seconds and retry
```

### ☐ Initialize Database Schema

```bash
# Run migrations in backend container
docker-compose exec backend npm run db:migrate

# This will:
# - Create PostgreSQL schema
# - Run Prisma migrations
# - Generate Prisma Client

# Expected output:
# ✓ Migrations completed (X migrations)
```

### ☐ Verify Frontend is Running

```bash
# Open in browser
open http://localhost:3000

# Or curl to check
curl http://localhost:3000

# Should return HTML homepage
```

### ✅ DOCKER SETUP COMPLETE!

**All services running:**
- **Frontend**: http://localhost:3000 (Next.js)
- **Backend**: http://localhost:3001 (API)
- **Postgres**: localhost:5432 (Database)
- **Redis**: localhost:6379 (Cache)

**Next: Jump to "EVERYDAY DEVELOPMENT" section below**

---

## OPTION B: MANUAL SETUP (For advanced dev/debugging) (90 minutes)

### ☐ Terminal 1: Start PostgreSQL

```bash
docker run --name postgres-dev \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=ai_creative_dev \
  -p 5432:5432 \
  postgres:16-alpine

# Expected output:
# database system is ready to accept connections
```

### ☐ Terminal 2: Start Redis

```bash
docker run --name redis-dev \
  -p 6379:6379 \
  redis:7-alpine

# Expected output:
# * Ready to accept connections
```

### ☐ Terminal 3: Start Backend

```bash
cd backend

# Install dependencies
npm install

# Run migrations
npm run db:migrate

# Start development server
npm run dev

# Expected output:
# ✅ Backend running at http://localhost:3001
# Environment: development
```

### ☐ Terminal 4: Start Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Expected output:
# ▲ Next.js 14.0.4
# - Local: http://localhost:3000
```

### ✅ MANUAL SETUP COMPLETE!

**All services running:**
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- Database & Cache: Ready

---

## EVERYDAY DEVELOPMENT

### ☐ Daily Startup

**With Docker (fastest):**
```bash
cd ~/projects/ai-creative-engine
docker-compose up -d
# Wait 30 seconds for services to start
open http://localhost:3000
```

**Or manually:**
```bash
# Just use your existing terminal windows that are still running
# Frontend should already be on http://localhost:3000
```

### ☐ Make Code Changes

**Backend changes:**
```bash
# Edit files in backend/src/
vim backend/src/index.ts

# Hot reload automatically (watch mode)
# Changes appear at http://localhost:3001
```

**Frontend changes:**
```bash
# Edit files in frontend/app/ or frontend/components/
vim frontend/app/page.tsx

# Next.js hot reload automatically
# Changes appear at http://localhost:3000
```

### ☐ Run Tests

**Backend tests:**
```bash
cd backend
npm test                # Run once
npm run test:watch     # Auto re-run
```

**Frontend tests:**
```bash
cd frontend
npm test                # Run once
npm run test:watch     # Auto re-run
```

### ☐ Check Code Quality

```bash
# Backend lint + format
cd backend
npm run lint
npm run format

# Frontend lint + format
cd frontend
npm run lint
npm run format
```

### ☐ Access Database UI (Prisma Studio)

```bash
# Option A: Via Docker
docker-compose exec backend npx prisma studio

# Option B: Manually
cd backend
npx prisma studio

# Opens at http://localhost:5555
# View/edit all database records visually
```

---

## COMMON TASKS

### Create a New API Endpoint

```bash
# 1. Create new route file
vim backend/src/routes/products.ts

# 2. Add route handler
# (See TASKS.md for detailed examples)

# 3. Define TypeScript types
vim backend/src/types/product.ts

# 4. Create service logic
vim backend/src/services/product.service.ts

# 5. Test the endpoint
curl http://localhost:3001/api/products
```

### Create a New React Component

```bash
# 1. Create component file
vim frontend/components/ProductUpload.tsx

# 2. Use in a page
vim frontend/app/dashboard/page.tsx

# 3. View in browser at http://localhost:3000/dashboard
```

### Update Database Schema

```bash
# 1. Edit schema
vim backend/prisma/schema.prisma

# 2. Create migration
cd backend
npx prisma migrate dev --name add_new_table

# 3. Schema updated + Prisma Client regenerated automatically
```

### Deploy Changes

```bash
# 1. Commit code
git add .
git commit -m "feat: Add new feature"

# 2. Push to GitHub
git push origin main

# 3. GitHub Actions will automatically:
# - Run tests
# - Run linting
# - Build Docker images
# - Deploy to staging (if tests pass)
```

---

## TROUBLESHOOTING

### "Cannot connect to localhost:3001"

```bash
# Check if backend is running
curl http://localhost:3001/health

# If failed, check logs
docker-compose logs backend

# Restart backend
docker-compose restart backend
```

### "Database connection failed"

```bash
# Check PostgreSQL container
docker-compose logs postgres

# Verify DATABASE_URL in .env.local
cat .env.local | grep DATABASE_URL

# Reset database
docker-compose down -v  # Delete volumes
docker-compose up -d    # Restart
docker-compose exec backend npm run db:migrate
```

### "Port 3000 already in use"

```bash
# Find what's using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or restart frontend service
docker-compose restart frontend
```

### "Node modules out of date"

```bash
# Clear and reinstall
rm -rf node_modules
npm install

# Or with Docker
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### "TypeScript errors in IDE"

```bash
# Generate TypeScript types
cd backend
npx prisma generate

cd ../frontend
npx prisma generate  # If needed
```

---

## VERIFICATION CHECKLIST

✅ **You're ready to develop when all of these pass:**

```bash
# 1. Frontend loading
curl http://localhost:3000
# Response: HTML page

# 2. Backend responding
curl http://localhost:3001/health
# Response: {"status":"ok",...}

# 3. Database connected
docker-compose exec backend npm run db:studio
# Opens http://localhost:5555 with database browser

# 4. Can run tests
cd frontend && npm test
# Should pass (or show which tests to fix)

# 5. Code changes auto-reload
# Edit frontend/app/page.tsx
# Save and check http://localhost:3000 (should update instantly)
```

---

## NEXT STEPS

1. **Complete environment setup** (this checklist)
2. **Read [TASKS.md](./TASKS.md)** to understand what needs to be built
3. **Start with Task 1.1** - Backend API setup
4. **Use [IMPLEMENTATION.md](./IMPLEMENTATION.md)** as detailed reference
5. **Deploy first feature** and celebrate! 🎉

---

## QUICK REFERENCE

**Common commands:**

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# Access database UI
docker-compose exec backend npx prisma studio

# Run backend tests
cd backend && npm test

# Run frontend tests
cd frontend && npm test

# Lint all code
cd backend && npm run lint && cd ../frontend && npm run lint

# Format all code
cd backend && npm run format && cd ../frontend && npm run format
```

---

**You're all set! Start coding! 🚀**

**Questions?** Check [IMPLEMENTATION.md](./IMPLEMENTATION.md) or [README.md](./README.md)

---

Document Updated: March 1, 2026  
Ready to Develop ✅
