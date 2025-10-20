# İnsan IQ Conversation Management Patterns

Production-ready patterns for managing conversations, maintaining context, and creating natural dialogue flows with İnsan IQ.

## Overview

Practical recipes for building sophisticated conversation systems with context management, turn-taking, topic handling, and dialogue state tracking.

## Recipe 1: Multi-Turn Conversation with Memory

### Problem
Maintain context across long conversations without losing coherence.

### Solution
Sliding window context with intelligent summarization.

```typescript
import { InsanIQClient } from '@lydian/insan-iq';

const client = new InsanIQClient({
  apiKey: process.env.INSAN_IQ_API_KEY!
});

class ConversationManager {
  private context: Array<{ role: string; content: string }> = [];
  private summary: string = '';
  private maxContextLength = 10;

  async addTurn(role: 'user' | 'assistant', content: string) {
    this.context.push({ role, content });

    // When context gets too long, summarize old messages
    if (this.context.length > this.maxContextLength) {
      await this.summarizeAndCompress();
    }
  }

  private async summarizeAndCompress() {
    // Summarize first half of conversation
    const toSummarize = this.context.slice(0, this.maxContextLength / 2);

    const summary = await client.conversations.summarize({
      messages: toSummarize,
      preserve: ['key_facts', 'emotional_context', 'commitments'],
      max_length: 200
    });

    // Keep recent messages + summary
    this.summary = summary.text;
    this.context = this.context.slice(this.maxContextLength / 2);
  }

  async generateResponse(userMessage: string): Promise<string> {
    await this.addTurn('user', userMessage);

    const response = await client.generate({
      messages: [
        ...(this.summary ? [{ role: 'system', content: `Previous context: ${this.summary}` }] : []),
        ...this.context
      ],
      max_tokens: 200,
      temperature: 0.7
    });

    await this.addTurn('assistant', response.text);

    return response.text;
  }

  getConversationSummary(): string {
    return this.summary;
  }

  getRecentContext(): typeof this.context {
    return this.context.slice(-5);
  }
}

// Usage
const conversation = new ConversationManager();

await conversation.generateResponse("I'm planning a trip to Paris");
await conversation.generateResponse("What's the weather like there?");
await conversation.generateResponse("Thanks! Any restaurant recommendations?");

console.log(conversation.getConversationSummary());
```

**Key Features**:
- Automatic context compression
- Summary preservation
- Configurable window size

## Recipe 2: Intent-Based Dialogue Flow

### Problem
Route conversation based on user intent and maintain dialogue state.

### Solution
State machine with intent classification.

```typescript
type Intent = 'greet' | 'question' | 'complaint' | 'request' | 'farewell';
type DialogueState = 'initial' | 'engaged' | 'resolving' | 'closing';

class DialogueFlowManager {
  private state: DialogueState = 'initial';
  private currentIntent: Intent | null = null;

  async processMessage(message: string): Promise<string> {
    // Detect intent
    const intent = await client.conversations.detectIntent({
      text: message,
      context: this.state
    });

    this.currentIntent = intent.primary as Intent;

    // Transition state
    const nextState = this.transitionState(this.state, this.currentIntent);
    this.state = nextState;

    // Generate contextual response
    return await this.generateStateAwareResponse(message, intent);
  }

  private transitionState(
    current: DialogueState,
    intent: Intent
  ): DialogueState {
    const transitions: Record<DialogueState, Record<Intent, DialogueState>> = {
      initial: {
        greet: 'engaged',
        question: 'engaged',
        complaint: 'resolving',
        request: 'engaged',
        farewell: 'closing'
      },
      engaged: {
        greet: 'engaged',
        question: 'engaged',
        complaint: 'resolving',
        request: 'engaged',
        farewell: 'closing'
      },
      resolving: {
        greet: 'resolving',
        question: 'resolving',
        complaint: 'resolving',
        request: 'resolving',
        farewell: 'closing'
      },
      closing: {
        greet: 'engaged',
        question: 'engaged',
        complaint: 'resolving',
        request: 'engaged',
        farewell: 'closing'
      }
    };

    return transitions[current][intent] || current;
  }

  private async generateStateAwareResponse(
    message: string,
    intent: any
  ): Promise<string> {
    const response = await client.generate({
      prompt: message,
      context: {
        dialogue_state: this.state,
        intent: this.currentIntent,
        intent_confidence: intent.confidence
      },
      style: this.getStyleForState(this.state)
    });

    return response.text;
  }

  private getStyleForState(state: DialogueState): string {
    const styles = {
      initial: 'welcoming',
      engaged: 'helpful',
      resolving: 'problem_solving',
      closing: 'polite_farewell'
    };

    return styles[state];
  }

  getCurrentState(): DialogueState {
    return this.state;
  }
}
```

