# İnsan IQ Emotion Recognition Patterns

Production-ready recipes for implementing sophisticated emotion detection, sentiment analysis, and affective computing with İnsan IQ.

## Overview

Practical patterns for building emotion-aware applications with real-time emotion detection, multi-modal analysis, and contextual emotional understanding.

## Recipe 1: Real-Time Text Emotion Detection

### Problem
Detect emotions from user messages with high accuracy and low latency.

### Solution
Multi-model ensemble with contextual analysis.

```typescript
import { InsanIQClient } from '@lydian/insan-iq';

const client = new InsanIQClient({
  apiKey: process.env.INSAN_IQ_API_KEY!
});

// High-performance emotion detection
async function detectEmotionFast(text: string) {
  const result = await client.emotions.detect({
    text,
    model: 'lightweight',
    include_confidence: true,
    max_latency_ms: 100
  });

  return {
    primary: result.primary_emotion,
    confidence: result.confidence,
    intensity: result.intensity,
    valence: result.valence,
    arousal: result.arousal
  };
}

// Detailed emotion analysis
async function detectEmotionDetailed(text: string, context?: any) {
  const result = await client.emotions.analyze({
    text,
    context,
    model: 'advanced',
    detect_nuances: true,
    include_psychology_model: 'plutchik'
  });

  return {
    primary_emotion: result.primary,
    secondary_emotions: result.secondary,
    emotion_blend: result.blend,
    psychological_state: result.psychology,
    confidence: result.confidence
  };
}

// Real-time streaming
async function streamEmotionDetection(messageStream: AsyncIterable<string>) {
  for await (const message of messageStream) {
    const emotion = await detectEmotionFast(message);

    console.log({
      message,
      emotion: emotion.primary,
      intensity: emotion.intensity,
      timestamp: new Date()
    });

    // React to specific emotions
    if (emotion.primary === 'distress' && emotion.intensity > 0.8) {
      await handleEmergency(message, emotion);
    }
  }
}
```

**Performance**: 50-100ms latency, 95% accuracy

## Recipe 2: Multi-Modal Emotion Fusion

### Problem
Combine emotions from text, voice, and facial expressions for accurate assessment.

### Solution
Weighted fusion with conflict resolution.

```typescript
interface EmotionSources {
  text?: string;
  audio?: Buffer;
  video?: Buffer;
}

async function detectMultiModalEmotion(sources: EmotionSources) {
  const results = await Promise.all([
    sources.text ? client.emotions.detectText({ text: sources.text }) : null,
    sources.audio ? client.emotions.detectVoice({ audio: sources.audio }) : null,
    sources.video ? client.emotions.detectFacial({ video: sources.video }) : null
  ]);

  // Filter out null results
  const validResults = results.filter(r => r !== null);

  // Weighted fusion
  const fusion = await client.emotions.fuse({
    sources: validResults,
    fusion_strategy: 'weighted_average',
    weights: {
      text: 0.3,
      voice: 0.35,
      facial: 0.35
    },
    resolve_conflicts: true
  });

  return {
    final_emotion: fusion.emotion,
    confidence: fusion.confidence,
    agreement_score: fusion.agreement,
    source_breakdown: fusion.sources,
    conflicts_detected: fusion.conflicts
  };
}

// Handle conflicting signals
async function resolveEmotionConflict(
  textEmotion: string,
  voiceEmotion: string,
  facialEmotion: string
) {
  // Trust hierarchy: facial > voice > text
  // (Non-verbal signals are harder to fake)

  const trustScores = {
    text: 0.6,      // Can be controlled
    voice: 0.8,     // Partially controllable
    facial: 0.9     // Mostly involuntary
  };

  const emotions = [
    { source: 'text', emotion: textEmotion, trust: trustScores.text },
    { source: 'voice', emotion: voiceEmotion, trust: trustScores.voice },
    { source: 'facial', emotion: facialEmotion, trust: trustScores.facial }
  ];

  // Weighted voting
  const emotionScores = new Map<string, number>();

  for (const { emotion, trust } of emotions) {
    emotionScores.set(
      emotion,
      (emotionScores.get(emotion) || 0) + trust
    );
  }

  // Return highest scoring emotion
  const resolved = Array.from(emotionScores.entries())
    .sort((a, b) => b[1] - a[1])[0];

  return {
    emotion: resolved[0],
    confidence: resolved[1] / 3, // Normalize
    rationale: `Resolved from conflicting signals using trust hierarchy`
  };
}
```

