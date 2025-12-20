# BRIEF: PHASE E — TPM_GOVERNOR & TOKEN_BUCKET

**Timestamp**: 2025-10-05T18:35:00Z
**Phase**: E — TPM Governor & Queue Management
**Status**: ✅ COMPLETE
**Duration**: ~5 minutes

## DELIVERED ARTIFACTS

✅ `/lib/governor/redis.js` (500 lines)
✅ `/lib/governor/tokenBucket.js` (450 lines)

## REDIS ADAPTER FEATURES

### Distributed State Management
- **Primary**: Upstash Redis for serverless compatibility
- **Fallback**: In-memory Map when REDIS_URL not configured
- **Operations**: GET, SET, INCR, DECR, RPUSH, LPOP, BLPOP, HGET, HSET
- **Key Prefix**: `token-governor:` for namespace isolation

### Auto-Fallback Mechanism
```javascript
const redis = new RedisAdapter();
// If REDIS_URL missing → in-memory fallback (zero config!)
// If Redis connection fails → graceful degradation
```

### Supported Operations
| Operation | Purpose | Atomic |
|-----------|---------|--------|
| `get/set` | Basic key-value | ✅ |
| `incr/decr` | Token counter | ✅ Yes |
| `rpush/lpop` | Job queue (FIFO) | ✅ Yes |
| `blpop` | Blocking queue pop | ✅ Yes |
| `hget/hset` | Hash fields (metadata) | ✅ Yes |
| `expire` | TTL management | ✅ Yes |

## TOKEN BUCKET ALGORITHM

### Core Mechanics
- **Capacity**: Burst TPM limit (e.g., 300,000 for AX9F7E2B Sonnet 4.5)
- **Refill Rate**: Target TPM / 60 (e.g., 240,000 / 60 = 4,000 tokens/second)
- **Refill Interval**: 60 seconds (configurable)
- **Priority Classes**: P0 (clinical) = 100%, P1 (user) = 70%, P2 (batch) = 40%

### Request Flow
```
1. Request arrives → request(tokensNeeded, priority)
2. Refill bucket based on elapsed time
3. Check if tokens available
   → YES: Grant tokens, decrement bucket
   → NO: Queue job with priority, return waitMs
4. Auto-refill timer processes queued jobs (P0 → P1 → P2)
```

### Priority-Based Queuing
```javascript
// P0_clinical: Medical emergencies (100% allocation)
await bucket.request(5000, 'P0_clinical');

// P1_user: Interactive requests (70% allocation)
await bucket.request(3000, 'P1_user');

// P2_batch: Background processing (40% allocation)
await bucket.request(1000, 'P2_batch');
```

### Token Grant Response
```json
{
  "granted": true,
  "tokens": 3000,
  "remaining": 237000,
  "model": "AX9F7E2B-sonnet-4-5",
  "priority": "P1_user"
}
```

### Token Rejection Response
```json
{
  "granted": false,
  "tokens": 10000,
  "remaining": 2000,
  "waitMs": 2000,
  "queuePosition": 5,
  "model": "OX7A3F8D",
  "priority": "P2_batch"
}
```

## PRIORITY CLASS BEHAVIOR

### P0_clinical (Medical Emergencies)
- **Allocation**: 100% of requested tokens
- **Queue**: Highest priority, processed first
- **Use Case**: Sepsis detection, emergency triage, critical alerts
- **Example**:
  ```javascript
  // Request 5,000 tokens for sepsis analysis
  const result = await bucket.request(5000, 'P0_clinical');
  // Granted: 5,000 tokens (100%)
  ```

### P1_user (Interactive Requests)
- **Allocation**: 70% of requested tokens
- **Queue**: Medium priority, processed after P0
- **Use Case**: User chat, medical consultations, report generation
- **Example**:
  ```javascript
  // Request 3,000 tokens for user query
  const result = await bucket.request(3000, 'P1_user');
  // Granted: 2,100 tokens (70%)
  ```

### P2_batch (Background Processing)
- **Allocation**: 40% of requested tokens
- **Queue**: Lowest priority, processed last
- **Use Case**: Batch report generation, analytics, data processing
- **Example**:
  ```javascript
  // Request 10,000 tokens for batch job
  const result = await bucket.request(10000, 'P2_batch');
  // Granted: 4,000 tokens (40%)
  ```

## AUTO-REFILL MECHANISM

### Time-Based Refill
```javascript
// Every 60 seconds (configurable):
const elapsedSeconds = (now - lastRefill) / 1000;
const tokensToAdd = refillRate * elapsedSeconds;
const newTokens = min(current + tokensToAdd, capacity);

// Example:
// Refill rate: 4,000 tokens/second
// Elapsed: 60 seconds
// Tokens added: 4,000 × 60 = 240,000 (up to capacity)
```

### Refill Logs
```
[TokenBucket] Refilled AX9F7E2B-sonnet-4-5: +240000 tokens (60000 → 300000)
[TokenBucket] Processed 3 jobs from P0_clinical queue
[TokenBucket] Processed 7 jobs from P1_user queue
```

## QUEUE PROCESSING

### Priority-Based Processing
```javascript
// Process queues in order: P0 → P1 → P2
// Up to 10 jobs per cycle per priority
for (const priority of ['P0_clinical', 'P1_user', 'P2_batch']) {
  const job = await redis.lpop(queueKey);
  const result = await bucket.request(job.tokensNeeded, priority);

  if (!result.granted) {
    // Re-queue if still not enough tokens
    await redis.rpush(queueKey, jobJson);
    break; // Stop processing this priority
  }
}
```