**Dialogue Management**:
- State tracking
- Intent-based routing
- Context-aware responses

## Recipe 3: Topic Switching Detection

### Problem
Detect when conversation topic changes and handle gracefully.

### Solution
Topic modeling with smooth transitions.

```typescript
class TopicManager {
  private currentTopic: string | null = null;
  private topicHistory: Array<{ topic: string; timestamp: Date }> = [];

  async processTurn(message: string): Promise<any> {
    // Detect topic
    const topicAnalysis = await client.conversations.analyzeTopic({
      text: message,
      previous_topic: this.currentTopic,
      detect_shift: true
    });

    const topicChanged = topicAnalysis.topic_shift_detected;

    if (topicChanged) {
      await this.handleTopicShift(
        this.currentTopic,
        topicAnalysis.new_topic
      );
    }

    this.currentTopic = topicAnalysis.current_topic;
    this.topicHistory.push({
      topic: topicAnalysis.current_topic,
      timestamp: new Date()
    });

    return {
      topic: topicAnalysis.current_topic,
      shifted: topicChanged,
      transition: topicAnalysis.transition_type,
      response: await this.generateTopicAwareResponse(message, topicAnalysis)
    };
  }

  private async handleTopicShift(
    oldTopic: string | null,
    newTopic: string
  ): Promise<void> {
    console.log(`Topic shift: ${oldTopic} → ${newTopic}`);

    // Optionally acknowledge topic change
    if (oldTopic && this.shouldAcknowledgeShift(oldTopic, newTopic)) {
      // Acknowledge before switching
    }
  }

  private shouldAcknowledgeShift(oldTopic: string, newTopic: string): boolean {
    // Acknowledge if topics are very different
    const topicSimilarity = this.calculateTopicSimilarity(oldTopic, newTopic);
    return topicSimilarity < 0.3;
  }

  private calculateTopicSimilarity(topic1: string, topic2: string): number {
    // Simple similarity calculation
    // In production, use semantic similarity
    return topic1 === topic2 ? 1.0 : 0.0;
  }

  private async generateTopicAwareResponse(
    message: string,
    topicAnalysis: any
  ): Promise<string> {
    const response = await client.generate({
      prompt: message,
      context: {
        current_topic: topicAnalysis.current_topic,
        topic_shift: topicAnalysis.topic_shift_detected,
        topic_history: this.topicHistory.slice(-3)
      },
      acknowledge_topic_shift: topicAnalysis.topic_shift_detected
    });

    return response.text;
  }

  getTopicHistory() {
    return this.topicHistory;
  }
}
```

**Topic Features**:
- Shift detection
- Smooth transitions
- History tracking

## Recipe 4: Clarification Requests

### Problem
Handle ambiguous or unclear user inputs.

### Solution
Intelligent clarification with disambiguation.

