# Lydian AI Platform - SDK Library Index

Official SDK client libraries for the Lydian AI Platform APIs.

## Available SDKs

### 1. TypeScript/JavaScript SDK
**Location:** [`typescript/`](./typescript/)
**Package:** `@lydian/sdk`
**Installation:** `npm install @lydian/sdk`
**Target:** Node.js 18+, Browser (ESM/CommonJS)
**Features:** Zero dependencies, full TypeScript types, fetch API

**Quick Start:**
```typescript
import { Lydian } from '@lydian/sdk';
const lydian = new Lydian({ apiKey: process.env.LYDIAN_API_KEY });
```

[📖 Full Documentation](./typescript/README.md)

---

### 2. Python SDK
**Location:** [`python/`](./python/)
**Package:** `lydian-sdk`
**Installation:** `pip install lydian-sdk`
**Target:** Python 3.8+
**Features:** Type hints, dataclasses, requests library

**Quick Start:**
```python
from lydian import Lydian
lydian = Lydian(api_key=os.environ.get("LYDIAN_API_KEY"))
```

[📖 Full Documentation](./python/README.md)

---

### 3. Go SDK
**Location:** [`go/`](./go/)
**Module:** `github.com/lydian/go-sdk`
**Installation:** `go get github.com/lydian/go-sdk`
**Target:** Go 1.21+
**Features:** Zero dependencies, context support, type-safe structs

**Quick Start:**
```go
import "github.com/lydian/go-sdk"
client := lydian.NewClient(lydian.Config{APIKey: os.Getenv("LYDIAN_API_KEY")})
```

[📖 Full Documentation](./go/README.md)

---

### 4. Java SDK
**Location:** [`java/`](./java/)
**Package:** `com.lydian:lydian-sdk`
**Installation:** Add to `pom.xml` (see documentation)
**Target:** Java 11+
**Features:** Builder pattern, OkHttp, Gson, type-safe models

**Quick Start:**
```java
LydianClient client = new LydianClient.Builder()
    .apiKey(System.getenv("LYDIAN_API_KEY"))
    .build();
```

[📖 Full Documentation](./java/README.md)

---

### 5. C# SDK
**Location:** [`csharp/`](./csharp/)
**Package:** `Lydian.SDK`
**Installation:** `dotnet add package Lydian.SDK`
**Target:** .NET 6.0+
**Features:** Async/await, HttpClient, System.Text.Json, nullable types

**Quick Start:**
```csharp
var client = new LydianClient(new LydianConfig
{
    ApiKey = Environment.GetEnvironmentVariable("LYDIAN_API_KEY")
});
```

[📖 Full Documentation](./csharp/README.md)

---

## API Coverage

All SDKs provide complete coverage of:

### Smart Cities API (11 endpoints)
- City management (CRUD)
- Asset management (sensors, cameras, etc.)
- Metrics and analytics
- Alert system

### İnsan IQ API (10 endpoints)
- Persona management
- Skill publishing
- Chat sessions
- Message history

### LyDian IQ API (10 endpoints)
- Signal ingestion
- Knowledge graph management
- Entity operations
- Insight generation

**Total:** 31 endpoints across all SDKs

---

## Common Features

✅ **Authentication**
- API Key authentication
- OAuth2 client credentials flow

✅ **Reliability**
- Automatic retries with exponential backoff
- Configurable timeouts
- Proper error handling

✅ **Developer Experience**
- Type safety (TypeScript types, Python type hints, strongly typed in Go/Java/C#)
- Comprehensive examples
- Detailed documentation
- Security best practices

✅ **Advanced Features**
- Pagination helpers (page-based and cursor-based)
- Idempotency key support
- Webhook signature validation (HMAC SHA-256)
- Environment variable configuration

---

## Documentation

- **[BRIEF-C Report](./SDK-GENERATION-BRIEF-C-REPORT.md)** - Complete technical documentation
- **README files** - See each SDK directory for language-specific documentation
- **Examples** - Working code examples in each SDK's `examples/` directory

---

## Quick Links

| SDK | Package Manager | Repository | Documentation |
|-----|----------------|------------|---------------|
| TypeScript | [NPM](https://npmjs.com) | GitHub | [Docs](./typescript/README.md) |
| Python | [PyPI](https://pypi.org) | GitHub | [Docs](./python/README.md) |
| Go | [pkg.go.dev](https://pkg.go.dev) | GitHub | [Docs](./go/README.md) |
| Java | [Maven Central](https://search.maven.org) | GitHub | [Docs](./java/README.md) |
| C# | [NuGet](https://nuget.org) | GitHub | [Docs](./csharp/README.md) |

---

## Support

- **Documentation:** https://docs.lydian.ai
- **API Reference:** https://api.lydian.ai/docs
- **Email:** support@lydian.ai
- **Issues:** Report SDK-specific issues in respective GitHub repositories

---

## Security

All SDKs implement:
- Secure credential storage (environment variables)
- HTTPS-only communication
- HMAC signature validation for webhooks
- No hardcoded secrets
- Rate limit handling

See individual SDK documentation for security best practices.

---

## License

All SDKs are released under the MIT License.

---

**Last Updated:** October 7, 2025
**SDK Version:** 1.0.0
**Total Files:** 69 files across 5 SDKs
**Total Source Files:** 57 (.ts, .py, .go, .java, .cs)
