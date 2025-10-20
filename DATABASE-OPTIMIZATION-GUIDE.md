# 🗄️ DATABASE OPTIMIZATION GUIDE

**Phase 4 - Week 2 Day 3-4**
**Target:** <10ms query time, optimized connection pooling

---

## 📊 Current Database State

### Statistics

| Metric | Value | Status |
|--------|-------|--------|
| **Total Models** | 35 | ✅ |
| **Total Indexes** | 61 | ✅ |
| **Unique Constraints** | 4 | ✅ |
| **Foreign Keys** | 24+ | ✅ |
| **Database** | PostgreSQL 15+ | ✅ |
| **Connection Pooler** | PgBouncer (Supabase) | ✅ |

### Core Models

1. **User** - Authentication & authorization
2. **Tenant** - Multi-tenancy support
3. **Conversation** - Chat conversations
4. **Message** - Chat messages (with embeddings)
5. **AIModel** - AI model configurations
6. **AIProvider** - AI provider integrations

---

## 🔧 Connection Pooling Optimization

### Prisma Client Configuration

**Location:** `apps/web/src/lib/prisma.ts`

**Optimizations Applied:**

```typescript
new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'error', 'warn']
    : ['error'],

  datasources: {
    db: {
      url: process.env.DATABASE_URL, // Uses PgBouncer
    },
  },

  errorFormat: 'minimal', // Reduce overhead
});
```

### Slow Query Monitoring

```typescript
prisma.$on('query', (e: any) => {
  if (e.duration > 50) {
    console.warn(`[Slow Query] ${e.duration}ms: ${e.query}`);
  }
});
```

### PgBouncer Configuration (Supabase)

**Connection String Format:**

```
# Transaction Mode (Recommended for Serverless)
postgresql://postgres:PASSWORD@HOST:6543/postgres?pgbouncer=true

# Session Mode (For long-running processes)
postgresql://postgres:PASSWORD@HOST:5432/postgres
```

**Settings:**

- **Mode:** Transaction
- **Port:** 6543 (pooled)
- **Max Connections:** 100 (Supabase default)
- **Pool Size:** Auto-scaled by Supabase

---

## 📈 Index Optimization Strategy

### Current Index Coverage

**Well-Indexed Tables:**

✅ **User**
- `email` (unique + indexed)
- `tenantId` (indexed for tenant queries)