```typescript
async function handleAmbiguousInput(userMessage: string) {
  // Analyze clarity
  const clarityAnalysis = await client.conversations.analyzeClarity({
    text: userMessage,
    detect_ambiguity: true,
    identify_missing_info: true
  });

  if (clarityAnalysis.is_ambiguous) {
    return await generateClarification(clarityAnalysis);
  }

  if (clarityAnalysis.missing_information.length > 0) {
    return await requestMissingInfo(clarityAnalysis.missing_information);
  }

  // Message is clear, proceed normally
  return await processNormalMessage(userMessage);
}

async function generateClarification(analysis: any): Promise<string> {
  const ambiguities = analysis.ambiguity_sources;

  if (ambiguities.includes('multiple_intents')) {
    return await client.generate({
      prompt: 'Generate clarification for multiple possible intents',
      context: analysis,
      style: 'polite_clarification',
      include_options: true
    });
  }

  if (ambiguities.includes('vague_reference')) {
    return `I want to make sure I understand correctly. When you said "${analysis.vague_phrase}", did you mean ${analysis.possible_meanings.join(' or ')}?`;
  }

  return "I'm not quite sure I understand. Could you please clarify what you mean?";
}

async function requestMissingInfo(missingFields: string[]): Promise<string> {
  if (missingFields.length === 1) {
    return `To help you with that, I need to know: ${missingFields[0]}?`;
  }

  return `To help you with that, I need a bit more information:\n${missingFields.map((field, i) => `${i + 1}. ${field}`).join('\n')}`;
}

async function processNormalMessage(message: string): Promise<string> {
  return await client.generate({
    prompt: message,
    max_tokens: 200
  });
}

// Multi-turn clarification dialogue
class ClarificationDialogue {
  private pendingClarifications: string[] = [];
  private originalIntent: any = null;

  async processTurn(message: string): Promise<string> {
    if (this.pendingClarifications.length > 0) {
      // Processing clarification response
      return await this.processClarificationResponse(message);
    }

    const analysis = await client.conversations.analyzeClarity({
      text: message,
      detect_ambiguity: true
    });

    if (analysis.needs_clarification) {
      this.originalIntent = analysis.intent;
      this.pendingClarifications = analysis.clarification_questions;

      return this.pendingClarifications[0];
    }

    return await processNormalMessage(message);
  }

  private async processClarificationResponse(response: string): Promise<string> {
    // Record clarification
    const clarifiedInfo = await client.conversations.processClarification({
      original_message: this.originalIntent,
      clarification_question: this.pendingClarifications[0],
      user_response: response
    });

    this.pendingClarifications.shift();

    if (this.pendingClarifications.length > 0) {
      // More clarifications needed
      return this.pendingClarifications[0];
    }

    // All clarified, proceed with enriched intent
    return await client.generate({
      prompt: this.originalIntent.original_text,
      context: clarifiedInfo
    });
  }
}
```

**Clarification Types**:
- Ambiguity resolution
- Missing information requests
- Intent disambiguation

## Recipe 5: Conversation Repair

### Problem
Recover from misunderstandings and errors gracefully.

### Solution
Error detection with corrective dialogue.

```typescript
class ConversationRepair {
  async detectMisunderstanding(
    userMessage: string,
    previousResponse: string
  ): Promise<boolean> {
    const analysis = await client.conversations.detectMisunderstanding({
      user_message: userMessage,
      assistant_previous: previousResponse
    });

    return analysis.misunderstanding_detected;
  }

  async generateRepairResponse(
    userMessage: string,
    context: any
  ): Promise<string> {
    // Detect repair strategy needed
    const repairType = await this.identifyRepairType(userMessage);

    switch (repairType) {
      case 'rephrase_request':
        return await this.handleRephraseRequest(context);

      case 'correction':
        return await this.handleCorrection(userMessage, context);

      case 'clarification_request':
        return await this.handleClarificationRequest(userMessage);

      default:
        return await this.generateGenericRepair(userMessage);
    }
  }

  private async identifyRepairType(message: string): Promise<string> {
    const patterns = {
      rephrase_request: /what|pardon|sorry|didn't (understand|get|catch)/i,
      correction: /no,|actually|I meant/i,
      clarification_request: /what do you mean|explain|clarify/i
    };

    for (const [type, pattern] of Object.entries(patterns)) {
      if (pattern.test(message)) {
        return type;
      }
    }

    return 'unknown';
  }

  private async handleRephraseRequest(context: any): Promise<string> {
    return await client.generate({
      prompt: 'Rephrase previous response more clearly',
      context: context,
      style: 'simpler_language',
      max_tokens: 150
    });
  }

  private async handleCorrection(
    correction: string,
    context: any
  ): Promise<string> {
    return await client.generate({
      prompt: `User corrects: "${correction}"`,
      context: context,
      acknowledge_correction: true,
      adjust_understanding: true
    });
  }

  private async handleClarificationRequest(request: string): Promise<string> {
    return await client.generate({
      prompt: request,
      style: 'explanatory',
      provide_examples: true
    });
  }

  private async generateGenericRepair(message: string): Promise<string> {
    return "I apologize for any confusion. Let me try to help you better. Could you please rephrase what you need?";
  }
}

// Usage
const repair = new ConversationRepair();

const userSaysDidntUnderstand = "I didn't quite get that";
const previousResponse = "The quantum entanglement coefficient...";

if (await repair.detectMisunderstanding(userSaysDidntUnderstand, previousResponse)) {
  const repairResponse = await repair.generateRepairResponse(
    userSaysDidntUnderstand,
    { previous: previousResponse }
  );
  console.log(repairResponse);
  // "Let me explain that more simply. Quantum entanglement means..."
}
```

**Repair Strategies**:
- Rephrasing
- Correction acknowledgment
- Clarification
- Simplification

## Recipe 6: Turn-Taking Management

