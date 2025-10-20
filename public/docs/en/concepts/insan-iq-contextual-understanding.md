# İnsan IQ Contextual Understanding

Deep dive into how İnsan IQ processes, maintains, and leverages context for human-centric AI interactions with sophisticated memory systems and situational awareness.

## Overview

Contextual understanding is the foundation of İnsan IQ's ability to engage in meaningful, human-like conversations. This document explores the mechanisms for capturing, storing, retrieving, and applying contextual information across interactions.

## Context Types

### 1. Conversational Context

Immediate dialogue history and ongoing conversation state.

```typescript
import { InsanIQClient } from '@lydian/insan-iq';

const client = new InsanIQClient({
  apiKey: process.env.INSAN_IQ_API_KEY
});

// Track conversational context
const conversation = await client.context.createConversation({
  user_id: 'user_12345',
  conversation_id: 'conv_67890',
  context_window: 20, // Last 20 exchanges
  metadata: {
    channel: 'web_chat',
    language: 'en',
    topic: 'customer_support'
  }
});

// Add exchange to context
await client.context.addExchange({
  conversation_id: conversation.id,
  role: 'user',
  content: 'I ordered a product last week but it hasn't arrived',
  timestamp: new Date(),
  metadata: {
    sentiment: 'frustrated',
    intent: 'track_order'
  }
});

await client.context.addExchange({
  conversation_id: conversation.id,
  role: 'assistant',
  content: 'I understand your frustration. Let me help you track your order.',
  timestamp: new Date(),
  metadata: {
    empathy_score: 0.89,
    action: 'initiate_order_lookup'
  }
});

// Retrieve conversation context
const contextHistory = await client.context.getHistory({
  conversation_id: conversation.id,
  limit: 10
});

console.log(contextHistory.exchanges);
```

**Key Features:**
- **Turn-by-turn tracking**: Each user-assistant exchange captured
- **Sentiment evolution**: Track emotional trajectory over conversation
- **Intent progression**: Monitor how user goals evolve
- **Topic shifts**: Detect and manage conversation topic changes

### 2. User Context

Long-term user profile, preferences, and behavioral patterns.

```typescript
// Build user context profile
const userContext = await client.context.buildUserProfile({
  user_id: 'user_12345',
  sources: [
    'conversation_history',
    'preference_settings',
    'behavioral_analytics'
  ],
  time_range: '90d'
});

console.log(userContext.profile);
// {
//   communication_style: 'direct',
//   formality_preference: 'casual',
//   topics_of_interest: ['technology', 'health', 'finance'],
//   emotional_baseline: { positivity: 0.65, anxiety_tendency: 0.42 },
//   interaction_patterns: {
//     avg_message_length: 85,
//     question_frequency: 0.68,
//     response_time_preference: 'immediate'
//   }
// }

// Apply user context to response generation
const response = await client.generate({
  prompt: 'How can I improve my sleep quality?',
  user_context: userContext,
  adapt_to_user: true
});

console.log(response.text);
// Response adapted to user's communication style and known interests
```

**Profile Components:**
- **Preferences**: Communication style, formality, topics
- **Behavioral patterns**: Interaction habits, response times
- **Emotional baseline**: Typical emotional state, triggers
- **Historical knowledge**: Past conversations, resolved issues

### 3. Situational Context

Real-time environmental and situational factors.

```typescript
// Capture situational context
const situationalContext = await client.context.captureSituation({
  timestamp: new Date(),
  user_id: 'user_12345',
  environment: {
    time_of_day: 'evening',
    day_of_week: 'friday',
    location: { city: 'New York', timezone: 'America/New_York' },
    device: 'mobile',
    network: 'cellular'
  },
  user_state: {
    activity: 'commuting',
    stress_level: 0.72,
    multitasking: true
  }
});

// Adapt response based on situation
const adaptiveResponse = await client.generate({
  prompt: 'I need help with a complex technical issue',
  situational_context: situationalContext,
  adaptations: {
    brevity: situationalContext.user_state.multitasking ? 'high' : 'medium',
    complexity: situationalContext.environment.device === 'mobile' ? 'simplified' : 'full',
    urgency: situationalContext.user_state.stress_level > 0.7 ? 'high' : 'normal'
  }
});
```

**Situational Factors:**
- **Temporal**: Time of day, day of week, season
- **Environmental**: Location, device, network conditions
- **User state**: Activity, stress level, focus capacity
- **Session context**: Entry point, referral source, campaign

### 4. Domain Context

Subject matter expertise and specialized knowledge domains.

