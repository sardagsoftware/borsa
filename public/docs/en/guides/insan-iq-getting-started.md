# Getting Started with İnsan IQ API

## Overview

İnsan IQ (Human Intelligence) is LyDian's advanced reasoning and problem-solving platform. It provides AI personas, skill assessment, personalized learning paths, and intelligent assistants for various domains including legal, medical, education, and business advisory.

**What You'll Learn:**
- Authenticate with the İnsan IQ API
- Create and manage AI personas
- Conduct skill assessments
- Generate personalized learning paths
- Interact with specialized AI assistants

**Time to Complete:** 30-45 minutes

## Prerequisites

- LyDian API account ([Sign up](https://lydian.com/signup))
- API key or OAuth2 credentials
- Node.js 18+ or Python 3.8+
- Basic understanding of REST APIs

## What is İnsan IQ?

İnsan IQ provides intelligent reasoning capabilities through:

- **AI Personas**: Customizable AI characters with specific knowledge domains
- **Skill Assessment**: Evaluate competencies across 500+ skills
- **Learning Paths**: Personalized education journeys
- **Reasoning Engine**: Advanced problem-solving and decision support
- **Specialized Assistants**: Domain experts (legal, medical, education, business)

## Quick Start

### Step 1: Install SDK

**TypeScript/JavaScript:**
```bash
npm install @lydian/sdk
```

**Python:**
```bash
pip install lydian-sdk
```

**Go:**
```bash
go get github.com/lydian/go-sdk
```

### Step 2: Initialize Client

**TypeScript:**
```typescript
import { Lydian } from '@lydian/sdk';

const client = new Lydian({
  apiKey: process.env.LYDIAN_API_KEY,
  // Or use OAuth2
  oauth: {
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET
  }
});
```

**Python:**
```python
from lydian import Lydian

client = Lydian(
    api_key=os.environ['LYDIAN_API_KEY']
)
```

**Go:**
```go
import "github.com/lydian/go-sdk"

client := lydian.NewClient(
    lydian.WithAPIKey(os.Getenv("LYDIAN_API_KEY")),
)
```

### Step 3: Create Your First AI Persona

AI personas are intelligent agents with specialized knowledge and personality traits.

**TypeScript:**
```typescript
const persona = await client.insanIQ.createPersona({
  name: 'Legal Assistant Pro',
  type: 'legal_expert',
  languagessupported: ['en', 'tr', 'de'],
  knowledgeDomains: ['contract_law', 'intellectual_property', 'compliance'],
  personalityTraits: {
    formality: 'professional',
    tone: 'helpful',
    verbosity: 'concise'
  },
  capabilities: [
    'document_analysis',
    'legal_research',
    'contract_review',
    'risk_assessment'
  ],
  settings: {
    temperature: 0.7,
    maxTokens: 2000,
    responseFormat: 'structured'
  }
});

console.log(`Created persona: ${persona.id}`);
console.log(`Name: ${persona.name}`);
console.log(`Status: ${persona.status}`);
```

**Python:**
```python
persona = client.insan_iq.create_persona(
    name='Legal Assistant Pro',
    type='legal_expert',
    languages_supported=['en', 'tr', 'de'],
    knowledge_domains=['contract_law', 'intellectual_property', 'compliance'],
    personality_traits={
        'formality': 'professional',
        'tone': 'helpful',
        'verbosity': 'concise'
    },
    capabilities=[
        'document_analysis',
        'legal_research',
        'contract_review',
        'risk_assessment'
    ],
    settings={
        'temperature': 0.7,
        'max_tokens': 2000,
        'response_format': 'structured'
    }
)

print(f"Created persona: {persona.id}")
```

**Response:**
```json
{
  "id": "persona_01HXA2B3C4D5E6F7G8H9J0K1L2",
  "name": "Legal Assistant Pro",
  "type": "legal_expert",
  "status": "active",
  "languagesSupported": ["en", "tr", "de"],
  "knowledgeDomains": ["contract_law", "intellectual_property", "compliance"],
  "capabilities": ["document_analysis", "legal_research", "contract_review", "risk_assessment"],
  "createdAt": "2024-01-01T12:00:00Z",
  "updatedAt": "2024-01-01T12:00:00Z"
}
```

### Step 4: Chat with Your Persona

Once created, you can interact with your persona through conversational chat.

**TypeScript:**
```typescript
const conversation = await client.insanIQ.chat({
  personaId: persona.id,
  messages: [
    {
      role: 'user',
      content: 'I need to review a software licensing agreement. What should I look out for?'
    }
  ],
  options: {
    includeReferences: true,
    includeSources: true
  }
});

console.log('Response:', conversation.response);
console.log('References:', conversation.references);
```

**Python:**
```python
conversation = client.insan_iq.chat(
    persona_id=persona.id,
    messages=[
        {
            'role': 'user',
            'content': 'I need to review a software licensing agreement. What should I look out for?'
        }
    ],
    options={
        'include_references': True,
        'include_sources': True
    }
)

print('Response:', conversation.response)
print('References:', conversation.references)
```

**Response:**
```json
{
  "id": "conv_01HXB3C4D5E6F7G8H9J0K1L2M3",
  "personaId": "persona_01HXA2B3C4D5E6F7G8H9J0K1L2",
  "response": {
    "role": "assistant",
    "content": "When reviewing a software licensing agreement, focus on these key areas:\n\n1. **License Scope**: Verify the number of users, installations, and geographic restrictions.\n2. **Intellectual Property Rights**: Ensure you're not unintentionally transferring IP ownership.\n3. **Liability Limitations**: Review caps on liability and indemnification clauses.\n4. **Termination Conditions**: Understand exit clauses, data retrieval rights, and post-termination obligations.\n5. **Compliance Requirements**: Check for regulatory compliance obligations (GDPR, HIPAA, etc.).\n6. **Support & Maintenance**: Clarify SLA terms, update schedules, and support channels.\n7. **Payment Terms**: Review billing cycles, renewal terms, and price escalation clauses.\n\nWould you like me to analyze a specific agreement for you?"
  },
  "references": [
    {
      "title": "Software License Agreement Best Practices",
      "url": "https://lydian.com/kb/legal/software-licenses",
      "relevance": 0.94
    }
  ],
  "usage": {
    "promptTokens": 45,
    "completionTokens": 187,
    "totalTokens": 232
  },
  "timestamp": "2024-01-01T12:01:30Z"
}
```

### Step 5: Conduct a Skill Assessment

Evaluate skills across technical, business, and soft skill domains.

**TypeScript:**
```typescript
const assessment = await client.insanIQ.createAssessment({
  userId: 'user_123',
  skillCategory: 'software_development',
  skills: [
    'javascript',
    'typescript',
    'react',
    'nodejs',
    'system_design',
    'agile_methodology'
  ],
  assessmentType: 'adaptive', // Adjusts difficulty based on responses
  timeLimit: 3600, // 1 hour in seconds
  language: 'en'
});

console.log(`Assessment created: ${assessment.id}`);
console.log(`Access URL: ${assessment.accessUrl}`);
console.log(`Questions: ${assessment.questionCount}`);
```

**Python:**
```python
assessment = client.insan_iq.create_assessment(
    user_id='user_123',
    skill_category='software_development',
    skills=[
        'javascript',
        'typescript',
        'react',
        'nodejs',
        'system_design',
        'agile_methodology'
    ],
    assessment_type='adaptive',
    time_limit=3600,
    language='en'
)

print(f"Assessment created: {assessment.id}")
print(f"Access URL: {assessment.access_url}")
```

**Retrieve Assessment Results:**
```typescript
const results = await client.insanIQ.getAssessmentResults(assessment.id);

console.log('Overall Score:', results.overallScore, '/100');
console.log('\nSkill Breakdown:');
results.skillScores.forEach(skill => {
  console.log(`  ${skill.name}: ${skill.score}/100 (${skill.level})`);
});
```

**Response:**
```json
{
  "id": "assessment_01HXC4D5E6F7G8H9J0K1L2M3N4",
  "userId": "user_123",
  "status": "completed",
  "overallScore": 82,
  "skillScores": [
    {
      "skill": "javascript",
      "score": 88,
      "level": "advanced",
      "percentile": 85
    },
    {
      "skill": "typescript",
      "score": 79,
      "level": "intermediate",
      "percentile": 72
    },
    {
      "skill": "react",
      "score": 85,
      "level": "advanced",
      "percentile": 78
    },
    {
      "skill": "nodejs",
      "score": 76,
      "level": "intermediate",
      "percentile": 68
    },
    {
      "skill": "system_design",
      "score": 73,
      "level": "intermediate",
      "percentile": 65
    },
    {
      "skill": "agile_methodology",
      "score": 91,
      "level": "expert",
      "percentile": 92
    }
  ],
  "completedAt": "2024-01-01T13:15:00Z",
  "duration": 2847
}
```

### Step 6: Generate Personalized Learning Path

Based on assessment results, create a customized learning journey.

**TypeScript:**
```typescript
const learningPath = await client.insanIQ.createLearningPath({
  userId: 'user_123',
  assessmentId: assessment.id,
  goals: [
    'Improve system design skills',
    'Master TypeScript best practices',
    'Learn microservices architecture'
  ],
  timeCommitment: 'moderate', // light, moderate, intensive
  preferredLearningStyle: 'hands_on', // visual, hands_on, reading, mixed
  targetCompletionWeeks: 12
});

console.log('Learning Path Created:', learningPath.id);
console.log('Estimated Duration:', learningPath.estimatedWeeks, 'weeks');
console.log('Modules:', learningPath.modules.length);
```

**Python:**
```python
learning_path = client.insan_iq.create_learning_path(
    user_id='user_123',
    assessment_id=assessment.id,
    goals=[
        'Improve system design skills',
        'Master TypeScript best practices',
        'Learn microservices architecture'
    ],
    time_commitment='moderate',
    preferred_learning_style='hands_on',
    target_completion_weeks=12
)

print(f"Learning Path: {learning_path.id}")
print(f"Modules: {len(learning_path.modules)}")
```

**Response:**
```json
{
  "id": "path_01HXD5E6F7G8H9J0K1L2M3N4O5",
  "userId": "user_123",
  "status": "active",
  "estimatedWeeks": 12,
  "modules": [
    {
      "id": "module_01",
      "title": "TypeScript Advanced Patterns",
      "description": "Master advanced TypeScript features and design patterns",
      "skills": ["typescript", "design_patterns"],
      "lessons": [
        {
          "id": "lesson_01",
          "title": "Generics and Type Inference",
          "type": "video",
          "duration": 45,
          "url": "https://lydian.com/learn/ts-generics"
        },
        {
          "id": "lesson_02",
          "title": "Decorators and Metadata",
          "type": "interactive",
          "duration": 60,
          "url": "https://lydian.com/learn/ts-decorators"
        }
      ],
      "assessment": {
        "id": "quiz_01",
        "title": "TypeScript Patterns Quiz",
        "passingScore": 80
      },
      "estimatedHours": 15
    },
    {
      "id": "module_02",
      "title": "System Design Fundamentals",
      "description": "Learn to design scalable distributed systems",
      "skills": ["system_design", "architecture"],
      "lessons": [
        {
          "id": "lesson_03",
          "title": "Scalability Principles",
          "type": "video",
          "duration": 60
        },
        {
          "id": "lesson_04",
          "title": "Design a URL Shortener",
          "type": "hands_on_project",
          "duration": 180
        }
      ],
      "estimatedHours": 20
    }
  ],
  "progress": {
    "completedModules": 0,
    "totalModules": 8,
    "percentComplete": 0
  },
  "createdAt": "2024-01-01T13:30:00Z"
}
```

### Step 7: Use Specialized Assistants

İnsan IQ provides pre-built assistants for specific domains.

**Legal Assistant:**
```typescript
const legalAssistant = await client.insanIQ.getAssistant('legal_assistant');

const analysis = await legalAssistant.analyzeDocument({
  documentUrl: 'https://example.com/contract.pdf',
  analysisType: 'risk_assessment',
  jurisdiction: 'TR', // Turkey
  language: 'tr'
});

console.log('Risk Level:', analysis.riskLevel);
console.log('Issues Found:', analysis.issues.length);
analysis.issues.forEach(issue => {
  console.log(`  - ${issue.severity}: ${issue.description}`);
});
```

**Medical Assistant:**
```typescript
const medicalAssistant = await client.insanIQ.getAssistant('medical_assistant');

const diagnosis = await medicalAssistant.analyzeSymptons({
  symptoms: [
    'fever > 38°C',
    'persistent cough',
    'fatigue',
    'loss of taste'
  ],
  patientAge: 35,
  patientGender: 'female',
  medicalHistory: ['asthma'],
  language: 'en'
});

console.log('Potential Diagnoses:', diagnosis.possibleConditions);
console.log('Recommended Actions:', diagnosis.recommendations);
```

**Education Assistant:**
```typescript
const eduAssistant = await client.insanIQ.getAssistant('education_assistant');

const tutoring = await eduAssistant.createTutoringSession({
  subject: 'mathematics',
  topic: 'calculus',
  studentLevel: 'high_school',
  learningGoal: 'Understand derivatives and integrals',
  language: 'en'
});

// Interactive tutoring session
const response = await eduAssistant.chat({
  sessionId: tutoring.id,
  message: 'Can you explain what a derivative is?'
});

console.log(response.explanation);
```

## Authentication

### API Key (Simple)

Best for server-to-server communication.

```typescript
const client = new Lydian({
  apiKey: 'sk_live_abc123def456ghi789'
});
```

### OAuth2 (Recommended for User-Facing Apps)

```typescript
// Step 1: Redirect user to authorization URL
const authUrl = client.oauth.getAuthorizationUrl({
  redirectUri: 'https://yourapp.com/callback',
  scope: ['insan_iq:read', 'insan_iq:write'],
  state: generateRandomState()
});

// Step 2: Exchange code for tokens
const tokens = await client.oauth.exchangeCodeForTokens({
  code: req.query.code,
  redirectUri: 'https://yourapp.com/callback'
});

// Step 3: Use access token
const authenticatedClient = new Lydian({
  accessToken: tokens.accessToken
});
```

## Rate Limits

| Plan | Requests/Hour | Concurrent Requests |
|------|---------------|---------------------|
| Free | 100 | 2 |
| Pro | 10,000 | 20 |
| Enterprise | Unlimited | 100 |

**Rate Limit Headers:**
```http
X-RateLimit-Limit: 10000
X-RateLimit-Remaining: 9847
X-RateLimit-Reset: 1704067200
```

**Handling Rate Limits:**
```typescript
try {
  const result = await client.insanIQ.chat({ ... });
} catch (error) {
  if (error.status === 429) {
    const retryAfter = error.headers['Retry-After'];
    console.log(`Rate limited. Retry after ${retryAfter} seconds`);
    await sleep(retryAfter * 1000);
    // Retry request
  }
}
```

## Error Handling

All API errors follow a consistent format:

```json
{
  "error": {
    "type": "validation_error",
    "code": "invalid_persona_type",
    "message": "The persona type 'invalid_type' is not supported",
    "details": {
      "field": "type",
      "allowedValues": ["legal_expert", "medical_expert", "educator", "business_advisor"]
    },
    "requestId": "req_01HXE6F7G8H9J0K1L2M3N4O5P6"
  }
}
```

**Error Types:**
- `authentication_error`: Invalid API key or token
- `authorization_error`: Insufficient permissions
- `validation_error`: Invalid request parameters
- `not_found_error`: Resource not found
- `rate_limit_error`: Too many requests
- `server_error`: Internal server error

**Best Practice:**
```typescript
try {
  const persona = await client.insanIQ.createPersona({ ... });
} catch (error) {
  if (error.type === 'validation_error') {
    console.error('Invalid parameters:', error.details);
  } else if (error.type === 'rate_limit_error') {
    await handleRateLimit(error);
  } else {
    console.error('Unexpected error:', error.message);
  }
}
```

## Pagination

List endpoints support cursor-based pagination:

```typescript
let cursor = null;
const allPersonas = [];

do {
  const response = await client.insanIQ.listPersonas({
    limit: 100,
    cursor
  });

  allPersonas.push(...response.data);
  cursor = response.nextCursor;
} while (cursor);

console.log(`Fetched ${allPersonas.length} personas`);
```

## Webhooks

Subscribe to events to receive real-time notifications.

**Create Webhook:**
```typescript
const webhook = await client.insanIQ.createWebhook({
  url: 'https://yourapp.com/webhooks/insan-iq',
  events: [
    'persona.created',
    'persona.updated',
    'assessment.completed',
    'learning_path.progress_updated'
  ],
  secret: 'whsec_abc123def456' // For signature verification
});
```

**Verify Webhook Signature:**
```typescript
import crypto from 'crypto';

function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Express.js webhook handler
app.post('/webhooks/insan-iq', (req, res) => {
  const signature = req.headers['x-lydian-signature'];
  const payload = JSON.stringify(req.body);

  if (!verifyWebhookSignature(payload, signature, WEBHOOK_SECRET)) {
    return res.status(401).send('Invalid signature');
  }

  const event = req.body;
  console.log('Event received:', event.type);

  // Handle event
  if (event.type === 'assessment.completed') {
    handleAssessmentCompleted(event.data);
  }

  res.status(200).send('OK');
});
```

## Best Practices

### 1. Cache Persona Configurations
```typescript
const cache = new Map();

async function getPersona(personaId: string) {
  if (cache.has(personaId)) {
    return cache.get(personaId);
  }

  const persona = await client.insanIQ.getPersona(personaId);
  cache.set(personaId, persona);

  return persona;
}
```

### 2. Use Streaming for Long Responses
```typescript
const stream = await client.insanIQ.chatStream({
  personaId: 'persona_123',
  messages: [{ role: 'user', content: 'Explain quantum computing' }]
});

for await (const chunk of stream) {
  process.stdout.write(chunk.content);
}
```

### 3. Implement Retry Logic
```typescript
async function retryWithBackoff<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;

      const delay = Math.pow(2, i) * 1000; // Exponential backoff
      await sleep(delay);
    }
  }
  throw new Error('Max retries exceeded');
}

const persona = await retryWithBackoff(() =>
  client.insanIQ.createPersona({ ... })
);
```

## Next Steps

**Explore Advanced Features:**
- [Persona Management Guide](./insan-iq-personas.md)
- [Skill Assessment Deep Dive](./insan-iq-assessments.md)
- [Learning Paths & Curricula](./insan-iq-learning-paths.md)
- [Reasoning Engine](./insan-iq-reasoning.md)

**Integrate with Other Modules:**
- [Smart Cities Integration](../guides/smart-cities-getting-started.md)
- [LyDian IQ Integration](../guides/lydian-iq-getting-started.md)

**API Reference:**
- [İnsan IQ API Reference](../api/insan-iq-api.md)
- [Specialized Assistants Reference](../api/insan-iq-assistants.md)

## Support

- **Documentation**: [https://docs.lydian.com](https://docs.lydian.com)
- **API Status**: [https://status.lydian.com](https://status.lydian.com)
- **Community**: [https://community.lydian.com](https://community.lydian.com)
- **Support Email**: support@lydian.com