### Problem
Manage who speaks when in multi-party conversations.

### Solution
Intelligent turn allocation with interruption handling.

```typescript
class TurnTakingManager {
  private currentSpeaker: string | null = null;
  private speakerQueue: string[] = [];

  async manageTurn(
    speakerId: string,
    message: string
  ): Promise<{ allowed: boolean; response?: string }> {
    // Check if speaker can take turn
    const canSpeak = await this.canTakeTurn(speakerId, message);

    if (!canSpeak.allowed) {
      return {
        allowed: false,
        response: canSpeak.reason
      };
    }

    // Allocate turn
    this.currentSpeaker = speakerId;

    // Process message
    const response = await this.processSpeakerMessage(speakerId, message);

    // Check if speaker wants to yield turn
    if (await this.detectTurnYield(message)) {
      await this.yieldTurn();
    }

    return { allowed: true, response };
  }

  private async canTakeTurn(
    speakerId: string,
    message: string
  ): Promise<{ allowed: boolean; reason?: string }> {
    // No one speaking - anyone can talk
    if (!this.currentSpeaker) {
      return { allowed: true };
    }

    // Same speaker continuing
    if (this.currentSpeaker === speakerId) {
      return { allowed: true };
    }

    // Check for valid interruption
    const isValidInterruption = await this.isValidInterruption(message);

    if (isValidInterruption) {
      return { allowed: true };
    }

    // Not their turn
    return {
      allowed: false,
      reason: `Please wait for ${this.currentSpeaker} to finish.`
    };
  }

  private async isValidInterruption(message: string): Promise<boolean> {
    const urgentPatterns = [
      /urgent|emergency|important|wait/i,
      /stop|hold on/i
    ];

    return urgentPatterns.some(pattern => pattern.test(message));
  }

  private async detectTurnYield(message: string): Promise<boolean> {
    const yieldPatterns = [
      /your turn|over to you|what do you think/i,
      /\?$/ // Question mark
    ];

    return yieldPatterns.some(pattern => pattern.test(message));
  }

  private async yieldTurn(): Promise<void> {
    if (this.speakerQueue.length > 0) {
      this.currentSpeaker = this.speakerQueue.shift()!;
    } else {
      this.currentSpeaker = null;
    }
  }

  private async processSpeakerMessage(
    speakerId: string,
    message: string
  ): Promise<string> {
    return await client.generate({
      prompt: message,
      context: { speaker_id: speakerId },
      max_tokens: 200
    });
  }

  async requestTurn(speakerId: string): Promise<void> {
    if (!this.speakerQueue.includes(speakerId)) {
      this.speakerQueue.push(speakerId);
    }
  }

  getCurrentSpeaker(): string | null {
    return this.currentSpeaker;
  }
}
```

**Turn Management**:
- Turn allocation
- Interruption handling
- Queue management
- Yield detection

## Recipe 7: Conversation Analytics

### Problem
Track conversation quality and identify issues.

### Solution
Real-time conversation metrics and insights.

```typescript
class ConversationAnalytics {
  async analyzeConversation(messages: Array<{
    role: string;
    content: string;
    timestamp: Date;
  }>) {
    const metrics = await client.conversations.analyze({
      messages,
      metrics: [
        'coherence',
        'engagement',
        'information_density',
        'turn_taking_balance',
        'topic_focus',
        'sentiment_progression'
      ]
    });

    return {
      quality_score: metrics.overall_quality,
      coherence: metrics.coherence_score,
      engagement: metrics.engagement_level,
      balance: this.calculateBalance(messages),
      issues: await this.identifyIssues(metrics),
      recommendations: metrics.improvement_suggestions
    };
  }

  private calculateBalance(messages: any[]): number {
    const userMessages = messages.filter(m => m.role === 'user').length;
    const assistantMessages = messages.filter(m => m.role === 'assistant').length;

    const total = userMessages + assistantMessages;
    const idealRatio = 0.5;
    const actualRatio = userMessages / total;

    return 1 - Math.abs(idealRatio - actualRatio);
  }

  private async identifyIssues(metrics: any): Promise<string[]> {
    const issues: string[] = [];

    if (metrics.coherence_score < 0.6) {
      issues.push('Low coherence - conversation may be disjointed');
    }

    if (metrics.engagement_level < 0.5) {
      issues.push('Low engagement - user may be losing interest');
    }

    if (metrics.topic_drift_score > 0.7) {
      issues.push('High topic drift - conversation losing focus');
    }

    return issues;
  }

  async generateReport(conversationId: string): Promise<any> {
    const conversation = await this.getConversation(conversationId);
    const analysis = await this.analyzeConversation(conversation.messages);

    return {
      conversation_id: conversationId,
      duration: this.calculateDuration(conversation),
      message_count: conversation.messages.length,
      analysis,
      summary: await this.generateSummary(conversation),
      action_items: await this.extractActionItems(conversation)
    };
  }

  private calculateDuration(conversation: any): number {
    const start = conversation.messages[0].timestamp;
    const end = conversation.messages[conversation.messages.length - 1].timestamp;
    return end.getTime() - start.getTime();
  }

  private async generateSummary(conversation: any): Promise<string> {
    return await client.conversations.summarize({
      messages: conversation.messages,
      max_length: 150
    });
  }

  private async extractActionItems(conversation: any): Promise<string[]> {
    const result = await client.conversations.extractActionItems({
      messages: conversation.messages
    });

    return result.action_items;
  }

  private async getConversation(id: string) {
    // Retrieve from database
    return { messages: [] };
  }
}
```