```typescript
// Activate domain-specific context
const domainContext = await client.context.activateDomain({
  domain: 'healthcare',
  specialization: 'mental_health',
  expertise_level: 'professional',
  terminology: 'clinical',
  regulations: ['HIPAA', 'informed_consent']
});

// Domain-aware conversation
const clinicalResponse = await client.generate({
  prompt: 'Patient reports persistent anhedonia and fatigue',
  domain_context: domainContext,
  require_disclaimer: true,
  avoid_diagnosis: true
});

console.log(clinicalResponse.text);
// Uses appropriate clinical terminology while maintaining ethical boundaries
console.log(clinicalResponse.disclaimers);
// ['This is not medical advice', 'Consult a licensed professional']
```

**Domain Attributes:**
- **Terminology**: Domain-specific vocabulary
- **Expertise level**: Layperson, professional, expert
- **Regulatory compliance**: HIPAA, GDPR, industry standards
- **Knowledge boundaries**: What the system can/cannot advise on

## Context Management

### Context Storage

```typescript
// Configure context storage strategy
const storage = await client.context.configureStorage({
  short_term: {
    backend: 'memory',
    retention: '2h',
    max_size: 1000 // tokens
  },
  medium_term: {
    backend: 'redis',
    retention: '7d',
    compression: 'lz4'
  },
  long_term: {
    backend: 'postgresql',
    retention: '1y',
    indexing: ['user_id', 'timestamp', 'topic'],
    encryption: true
  }
});

// Store context with appropriate tier
await client.context.store({
  data: conversationExchange,
  tier: 'medium_term',
  tags: ['customer_support', 'order_tracking'],
  importance: 0.75
});
```

### Context Retrieval

```typescript
// Semantic context search
const relevantContext = await client.context.search({
  query: 'previous discussions about shipping delays',
  user_id: 'user_12345',
  search_strategy: 'semantic_similarity',
  time_range: '30d',
  limit: 5,
  min_relevance: 0.7
});

console.log(relevantContext.results);
// [
//   {
//     content: 'User asked about delayed shipment on 2024-09-15',
//     relevance_score: 0.92,
//     context_type: 'conversation',
//     timestamp: '2024-09-15T14:23:00Z'
//   },
//   ...
// ]

// Temporal context retrieval
const recentContext = await client.context.getRecent({
  user_id: 'user_12345',
  hours: 24,
  types: ['conversation', 'user_action'],
  sort: 'chronological'
});
```

### Context Prioritization

```typescript
// Prioritize context by relevance and recency
const prioritized = await client.context.prioritize({
  conversation_id: 'conv_67890',
  current_input: 'What was the tracking number again?',
  strategies: [
    { type: 'semantic_relevance', weight: 0.5 },
    { type: 'temporal_recency', weight: 0.3 },
    { type: 'importance_score', weight: 0.2 }
  ],
  max_context_tokens: 1500
});

console.log(prioritized.selected_context);
// Top contexts that fit within token budget, ranked by combined score
```

## Context Integration

### Multi-Source Context Fusion

```typescript
// Fuse context from multiple sources
const fusedContext = await client.context.fuse({
  sources: [
    { type: 'conversation', data: conversationHistory },
    { type: 'user_profile', data: userProfile },
    { type: 'knowledge_base', data: relevantArticles },
    { type: 'real_time_data', data: orderStatus }
  ],
  fusion_strategy: 'weighted_ensemble',
  weights: {
    conversation: 0.4,
    user_profile: 0.2,
    knowledge_base: 0.25,
    real_time_data: 0.15
  },
  resolve_conflicts: 'most_recent'
});

// Generate response with fused context
const response = await client.generate({
  prompt: 'Where is my package?',
  context: fusedContext,
  max_length: 200
});
```

### Context-Aware Generation

```typescript
// Generate with explicit context utilization
const contextAwareResponse = await client.generate({
  prompt: 'I'm still having the same issue',
  context: {
    previous_issue: 'Login failure on mobile app',
    attempted_solutions: ['Clear cache', 'Reinstall app'],
    user_technical_level: 'intermediate',
    user_frustration: 0.78
  },
  generation_config: {
    acknowledge_context: true,
    build_on_previous: true,
    avoid_repetition: true,
    escalation_trigger: { frustration_threshold: 0.75 }
  }
});

console.log(contextAwareResponse.text);
// "I understand the previous solutions haven't worked. Given your technical background,
//  let's try advanced troubleshooting steps..."

console.log(contextAwareResponse.actions);
// [{ type: 'escalate_to_specialist', reason: 'high_frustration_and_failed_solutions' }]
```

