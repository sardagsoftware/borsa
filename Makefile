# LCI Makefile - White-hat Development & Production Tasks
# Usage: make <target>

.PHONY: help dev up down logs clean test migrate seed

# Default target
.DEFAULT_GOAL := help

##@ General

help: ## Display this help message
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ Development

dev: ## Start all services in development mode
	@echo "🚀 Starting LCI development environment..."
	@cd infra/lci-db && docker-compose up -d
	@echo "⏳ Waiting for database..."
	@sleep 5
	@echo "✅ Services ready!"
	@echo "📍 PostgreSQL: localhost:5433"
	@echo "📍 Redis: localhost:6380"
	@echo "📍 Meilisearch: http://localhost:7700"

up: dev ## Alias for 'make dev'

down: ## Stop all services
	@echo "🛑 Stopping LCI services..."
	@cd infra/lci-db && docker-compose down
	@echo "✅ Services stopped"

logs: ## View service logs
	@cd infra/lci-db && docker-compose logs -f

clean: ## Clean volumes and containers (WARNING: Data loss!)
	@echo "⚠️  WARNING: This will delete all data!"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		cd infra/lci-db && docker-compose down -v; \
		echo "✅ Clean complete"; \
	else \
		echo "❌ Cancelled"; \
	fi

##@ Database

migrate: ## Run Prisma migrations
	@echo "🔄 Running database migrations..."
	@cd infra/lci-db && npx prisma migrate dev --schema prisma/schema.prisma
	@echo "✅ Migrations complete"

migrate-deploy: ## Deploy migrations to production
	@echo "🚀 Deploying migrations to production..."
	@cd infra/lci-db && npx prisma migrate deploy --schema prisma/schema.prisma
	@echo "✅ Production migrations complete"

migrate-reset: ## Reset database (WARNING: Data loss!)
	@echo "⚠️  WARNING: This will reset the database!"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		cd infra/lci-db && npx prisma migrate reset --schema prisma/schema.prisma; \
		echo "✅ Database reset complete"; \
	else \
		echo "❌ Cancelled"; \
	fi

seed: ## Seed database with test data
	@echo "🌱 Seeding database..."
	@cd infra/lci-db && npx prisma db seed
	@echo "✅ Seed complete (20 brands, 50 complaints)"

prisma-studio: ## Open Prisma Studio
	@echo "🎨 Opening Prisma Studio..."
	@cd infra/lci-db && npx prisma studio --schema prisma/schema.prisma

##@ Build

build-api: ## Build backend API
	@echo "🔨 Building LCI API..."
	@cd apps/lci-api && pnpm build
	@echo "✅ API build complete"

build-web: ## Build frontend
	@echo "🔨 Building LCI Web..."
	@cd apps/lci-web && pnpm build
	@echo "✅ Web build complete"

build: build-api build-web ## Build all services

##@ Testing

test: ## Run all tests
	@echo "🧪 Running tests..."
	@cd apps/lci-api && pnpm test
	@cd apps/lci-web && pnpm test
	@echo "✅ Tests complete"

test-api: ## Run API tests only
	@cd apps/lci-api && pnpm test

test-web: ## Run web tests only
	@cd apps/lci-web && pnpm test

test-e2e: ## Run E2E tests
	@echo "🧪 Running E2E tests..."
	@cd apps/lci-web && pnpm test:e2e
	@echo "✅ E2E tests complete"

test-cov: ## Run tests with coverage
	@echo "📊 Running tests with coverage..."
	@cd apps/lci-api && pnpm test:cov
	@echo "✅ Coverage report generated"

##@ Linting

lint: ## Lint all code
	@echo "🔍 Linting code..."
	@cd apps/lci-api && pnpm lint
	@cd apps/lci-web && pnpm lint
	@echo "✅ Lint complete"

lint-fix: ## Fix linting issues
	@echo "🔧 Fixing linting issues..."
	@cd apps/lci-api && pnpm lint --fix
	@cd apps/lci-web && pnpm lint --fix
	@echo "✅ Lint fixes applied"

format: ## Format code with Prettier
	@echo "✨ Formatting code..."
	@cd apps/lci-api && pnpm format
	@cd apps/lci-web && pnpm format
	@echo "✅ Code formatted"

##@ Security

security-check: ## Run security audit
	@echo "🔒 Running security audit..."
	@cd apps/lci-api && pnpm audit
	@cd apps/lci-web && pnpm audit
	@echo "✅ Security audit complete"

security-fix: ## Fix security vulnerabilities
	@echo "🔧 Fixing security vulnerabilities..."
	@cd apps/lci-api && pnpm audit --fix
	@cd apps/lci-web && pnpm audit --fix
	@echo "✅ Security fixes applied"

##@ Production

deploy-staging: ## Deploy to staging
	@echo "🚀 Deploying to staging..."
	@echo "Not implemented yet"

deploy-prod: ## Deploy to production
	@echo "🚀 Deploying to production..."
	@echo "⚠️  Not implemented yet - use CI/CD pipeline"

health-check: ## Check service health
	@echo "🏥 Checking service health..."
	@curl -f http://localhost:3201/health || echo "❌ API not healthy"
	@curl -f http://localhost:3200/api/health || echo "❌ Web not healthy"
	@echo "✅ Health check complete"