**Analytics Metrics**:
- Coherence score
- Engagement level
- Turn balance
- Topic focus
- Action items

## Recipe 8: Personality-Consistent Responses

### Problem
Maintain consistent personality across conversation.

### Solution
Personality profile with response alignment.

```typescript
interface PersonalityProfile {
  traits: {
    formality: number; // 0-1
    humor: number;
    empathy: number;
    directness: number;
    enthusiasm: number;
  };
  communication_style: string;
  vocabulary_level: string;
  example_phrases: string[];
}

class PersonalityConsistentBot {
  constructor(private profile: PersonalityProfile) {}

  async generateResponse(userMessage: string): Promise<string> {
    const response = await client.generate({
      prompt: userMessage,
      personality: {
        traits: this.profile.traits,
        style: this.profile.communication_style,
        vocabulary: this.profile.vocabulary_level
      },
      consistency_check: true,
      reference_phrases: this.profile.example_phrases
    });

    // Verify personality alignment
    const alignment = await this.checkPersonalityAlignment(response.text);

    if (alignment.score < 0.7) {
      // Regenerate with stronger personality constraints
      return await this.regenerateWithStrongerConstraints(userMessage);
    }

    return response.text;
  }

  private async checkPersonalityAlignment(response: string): Promise<any> {
    return await client.personality.checkAlignment({
      text: response,
      expected_profile: this.profile,
      strict: true
    });
  }

  private async regenerateWithStrongerConstraints(
    prompt: string
  ): Promise<string> {
    const response = await client.generate({
      prompt,
      personality: this.profile,
      enforce_personality: true,
      example_responses: this.profile.example_phrases
    });

    return response.text;
  }
}

// Example personalities
const professionalAssistant: PersonalityProfile = {
  traits: {
    formality: 0.8,
    humor: 0.2,
    empathy: 0.6,
    directness: 0.7,
    enthusiasm: 0.5
  },
  communication_style: 'professional',
  vocabulary_level: 'advanced',
  example_phrases: [
    'I would be happy to assist you with that.',
    'Let me provide you with the relevant information.',
    'Is there anything else I can help you with today?'
  ]
};

const casualFriend: PersonalityProfile = {
  traits: {
    formality: 0.2,
    humor: 0.8,
    empathy: 0.9,
    directness: 0.6,
    enthusiasm: 0.9
  },
  communication_style: 'casual',
  vocabulary_level: 'conversational',
  example_phrases: [
    'Hey! What\'s up?',
    'That sounds awesome!',
    'Totally get what you mean!'
  ]
};
```

**Personality Consistency**:
- Trait maintenance
- Style enforcement
- Alignment verification

## Recipe 9: Proactive Conversation

### Problem
Bot waits passively instead of driving conversation.

### Solution
Proactive engagement with topic suggestions.

