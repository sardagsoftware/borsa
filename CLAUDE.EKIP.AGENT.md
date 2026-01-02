# 🤖 CLAUDE EKİP AGENT SİSTEMİ - AILYDIAN ULTRA PRO

## 🎯 SİSTEM TANIMI

Bu dosya, AILYDIAN Ultra Pro projesi için Claude Code AI Agent Ekosistemini tanımlar. 35+ özelleşmiş agent, Master Orchestrator koordinasyonunda çalışır.

---

## 📋 MASTER ORKESTRATÖRÜn KURALLARI

### ⚡ TEMEL PRENSİPLER

```yaml
ZERO_TOLERANCE_POLICY:
  - Placeholder kod: YASAK
  - TODO yorumları: YASAK
  - Mock/Demo data: YASAK
  - Simplified versiyonlar: YASAK
  - Incomplete implementations: YASAK

PRODUCTION_READY_MANDATE:
  - Her kod satırı production-grade olmalı
  - Fortune 500 standartlarında kalite
  - 1M+ kullanıcıya scale edebilir
  - Security audit geçer
  - Performance SLA'ları karşılar
```

---

## 🏗️ AGENT EKOSİSTEM MİMARİSİ

### Agent Kategori ve Sayıları

```
.claude/agents/
├── MASTER-ORCHESTRATOR.md           # Ana koordinatör
├── engineering/                     # 6 Agent
│   ├── frontend-developer.md        # React, Next.js, TypeScript
│   ├── backend-architect.md         # Node.js, Python, DBs
│   ├── ai-engineer.md               # ML, LLM, AI Pipelines
│   ├── devops-automator.md          # CI/CD, Infra, K8s
│   ├── mobile-app-builder.md        # React Native, Swift
│   └── rapid-prototyper.md          # MVPs, Quick iterations
│
├── product/                         # 3 Agent
│   ├── trend-researcher.md          # Market analysis
│   ├── feedback-synthesizer.md      # User insights
│   └── sprint-prioritizer.md        # Backlog management
│
├── marketing/                       # 7 Agent
│   ├── growth-hacker.md             # Viral strategies
│   ├── content-creator.md           # Blog, docs, copy
│   ├── twitter-engager.md           # X/Twitter strategy
│   ├── tiktok-strategist.md         # Short-form video
│   ├── instagram-curator.md         # Visual content
│   ├── reddit-community-builder.md  # Community engagement
│   └── app-store-optimizer.md       # ASO optimization
│
├── design/                          # 5 Agent
│   ├── ui-designer.md               # Visual design
│   ├── ux-researcher.md             # User research
│   ├── brand-guardian.md            # Brand consistency
│   ├── visual-storyteller.md        # Visual narratives
│   └── whimsy-injector.md           # Delightful UX
│
├── project-management/              # 3 Agent
│   ├── studio-producer.md           # Project coordination
│   ├── project-shipper.md           # Delivery management
│   └── experiment-tracker.md        # A/B test tracking
│
├── studio-operations/               # 5 Agent
│   ├── infrastructure-maintainer.md # System health
│   ├── finance-tracker.md           # Budget, costs
│   ├── support-responder.md         # Customer support
│   ├── analytics-reporter.md        # Metrics, dashboards
│   └── legal-compliance-checker.md  # GDPR, HIPAA, etc.
│
└── testing/                         # 5 Agent
    ├── api-tester.md                # API test automation
    ├── performance-benchmarker.md   # Load testing
    ├── test-results-analyzer.md     # Test analytics
    └── tool-evaluator.md            # Tool assessment

TOPLAM: 35 Specialized Agents + 1 Master Orchestrator
```

---

## 🔄 AGENT ÇALIŞMA PROTOKOLLERİ

### 1. Task Routing Matrix

