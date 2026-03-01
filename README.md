# AI Creative Engine
## AI Photoshoot & Ad Creative Generator for E-commerce

[![Tests](https://github.com/your-org/ai-creative-engine/actions/workflows/test.yml/badge.svg)](https://github.com/your-org/ai-creative-engine/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Status:** MVP Development (12-week launch sprint)

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- Git

### Option 1: Using Docker Compose (Recommended)

```bash
# 1. Clone repository
git clone <your-repo-url>
cd ai-creative-engine

# 2. Copy environment file
cp .env.example .env.local

# 3. Start all services
docker-compose up -d

# 4. Initialize database
docker-compose exec backend npm run db:migrate

# 5. Visit
# Frontend: http://localhost:3000
# Backend: http://localhost:3001
# Prisma Studio: http://localhost:5555
```

### Option 2: Manual Setup (Development)

```bash
# Terminal 1: Start PostgreSQL
docker run --name postgres-dev \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=ai_creative_dev \
  -p 5432:5432 \
  postgres:16-alpine

# Terminal 2: Start Redis
docker run --name redis-dev \
  -p 6379:6379 \
  redis:7-alpine

# Terminal 3: Start Backend
cd backend
npm install
npm run db:migrate
npm run dev

# Terminal 4: Start Frontend
cd frontend
npm install
npm run dev
```

---

## 📁 Project Structure

```
ai-creative-engine/
├── backend/                 # Node.js API server
│   ├── src/
│   │   ├── config/         # Configuration
│   │   ├── controllers/    # Request handlers
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API routes
│   │   ├── types/          # TypeScript types
│   │   └── index.ts        # Entry point
│   ├── prisma/             # Database schema
│   ├── Dockerfile
│   └── package.json
│
├── frontend/               # Next.js web app
│   ├── app/
│   │   ├── (auth)/        # Auth pages
│   │   ├── dashboard/     # Main app
│   │   └── layout.tsx
│   ├── components/         # React components
│   ├── lib/               # Utilities & hooks
│   ├── public/            # Static files
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml     # Local development setup
├── .env.example           # Environment template
├── PRD.md                 # Product Requirements Document
├── CONSTITUTION.md        # Core principles
├── TASKS.md              # Implementation tasks
└── README.md             # This file
```

---

## 🏗️ Architecture

```
Frontend (Next.js)           Backend (Node.js)           Data
┌─────────────────┐          ┌──────────────────┐       ┌────────┐
│  React + UI     │  ─────→  │  Express API     │ ────→ │ Postgres│
│  TypeScript     │          │  TypeScript      │       │         │
│  Tailwind CSS   │  ←─────  │  Prisma ORM      │       └────────┘
└─────────────────┘          └──────────────────┘
        ↓                            ↓
    S3 / CDN              Bull Queue, Redis Cache
```

---

## 🛠️ Development

### Backend

```bash
cd backend

# Install dependencies
npm install

# Database migrations
npm run db:migrate        # Create/update schema
npm run db:seed          # Seed test data
npm run db:reset         # Reset database

# Development
npm run dev              # Start dev server with hot reload
npm run test             # Run unit tests
npm run test:watch       # Watch mode
npm run lint             # ESLint
npm run format           # Prettier formatting

# Production
npm run build            # Build TypeScript
npm start                # Start compiled app
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Development
npm run dev              # Start dev server on :3000
npm run test             # Run tests
npm run test:e2e         # Run E2E tests
npm run lint             # ESLint
npm run format           # Prettier formatting

# Production
npm run build            # Build static site
npm start                # Start production server
```

---

## 📚 Documentation

- **[PRD.md](./PRD.md)** - Complete product specification
- **[CONSTITUTION.md](./CONSTITUTION.md)** - Core values & decision framework
- **[TASKS.md](./TASKS.md)** - 86 implementation tasks
- **[IMPLEMENTATION.md](./IMPLEMENTATION.md)** - Setup guide
- **[backend/README.md](./backend/README.md)** - Backend details
- **[frontend/README.md](./frontend/README.md)** - Frontend details

---

## 🔐 Environment Variables

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
vim .env.local
```

**Key variables:**

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for signing JWT tokens
- `OPENAI_API_KEY` - OpenAI API key for DALL-E
- `AWS_S3_BUCKET` - AWS S3 bucket for file storage
- `STRIPE_SECRET_KEY` - Stripe API key

See `.env.example` for all available options.

---

## 🧪 Testing

### Backend Tests

```bash
cd backend
npm test                 # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report
```

### Frontend Tests

```bash
cd frontend
npm test                # Run unit tests
npm run test:e2e       # Run Playwright E2E tests
npm run test:e2e:ui   # With UI browser
```

---

## 🚀 Deployment

### Docker

```bash
# Build images
docker build -t ai-creative-backend ./backend
docker build -t ai-creative-frontend ./frontend

# Run containers
docker run -p 3001:3001 ai-creative-backend
docker run -p 3000:3000 ai-creative-frontend
```

### Using Docker Compose

```bash
# Build all services
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### Vercel (Frontend) + Railway/ECS (Backend)

See `IMPLEMENTATION.md` for detailed deployment instructions.

---

## 📊 Key Metrics

**Development Phase:**
- ✅ Backend API: Running
- ✅ Frontend: Running locally
- ✅ Database: Connected
- ⏳ Authentication: In progress
- ⏳ File upload: In progress
- ⏳ Background removal: Planned

**Target MVP (Week 12, May 2026):**
- 500+ signups
- 10%+ free-to-paid conversion
- 4.2+ / 5.0 quality rating
- 99.5% uptime

---

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make changes and commit: `git commit -am 'Add feature'`
3. Push to branch: `git push origin feature/your-feature`
4. Submit a pull request

**Before committing:**
```bash
npm run lint
npm run format
npm run type-check
npm test
```

---

## 📅 Timeline

| Phase | Timeline | Milestone |
|---|---|---|
| Infrastructure | Weeks 1-2 | Dev environment ready |
| Core Features | Weeks 3-8 | MVP features complete |
| Testing & QA | Weeks 9-10 | Quality verified |
| Launch | Weeks 11-12 | Public launch |

**Target Launch:** Early May 2026

---

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Find process on port 3001
lsof -i :3001

# Kill process
kill -9 <PID>
```

### Database Connection Error

```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Check connection string in .env.local
cat .env.local | grep DATABASE_URL
```

### Docker Issues

```bash
# Clean up containers
docker-compose down -v

# Rebuild from scratch
docker-compose build --no-cache
docker-compose up -d
```

---

## 📞 Support

- **Documentation:** See `/docs` folder
- **Issues:** Create a GitHub issue
- **Questions:** Email: [your-email@example.com](mailto:your-email@example.com)

---

## 📄 License

MIT License - see LICENSE.md

---

**Happy coding! 🚀**

Last Updated: March 1, 2026  
Team: AI Creative Engine
