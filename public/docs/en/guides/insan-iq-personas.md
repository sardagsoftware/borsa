# Managing AI Personas - İnsan IQ

## Overview

AI Personas are the foundation of İnsan IQ's intelligent capabilities. A persona is a customizable AI agent with specialized knowledge, personality traits, and capabilities tailored to specific domains such as legal, medical, education, or business advisory.

This guide covers persona lifecycle management, customization, optimization, and best practices for building production-grade AI assistants.

**What You'll Learn:**
- Create and configure AI personas
- Customize personality traits and behavior
- Manage knowledge domains and capabilities
- Optimize persona performance
- Version and deploy personas
- Monitor persona usage and quality

## Persona Architecture

### Core Components

```typescript
interface Persona {
  id: string;
  name: string;
  type: PersonaType;
  status: 'draft' | 'active' | 'archived';

  // Knowledge & Capabilities
  knowledgeDomains: string[];
  capabilities: string[];
  languagesSupported: string[];

  // Personality Configuration
  personalityTraits: {
    formality: 'casual' | 'professional' | 'formal';
    tone: 'helpful' | 'authoritative' | 'empathetic' | 'analytical';
    verbosity: 'concise' | 'balanced' | 'detailed';
    creativity: number; // 0-1
  };

  // Model Configuration
  settings: {
    temperature: number;
    maxTokens: number;
    topP: number;
    frequencyPenalty: number;
    presencePenalty: number;
    responseFormat: 'text' | 'structured' | 'markdown';
  };

  // Knowledge Base
  knowledgeBase?: {
    documents: string[];
    embeddings: string[];
    vectorStoreId: string;
  };

  // Version Control
  version: string;
  parentPersonaId?: string;

  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
```

## Creating Personas

### Basic Persona Creation

**TypeScript:**
```typescript
import { Lydian } from '@lydian/sdk';

const client = new Lydian({ apiKey: process.env.LYDIAN_API_KEY });

const persona = await client.insanIQ.createPersona({
  name: 'Corporate Legal Assistant',
  type: 'legal_expert',
  knowledgeDomains: [
    'corporate_law',
    'contract_law',
    'intellectual_property',
    'mergers_acquisitions'
  ],
  capabilities: [
    'document_analysis',
    'legal_research',
    'contract_review',
    'risk_assessment',
    'compliance_check'
  ],
  languagesSupported: ['en', 'tr', 'de'],
  personalityTraits: {
    formality: 'professional',
    tone: 'authoritative',
    verbosity: 'balanced',
    creativity: 0.3 // Low creativity for legal precision
  },
  settings: {
    temperature: 0.5, // Balanced between deterministic and creative
    maxTokens: 3000,
    topP: 0.9,
    frequencyPenalty: 0.3,
    presencePenalty: 0.3,
    responseFormat: 'structured'
  }
});

console.log(`Created persona: ${persona.id}`);
```

**Python:**
```python
from lydian import Lydian

client = Lydian(api_key=os.environ['LYDIAN_API_KEY'])

persona = client.insan_iq.create_persona(
    name='Corporate Legal Assistant',
    type='legal_expert',
    knowledge_domains=[
        'corporate_law',
        'contract_law',
        'intellectual_property',
        'mergers_acquisitions'
    ],
    capabilities=[
        'document_analysis',
        'legal_research',
        'contract_review',
        'risk_assessment',
        'compliance_check'
    ],
    languages_supported=['en', 'tr', 'de'],
    personality_traits={
        'formality': 'professional',
        'tone': 'authoritative',
        'verbosity': 'balanced',
        'creativity': 0.3
    },
    settings={
        'temperature': 0.5,
        'max_tokens': 3000,
        'response_format': 'structured'
    }
)
```

### Domain-Specific Personas

#### Medical Expert Persona