```typescript
interface TaskRoutingRule {
  taskType: TaskType;
  primaryAgent: Agent;
  supportAgents: Agent[];
  handoffProtocol: 'sequential' | 'parallel' | 'consensus';
}

const ROUTING_RULES: TaskRoutingRule[] = [
  {
    taskType: 'FRONTEND_FEATURE',
    primaryAgent: 'engineering/frontend-developer',
    supportAgents: ['design/ui-designer', 'testing/api-tester'],
    handoffProtocol: 'sequential'
  },
  {
    taskType: 'BACKEND_API',
    primaryAgent: 'engineering/backend-architect',
    supportAgents: ['testing/api-tester', 'studio-operations/infrastructure-maintainer'],
    handoffProtocol: 'parallel'
  },
  {
    taskType: 'AI_MODEL_INTEGRATION',
    primaryAgent: 'engineering/ai-engineer',
    supportAgents: ['engineering/backend-architect', 'testing/performance-benchmarker'],
    handoffProtocol: 'sequential'
  },
  {
    taskType: 'MARKETING_CAMPAIGN',
    primaryAgent: 'marketing/growth-hacker',
    supportAgents: ['marketing/content-creator', 'design/visual-storyteller'],
    handoffProtocol: 'consensus'
  },
  {
    taskType: 'DEPLOYMENT',
    primaryAgent: 'engineering/devops-automator',
    supportAgents: ['testing/*', 'studio-operations/infrastructure-maintainer'],
    handoffProtocol: 'sequential'
  }
];
```

### 2. Multi-Agent Collaboration Protocol

```python
class AgentCollaborationEngine:
    """
    Agent'lar arası iş birliği orchestration motoru
    """

    async def execute_multi_agent_task(
        self,
        task: ComplexTask,
        primary_agent: Agent,
        support_agents: List[Agent]
    ) -> CollaborationResult:
        """
        Çoklu agent görevi koordine et
        """
        # 1. Task decomposition
        subtasks = await self.decompose_task(task)

        # 2. Agent assignment
        assignments = self.assign_agents(subtasks, primary_agent, support_agents)

        # 3. Parallel execution
        results = await asyncio.gather(*[
            agent.execute(subtask)
            for agent, subtask in assignments.items()
        ])

        # 4. Result synthesis
        final_output = await self.synthesize_results(results)

        # 5. Quality gate validation
        if not await self.validate_quality_gates(final_output):
            raise QualityGateFailure("Output does not meet production standards")

        return final_output
```

### 3. Quality Gate System

```javascript
// Her agent çıktısı bu quality gate'lerden geçmelidir
const QUALITY_GATES = {
  code_quality: {
    checks: [
      'no_placeholder_code',
      'no_todo_comments',
      'no_mock_data',
      'comprehensive_error_handling',
      'type_safety',
      'documentation_complete'
    ],
    threshold: '100%' // Zero tolerance
  },

  performance: {
    checks: [
      'api_response_time_p95 < 100ms',
      'database_query_time < 10ms',
      'bundle_size_optimized',
      'lighthouse_score >= 95'
    ],
    threshold: 'all_pass'
  },

  security: {
    checks: [
      'input_validation',
      'authentication_proper',
      'authorization_rbac',
      'encryption_at_rest',
      'encryption_in_transit',
      'no_secrets_in_code'
    ],
    threshold: '100%' // Zero tolerance
  },

  scalability: {
    checks: [
      'handles_1M+_users',
      'database_properly_indexed',
      'caching_strategy_implemented',
      'rate_limiting_configured'
    ],
    threshold: 'all_pass'
  }
};
```

---

## 🎯 AGENT AKTİVASYON KOMUTLARI

### Claude Code CLI Kullanımı