## Context Tracking Patterns

### Session Context

```typescript
// Track session-level context
const session = await client.context.createSession({
  user_id: 'user_12345',
  session_id: 'session_abc123',
  initial_state: {
    entry_point: 'product_page',
    referrer: 'google_search',
    utm_campaign: 'summer_sale'
  }
});

// Update session context as user progresses
await client.context.updateSession({
  session_id: session.id,
  events: [
    { type: 'page_view', page: 'cart', timestamp: new Date() },
    { type: 'interaction', action: 'add_to_cart', item_id: 'prod_456' },
    { type: 'support_initiated', reason: 'question_about_shipping' }
  ]
});

// Retrieve session context for personalized support
const sessionContext = await client.context.getSession({
  session_id: session.id
});

console.log(sessionContext.journey);
// ['product_page', 'cart', 'support'] - User's navigation path
```

### Intent Context

```typescript
// Track intent evolution across conversation
const intentTracking = await client.context.trackIntent({
  conversation_id: 'conv_67890',
  current_input: 'Actually, I also want to change my delivery address',
  intent_history: [
    { intent: 'track_order', confidence: 0.95, timestamp: '10:15:23' },
    { intent: 'modify_order', confidence: 0.88, timestamp: '10:16:45' }
  ]
});

console.log(intentTracking.intent_flow);
// [
//   'track_order' → 'modify_order' → 'change_delivery_address'
// ]

console.log(intentTracking.recommended_action);
// { action: 'order_modification_workflow', substep: 'address_update' }
```

### Emotional Context

```typescript
// Track emotional state across conversation
const emotionalContext = await client.context.trackEmotions({
  conversation_id: 'conv_67890',
  current_input: 'Thank you so much for your help!',
  emotion_history: [
    { emotion: 'frustration', intensity: 0.82, timestamp: '10:15:00' },
    { emotion: 'concern', intensity: 0.65, timestamp: '10:16:30' },
    { emotion: 'relief', intensity: 0.71, timestamp: '10:18:15' }
  ]
});

console.log(emotionalContext.emotional_arc);
// ['frustration' → 'concern' → 'relief' → 'gratitude']

console.log(emotionalContext.resolution_quality);
// { score: 0.89, indicator: 'positive_resolution' }
```

## Advanced Context Features

### Context Summarization

```typescript
// Summarize long context for efficient processing
const summarized = await client.context.summarize({
  conversation_id: 'conv_67890',
  strategy: 'extractive_plus_abstractive',
  target_length: 200,
  preserve: ['key_facts', 'user_requests', 'action_items']
});

console.log(summarized.summary);
// "User purchased item on 9/15. Shipping delayed. Requested refund.
//  Agent offered 20% discount. User accepted and issue resolved."

console.log(summarized.key_entities);
// {
//   order_id: 'ORD-12345',
//   purchase_date: '2024-09-15',
//   resolution: 'discount_applied',
//   discount_amount: '20%'
// }
```

### Context Projection

```typescript
// Project likely future context needs
const projection = await client.context.project({
  current_context: currentConversationContext,
  user_behavior_model: userProfile.behavior,
  predict_ahead: '5_turns',
  confidence_threshold: 0.6
});

console.log(projection.likely_needs);
// [
//   { need: 'shipping_status_update', probability: 0.87 },
//   { need: 'return_policy_info', probability: 0.64 },
//   { need: 'contact_human_agent', probability: 0.42 }
// ]

// Pre-fetch relevant context
await client.context.prefetch({
  resources: projection.likely_needs
    .filter(n => n.probability > 0.6)
    .map(n => n.need)
});
```

### Cross-Conversation Context

```typescript
// Link related conversations
const crossConversation = await client.context.linkConversations({
  primary_conversation_id: 'conv_67890',
  related_conversations: [
    'conv_54321', // Previous order issue
    'conv_98765'  // Account setup conversation
  ],
  relationship_type: 'user_history',
  extract_patterns: true
});

console.log(crossConversation.patterns);
// {
//   recurring_issues: ['shipping_delays'],
//   preferred_resolutions: ['discount_compensation'],
//   escalation_tendency: 'low',
//   communication_preference: 'concise'
// }
```

## Context Privacy & Security

### Context Anonymization

