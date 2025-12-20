# 🗄️ ACE Governance Database Setup Guide

**Date**: 2025-10-18
**Project**: AILydian Ultra Pro - AI Compliance Engine
**Status**: Ready for Production Database Setup

---

## 📋 Overview

This guide explains how to set up the PostgreSQL database for the AI Governance (ACE) system.

### Database Models Added

- **GovernanceModel**: AI models registered in the governance system
- **ComplianceCheck**: Compliance validation results (GDPR, HIPAA, CCPA, SOC2)
- **TrustIndex**: 5-dimensional trust scores for models
- **KillSwitch**: Emergency shutdown controls
- **CircuitBreaker**: Automated failure protection
- **GovernanceAuditLog**: Complete audit trail

---

## 🚀 Quick Start

### Option 1: Supabase (Recommended for Production)

1. **Create Supabase Project**:
   ```bash
   # Go to https://supabase.com/dashboard
   # Create new project
   # Note down your connection strings
   ```

2. **Get Connection Strings**:
   ```
   Database URL: postgresql://postgres:[password]@[host]:5432/postgres
   Direct URL (for migrations): postgresql://postgres:[password]@[host]:5432/postgres?pgbouncer=true&connection_limit=1
   ```

3. **Set Environment Variables**:
   ```bash
   # Add to .env file
   DATABASE_URL="postgresql://postgres:[password]@[host]:5432/postgres"
   DIRECT_URL="postgresql://postgres:[password]@[host]:5432/postgres?pgbouncer=true&connection_limit=1"
   ```

4. **Run Migration**:
   ```bash
   npx prisma migrate deploy --schema=./infra/prisma/schema.prisma
   ```

### Option 2: Local PostgreSQL (Development)

1. **Install PostgreSQL**:
   ```bash
   # macOS
   brew install postgresql@16
   brew services start postgresql@16

   # Ubuntu/Debian
   sudo apt-get install postgresql-16
   sudo systemctl start postgresql
   ```

2. **Create Database**:
   ```bash
   psql postgres
   CREATE DATABASE ailydian_ace;
   CREATE USER ace_user WITH ENCRYPTED PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE ailydian_ace TO ace_user;
   \q
   ```

3. **Set Environment Variables**:
   ```bash
   # Add to .env file
   DATABASE_URL="postgresql://ace_user:your_password@localhost:5432/ailydian_ace"
   DIRECT_URL="postgresql://ace_user:your_password@localhost:5432/ailydian_ace"
   ```

4. **Run Migration**:
   ```bash
   npx prisma migrate deploy --schema=./infra/prisma/schema.prisma
   ```

### Option 3: Neon (Serverless PostgreSQL)

1. **Create Neon Project**:
   ```bash
   # Go to https://neon.tech
   # Create new project
   # Copy connection string
   ```

2. **Set Environment Variables**:
   ```bash
   # Add to .env file
   DATABASE_URL="postgresql://[user]:[password]@[host]/[database]?sslmode=require"
   DIRECT_URL="postgresql://[user]:[password]@[host]/[database]?sslmode=require"
   ```

3. **Run Migration**:
   ```bash
   npx prisma migrate deploy --schema=./infra/prisma/schema.prisma
   ```

---

## 🔧 Prisma Commands

### Generate Client
```bash
npx prisma generate --schema=./infra/prisma/schema.prisma
```

### View Database in Studio
```bash
npx prisma studio --schema=./infra/prisma/schema.prisma
```

### Check Migration Status
```bash
npx prisma migrate status --schema=./infra/prisma/schema.prisma
```

### Reset Database (Development Only)
```bash
npx prisma migrate reset --schema=./infra/prisma/schema.prisma
```

---

## 📊 Database Schema

### GovernanceModel
```sql
CREATE TABLE "GovernanceModel" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  version TEXT NOT NULL,
  description TEXT,
  provider TEXT NOT NULL,
  status GovernanceModelStatus DEFAULT 'ACTIVE',
  metadata JSONB,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP,
  ownerId TEXT REFERENCES "User"(id)
);
```

**Indexes**:
- `ownerId`, `status`, `provider`, `createdAt`