```bash
# 1. TEK AGENT AKTİVASYONU
claude --agent frontend-developer "Build user dashboard with real-time updates"
claude --agent ai-engineer "Implement RAG pipeline with pgvector"
claude --agent devops-automator "Setup CI/CD with GitHub Actions"

# 2. ÇOK AGENT GÖREVE (PARALLEL)
claude --agents "frontend-developer,ui-designer,api-tester" \
      "Create e-commerce checkout flow"

# 3. TAM PIPELINE (SEQUENTIAL)
claude --pipeline "MVP to Production" \
      --agents "rapid-prototyper -> frontend-developer -> backend-architect -> devops-automator" \
      --quality-gates enabled

# 4. MASTER ORCHESTRATOR İLE
claude --orchestrate "Launch AI medical diagnosis feature" \
      --mode intelligent \
      --parallel-where-possible

# 5. SPESİFİK CONTEXT İLE
claude --context ".claude/agents/engineering/ai-engineer.md" \
      "Integrate Claude 3.5 Sonnet with streaming"
```

### Conversation İçi Aktivasyon

```markdown
# Agent directive kullanımı
@engineering/frontend-developer Build the component with TypeScript and Tailwind

@marketing/growth-hacker Design viral launch campaign for TikTok and Instagram

@orchestrate Full-stack feature: User authentication with OAuth2 and MFA
```

---

## 🛡️ GÜVENLİK VE COMPLIANCE

### Security Protocol - Tüm Agent'lar İçin

```yaml
security_mandates:
  authentication:
    - JWT with refresh token rotation
    - MFA support required
    - Session timeout: 15 minutes

  authorization:
    - RBAC (Role-Based Access Control)
    - ABAC where needed
    - Principle of least privilege

  data_protection:
    - Encryption at rest: AES-256-GCM
    - Encryption in transit: TLS 1.3+
    - PII masking in logs
    - GDPR/KVKK compliance

  secrets_management:
    - No secrets in code (NEVER)
    - Environment variables only
    - Vault integration preferred
    - API key rotation: 90 days

  audit_trail:
    - All actions logged
    - Immutable audit logs
    - HIPAA compliance where applicable
    - Retention: 7 years
```

---

## 📊 PERFORMANS HEDEFLERİ

### Tüm Agent'ların Uyması Gereken SLA'lar

```yaml
performance_sla:
  api_endpoints:
    response_time_p50: < 50ms
    response_time_p95: < 100ms
    response_time_p99: < 200ms
    error_rate: < 0.01%
    uptime: 99.9%

  database:
    query_time_simple: < 5ms
    query_time_complex: < 50ms
    connection_pool_size: 100
    index_coverage: 95%+

  frontend:
    first_contentful_paint: < 1.5s
    time_to_interactive: < 3.5s
    lighthouse_performance: >= 95
    lighthouse_accessibility: >= 95
    bundle_size_js: < 200KB (gzipped)

  infrastructure:
    auto_scaling: enabled
    health_checks: every 30s
    failover_time: < 60s
    backup_frequency: daily
```

---

## 🔧 TEKNİK STACK VE STANDARTLAR

### Frontend Standards (frontend-developer agent)

```typescript
// TypeScript strict mode zorunlu
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}

// Component structure
interface ComponentStandards {
  framework: 'Next.js 15' | 'React 18';
  styling: 'Tailwind CSS' | 'CSS Modules';
  stateManagement: 'Zustand' | 'Jotai' | 'React Context';
  forms: 'React Hook Form' | 'Formik';
  validation: 'Zod' | 'Yup';
  testing: 'Vitest' | 'Jest' + 'React Testing Library';
}
```

### Backend Standards (backend-architect agent)

```python
# Python backend standardı
from typing import TypeVar, Generic, Protocol
from pydantic import BaseModel, Field
from fastapi import FastAPI, HTTPException, Depends

# Type hints zorunlu
# Pydantic models for validation
# FastAPI preferred for APIs
# SQLAlchemy 2.0+ for ORMs
# Alembic for migrations
```

```javascript
// Node.js backend standardı
// Express 5.0 preferred
// TypeScript mandatory
// Prisma ORM for database
// Winston for logging
// Jest for testing
```

### AI/ML Standards (ai-engineer agent)

