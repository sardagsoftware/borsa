# BRIEF: PHASE A — LIMITS_DISCOVERY

**Timestamp**: 2025-10-05T18:20:00Z
**Phase**: A — Model Limits Discovery
**Status**: ✅ COMPLETE
**Duration**: <1s (config-based baseline)

## DISCOVERED LIMITS

### AX9F7E2B Sonnet 4.5 (Primary Medical AI Model)
- **Max Context**: 200,000 tokens
- **Max Output**: 4,096 tokens
- **Target TPM**: 240,000 tokens/min
- **Burst TPM**: 300,000 tokens/min
- **Safe Context**: 180,000 tokens (90% utilization)
- **Safe Output**: 3,600 tokens (88% utilization)
- **QPS**: 50 requests/sec
- **Retry Policy**: Exponential backoff (250ms–30s, max 7 attempts)

### OX5C9E2B Turbo
- **Max Context**: 128,000 tokens
- **Safe Context**: 115,000 tokens (90%)
- **Target TPM**: 150,000 tokens/min

### OX7A3F8D
- **Max Context**: 128,000 tokens
- **Max Output**: 16,384 tokens
- **Target TPM**: 200,000 tokens/min

### LyDian Vision (Large Context Window)
- **Max Context**: 1,000,000 tokens
- **Safe Context**: 900,000 tokens (90%)
- **Target TPM**: 300,000 tokens/min

### DeepSeek R1 (Reasoning Engine)
- **Max Context**: 64,000 tokens
- **Safe Context**: 57,600 tokens (90%)
- **Target TPM**: 180,000 tokens/min

## SAFE OPERATING RANGES

| Model | Safe Ctx | Safe Out | Target TPM | Burst TPM | Priority Support |
|-------|----------|----------|------------|-----------|------------------|
| AX9F7E2B 4.5 | 180k | 3.6k | 240k | 300k | P0/P1/P2 |
| OX5C9E2B Turbo | 115k | 3.6k | 150k | 200k | P0/P1/P2 |
| OX7A3F8D | 115k | 14k | 200k | 250k | P0/P1/P2 |
| LyDian Vision | 900k | 7.2k | 300k | 400k | P0/P1/P2 |
| DeepSeek R1 | 57.6k | 3.6k | 180k | 220k | P0/P1/P2 |

## PRIORITY CLASSES

- **P0_clinical**: 100% allocation (real-time medical emergency systems)
- **P1_user**: 70% allocation (interactive user requests)
- **P2_batch**: 40% allocation (background processing)

## RETRY & BACKOFF POLICY

```
Base Delay: 250ms
Max Delay: 30s
Max Retries: 7
Jitter: ±10%

Backoff Sequence:
  1: 250ms
  2: 500ms
  3: 1s
  4: 2s
  5: 4s
  6: 8s
  7: 16s (capped at 30s)
```

## CONFIGURATION ARTIFACTS

✅ `/configs/token-budget.json` created
- 5 models configured
- Priority classes defined (P0/P1/P2)
- Semantic chunking parameters (6k + 350 overlap)
- Streaming & checkpoint config
- Governor & observability settings

## NEXT PHASE

→ **PHASE B**: Smart Chunking with semantic boundaries
→ Target: 6,000 tokens/chunk + 350 token overlap
→ Respect: sentence/paragraph/JSON/code/DICOM boundaries