### ComplianceCheck
```sql
CREATE TABLE "ComplianceCheck" (
  id TEXT PRIMARY KEY,
  modelId TEXT REFERENCES "GovernanceModel"(id) ON DELETE CASCADE,
  framework TEXT NOT NULL,  -- GDPR, HIPAA, CCPA, SOC2
  score INTEGER NOT NULL,
  compliant BOOLEAN NOT NULL,
  results JSONB NOT NULL,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP
);
```

**Indexes**:
- `modelId`, `framework`, `compliant`, `createdAt`

### TrustIndex
```sql
CREATE TABLE "TrustIndex" (
  id TEXT PRIMARY KEY,
  modelId TEXT REFERENCES "GovernanceModel"(id) ON DELETE CASCADE,
  globalScore DOUBLE PRECISION NOT NULL,
  tier TEXT NOT NULL,  -- PLATINUM, GOLD, SILVER, BRONZE, UNVERIFIED
  transparency DOUBLE PRECISION NOT NULL,
  accountability DOUBLE PRECISION NOT NULL,
  fairness DOUBLE PRECISION NOT NULL,
  privacy DOUBLE PRECISION NOT NULL,
  robustness DOUBLE PRECISION NOT NULL,
  calculatedAt TIMESTAMP DEFAULT NOW(),
  expiresAt TIMESTAMP NOT NULL
);
```

**Indexes**:
- `modelId`, `tier`, `globalScore`, `calculatedAt`

### KillSwitch
```sql
CREATE TABLE "KillSwitch" (
  id TEXT PRIMARY KEY,
  modelId TEXT REFERENCES "GovernanceModel"(id) ON DELETE CASCADE,
  status KillSwitchStatus NOT NULL,  -- ACTIVE, INACTIVE
  reason TEXT NOT NULL,
  triggeredBy TEXT NOT NULL,
  triggeredAt TIMESTAMP DEFAULT NOW(),
  deactivatedAt TIMESTAMP,
  updatedAt TIMESTAMP
);
```

**Indexes**:
- `modelId`, `status`, `triggeredAt`

### CircuitBreaker
```sql
CREATE TABLE "CircuitBreaker" (
  id TEXT PRIMARY KEY,
  modelId TEXT REFERENCES "GovernanceModel"(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  threshold INTEGER NOT NULL,
  windowMs INTEGER NOT NULL,
  failureCount INTEGER DEFAULT 0,
  state CircuitBreakerState NOT NULL,  -- CLOSED, OPEN, HALF_OPEN
  trips JSONB DEFAULT '[]',
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP
);
```

**Indexes**:
- `modelId`, `state`, `createdAt`

### GovernanceAuditLog
```sql
CREATE TABLE "GovernanceAuditLog" (
  id TEXT PRIMARY KEY,
  modelId TEXT REFERENCES "GovernanceModel"(id),
  userId TEXT REFERENCES "User"(id),
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  details JSONB NOT NULL,
  ipAddress TEXT,
  userAgent TEXT,
  timestamp TIMESTAMP DEFAULT NOW()
);
```

**Indexes**:
- `modelId`, `userId`, `action`, `timestamp`

---

## 🔐 Security Best Practices

### Connection Security

1. **Always use SSL/TLS**:
   ```
   ?sslmode=require
   ```

2. **Use connection pooling**:
   ```
   ?pgbouncer=true&connection_limit=10
   ```

3. **Set statement timeout**:
   ```
   ?statement_timeout=30000
   ```

### Database User Permissions

```sql
-- Create limited user for application
CREATE USER ace_app WITH PASSWORD 'strong_password';

-- Grant only necessary permissions
GRANT CONNECT ON DATABASE ailydian_ace TO ace_app;
GRANT USAGE ON SCHEMA public TO ace_app;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO ace_app;

-- Deny dangerous operations
REVOKE DELETE, TRUNCATE, DROP ON ALL TABLES IN SCHEMA public FROM ace_app;
```

### Backup Strategy

1. **Automated Daily Backups**:
   - Supabase: Enabled by default
   - Self-hosted: Use `pg_dump` in cron job

2. **Point-in-Time Recovery** (PITR):
   - Keep WAL archives for 7 days minimum
   - Test restore process monthly

3. **Backup Verification**:
   ```bash
   pg_dump -h localhost -U ace_user ailydian_ace > backup.sql
   ```

---

## 📈 Performance Optimization

### Query Performance