```typescript
const medicalPersona = await client.insanIQ.createPersona({
  name: 'Medical Diagnostic Assistant',
  type: 'medical_expert',
  knowledgeDomains: [
    'internal_medicine',
    'diagnostics',
    'pharmacology',
    'radiology',
    'pathology'
  ],
  capabilities: [
    'symptom_analysis',
    'differential_diagnosis',
    'treatment_recommendations',
    'drug_interactions',
    'medical_imaging_analysis'
  ],
  languagesSupported: ['en', 'tr', 'es', 'de'],
  personalityTraits: {
    formality: 'professional',
    tone: 'empathetic',
    verbosity: 'detailed',
    creativity: 0.4
  },
  settings: {
    temperature: 0.6,
    maxTokens: 4000,
    responseFormat: 'structured'
  },
  metadata: {
    certifications: ['HIPAA_compliant', 'GDPR_compliant'],
    specializations: ['cardiology', 'neurology'],
    disclaimers: 'This AI assistant provides information for educational purposes only. Always consult a licensed physician.'
  }
});
```

#### Education Persona

```typescript
const educatorPersona = await client.insanIQ.createPersona({
  name: 'Math Tutor Pro',
  type: 'educator',
  knowledgeDomains: [
    'mathematics',
    'calculus',
    'algebra',
    'geometry',
    'statistics',
    'problem_solving'
  ],
  capabilities: [
    'concept_explanation',
    'step_by_step_solutions',
    'practice_problem_generation',
    'learning_assessment',
    'adaptive_teaching'
  ],
  languagesSupported: ['en', 'tr', 'es', 'fr', 'zh'],
  personalityTraits: {
    formality: 'casual',
    tone: 'helpful',
    verbosity: 'detailed',
    creativity: 0.7 // Higher creativity for teaching analogies
  },
  settings: {
    temperature: 0.8,
    maxTokens: 2500,
    responseFormat: 'markdown'
  },
  metadata: {
    gradeLevel: 'high_school',
    teachingStyle: 'socratic',
    visualAids: true
  }
});
```

#### Business Advisor Persona

```typescript
const businessAdvisor = await client.insanIQ.createPersona({
  name: 'Strategic Business Consultant',
  type: 'business_advisor',
  knowledgeDomains: [
    'strategy',
    'finance',
    'marketing',
    'operations',
    'human_resources',
    'technology'
  ],
  capabilities: [
    'swot_analysis',
    'market_research',
    'financial_modeling',
    'business_planning',
    'competitive_analysis',
    'growth_strategy'
  ],
  languagesSupported: ['en', 'tr', 'de', 'fr'],
  personalityTraits: {
    formality: 'professional',
    tone: 'analytical',
    verbosity: 'balanced',
    creativity: 0.6
  },
  settings: {
    temperature: 0.7,
    maxTokens: 3500,
    responseFormat: 'structured'
  },
  metadata: {
    industries: ['technology', 'finance', 'healthcare', 'retail'],
    frameworks: ['porter_five_forces', 'bcg_matrix', 'ansoff_matrix']
  }
});
```

## Customizing Personality Traits

### Formality Levels

```typescript
// Casual (friendly, conversational)
personalityTraits: {
  formality: 'casual',
  tone: 'helpful',
  verbosity: 'concise'
}
// Example output: "Hey! Let's break this down. So basically, a derivative is..."

// Professional (balanced, respectful)
personalityTraits: {
  formality: 'professional',
  tone: 'helpful',
  verbosity: 'balanced'
}
// Example output: "I'd be happy to explain derivatives. A derivative represents..."

// Formal (precise, technical)
personalityTraits: {
  formality: 'formal',
  tone: 'authoritative',
  verbosity: 'detailed'
}
// Example output: "In calculus, the derivative of a function represents the instantaneous rate of change..."
```

### Tone Customization

```typescript
// Helpful tone (supportive, encouraging)
tone: 'helpful'
// "Great question! Let me help you understand this concept step by step."

// Authoritative tone (confident, expert)
tone: 'authoritative'
// "Based on legal precedent and statutory requirements, the recommended approach is..."

// Empathetic tone (understanding, compassionate)
tone: 'empathetic'
// "I understand this can be concerning. Let's review your symptoms carefully..."

// Analytical tone (logical, data-driven)
tone: 'analytical'
// "Analyzing the data reveals three key trends. First, market share has increased by 15%..."
```

### Verbosity Control

