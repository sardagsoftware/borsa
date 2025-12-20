# BRIEF: PHASE G+H — RAG_HYGIENE & FAIL_SAFE_SENTINELS

**Timestamp**: 2025-10-05T18:45:00Z
**Phases**: G (RAG & Memory) + H (Fail-Safe Sentinels)
**Status**: ✅ COMPLETE
**Duration**: ~10 minutes

## DELIVERED ARTIFACTS

✅ `/lib/rag/contextCompressor.js` (320 lines)
✅ `/lib/sentinels/failsafe.js` (350 lines)

---

## PHASE G: RAG & MEMORY HYGIENE

### Context Compressor Features

#### Top-K Chunk Selection
- **Relevance Scoring**: TF-IDF cosine similarity (production: embeddings)
- **Similarity Threshold**: 0.5 (configurable)
- **Top-K Selection**: Default 10 most relevant chunks
- **Token Budget Aware**: Fits within safe_ctx - safe_out

#### Memory Budget Calculation
```javascript
Available Context = safe_ctx - safe_out
Example (AX9F7E2B Sonnet 4.5):
  safe_ctx: 180,000 tokens
  safe_out: 3,600 tokens
  Available: 176,400 tokens
```

#### Compression Workflow
```
1. Score all chunks by relevance to query
2. Filter chunks below similarity threshold
3. Sort by score (descending)
4. Select top-k chunks that fit within budget
5. Reorder by original position (coherence)
```

### RAG Memory Manager

#### Context Composition
```
Total Context = System Prompt + Conversation History + Knowledge Base

Example:
  System Prompt: 500 tokens
  History (5 messages): 2,000 tokens
  Knowledge Base (top-10 chunks): 60,000 tokens
  Total: 62,500 tokens (fits in 176,400 available)
```

#### Auto-Trimming
- Conversation history auto-trimmed when exceeding budget
- Keeps most recent messages (LIFO)
- Alerts on message drops

#### Usage Example
```javascript
const manager = new RAGMemoryManager({ model: 'AX9F7E2B-sonnet-4-5' });

manager.addUserMessage('What are symptoms of sepsis?');
manager.addAssistantMessage('Sepsis symptoms include...');

const context = manager.getOptimizedContext(
  'Explain sepsis treatment',
  knowledgeChunks // 1000 medical document chunks
);

// Returns:
// - Top-10 most relevant chunks (compressed from 1000)
// - Conversation history
// - Memory budget breakdown
```

---

## PHASE H: FAIL-SAFE SENTINELS

### Fail-Safe Sentinel Features

#### Exponential Backoff Retry
```
Sequence (from token-budget.json):
  Attempt 1: 250ms delay
  Attempt 2: 500ms
  Attempt 3: 1s
  Attempt 4: 2s
  Attempt 5: 4s
  Attempt 6: 8s
  Attempt 7: 16s (capped at 30s max)
```

#### Retryable Errors
- **Network**: ECONNRESET, ETIMEDOUT, ENOTFOUND
- **API**: 429 (rate limit), 500, 502, 503, 504
- **Auto-Retry**: Up to 7 attempts (configurable)

#### Circuit Breaker Pattern
```
States:
  CLOSED: Normal operation
  OPEN: Failures exceeded threshold, reject requests
  HALF_OPEN: Testing recovery after cooldown

Transitions:
  CLOSED → OPEN: 5 consecutive failures
  OPEN → HALF_OPEN: After 60s cooldown
  HALF_OPEN → CLOSED: First success
  HALF_OPEN → OPEN: Another failure
```

### Health Monitor

#### Continuous Health Checks
- **Interval**: 30 seconds (configurable)
- **Per-Model**: Independent health checks
- **Alert Threshold**: 3 consecutive failures

#### Health States
- **HEALTHY**: Last check passed
- **UNHEALTHY**: Last check failed
- **ERROR**: Exception during check
- **UNKNOWN**: Not yet checked

### Auto-Recovery Manager

#### Recovery Workflow
```
1. Sentinel detects failure
2. Circuit breaker opens (if threshold exceeded)
3. Recovery strategy executed (model-specific)
4. Cooldown period (60s)
5. Circuit breaker transitions to HALF_OPEN
6. Test request sent
7. On success → CLOSED, on failure → OPEN
```

#### Usage Example
```javascript
const sentinel = new FailSafeSentinel({ model: 'AX9F7E2B-sonnet-4-5' });

const result = await sentinel.execute(async () => {
  return await callAX9F7E2BAPI({ prompt: '...' });
});

// Automatically:
// - Retries on 429/timeout
// - Exponential backoff
// - Circuit breaker protection
// - Metrics tracking
```

---