```typescript
class ProactiveConversationManager {
  private lastUserActivity: Date = new Date();
  private silenceDuration = 30000; // 30 seconds

  async monitorAndEngage(
    conversationContext: any
  ): Promise<string | null> {
    const timeSinceActivity = Date.now() - this.lastUserActivity.getTime();

    if (timeSinceActivity > this.silenceDuration) {
      return await this.generateProactiveMessage(conversationContext);
    }

    return null;
  }

  private async generateProactiveMessage(context: any): Promise<string> {
    // Analyze conversation state
    const analysis = await client.conversations.analyzeState({
      context,
      identify_engagement_opportunities: true
    });

    if (analysis.user_may_need_help) {
      return await this.offerHelp(context);
    }

    if (analysis.conversation_stalled) {
      return await this.suggestTopic(context);
    }

    if (analysis.can_provide_value) {
      return await this.shareRelevantInfo(context);
    }

    return await this.generateGenericEngagement();
  }

  private async offerHelp(context: any): Promise<string> {
    return await client.generate({
      prompt: 'Offer help based on conversation context',
      context,
      tone: 'helpful_not_pushy'
    });
  }

  private async suggestTopic(context: any): Promise<string> {
    const suggestions = await client.conversations.suggestTopics({
      context,
      count: 2,
      relevance_threshold: 0.7
    });

    return `I noticed we haven't talked about ${suggestions[0].topic}. Would you like to discuss that?`;
  }

  private async shareRelevantInfo(context: any): Promise<string> {
    return await client.generate({
      prompt: 'Share interesting relevant information',
      context,
      value_add: true
    });
  }

  private async generateGenericEngagement(): Promise<string> {
    const engagements = [
      'Is there anything else on your mind?',
      'How are you feeling about everything we\'ve discussed?',
      'Would you like to explore any other topics?'
    ];

    return engagements[Math.floor(Math.random() * engagements.length)];
  }

  updateUserActivity(): void {
    this.lastUserActivity = new Date();
  }
}
```

**Proactive Features**:
- Silence detection
- Help offering
- Topic suggestions
- Value-add sharing

## Recipe 10: Conversation Testing

### Problem
Difficult to test conversation quality systematically.

### Solution
Automated conversation testing framework.

```typescript
class ConversationTester {
  async runTestConversation(
    scenario: {
      name: string;
      initial_message: string;
      expected_outcomes: string[];
      max_turns: number;
    }
  ): Promise<any> {
    const conversation = [];
    let currentMessage = scenario.initial_message;

    for (let turn = 0; turn < scenario.max_turns; turn++) {
      const response = await client.generate({
        prompt: currentMessage,
        context: conversation
      });

      conversation.push(
        { role: 'user', content: currentMessage },
        { role: 'assistant', content: response.text }
      );

      // Generate next user message based on response
      currentMessage = await this.generateNextTestMessage(
        response.text,
        scenario,
        turn
      );
    }

    // Evaluate conversation
    return await this.evaluateConversation(conversation, scenario);
  }

  private async generateNextTestMessage(
    botResponse: string,
    scenario: any,
    turn: number
  ): Promise<string> {
    // Simulate user response
    return await client.generate({
      prompt: `Generate realistic user response to: "${botResponse}"`,
      context: scenario,
      role: 'test_user'
    });
  }

  private async evaluateConversation(
    conversation: any[],
    scenario: any
  ): Promise<any> {
    const evaluation = await client.conversations.evaluate({
      conversation,
      expected_outcomes: scenario.expected_outcomes,
      quality_metrics: [
        'coherence',
        'helpfulness',
        'empathy',
        'accuracy'
      ]
    });

    return {
      scenario: scenario.name,
      passed: evaluation.all_outcomes_achieved,
      quality_scores: evaluation.metrics,
      issues: evaluation.identified_issues,
      conversation_transcript: conversation
    };
  }

  async runTestSuite(scenarios: any[]): Promise<any> {
    const results = await Promise.all(
      scenarios.map(scenario => this.runTestConversation(scenario))
    );

    return {
      total_tests: scenarios.length,
      passed: results.filter(r => r.passed).length,
      failed: results.filter(r => !r.passed).length,
      results
    };
  }
}

// Example test scenario
const testScenario = {
  name: 'Customer support - order tracking',
  initial_message: 'Where is my order?',
  expected_outcomes: [
    'Ask for order number',
    'Provide tracking information',
    'Offer additional help'
  ],
  max_turns: 6
};

const tester = new ConversationTester();
const result = await tester.runTestConversation(testScenario);
console.log(result);
```

**Testing Features**:
- Automated dialogue
- Outcome verification
- Quality metrics
- Test suites

## Related Documentation

- [İnsan IQ Conversation AI Guide](../guides/insan-iq-conversation-ai.md)
- [İnsan IQ Contextual Understanding](../concepts/insan-iq-contextual-understanding.md)
- [İnsan IQ API Reference](/docs/api/insan-iq)

## Support

- **Documentation**: https://docs.lydian.com
- **Conversation AI Best Practices**: https://research.lydian.com/conversation-ai
- **Community**: https://community.lydian.com