```typescript
// Concise (brief, to the point)
verbosity: 'concise'
// Response: 100-200 words, bullet points

// Balanced (comprehensive but focused)
verbosity: 'balanced'
// Response: 200-400 words, structured paragraphs

// Detailed (thorough, in-depth)
verbosity: 'detailed'
// Response: 400+ words, comprehensive explanations
```

## Knowledge Base Integration

### Adding Documents to Persona

```typescript
// Upload knowledge base documents
const documents = await client.insanIQ.uploadDocuments({
  personaId: persona.id,
  files: [
    { path: './legal/corporate-law-handbook.pdf', type: 'pdf' },
    { path: './legal/contract-templates.docx', type: 'docx' },
    { path: './legal/case-studies/', type: 'directory' }
  ],
  options: {
    chunkSize: 1000, // Characters per chunk
    overlap: 200, // Overlap between chunks
    embeddingModel: 'text-embedding-ada-002'
  }
});

console.log(`Uploaded ${documents.count} documents`);
console.log(`Created ${documents.chunks} chunks`);
console.log(`Vector store: ${documents.vectorStoreId}`);
```

**Python:**
```python
documents = client.insan_iq.upload_documents(
    persona_id=persona.id,
    files=[
        {'path': './legal/corporate-law-handbook.pdf', 'type': 'pdf'},
        {'path': './legal/contract-templates.docx', 'type': 'docx'}
    ],
    options={
        'chunk_size': 1000,
        'overlap': 200,
        'embedding_model': 'text-embedding-ada-002'
    }
)
```

### Querying with Knowledge Base

```typescript
const response = await client.insanIQ.chat({
  personaId: persona.id,
  messages: [
    {
      role: 'user',
      content: 'What are the key clauses in a software licensing agreement?'
    }
  ],
  options: {
    useKnowledgeBase: true,
    includeReferences: true,
    maxReferences: 5
  }
});

console.log('Response:', response.response.content);
console.log('\nReferences:');
response.references.forEach(ref => {
  console.log(`- ${ref.document} (page ${ref.page}): ${ref.snippet}`);
});
```

### Updating Knowledge Base

```typescript
// Add new documents
await client.insanIQ.addDocuments({
  personaId: persona.id,
  files: [{ path: './legal/new-regulations-2024.pdf' }]
});

// Remove outdated documents
await client.insanIQ.removeDocuments({
  personaId: persona.id,
  documentIds: ['doc_01HXA2B3C4D5E6F7G8H9J0K1L2']
});

// Rebuild embeddings
await client.insanIQ.rebuildEmbeddings({
  personaId: persona.id,
  model: 'text-embedding-3-large' // Upgrade to better model
});
```

## Persona Optimization

### A/B Testing Personas

```typescript
// Create variant persona for testing
const variantPersona = await client.insanIQ.createPersona({
  ...persona,
  name: `${persona.name} - Variant A`,
  parentPersonaId: persona.id,
  settings: {
    ...persona.settings,
    temperature: 0.7 // Test higher temperature
  }
});

// Track performance
const metrics = await client.insanIQ.getPersonaMetrics({
  personaIds: [persona.id, variantPersona.id],
  metrics: ['response_time', 'user_satisfaction', 'accuracy'],
  timeRange: {
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    end: new Date()
  }
});

// Compare results
metrics.forEach(m => {
  console.log(`${m.personaName}:`);
  console.log(`  Avg Response Time: ${m.avgResponseTime}ms`);
  console.log(`  User Satisfaction: ${m.userSatisfaction}/5`);
  console.log(`  Accuracy: ${m.accuracy}%`);
});
```

### Performance Tuning

```typescript
// Monitor token usage
const usage = await client.insanIQ.getTokenUsage({
  personaId: persona.id,
  groupBy: 'day',
  timeRange: { start: '2024-01-01', end: '2024-01-31' }
});

console.log('Token Usage Analysis:');
console.log(`Total tokens: ${usage.total}`);
console.log(`Avg per conversation: ${usage.avgPerConversation}`);
console.log(`Cost estimate: $${usage.estimatedCost}`);

// Optimize settings if tokens are too high
if (usage.avgPerConversation > 2000) {
  await client.insanIQ.updatePersona(persona.id, {
    settings: {
      ...persona.settings,
      maxTokens: 2000, // Reduce max tokens
      verbosity: 'concise' // Make responses more concise
    }
  });
}
```