1. **Enable Query Performance Insights** (Supabase/Neon):
   - Monitor slow queries
   - Identify missing indexes
   - Optimize hot paths

2. **Use EXPLAIN ANALYZE**:
   ```sql
   EXPLAIN ANALYZE
   SELECT * FROM "ComplianceCheck"
   WHERE "modelId" = 'model-123'
   AND "framework" = 'GDPR';
   ```

3. **Index Strategy**:
   - All foreign keys are indexed
   - Common query patterns are indexed
   - Composite indexes for multi-column queries

### Connection Pooling

**Recommended Settings**:
```bash
# Supabase
?pgbouncer=true&connection_limit=10

# PgBouncer (self-hosted)
max_client_conn = 1000
default_pool_size = 25
min_pool_size = 5
```

---

## 🧪 Testing Database Setup

### 1. Connection Test
```bash
npx prisma db execute --schema=./infra/prisma/schema.prisma --stdin < /dev/null
```

### 2. Schema Validation
```bash
npx prisma validate --schema=./infra/prisma/schema.prisma
```

### 3. Sample Data Insert
```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testInsert() {
  // Create test user first (if not exists)
  const user = await prisma.user.upsert({
    where: { email: 'test@ailydian.com' },
    update: {},
    create: {
      email: 'test@ailydian.com',
      name: 'Test User',
      passwordHash: 'hash',
      role: 'USER',
    },
  });

  // Create test governance model
  const model = await prisma.governanceModel.create({
    data: {
      name: 'GPT-4 Test',
      version: '1.0.0',
      provider: 'OpenAI',
      ownerId: user.id,
      status: 'TESTING',
    },
  });

  console.log('✅ Test model created:', model);
}

testInsert().catch(console.error);
```

---

## 🚨 Troubleshooting

### Connection Issues

**Error**: `Environment variable not found: DATABASE_URL`
```bash
# Solution: Create .env file
echo 'DATABASE_URL="postgresql://..."' > .env
echo 'DIRECT_URL="postgresql://..."' >> .env
```

**Error**: `Can't reach database server`
```bash
# Solution: Check network connectivity
ping your-db-host.com

# Check SSL requirement
psql "postgresql://...?sslmode=disable"
```

### Migration Issues

**Error**: `Migration already applied`
```bash
# Solution: Mark as applied manually
npx prisma migrate resolve --applied 20251018_governance_models --schema=./infra/prisma/schema.prisma
```

**Error**: `Table already exists`
```bash
# Solution: Reset and reapply (development only!)
npx prisma migrate reset --schema=./infra/prisma/schema.prisma
```

---

## 📝 Environment Variables

### Required Variables

```bash
# Database Connection
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"
DIRECT_URL="postgresql://user:password@host:5432/database?sslmode=require"

# Prisma
PRISMA_SCHEMA="./infra/prisma/schema.prisma"
```

### Optional Variables

```bash
# Connection Pooling
DATABASE_POOL_MIN=5
DATABASE_POOL_MAX=25

# Query Timeouts
DATABASE_STATEMENT_TIMEOUT=30000
DATABASE_QUERY_TIMEOUT=10000

# Logging
DATABASE_LOG_QUERIES=true
DATABASE_LOG_SLOW_QUERIES=true
DATABASE_SLOW_QUERY_THRESHOLD=1000
```

---

## ✅ Migration Checklist

- [ ] Database service selected (Supabase/Neon/Local)
- [ ] Database created
- [ ] User with correct permissions created
- [ ] Environment variables set in .env
- [ ] Prisma client generated
- [ ] Migration file reviewed
- [ ] Migration applied successfully
- [ ] Database connection tested
- [ ] Sample data insert tested
- [ ] Prisma Studio accessible
- [ ] Backup strategy configured
- [ ] Monitoring enabled

---

## 🎯 Next Steps

After database setup is complete:

1. ✅ Update governance APIs to use Prisma
2. ✅ Test all API endpoints with real database
3. ✅ Implement authentication (Sprint 2.2)
4. ✅ Implement RBAC authorization
5. ✅ Deploy to production

---

**Created**: 2025-10-18
**Status**: ✅ Ready for Database Setup
**Migration File**: `infra/prisma/migrations/20251018_governance_models/migration.sql`
**Schema File**: `infra/prisma/schema.prisma`