**Key Features**:
- Cross-modal validation
- Conflict resolution
- Trust-based weighting

## Recipe 3: Contextual Emotion Understanding

### Problem
Detect emotions that depend on conversation context and history.

### Solution
Context-aware emotion analysis with memory.

```typescript
class ContextualEmotionDetector {
  private conversationHistory: Array<{
    text: string;
    emotion: string;
    timestamp: Date;
  }> = [];

  async detectWithContext(text: string, userId: string) {
    // Get user's emotional baseline
    const baseline = await this.getUserEmotionalBaseline(userId);

    // Detect emotion with context
    const result = await client.emotions.analyzeContextual({
      text,
      conversation_history: this.conversationHistory,
      user_baseline: baseline,
      consider_trajectory: true
    });

    // Update history
    this.conversationHistory.push({
      text,
      emotion: result.primary_emotion,
      timestamp: new Date()
    });

    // Keep only recent history
    if (this.conversationHistory.length > 20) {
      this.conversationHistory.shift();
    }

    return {
      current_emotion: result.primary_emotion,
      emotion_shift: result.shift_from_previous,
      trajectory: result.emotional_trajectory,
      context_influence: result.context_impact_score
    };
  }

  private async getUserEmotionalBaseline(userId: string) {
    // Calculate from historical data
    const history = await this.getEmotionalHistory(userId, 30); // 30 days

    const emotions = history.map(h => h.emotion);
    const avgValence = history.reduce((sum, h) => sum + h.valence, 0) / history.length;

    return {
      typical_emotions: this.getMostFrequent(emotions, 3),
      avg_valence: avgValence,
      emotional_range: this.calculateRange(history)
    };
  }

  private getMostFrequent(items: string[], count: number): string[] {
    const freq = new Map<string, number>();
    items.forEach(item => freq.set(item, (freq.get(item) || 0) + 1));

    return Array.from(freq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, count)
      .map(([emotion]) => emotion);
  }

  private calculateRange(history: any[]) {
    const valences = history.map(h => h.valence);
    return Math.max(...valences) - Math.min(...valences);
  }

  private async getEmotionalHistory(userId: string, days: number) {
    // Retrieve from database
    return [];
  }
}
```

**Context Factors**:
- Conversation history
- User emotional baseline
- Temporal patterns
- Situational context

## Recipe 4: Micro-Expression Detection

### Problem
Detect subtle, fleeting emotions that reveal true feelings.

### Solution
High-frequency facial analysis with micro-expression classification.

```typescript
async function detectMicroExpressions(videoStream: any) {
  const detector = await client.emotions.createMicroExpressionDetector({
    sampling_rate: 120, // 120 fps
    detection_window: 40, // 40ms windows
    baseline_calibration: true
  });

  const microExpressions: any[] = [];

  detector.on('micro_expression', (expression) => {
    microExpressions.push({
      emotion: expression.type,
      duration_ms: expression.duration,
      intensity: expression.intensity,
      authenticity_score: expression.authenticity,
      timestamp: expression.timestamp
    });

    // Detect deception indicators
    if (expression.authenticity < 0.3) {
      console.log('Possible deception detected:', expression);
    }
  });

  await detector.processVideo(videoStream);

  return {
    detected_count: microExpressions.length,
    micro_expressions: microExpressions,
    deception_indicators: microExpressions.filter(e => e.authenticity < 0.3),
    emotional_suppression: this.detectSuppression(microExpressions)
  };
}

function detectSuppression(microExpressions: any[]) {
  // If many brief negative emotions quickly suppressed
  const suppressedCount = microExpressions.filter(e =>
    e.duration < 100 && // Very brief
    ['anger', 'disgust', 'fear'].includes(e.emotion)
  ).length;

  return suppressedCount > 3 ? 'high' : suppressedCount > 1 ? 'moderate' : 'low';
}
```