### Quality Monitoring

```typescript
// Enable automatic quality checks
await client.insanIQ.configureQualityMonitoring({
  personaId: persona.id,
  checks: [
    {
      type: 'toxicity',
      threshold: 0.1, // Block responses with >10% toxicity
      action: 'reject_and_regenerate'
    },
    {
      type: 'hallucination',
      threshold: 0.15,
      action: 'flag_for_review'
    },
    {
      type: 'bias',
      categories: ['gender', 'race', 'religion'],
      action: 'flag_and_log'
    },
    {
      type: 'pii_leak',
      patterns: ['ssn', 'credit_card', 'email', 'phone'],
      action: 'block_and_alert'
    }
  ]
});

// Review flagged responses
const flagged = await client.insanIQ.getFlaggedResponses({
  personaId: persona.id,
  checkType: 'hallucination',
  limit: 50
});

flagged.forEach(response => {
  console.log(`Conversation: ${response.conversationId}`);
  console.log(`Issue: ${response.issue}`);
  console.log(`Confidence: ${response.confidence}`);
  console.log(`Action taken: ${response.actionTaken}`);
});
```

## Version Control

### Creating Persona Versions

```typescript
// Create a new version (snapshot)
const version = await client.insanIQ.createPersonaVersion({
  personaId: persona.id,
  versionName: 'v1.2.0',
  description: 'Added M&A knowledge domain and improved contract analysis',
  changes: [
    'Added mergers_acquisitions knowledge domain',
    'Increased max tokens from 2000 to 3000',
    'Updated knowledge base with 2024 regulations'
  ]
});

console.log(`Created version: ${version.version}`);
console.log(`Snapshot ID: ${version.snapshotId}`);
```

### Rolling Back

```typescript
// List versions
const versions = await client.insanIQ.listPersonaVersions({
  personaId: persona.id
});

versions.forEach(v => {
  console.log(`${v.version} - ${v.createdAt} - ${v.description}`);
});

// Rollback to previous version
await client.insanIQ.rollbackPersona({
  personaId: persona.id,
  targetVersion: 'v1.1.0'
});

console.log('Rolled back to v1.1.0');
```

### Branching Personas

```typescript
// Create a branch for experimentation
const experimentalBranch = await client.insanIQ.clonePersona({
  sourcePersonaId: persona.id,
  name: `${persona.name} - Experimental`,
  changes: {
    settings: {
      temperature: 0.9, // Much higher for creative experiments
      creativity: 0.8
    },
    personalityTraits: {
      tone: 'creative',
      verbosity: 'detailed'
    }
  }
});

// Test experimental branch
const experimentalResponse = await client.insanIQ.chat({
  personaId: experimentalBranch.id,
  messages: [{ role: 'user', content: 'Explain quantum computing' }]
});

// Merge successful changes back to main persona
await client.insanIQ.mergePersona({
  sourcePersonaId: experimentalBranch.id,
  targetPersonaId: persona.id,
  mergeStrategy: 'selective',
  selectedChanges: ['settings.temperature']
});
```

## Multi-Tenant Persona Management

### Organization-Level Personas

```typescript
// Create organization-wide persona
const orgPersona = await client.insanIQ.createPersona({
  name: 'Company Legal Assistant',
  type: 'legal_expert',
  scope: 'organization',
  organizationId: 'org_123',
  permissions: {
    read: ['org:legal_team', 'org:executives'],
    write: ['org:legal_admins'],
    deploy: ['org:it_admins']
  }
});

// Share with specific teams
await client.insanIQ.sharePersona({
  personaId: orgPersona.id,
  shareWith: [
    { teamId: 'team_legal', role: 'viewer' },
    { teamId: 'team_compliance', role: 'editor' }
  ]
});
```

### User-Level Personas

