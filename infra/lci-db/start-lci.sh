#!/bin/bash
# LCI Platform - Quick Start Script
# This script starts the entire LCI platform

set -e  # Exit on error

echo "🚀 LCI Platform - Starting..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Docker is running
echo "1️⃣  Checking Docker..."
if ! docker ps > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running!${NC}"
    echo "Please start Docker Desktop and try again."
    exit 1
fi
echo -e "${GREEN}✅ Docker is running${NC}"
echo ""

# Start PostgreSQL container
echo "2️⃣  Starting PostgreSQL container..."
cd /Users/sardag/Desktop/ailydian-ultra-pro/infra/lci-db
docker-compose up -d
echo -e "${GREEN}✅ PostgreSQL started${NC}"
echo ""

# Wait for PostgreSQL to be ready
echo "3️⃣  Waiting for PostgreSQL to be ready..."
sleep 5
until docker exec lci-postgres pg_isready -U postgres > /dev/null 2>&1; do
    echo "   Waiting for database..."
    sleep 2
done
echo -e "${GREEN}✅ PostgreSQL is ready${NC}"
echo ""

# Run Prisma migrations
echo "4️⃣  Running database migrations..."
npx prisma migrate deploy
echo -e "${GREEN}✅ Migrations applied${NC}"
echo ""

# Generate Prisma Client
echo "5️⃣  Generating Prisma Client..."
npx prisma generate
echo -e "${GREEN}✅ Prisma Client generated${NC}"
echo ""

# Load seed data
echo "6️⃣  Loading seed data..."
npm run seed
echo -e "${GREEN}✅ Seed data loaded${NC}"
echo ""

# Start LCI API
echo "7️⃣  Starting LCI API..."
cd /Users/sardag/Desktop/ailydian-ultra-pro/apps/lci-api
echo -e "${YELLOW}Starting API server on http://localhost:3201${NC}"
npm run start:dev &
API_PID=$!
echo "   API PID: $API_PID"
echo ""

# Wait for API to start
echo "8️⃣  Waiting for API to be ready..."
sleep 10
echo -e "${GREEN}✅ API is starting${NC}"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}🎉 LCI Platform Started Successfully!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📍 Services:"
echo "   • PostgreSQL: localhost:5432"
echo "   • LCI API:    http://localhost:3201"
echo "   • Health:     http://localhost:3201/health"
echo ""
echo "👤 Demo Accounts:"
echo "   • Admin:      admin@lci.lydian.ai / Demo1234!"
echo "   • Moderator:  moderator@lci.lydian.ai / Demo1234!"
echo "   • User:       ahmet.yilmaz@gmail.com / Demo1234!"
echo ""
echo "🧪 Run E2E Tests:"
echo "   cd /Users/sardag/Desktop/ailydian-ultra-pro/apps/lci-api"
echo "   npm run test:e2e"
echo ""
echo "📚 Documentation:"
echo "   • API Reference: apps/lci-api/API-REFERENCE.md"
echo "   • Production Checklist: apps/lci-api/PRODUCTION-READINESS.md"
echo ""
echo "🛑 To stop:"
echo "   docker-compose down (in infra/lci-db)"
echo "   kill $API_PID (to stop API)"
echo ""