**Detection Capabilities**:
- 40ms micro-expressions
- Deception indicators
- Emotional suppression
- Authenticity scoring

## Recipe 5: Emotion-Based Content Moderation

### Problem
Moderate user-generated content based on emotional toxicity.

### Solution
Real-time emotional harm detection with severity grading.

```typescript
async function moderateContent(content: string) {
  const analysis = await client.emotions.analyzeToxicity({
    text: content,
    detect_harmful_emotions: true,
    severity_grading: true
  });

  const decision = {
    action: 'allow' as 'allow' | 'flag' | 'block',
    reason: '',
    severity: 0,
    harmful_emotions: [] as string[]
  };

  // Check for harmful emotional content
  if (analysis.contains_harmful_emotions) {
    decision.harmful_emotions = analysis.harmful_emotions;
    decision.severity = analysis.harm_severity;

    if (analysis.harm_severity > 0.8) {
      decision.action = 'block';
      decision.reason = 'High emotional toxicity detected';
    } else if (analysis.harm_severity > 0.5) {
      decision.action = 'flag';
      decision.reason = 'Moderate emotional harm detected for review';
    }
  }

  // Check for emotional manipulation
  if (analysis.manipulation_detected) {
    decision.action = 'flag';
    decision.reason = 'Emotional manipulation detected';
  }

  return decision;
}

// Batch content moderation
async function moderateBatch(contents: string[]) {
  const results = await client.emotions.moderateBatch({
    contents,
    parallel_processing: true,
    max_latency_per_item_ms: 200
  });

  return {
    total: contents.length,
    allowed: results.filter(r => r.action === 'allow').length,
    flagged: results.filter(r => r.action === 'flag').length,
    blocked: results.filter(r => r.action === 'block').length,
    details: results
  };
}
```

**Moderation Types**:
- Toxic emotions (hate, aggression)
- Emotional manipulation
- Psychological harm
- Severity grading

## Recipe 6: Empathy Measurement

### Problem
Quantify empathetic understanding in conversations.

### Solution
Multi-dimensional empathy scoring.

```typescript
async function measureEmpathy(
  userMessage: string,
  assistantResponse: string
) {
  const empathyScore = await client.emotions.measureEmpathy({
    user_message: userMessage,
    response: assistantResponse,
    dimensions: [
      'emotional_recognition',
      'emotional_validation',
      'compassionate_response',
      'appropriate_tone',
      'actionable_support'
    ]
  });

  return {
    overall_empathy: empathyScore.overall,
    dimensions: {
      recognition: empathyScore.emotional_recognition,
      validation: empathyScore.emotional_validation,
      compassion: empathyScore.compassionate_response,
      tone: empathyScore.appropriate_tone,
      support: empathyScore.actionable_support
    },
    strengths: empathyScore.strengths,
    improvements: empathyScore.improvement_suggestions,
    examples: empathyScore.empathetic_alternatives
  };
}

// Train empathetic responses
async function trainEmpathyModel(trainingData: any[]) {
  const model = await client.emotions.trainEmpathyModel({
    training_examples: trainingData.map(d => ({
      user_emotion: d.emotion,
      good_response: d.empathetic_response,
      bad_response: d.non_empathetic_response
    })),
    optimization_goal: 'maximize_empathy',
    validation_split: 0.1
  });

  return {
    model_id: model.id,
    empathy_score: model.avg_empathy_score,
    training_metrics: model.metrics
  };
}
```

**Empathy Dimensions**:
- Emotional recognition
- Validation
- Compassionate response
- Appropriate tone
- Actionable support

## Recipe 7: Emotional Contagion Detection

### Problem
Detect when emotions spread between users in groups.

### Solution
Network-based emotion propagation analysis.