```python
# LLM Integration standardı
from anthropic import Anthropic
from openai import OpenAI
import tiktoken

class LLMAdapter(Protocol):
    async def complete(
        self,
        messages: List[Message],
        **kwargs
    ) -> CompletionResult:
        """Type-safe LLM completion"""
        ...

# Retry with exponential backoff
# Token counting before API calls
# Streaming support mandatory
# Cost tracking per request
# Circuit breaker pattern for failures
```

---

## 🚀 DEPLOYMENT VE DevOps

### DevOps Automator Agent Standardı

```yaml
ci_cd_pipeline:
  platform: GitHub Actions | GitLab CI | Azure DevOps

  stages:
    - lint_and_typecheck
    - unit_tests
    - integration_tests
    - security_scan
    - build
    - deploy_staging
    - smoke_tests
    - deploy_production

  deployment_strategy:
    type: blue_green | canary | rolling
    health_checks: mandatory
    rollback_automatic: on_error

  monitoring:
    metrics: Prometheus
    logging: Winston + Azure Application Insights
    tracing: OpenTelemetry
    alerting: PagerDuty | Opsgenie
```

---

## 📈 MARKETING VE GROWTH

### Growth Hacker Agent Stratejileri

```typescript
interface GrowthStrategy {
  channels: [
    'organic_social',      // Twitter, TikTok, Instagram
    'content_marketing',   // Blog, SEO
    'product_led_growth',  // Freemium, virality
    'community',           // Reddit, Discord
    'partnerships',        // Integrations, affiliates
    'paid_acquisition'     // Ads (minimal initially)
  ];

  metrics: {
    north_star: 'Weekly Active Users (WAU)';
    acquisition: ['CAC', 'viral_coefficient'];
    activation: ['time_to_value', 'aha_moment_rate'];
    retention: ['D1_retention', 'D7_retention', 'D30_retention'];
    revenue: ['ARPU', 'LTV', 'MRR_growth'];
  };

  experimentation: {
    framework: 'continuous_AB_testing';
    cadence: 'weekly_experiments';
    success_criteria: 'statistical_significance_95%';
  };
}
```

---

## 🎨 DESIGN VE UX

### UI Designer Agent Standardı

```css
/* Design System Enforcement */
:root {
  /* Typography */
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'Fira Code', monospace;

  /* Spacing (8px base) */
  --space-1: 0.5rem;  /* 8px */
  --space-2: 1rem;    /* 16px */
  --space-3: 1.5rem;  /* 24px */
  --space-4: 2rem;    /* 32px */

  /* Colors (semantic) */
  --color-primary: hsl(220, 90%, 56%);
  --color-success: hsl(142, 71%, 45%);
  --color-error: hsl(0, 84%, 60%);

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.15);
}

/* Accessibility mandatory */
/* WCAG 2.1 AA minimum */
/* Color contrast ratio >= 4.5:1 */
/* Keyboard navigation support */
/* Screen reader friendly */
```

---

## 🧪 TESTING VE QUALITY ASSURANCE

### Test Coverage Gereksinimleri

```typescript
// Testing pyramid
const TEST_REQUIREMENTS = {
  unit_tests: {
    coverage: '>90%',
    framework: 'Vitest | Jest',
    philosophy: 'Test behavior, not implementation'
  },

  integration_tests: {
    coverage: '>80%',
    framework: 'Supertest | Playwright',
    focus: 'API contracts, DB interactions'
  },

  e2e_tests: {
    coverage: 'Critical user paths',
    framework: 'Playwright | Cypress',
    environments: ['staging', 'production-like']
  },

  performance_tests: {
    tool: 'k6 | Artillery',
    scenarios: ['load_test', 'stress_test', 'spike_test'],
    thresholds: 'See PERFORMANCE_SLA'
  }
};
```

---

## 📚 DOKÜMANTASYON STANDARTLARI

### Her Agent Mutlaka Üretmelidir

