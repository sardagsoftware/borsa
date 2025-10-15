# LCI API - Backend Service

KVKK/GDPR compliant complaint management API built with NestJS.

## White-hat Security Features

- ✅ Helmet.js security headers
- ✅ CORS restricted to allowed origins
- ✅ Rate limiting (100 req/min default)
- ✅ Input validation with class-validator
- ✅ Prisma ORM with parameterized queries
- ✅ JWT authentication (Phase 2)
- ✅ RBAC authorization (Phase 2)

## Quick Start

```bash
# Install dependencies
pnpm install

# Generate Prisma client
cd ../../infra/lci-db && npx prisma generate

# Start database
cd ../../ && make dev

# Run migrations
make migrate

# Start development server
pnpm start:dev

# API will be available at http://localhost:3201
# API Docs: http://localhost:3201/api/docs
```

## Project Structure

```
src/
├── main.ts              # Entry point with Swagger setup
├── app.module.ts        # Root module
├── prisma.service.ts    # Database client
├── health/              # Health check endpoints
├── auth/                # Authentication (Phase 2.1)
├── users/               # User management (Phase 2.1)
├── complaints/          # Complaint CRUD (Phase 2.2)
├── brands/              # Brand management (Phase 3.1)
├── moderation/          # Content moderation (Phase 2.3)
└── legal/               # KVKK/GDPR endpoints (Phase 3.2)
```

## Testing

```bash
# Run unit tests
pnpm test

# Run tests with coverage
pnpm test:cov

# Target: >85% coverage
```

## Linting

```bash
# Lint code
pnpm lint

# Fix linting issues
pnpm lint --fix
```

## Environment Variables

See `../../infra/lci-db/.env.example` for all required environment variables.

## API Documentation

Once running, visit http://localhost:3201/api/docs for interactive Swagger documentation.

## Development Phases

- ✅ Phase 1.5: API skeleton (current)
- ⏳ Phase 2.1: Auth system (Email + JWT + RBAC)
- ⏳ Phase 2.2: Complaint CRUD + state machine
- ⏳ Phase 2.3: Moderation pipeline
- ⏳ Phase 2.4: Evidence upload
- ⏳ Phase 3.1: Brand panel
- ⏳ Phase 3.2: KVKK compliance endpoints

## License

Proprietary - Lydian AI © 2025