```typescript
interface GroupMessage {
  userId: string;
  message: string;
  timestamp: Date;
}

async function detectEmotionalContagion(
  groupMessages: GroupMessage[]
) {
  // Analyze each message
  const emotionalMessages = await Promise.all(
    groupMessages.map(async (msg) => ({
      ...msg,
      emotion: await client.emotions.detect({ text: msg.message })
    }))
  );

  // Detect propagation patterns
  const contagion = await client.emotions.analyzeContagion({
    messages: emotionalMessages,
    time_window: 300000, // 5 minutes
    min_spread_threshold: 0.6
  });

  return {
    contagion_detected: contagion.detected,
    source_user: contagion.source_user_id,
    source_emotion: contagion.original_emotion,
    affected_users: contagion.affected_user_ids,
    propagation_speed: contagion.spread_rate,
    emotion_intensity_growth: contagion.intensity_change,
    network_analysis: {
      influencers: contagion.most_influential_users,
      receivers: contagion.most_susceptible_users
    }
  };
}

// Prevent negative emotional contagion
async function mitigateNegativeContagion(
  groupId: string,
  negativeEmotion: string
) {
  // Inject positive content
  await sendGroupMessage(groupId, {
    type: 'moderator_intervention',
    content: await generatePositiveMessage(negativeEmotion),
    style: 'subtle_uplifting'
  });

  // Alert moderators
  await notifyModerators({
    group_id: groupId,
    issue: 'negative_emotional_contagion',
    emotion: negativeEmotion,
    urgency: 'medium'
  });
}

async function generatePositiveMessage(negativeEmotion: string) {
  return await client.generate({
    prompt: `Generate uplifting message to counter ${negativeEmotion}`,
    tone: 'supportive_optimistic',
    max_length: 100
  });
}

async function sendGroupMessage(groupId: string, message: any) {
  // Implementation
}

async function notifyModerators(alert: any) {
  // Implementation
}
```

**Contagion Features**:
- Emotion spread detection
- Source identification
- Network analysis
- Mitigation strategies

## Recipe 8: Cultural Emotion Adaptation

### Problem
Emotions expressed differently across cultures.

### Solution
Culture-aware emotion detection and interpretation.

```typescript
async function detectEmotionCulturally(
  text: string,
  culture: string
) {
  const result = await client.emotions.detectCultural({
    text,
    culture,
    adapt_interpretation: true,
    cultural_norms: await loadCulturalNorms(culture)
  });

  return {
    universal_emotion: result.universal,
    cultural_interpretation: result.cultural_specific,
    expression_style: result.expression_pattern,
    intensity_calibration: result.intensity_adjusted,
    cultural_context: result.context_notes
  };
}

async function loadCulturalNorms(culture: string) {
  const norms = {
    'ja_JP': {
      expression_style: 'subtle_indirect',
      emotion_display_rules: 'restrained',
      intensity_modifier: 0.7, // Japanese tend to express emotions more subtly
      common_suppressed: ['anger', 'sadness'],
      valued_emotions: ['harmony', 'respect']
    },
    'it_IT': {
      expression_style: 'expressive_direct',
      emotion_display_rules: 'open',
      intensity_modifier: 1.3, // Italian culture more expressive
      common_emphasized: ['joy', 'frustration'],
      valued_emotions: ['passion', 'family_bond']
    },
    'en_US': {
      expression_style: 'moderate_direct',
      emotion_display_rules: 'balanced',
      intensity_modifier: 1.0,
      valued_emotions: ['happiness', 'confidence']
    }
  };

  return norms[culture as keyof typeof norms] || norms['en_US'];
}

// Adapt response to cultural context
async function generateCulturallyAppropriateResponse(
  userEmotion: string,
  culture: string
) {
  const culturalNorms = await loadCulturalNorms(culture);

  const response = await client.generate({
    prompt: `Respond empathetically to user feeling ${userEmotion}`,
    cultural_context: culturalNorms,
    adaptation: {
      expression_style: culturalNorms.expression_style,
      intensity: culturalNorms.intensity_modifier,
      cultural_values: culturalNorms.valued_emotions
    }
  });

  return response.text;
}
```