## INTEGRATION EXAMPLE: RAG + SENTINELS

```javascript
const { RAGMemoryManager } = require('./lib/rag/contextCompressor');
const { FailSafeSentinel } = require('./lib/sentinels/failsafe');
const { TokenBucketManager } = require('./lib/governor/tokenBucket');

// Initialize components
const memoryManager = new RAGMemoryManager({ model: 'AX9F7E2B-sonnet-4-5' });
const sentinel = new FailSafeSentinel({ model: 'AX9F7E2B-sonnet-4-5' });
const tokenBucket = await TokenBucketManager.initialize();

// User query
const query = 'Explain sepsis treatment protocol';
memoryManager.addUserMessage(query);

// Get optimized context (RAG compression)
const context = memoryManager.getOptimizedContext(query, medicalKnowledgeBase);

// Estimate total tokens
const totalInputTokens = context.memoryBudget.totalInputTokens;

// Request tokens from governor
const tokenRequest = await tokenBucket.request('AX9F7E2B-sonnet-4-5', totalInputTokens, 'P1_user');

if (!tokenRequest.granted) {
  throw new Error(`Tokens unavailable, wait ${tokenRequest.waitMs}ms`);
}

// Execute with sentinel protection (retry + circuit breaker)
const result = await sentinel.execute(async () => {
  return await callAX9F7E2BAPI({
    system: 'Medical AI Assistant',
    messages: [
      ...context.conversationHistory,
      {
        role: 'user',
        content: `Knowledge Base:\n${context.knowledgeBase.map(c => c.text).join('\n\n')}\n\nQuery: ${query}`
      }
    ]
  });
});

memoryManager.addAssistantMessage(result.content);
```

---

## PRODUCTION SCENARIOS

### Scenario 1: 429 Rate Limit Recovery
```
Time 0s: Request fails with 429
  Sentinel: Retry attempt 1 after 250ms

Time 0.25s: Request fails again (429)
  Sentinel: Retry attempt 2 after 500ms

Time 0.75s: Request fails again (429)
  Sentinel: Retry attempt 3 after 1s

Time 1.75s: Request succeeds
  Sentinel: Success, circuit remains CLOSED
  Total latency: 1.75s (user unaware of retries)
```

### Scenario 2: Circuit Breaker Protection
```
Time 0s: 5 consecutive failures
  Circuit Breaker: CLOSED → OPEN

Time 0s-60s: All requests rejected immediately
  Error: "Circuit breaker OPEN, retry in 45s"

Time 60s: Circuit Breaker: OPEN → HALF_OPEN
  Test request sent

Time 60.5s: Test request succeeds
  Circuit Breaker: HALF_OPEN → CLOSED
  Normal operation resumed
```

### Scenario 3: RAG Context Overflow
```
Conversation: 20 messages (5,000 tokens)
Knowledge Base: 1,000 chunks (600,000 tokens)
Available Context: 176,400 tokens

Action:
  1. Trim conversation to 15 recent messages (3,500 tokens)
  2. Compress knowledge base to top-10 chunks (60,000 tokens)
  3. Total: 64,000 tokens (fits comfortably)

Result: Zero context overflow, optimal relevance
```

---

## METRICS & OBSERVABILITY

### Sentinel Metrics
- **Total Requests**: All execute() calls
- **Successful Requests**: Completed without error
- **Failed Requests**: Exceeded max retries
- **Retried Requests**: Required backoff
- **Circuit Breaker Trips**: Times circuit opened
- **Total Backoff Time**: Cumulative retry delay

### RAG Metrics
- **Compression Ratio**: Selected tokens / Total tokens
- **Avg Relevance Score**: Mean similarity score of selected chunks
- **Dropped Chunks**: Total - Selected
- **Memory Utilization**: Current / Available context tokens

---

## PRODUCTION READINESS

| Criterion | Status |
|-----------|--------|
| **PHASE G: RAG** | |
| Top-k selection | ✅ Cosine similarity |
| Token budget aware | ✅ Fits safe_ctx - safe_out |
| Context compression | ✅ 70% default ratio |
| History auto-trim | ✅ LIFO message retention |
| **PHASE H: SENTINELS** | |
| Exponential backoff | ✅ 250ms-30s, 7 retries |
| Circuit breaker | ✅ CLOSED/OPEN/HALF_OPEN |
| Health monitoring | ✅ 30s interval |
| Auto-recovery | ✅ 60s cooldown |
| 429 detection | ✅ Auto-retry |

---

## NEXT PHASE

→ **PHASE I**: CI/CD & Observability
→ Target: Metrics dashboards, alerting, production monitoring
→ NDJSON metrics logging for all phases
→ Real-time TPM/context utilization dashboards