```markdown
# Component/Module Documentation Template

## Overview
[1-2 sentence description]

## API Reference
[Comprehensive API docs with examples]

## Usage Examples
```typescript
// Real, working examples (NOT placeholders)
```

## Architecture Decisions
[Why this approach? Alternatives considered?]

## Performance Characteristics
[Time/space complexity, benchmarks]

## Security Considerations
[Threat model, mitigations]

## Testing Strategy
[How to test? What's covered?]

## Maintenance Notes
[Known issues, future improvements]
```

---

## 🔄 AGENT GÜNCELLEMELER VE VERSİYONLAMA

### Agent Versiyonlama

```yaml
agent_versioning:
  format: semantic_versioning (MAJOR.MINOR.PATCH)

  update_triggers:
    MAJOR: breaking_changes_to_agent_interface
    MINOR: new_capabilities_added
    PATCH: bug_fixes_improvements

  changelog: .claude/agents/CHANGELOG.md

  backward_compatibility:
    policy: maintain_for_2_major_versions
    deprecation_notice: 90_days_minimum
```

---

## 🎓 AGENT EĞİTİMİ VE ÖĞRENME

### Continuous Improvement Protocol

```python
class AgentLearningSystem:
    """
    Agent'ların ürettiği çıktılardan öğrenme ve iyileşme
    """

    async def collect_feedback(self, task_id: str, output: Any):
        """User feedback ve system metrics topla"""
        feedback = await self.gather_metrics({
            'user_satisfaction': await get_user_rating(task_id),
            'code_quality_score': await analyze_code_quality(output),
            'performance_metrics': await get_runtime_metrics(output),
            'security_audit_result': await run_security_scan(output)
        })
        return feedback

    async def update_agent_knowledge(self, agent_id: str, feedback: Feedback):
        """Agent'ın knowledge base'ini güncelle"""
        if feedback.score >= 0.9:
            # Success pattern'i kaydet
            await self.add_to_best_practices(agent_id, feedback.output)
        elif feedback.score < 0.5:
            # Failure pattern'i analiz et ve düzelt
            await self.analyze_and_correct(agent_id, feedback)
```

---

## 🚨 ACİL DURUM PROTOKOLLERİ

### Agent Failure Handling

```typescript
interface AgentFailureProtocol {
  detection: {
    timeout: '5 minutes per subtask';
    quality_gate_failure: 'immediate_detection';
    runtime_error: 'catch_and_log';
  };

  recovery: {
    retry_policy: {
      max_attempts: 3;
      backoff: 'exponential';
      fallback_agent: 'rapid-prototyper'; // Genel amaçlı yedek
    };

    escalation: {
      trigger: 'after_3_failed_retries';
      target: 'master_orchestrator | human_developer';
      notification: 'immediate_alert';
    };
  };

  post_mortem: {
    required: true;
    timeline: 'within_24_hours';
    root_cause_analysis: 'mandatory';
    prevention_plan: 'document_and_implement';
  };
}
```

---

## 📞 İNSAN-AGENT İŞBİRLİĞİ

### Human-in-the-Loop Protocol

```yaml
human_intervention_points:
  - ambiguous_requirements:
      action: request_clarification
      timeout: wait_indefinitely

  - architectural_decision:
      action: present_options_with_tradeoffs
      recommendation: include_agent_preference

  - security_critical_code:
      action: mandatory_human_review
      approval: required_before_deployment

  - high_risk_deployment:
      action: human_approval_required
      rollback_plan: must_be_approved

  - quality_gate_failure:
      action: notify_immediately
      decision: human_decides_proceed_or_fix
```

---

## 🎯 BAŞLANGIÇ KOMUTLARI

### Projeyi Claude Code ile Başlatma

```bash
# 1. Agent ekosistemini doğrula
claude --verify-agents

# 2. İlk task için orchestrator'ı aktive et
claude --orchestrate "Analyze project structure and suggest improvements"

# 3. Specific agent test
claude --agent frontend-developer "Audit all React components for best practices"

# 4. Multi-agent feature development
claude --pipeline "Implement user authentication" \
      --agents "backend-architect -> frontend-developer -> api-tester -> devops-automator"
```