```typescript
// Create personal persona
const personalPersona = await client.insanIQ.createPersona({
  name: 'My Research Assistant',
  type: 'researcher',
  scope: 'user',
  userId: 'user_456',
  permissions: {
    read: ['user:user_456'],
    write: ['user:user_456']
  }
});
```

## Best Practices

### 1. Start Simple, Iterate

```typescript
// ✅ Good: Start with minimal configuration
const persona = await client.insanIQ.createPersona({
  name: 'Legal Assistant v1',
  type: 'legal_expert',
  knowledgeDomains: ['contract_law'],
  capabilities: ['contract_review']
});

// Test with real users
// Collect feedback
// Add domains/capabilities incrementally

// ❌ Bad: Over-engineering from the start
const persona = await client.insanIQ.createPersona({
  knowledgeDomains: ['contract_law', 'ip_law', 'corporate_law', ...50 more],
  capabilities: [...100 capabilities],
  // Too complex to manage
});
```

### 2. Monitor and Optimize

```typescript
// Set up monitoring from day one
await client.insanIQ.enableMonitoring({
  personaId: persona.id,
  metrics: ['latency', 'tokens', 'satisfaction', 'accuracy'],
  alerts: [
    {
      metric: 'latency',
      threshold: 3000, // Alert if response >3s
      channel: 'email'
    },
    {
      metric: 'satisfaction',
      threshold: 3.5, // Alert if rating <3.5/5
      channel: 'slack'
    }
  ]
});
```

### 3. Use Appropriate Temperature

```typescript
// Low temperature (0.3-0.5) for factual, deterministic tasks
const legalPersona = await client.insanIQ.createPersona({
  settings: { temperature: 0.4 }
});

// Medium temperature (0.6-0.8) for balanced responses
const tutorPersona = await client.insanIQ.createPersona({
  settings: { temperature: 0.7 }
});

// High temperature (0.8-1.0) for creative tasks
const creativeWriterPersona = await client.insanIQ.createPersona({
  settings: { temperature: 0.9 }
});
```

### 4. Implement Guardrails

```typescript
// Add safety guardrails
await client.insanIQ.setGuardrails({
  personaId: persona.id,
  rules: [
    {
      type: 'content_filter',
      categories: ['violence', 'hate', 'sexual', 'self_harm'],
      action: 'block'
    },
    {
      type: 'output_validation',
      schema: {
        type: 'object',
        required: ['analysis', 'recommendation', 'confidence']
      },
      action: 'regenerate_if_invalid'
    },
    {
      type: 'input_sanitization',
      patterns: ['<script>', 'DROP TABLE', 'eval('],
      action: 'reject'
    }
  ]
});
```

### 5. Version Control

```typescript
// Always version before major changes
await client.insanIQ.createPersonaVersion({
  personaId: persona.id,
  versionName: `v${currentVersion}`,
  description: 'Snapshot before adding new knowledge domain'
});

// Make changes
await client.insanIQ.updatePersona(persona.id, { ... });

// Test thoroughly
// If issues, rollback
```

## Troubleshooting

### Issue: Responses Are Too Generic

**Solution**: Add domain-specific knowledge base
```typescript
await client.insanIQ.uploadDocuments({
  personaId: persona.id,
  files: [{ path: './domain-specific-docs/' }]
});
```

### Issue: Inconsistent Personality

**Solution**: Lower temperature, add system prompt
```typescript
await client.insanIQ.updatePersona(persona.id, {
  settings: { temperature: 0.5 },
  systemPrompt: 'You are a professional legal assistant. Always maintain a formal, authoritative tone.'
});
```

### Issue: High Token Usage

**Solution**: Reduce max tokens, optimize verbosity
```typescript
await client.insanIQ.updatePersona(persona.id, {
  settings: { maxTokens: 1500 },
  personalityTraits: { verbosity: 'concise' }
});
```

## Related Documentation

- [Getting Started with İnsan IQ](./insan-iq-getting-started.md)
- [Skill Assessments](./insan-iq-assessments.md)
- [Learning Paths](./insan-iq-learning-paths.md)
- [İnsan IQ API Reference](../api/insan-iq-api.md)