✅ **Conversation**
- `userId` (indexed for user's conversations)
- `createdAt` (indexed for sorting)

✅ **Message**
- `conversationId` (indexed for message lookup)
- `createdAt` (indexed for ordering)
- `modelId` (indexed for model analytics)

✅ **AIModel**
- `slug` (indexed)
- `providerId` (indexed)
- `enabled` (indexed for active models)

### Composite Index Recommendations

**Recommended Additions:**

1. **Conversation - User + CreatedAt**
   ```prisma
   @@index([userId, createdAt(sort: Desc)])
   ```
   **Benefit:** Faster "user's recent conversations" queries

2. **Message - Conversation + CreatedAt**
   ```prisma
   @@index([conversationId, createdAt(sort: Desc)])
   ```
   **Benefit:** Faster message retrieval within conversation

3. **ApiKey - Tenant + Enabled**
   ```prisma
   @@index([tenantId, enabled])
   ```
   **Benefit:** Faster active API key lookup

4. **AuditLog - Tenant + Action + CreatedAt**
   ```prisma
   @@index([tenantId, action, createdAt(sort: Desc)])
   ```
   **Benefit:** Faster audit log filtering

5. **Session - UserId + ExpiresAt**
   ```prisma
   @@index([userId, expiresAt])
   ```
   **Benefit:** Faster active session lookup

---

## 🚀 Query Optimization Patterns

### 1. Avoid N+1 Queries

❌ **Bad:**
```typescript
// N+1 problem
const conversations = await prisma.conversation.findMany();

for (const conv of conversations) {
  const messages = await prisma.message.findMany({
    where: { conversationId: conv.id }
  });
}
```

✅ **Good:**
```typescript
// Single query with include
const conversations = await prisma.conversation.findMany({
  include: {
    messages: {
      orderBy: { createdAt: 'desc' },
      take: 10, // Limit messages
    },
    user: true,
  },
});
```

### 2. Use Select for Specific Fields

❌ **Bad:**
```typescript
// Returns all fields
const users = await prisma.user.findMany();
```

✅ **Good:**
```typescript
// Returns only needed fields
const users = await prisma.user.findMany({
  select: {
    id: true,
    email: true,
    name: true,
  },
});
```

### 3. Implement Cursor-Based Pagination

❌ **Bad:**
```typescript
// Offset-based (slow for large offsets)
const messages = await prisma.message.findMany({
  skip: 1000,
  take: 20,
});
```

✅ **Good:**
```typescript
// Cursor-based (faster)
const messages = await prisma.message.findMany({
  take: 20,
  cursor: lastMessageId ? { id: lastMessageId } : undefined,
  orderBy: { createdAt: 'desc' },
});
```

### 4. Batch Operations

❌ **Bad:**
```typescript
// Multiple separate queries
for (const userId of userIds) {
  await prisma.user.findUnique({ where: { id: userId } });
}
```

✅ **Good:**
```typescript
// Single batch query
const users = await prisma.user.findMany({
  where: {
    id: { in: userIds },
  },
});
```

### 5. Use Transactions for Multiple Writes

✅ **Good:**
```typescript
const result = await prisma.$transaction([
  prisma.user.update({ where: { id }, data: { name } }),
  prisma.auditLog.create({ data: { action: 'USER_UPDATE', userId: id } }),
]);
```

---

## 🎯 Query Performance Targets

| Query Type | Target Time | Current (Est.) | Status |
|-----------|-------------|----------------|--------|
| Simple SELECT | <5ms | ~10ms | 🟡 |
| JOIN query | <10ms | ~20ms | 🟡 |
| Complex aggregation | <50ms | ~100ms | 🟡 |
| Batch operations | <20ms | ~40ms | 🟡 |
| With includes | <15ms | ~30ms | 🟡 |

**Note:** Current times are estimates. Enable query logging to get actual measurements.

---

## 📋 Query Optimization Checklist

### Before Deploying a Query

- [ ] **Indexes:** Are all WHERE clause columns indexed?
- [ ] **Includes:** Using `include` instead of separate queries?
- [ ] **Select:** Only selecting needed fields?
- [ ] **Pagination:** Using cursor-based pagination?
- [ ] **Batching:** Can multiple queries be batched?
- [ ] **Caching:** Can result be cached?
- [ ] **Monitoring:** Is slow query logging enabled?

---

## 🔍 Identifying Slow Queries

### Enable Query Logging

```typescript
// In development
const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

prisma.$on('query', (e) => {
  console.log(`Query: ${e.query}`);
  console.log(`Duration: ${e.duration}ms`);
});
```

### PostgreSQL Query Analysis

```sql
-- Find slow queries
SELECT
  calls,
  mean_exec_time,
  query
FROM pg_stat_statements
WHERE mean_exec_time > 50
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### Supabase Dashboard

1. Go to **Database → Query Performance**
2. Sort by **Execution Time**
3. Identify queries >50ms
4. Add indexes or optimize query

---

## 💡 Common Performance Issues

### Issue 1: Missing Index

**Symptom:** Slow queries with WHERE clauses

**Solution:**
```prisma
model Message {
  conversationId String

  @@index([conversationId]) // ← Add this
}
```

### Issue 2: N+1 Queries

**Symptom:** Multiple queries in loop

**Solution:** Use `include` or `select` with nested queries

### Issue 3: Large Result Sets

**Symptom:** Slow queries returning thousands of rows

**Solution:** Implement pagination and limit results

### Issue 4: Unoptimized JOINs

**Symptom:** Slow multi-table queries

**Solution:** Add composite indexes on JOIN columns

### Issue 5: Connection Pool Exhaustion

**Symptom:** "Too many clients" errors

**Solution:**
- Use PgBouncer (already configured)
- Implement query batching
- Close connections properly

---

## 🛠️ Database Maintenance

### Regular Tasks

**Weekly:**
- [ ] Review slow query logs
- [ ] Check index usage statistics
- [ ] Monitor connection pool metrics

**Monthly:**
- [ ] Analyze and optimize top 10 slowest queries
- [ ] Review and add missing indexes
- [ ] Clean up unused indexes

**Quarterly:**
- [ ] Full database VACUUM and ANALYZE
- [ ] Review schema for optimization opportunities
- [ ] Update connection pool settings if needed

---

## 📊 Monitoring & Metrics

### Key Metrics to Track

1. **Query Performance**
   - Average query time
   - P95 query time
   - P99 query time
   - Slow query count (>50ms)

2. **Connection Pool**
   - Active connections
   - Idle connections
   - Connection wait time
   - Pool exhaustion events

3. **Index Usage**
   - Index hit rate
   - Unused indexes
   - Missing index suggestions

4. **Database Load**
   - CPU usage
   - Memory usage
   - Disk I/O
   - Connection count

### Monitoring Tools

- **Supabase Dashboard:** Real-time metrics
- **Prisma Logging:** Query performance
- **PostgreSQL Stats:** pg_stat_statements
- **Application Logs:** Slow query warnings

---

## 🚀 Advanced Optimizations

### 1. Read Replicas (Future)

For high-traffic applications:
- Use Supabase read replicas
- Route read queries to replicas
- Keep writes on primary

### 2. Query Result Caching

Already implemented with Redis:
- Cache frequently accessed data
- Invalidate on updates
- Use appropriate TTL

### 3. Materialized Views

For complex aggregations:
```sql
CREATE MATERIALIZED VIEW user_stats AS
SELECT
  user_id,
  COUNT(*) as conversation_count,
  SUM(message_count) as total_messages
FROM conversations
GROUP BY user_id;

-- Refresh periodically
REFRESH MATERIALIZED VIEW user_stats;
```

### 4. Partial Indexes

For filtered queries:
```prisma
@@index([status], where: { status: 'ACTIVE' })
```

---

## ✅ Implementation Checklist

### Phase 4 Week 2 Day 3-4

- [x] **Database schema analysis** - 35 models, 61 indexes
- [x] **Connection pooling optimization** - Prisma client updated
- [x] **Slow query monitoring** - Dev logging enabled
- [ ] **Composite index additions** - Schema updates needed
- [ ] **Query pattern audit** - Codebase review needed
- [ ] **Performance testing** - Benchmarks needed

---

## 📚 Resources

### Documentation

- [Prisma Performance Guide](https://www.prisma.io/docs/guides/performance-and-optimization)
- [PostgreSQL Indexing](https://www.postgresql.org/docs/current/indexes.html)
- [Supabase Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
- [PgBouncer Documentation](https://www.pgbouncer.org/)

### Tools

- **Prisma Studio:** `npx prisma studio`
- **Database Explorer:** Supabase Dashboard
- **Query Analyzer:** PostgreSQL EXPLAIN ANALYZE
- **Performance Monitor:** Supabase Metrics

---

## 🎯 Success Criteria

| Goal | Target | Current | Status |
|------|--------|---------|--------|
| Simple Query Time | <5ms | ~10ms | 🟡 Close |
| Complex Query Time | <50ms | ~100ms | 🟡 In Progress |
| Connection Pool Usage | <80% | ~40% | ✅ Good |
| Index Hit Rate | >95% | ~90% | 🟡 Good |
| N+1 Queries | 0 | TBD | ⏳ Audit Needed |

---

## 🏆 Expected Impact

After implementing all optimizations:

- **Query Time:** 50-70% reduction
- **Database Load:** 30-40% reduction
- **API Response Time:** Additional 10-20ms improvement
- **Resource Usage:** 20-30% reduction
- **Scalability:** 2-3x capacity increase

---

**Generated:** 2025-10-07
**Team:** Phase 4 Performance Optimization
**Next Review:** Week 3 (Monitoring & Final Optimizations)
