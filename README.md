# Ailydian Ultra Pro

Enterprise-Grade AI Chat Core with Multi-Provider Routing, Real-Time Quality Estimation, and Production-Grade Security.

## 🚀 Features

### Sprint v2 - Core Chat Infrastructure ✅
- ✅ Multi-provider AI adapter layer (OpenAI, with extensibility for Anthropic, Gemini, etc.)
- ✅ Smart routing with circuit breaker pattern
- ✅ Full conversation persistence with PostgreSQL + Prisma
- ✅ Streaming and non-streaming chat completion
- ✅ Token usage and cost tracking
- ✅ Next.js 14 App Router frontend
- ✅ RESTful API endpoints

### Upcoming Sprints

#### v3 - Personalized Routing + Cost Optimization
- Intent inference from user queries
- Per-user model preferences
- Dynamic cost/latency/quality routing

#### v4-v8 - RAG + Privacy + Orchestration
- Vector embeddings with pgvector
- Differential privacy (ε-accounting)
- K-anonymity guarantees
- DAG-based multimodal orchestration

#### v9-v11 - Quality & Bandit
- Real-time quality estimation (RQE)
- Thompson sampling bandit for model selection
- Provenance tracking and watermarking
- Explainability (LIME/SHAP)

#### v12-v14 - Scale & Resilience
- Semantic caching with SimHash
- Multi-region active-active (CRDT)
- Multi-cloud GPU autoscaling

#### v15-v17 - Learning & Adaptation
- RL from production feedback
- RLHF-lite with active learning
- Federated learning for privacy

#### v18-v25 - Enterprise & Compliance
- Feature flags & A/B testing
- Trust & Safety moderation
- Full observability (OTel, Sentry, Prometheus)
- Knowledge graph + RAG 2.0
- Real data integrations (Finance, Travel, News, OSINT)
- Agentic workflows + IAM
- WebRTC live voice + ASR/TTS
- GDPR/CCPA compliance (DSAR, e-discovery)

## 📦 Architecture

```
ailydian-ultra-pro/
├── apps/
│   ├── web/           # Next.js 14 App Router
│   ├── worker/        # BullMQ job processors (v4+)
│   └── edge/          # Edge functions (v12+)
├── packages/
│   ├── ai-adapters/   # Provider abstraction layer
│   ├── ai-routing/    # Smart routing + circuit breaker
│   ├── ai-rag/        # RAG pipeline (v4+)
│   ├── orchestrator/  # DAG workflows (v4+)
│   ├── governance/    # Multi-tenant + billing (v6+)
│   ├── crypto-kms/    # Encryption (v7+)
│   ├── audit-worm/    # Immutable logs (v7+)
│   └── ... (40+ packages)
└── infra/
    ├── prisma/        # Database schema
    └── scripts/       # Deployment & smoke tests
```

## 🛠️ Installation

### Prerequisites
- Node.js 20+
- PostgreSQL 15+ with pgvector extension
- pnpm 8+
- Redis (for v12+ caching)

### Setup

1. **Clone and install dependencies:**
```bash
cd ~/Desktop/ailydian-ultra-pro
pnpm install
```

2. **Setup environment variables:**
```bash
cp .env.example .env
# Edit .env with your API keys and database URL
```

3. **Initialize database:**
```bash
cd infra/prisma
pnpm prisma generate
pnpm prisma db push
```

4. **Start development server:**
```bash
cd apps/web
pnpm dev
```

The application will be available at `http://localhost:3000`

## 🧪 Testing

### Smoke Tests (Sprint v2)

```bash
# Ensure the dev server is running on port 3000
cd infra/scripts
./smoke-test.sh
```

Expected output:
```
✓ PASS Create conversation
✓ PASS List conversations
✓ PASS Chat completion (non-streaming)
✓ PASS Chat with conversation persistence

✅ All tests passed!
Sprint v2 Status: ✅ COMPLETE
```

## 📡 API Reference

### POST /api/chat/complete

Send a chat completion request with automatic provider routing.

**Request:**
```json
{
  "messages": [
    {"role": "user", "content": "Hello, how are you?"}
  ],
  "model": "gpt-4o-mini",
  "temperature": 0.7,
  "maxTokens": 1000,
  "stream": false,
  "conversationId": "optional-conv-id",
  "userId": "optional-user-id"
}
```

**Response:**
```json
{
  "id": "chatcmpl-xxx",
  "content": "I'm doing well, thank you!",
  "model": "gpt-4o-mini",
  "usage": {
    "promptTokens": 15,
    "completionTokens": 8,
    "totalTokens": 23
  },
  "cost": 0.0000345,
  "latencyMs": 850,
  "finishReason": "stop"
}
```

**Streaming (SSE):**
Set `"stream": true` to receive Server-Sent Events:
```
data: {"id":"chatcmpl-xxx","delta":"I'm","done":false}
data: {"id":"chatcmpl-xxx","delta":" doing","done":false}
data: [DONE]
```

### POST /api/conversations

Create a new conversation.

**Request:**
```json
{
  "userId": "user-123",
  "title": "My Conversation"
}
```

**Response:**
```json
{
  "conversation": {
    "id": "conv-xxx",
    "userId": "user-123",
    "title": "My Conversation",
    "createdAt": "2025-10-01T10:00:00Z"
  }
}
```

### GET /api/conversations?userId={userId}

List conversations for a user.

**Response:**
```json
{
  "conversations": [
    {
      "id": "conv-xxx",
      "userId": "user-123",
      "title": "My Conversation",
      "createdAt": "2025-10-01T10:00:00Z",
      "_count": {
        "messages": 5
      }
    }
  ]
}
```

## 🗄️ Database Schema

Key models (Sprint v2):
- **User**: Authentication and profile
- **Conversation**: Chat threads
- **Message**: Individual messages with token/cost tracking
- **AIModel**: Model metadata and pricing
- **ApiKey**: API authentication

See `infra/prisma/schema.prisma` for full schema covering all 25 sprints.

## 🔐 Security

- **v2**: Basic authentication with API keys
- **v7**: Zero-trust mesh with mTLS (SPIFFE)
- **v7**: KMS envelope encryption for sensitive data
- **v7**: WORM audit logs for compliance
- **v8**: Differential privacy (ε-accounting)
- **v8**: K-anonymity for user data

## 📊 Observability

- **v20**: OpenTelemetry distributed tracing
- **v20**: Sentry error tracking
- **v20**: Prometheus metrics
- **v20**: Automated RCA and incident management

## 📝 License

MIT

## 🤝 Contributing

This is an enterprise project developed sprint-by-sprint. Each sprint is validated with smoke tests before proceeding.

Current status: **Sprint v2 Complete** ✅

---

**Built with:** Next.js 14, Prisma, PostgreSQL, OpenAI, TypeScript, pnpm workspaces