### Wait Time Calculation
```javascript
const tokensShort = tokensNeeded - currentTokens;
const waitSeconds = tokensShort / refillRate;
const waitMs = waitSeconds * 1000;

// Example:
// Needed: 10,000 tokens
// Available: 2,000 tokens
// Short: 8,000 tokens
// Refill rate: 4,000 tokens/second
// Wait: 8,000 / 4,000 = 2 seconds = 2000ms
```

## TOKEN BUCKET MANAGER

### Multi-Model Orchestration
```javascript
const manager = new TokenBucketManager();
await manager.initialize();

// Initializes buckets for all models in token-budget.json:
// - AX9F7E2B-sonnet-4-5
// - OX7A3F8D
// - OX7A3F8D
// - GE6D8A4F
// - deepseek-r1
```

### Request Routing
```javascript
// Request tokens for specific model
const result = await manager.request('AX9F7E2B-sonnet-4-5', 5000, 'P1_user');
```

### Health Monitoring
```javascript
// Runs every 5 seconds (configurable)
await manager.checkHealth();

// Alerts:
// - High rejection rate (>5%)
// - Queue buildup (>100 jobs)
```

### Global Status
```json
{
  "buckets": {
    "AX9F7E2B-sonnet-4-5": {
      "capacity": 300000,
      "available": 237000,
      "utilizationPct": "21.00",
      "queueLengths": {
        "P0_clinical": 0,
        "P1_user": 3,
        "P2_batch": 12
      }
    },
    "OX7A3F8D": {
      "capacity": 250000,
      "available": 198000,
      "utilizationPct": "20.80"
    }
  }
}
```

## PRODUCTION SCENARIOS

### Scenario 1: Burst Traffic (P0 Clinical Emergency)
```
Time 0s: P0 sepsis alert arrives (5,000 tokens needed)
  Bucket: 300,000 tokens available
  Action: Grant immediately, 295,000 remaining

Time 1s: Another P0 alert (5,000 tokens)
  Bucket: 295,000 tokens
  Action: Grant immediately, 290,000 remaining

Result: Zero delay for medical emergencies
```

### Scenario 2: TPM Exhaustion (P1 User Requests)
```
Time 0s: 50 users send queries (3,000 tokens each = 150,000 total)
  Bucket: 120,000 available
  Action: Grant 40 users, queue 10 users
  Queue wait: ~7.5 seconds (30,000 tokens / 4,000 refill rate)

Time 7s: Refill +28,000 tokens
  Action: Process 9 queued users, 1 still waiting

Time 8s: Refill +4,000 tokens
  Action: Process last queued user

Result: All users served within 8 seconds
```

### Scenario 3: Priority Override (P0 vs P2)
```
Time 0s: P2 batch job queued (100,000 tokens)
  Queue: [P2_batch: job-1]

Time 1s: P0 sepsis alert arrives (5,000 tokens)
  Queue processing order: P0 first
  Action: Grant P0 immediately, P2 waits

Result: Medical emergencies always prioritized
```

## METRICS & OBSERVABILITY

### Per-Bucket Metrics
- **Total Requests**: All token requests
- **Accepted Requests**: Tokens granted immediately
- **Rejected Requests**: Jobs queued
- **Tokens Consumed**: Total tokens allocated
- **Refill Count**: Number of refills performed
- **Queue Lengths**: Jobs waiting per priority

### Health Alerts
| Alert | Threshold | Action |
|-------|-----------|--------|
| High rejection rate | >5% | Scale model capacity |
| Queue buildup | >100 jobs | Increase refill rate |
| Bucket exhausted | 0 tokens | Emergency refill |

## INTEGRATION WITH OTHER PHASES

### Phase C (Streaming & Output Cap)
```javascript
const { SSEStreamer } = require('./lib/io/streaming');
const { TokenBucketManager } = require('./lib/governor/tokenBucket');

const manager = await TokenBucketManager.initialize();
const result = await manager.request('AX9F7E2B-sonnet-4-5', estimatedTokens, 'P1_user');

if (result.granted) {
  const streamer = new SSEStreamer(res, { model: 'AX9F7E2B-sonnet-4-5' });
  // Proceed with streaming
} else {
  // Queue job, notify user of wait time
  res.status(429).json({ waitMs: result.waitMs, queuePosition: result.queuePosition });
}
```

### Phase D (Checkpoint & Resume)
```javascript
const { ResumeEngine } = require('./lib/checkpoints/resumeEngine');
const { TokenBucket } = require('./lib/governor/tokenBucket');

const engine = await resumeEngineManager.getEngine(jobId);
const pending = engine.getPendingChunks();

for (const chunk of pending) {
  const result = await bucket.request(chunk.tokens, 'P2_batch');

  if (result.granted) {
    // Process chunk
    await engine.markProcessed(chunk.id);
  } else {
    // Wait for refill, retry later
    await sleep(result.waitMs);
  }
}
```

## PRODUCTION READINESS

| Criterion | Status |
|-----------|--------|
| Distributed TPM limiting | ✅ Redis-backed |
| Priority-based queuing | ✅ P0 > P1 > P2 |
| Auto-refill mechanism | ✅ Time-based |
| Queue processing | ✅ Priority order |
| Health monitoring | ✅ 5s interval |
| 429 backoff | ✅ Wait time calculation |
| In-memory fallback | ✅ Zero-config |

## NEXT PHASE

→ **PHASE F**: Map-Reduce for Large Jobs
→ Target: Shard large documents across parallel workers
→ Distribute chunks to multiple models (load balancing)
→ Aggregate results from parallel execution