---

## 📖 EK KAYNAKLAR

### İç Dökümanlar
- `.claude/agents/MASTER-ORCHESTRATOR.md` - Ana koordinasyon kuralları
- `.claude/agents/*/` - Her agent'ın detaylı direktifleri
- `CLAUDE.md` - Proje bazında genel kurallar (Desktop'ta)
- `README.md` - Proje dokümantasyonu

### External Resources
- [Claude Code Documentation](https://docs.anthropic.com/claude/docs)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

---

## ✅ KALICI DEVREYE ALMA KONTROLÜ

### Her Proje Açılışında Otomatik Yükleme

Bu dosya ve `.claude/agents/*` dizini proje kök dizininde bulunduğu sürece:
- ✅ Claude Code otomatik olarak agent'ları tarar
- ✅ MASTER-ORCHESTRATOR her zaman aktif
- ✅ Her conversation'da bu direktifler geçerli
- ✅ Terminal kapatılıp açılsa dahi kurallar kalıcı
- ✅ Bilgisayar yeniden başlatılsa dahi yapı korunur

### Doğrulama Komutu

```bash
# Agent sisteminin yüklendiğini doğrula
ls -la .claude/agents/

# Beklenen çıktı:
# MASTER-ORCHESTRATOR.md
# engineering/ (6 agent)
# product/ (3 agent)
# marketing/ (7 agent)
# design/ (5 agent)
# project-management/ (3 agent)
# studio-operations/ (5 agent)
# testing/ (5 agent)
```

---

## 🏆 BAŞARI KRİTERLERİ

Bir agent çıktısı başarılı sayılır ancak ve ancak:

- ✅ Fortune 500 production ortamında çalışabilir
- ✅ 1M+ kullanıcıya scale edebilir
- ✅ Security audit'ten geçer (A+ score)
- ✅ Performance SLA'larını karşılar (p95 < 100ms)
- ✅ %100 type-safe (TypeScript) veya fully typed (Python)
- ✅ Comprehensive error handling var
- ✅ Tam dokümante edilmiş
- ✅ Test coverage >90%
- ✅ SIFIR placeholder/TODO/mock kod

**Eğer yukarıdakilerden biri bile eksikse, çıktı REDDEDİLİR ve agent tekrar çalıştırılır.**

---

## 🔐 BEYAZ ŞAPKA GÜVENLİK DİSİPLİNİ

### Security-First Mindset

```yaml
white_hat_discipline:
  principle: "Security by design, not as afterthought"

  mandatory_checks:
    - input_validation: ALWAYS
    - output_encoding: ALWAYS
    - authentication: WHERE_APPLICABLE
    - authorization: WHERE_APPLICABLE
    - encryption: SENSITIVE_DATA_ALWAYS
    - audit_logging: CRITICAL_OPERATIONS_ALWAYS

  forbidden_practices:
    - hardcoded_secrets: NEVER
    - sql_string_concatenation: NEVER
    - eval_dynamic_code: NEVER
    - disabled_cors: NEVER
    - plaintext_passwords: NEVER
    - weak_crypto: NEVER

  compliance:
    - OWASP_Top_10: MITIGATED
    - HIPAA: WHERE_APPLICABLE
    - GDPR: DATA_PROTECTION_BY_DEFAULT
    - SOC2: TYPE_II_READY
```

---

*Bu dosya AILYDIAN Ultra Pro projesinin Claude Code Agent Ekosistemi'nin ana anayasasıdır. Her agent bu dosyaya bağlı olarak çalışır. Değişiklikler version control altındadır.*

**Son Güncelleme:** 27 Aralık 2025
**Versiyon:** 1.0.0
**Status:** ✅ PRODUCTION ACTIVE
**Geçerlilik:** Kalıcı (Her conversation'da aktif)