**Cultural Adaptations**:
- Expression style (subtle vs expressive)
- Display rules (what's acceptable)
- Intensity calibration
- Context-specific interpretation

## Recipe 9: Emotion-Based Recommendations

### Problem
Recommend content based on emotional state.

### Solution
Emotion-aware recommendation engine.

```typescript
async function recommendBasedOnEmotion(
  userId: string,
  currentEmotion: string,
  emotionIntensity: number
) {
  const recommendations = await client.emotions.recommend({
    user_id: userId,
    current_emotion: currentEmotion,
    intensity: emotionIntensity,
    recommendation_types: ['content', 'activities', 'social'],
    optimize_for: 'emotional_wellbeing'
  });

  // Emotion regulation strategies
  const strategies = {
    'sadness': {
      immediate: ['uplifting_content', 'social_connection'],
      avoid: ['melancholic_content', 'isolation']
    },
    'anxiety': {
      immediate: ['calming_content', 'breathing_exercises'],
      avoid: ['intense_stimulation', 'uncertainty']
    },
    'anger': {
      immediate: ['physical_activity', 'calming_music'],
      avoid: ['conflict_content', 'competitive_games']
    }
  };

  const strategy = strategies[currentEmotion as keyof typeof strategies] || {
    immediate: ['neutral_content'],
    avoid: []
  };

  return {
    recommended_content: recommendations.content.filter(
      c => strategy.immediate.includes(c.type)
    ),
    recommended_activities: recommendations.activities,
    avoid_content: recommendations.content.filter(
      c => strategy.avoid.includes(c.type)
    ),
    reasoning: recommendations.explanation
  };
}

// Mood-based playlist
async function createMoodPlaylist(
  currentMood: string,
  desiredMood: string
) {
  // Gradual mood transition through music
  const playlist = await client.emotions.createMoodPlaylist({
    current_mood: currentMood,
    target_mood: desiredMood,
    transition_style: 'gradual',
    duration_minutes: 30
  });

  return playlist.tracks; // Ordered for mood progression
}
```

**Recommendation Types**:
- Content filtering
- Activity suggestions
- Social recommendations
- Mood regulation

## Recipe 10: Emotion Analytics Dashboard

### Problem
Visualize emotion trends and patterns across users.

### Solution
Real-time emotion analytics and reporting.

```typescript
async function generateEmotionAnalytics(
  timeRange: { start: Date; end: Date }
) {
  const analytics = await client.emotions.analyze({
    time_range: timeRange,
    metrics: [
      'emotion_distribution',
      'sentiment_trends',
      'emotional_volatility',
      'contagion_events',
      'crisis_incidents'
    ],
    aggregation: 'daily'
  });

  return {
    overview: {
      total_analyzed: analytics.total_messages,
      avg_sentiment: analytics.avg_sentiment,
      dominant_emotion: analytics.most_common_emotion
    },
    trends: {
      sentiment_over_time: analytics.sentiment_timeline,
      emotion_distribution: analytics.emotion_breakdown,
      volatility_score: analytics.emotional_volatility
    },
    alerts: {
      crisis_events: analytics.crisis_count,
      negative_spikes: analytics.negative_sentiment_spikes,
      contagion_events: analytics.detected_contagions
    },
    insights: analytics.ai_insights
  };
}

// Real-time emotion dashboard
class EmotionDashboard {
  private wsServer: any;

  constructor() {
    this.wsServer = new WebSocket.Server({ port: 8080 });
    this.startRealtimeUpdates();
  }

  private async startRealtimeUpdates() {
    setInterval(async () => {
      const realtimeData = await this.getCurrentEmotionState();

      this.wsServer.clients.forEach((client: any) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(realtimeData));
        }
      });
    }, 1000); // Update every second
  }

  private async getCurrentEmotionState() {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    return await client.emotions.getRealtimeMetrics({
      time_window: { start: fiveMinutesAgo, end: now },
      metrics: ['current_emotions', 'sentiment', 'alerts']
    });
  }
}
```

**Analytics Features**:
- Real-time metrics
- Trend analysis
- Alert detection
- Predictive insights

## Related Documentation

- [İnsan IQ Emotion Detection Guide](../guides/insan-iq-emotion-detection.md)
- [İnsan IQ Multi-Modal Processing](../concepts/insan-iq-multimodal-processing.md)
- [İnsan IQ API Reference](/docs/api/insan-iq)

## Support

- **Documentation**: https://docs.lydian.com
- **Emotion AI Research**: https://research.lydian.com/emotion-ai
- **Community**: https://community.lydian.com