```typescript
// Anonymize sensitive context
const anonymized = await client.context.anonymize({
  context: rawConversationContext,
  pii_types: ['email', 'phone', 'address', 'ssn', 'credit_card'],
  strategy: 'tokenization',
  preserve_semantics: true
});

console.log(anonymized.data);
// Original: "My email is john.doe@example.com"
// Anonymized: "My email is [EMAIL_TOKEN_A47F]"

console.log(anonymized.token_map);
// { 'EMAIL_TOKEN_A47F': 'encrypted_reference_to_john.doe@example.com' }
```

### Context Access Control

```typescript
// Configure context access policies
await client.context.setAccessControl({
  conversation_id: 'conv_67890',
  policies: [
    {
      role: 'ai_agent',
      permissions: ['read', 'append'],
      restrictions: ['no_pii_export', 'no_long_term_storage']
    },
    {
      role: 'human_supervisor',
      permissions: ['read', 'annotate'],
      require_audit: true
    },
    {
      role: 'analytics_system',
      permissions: ['read_anonymized'],
      data_retention: '30d'
    }
  ]
});
```

### Context Expiration

```typescript
// Set context lifecycle policies
await client.context.setLifecycle({
  conversation_id: 'conv_67890',
  retention_policy: {
    hot_storage: '7d',    // Fast access
    warm_storage: '30d',   // Archive
    cold_storage: '1y',    // Compliance
    auto_delete: true
  },
  pii_handling: {
    redact_after: '90d',
    delete_after: '1y',
    comply_with: ['GDPR', 'CCPA']
  }
});
```

## Performance Optimization

### Context Caching

```typescript
// Cache frequently accessed context
const cache = await client.context.enableCaching({
  strategy: 'lru',
  max_size_mb: 500,
  ttl_seconds: 3600,
  cache_keys: ['user_profile', 'domain_knowledge', 'recent_exchanges']
});

// Retrieve from cache
const cached = await client.context.getCached({
  key: 'user_profile:user_12345',
  fallback: async () => {
    return await client.context.buildUserProfile({ user_id: 'user_12345' });
  }
});
```

### Context Compression

```typescript
// Compress context for efficient storage
const compressed = await client.context.compress({
  data: largeConversationHistory,
  algorithm: 'zstd',
  level: 9,
  preserve_searchability: true
});

console.log(compressed.stats);
// {
//   original_size_kb: 450,
//   compressed_size_kb: 67,
//   compression_ratio: 6.7,
//   decompression_time_ms: 15
// }
```

### Context Streaming

```typescript
// Stream context for large conversations
const contextStream = await client.context.stream({
  conversation_id: 'conv_67890',
  chunk_size: 50, // exchanges per chunk
  include_metadata: true
});

for await (const chunk of contextStream) {
  console.log(`Processing chunk ${chunk.index}/${chunk.total}`);
  await processContextChunk(chunk.data);
}
```

## Best Practices

### 1. Context Window Management

```typescript
// Optimize context window size
const optimized = await client.context.optimizeWindow({
  conversation_id: 'conv_67890',
  max_tokens: 2048,
  optimization_goals: ['relevance', 'recency', 'diversity'],
  mandatory_context: ['last_3_exchanges', 'user_request']
});

console.log(optimized.selected_context);
console.log(optimized.token_usage); // 1847/2048
```

### 2. Context Relevance Scoring

```typescript
// Score context relevance
const scored = await client.context.scoreRelevance({
  candidate_contexts: historicalConversations,
  current_query: 'How do I reset my password?',
  scoring_factors: {
    semantic_similarity: 0.5,
    temporal_proximity: 0.3,
    user_action_correlation: 0.2
  }
});

console.log(scored.ranked_contexts);
// Contexts ranked by relevance to current query
```

### 3. Context Conflict Resolution

```typescript
// Resolve conflicting context
const resolved = await client.context.resolveConflicts({
  contexts: [
    { source: 'user_stated', data: { preference: 'email' }, timestamp: '2024-09-20' },
    { source: 'system_observed', data: { preference: 'sms' }, timestamp: '2024-09-25' }
  ],
  resolution_strategy: 'most_recent',
  confidence_threshold: 0.8
});

console.log(resolved.final_context);
// { preference: 'sms', confidence: 0.95, source: 'system_observed' }
```

## Related Documentation

- [İnsan IQ Neural Architecture](./insan-iq-neural-architecture.md)
- [İnsan IQ Conversation AI Guide](../guides/insan-iq-conversation-ai.md)
- [İnsan IQ Memory Systems](../guides/insan-iq-memory-systems.md)

## Support

- **Documentation**: https://docs.lydian.com
- **Context Management Best Practices**: https://research.lydian.com/context-management
- **Privacy & Compliance**: https://docs.lydian.com/privacy
