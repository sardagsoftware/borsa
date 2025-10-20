# İnsan IQ Empathetic Response Generation

Production-ready patterns for generating empathetic, supportive, and emotionally intelligent responses with İnsan IQ.

## Overview

Practical recipes for building emotionally aware response generation with empathy scoring, validation techniques, and supportive communication patterns.

## Recipe 1: Emotional Validation Responses

### Problem
Acknowledge and validate user emotions without dismissing feelings.

### Solution
Emotion-specific validation with empathetic framing.

```typescript
import { InsanIQClient } from '@lydian/insan-iq';

const client = new InsanIQClient({
  apiKey: process.env.INSAN_IQ_API_KEY!
});

async function generateValidatingResponse(
  userMessage: string,
  detectedEmotion: string
) {
  const response = await client.empathy.generateValidation({
    user_message: userMessage,
    emotion: detectedEmotion,
    validation_style: 'acknowledge_and_normalize',
    avoid_minimizing: true
  });

  return response.text;
}

// Emotion-specific validation templates
const validationTemplates = {
  sadness: [
    "I can hear that you're feeling really sad right now.",
    "It's completely understandable to feel this way given what you're going through.",
    "Your sadness is valid, and it makes sense you'd feel this way."
  ],
  anxiety: [
    "I can sense that you're feeling anxious about this.",
    "It's natural to feel worried when facing uncertainty.",
    "Your anxiety is a normal response to this situation."
  ],
  frustration: [
    "I can tell this is really frustrating for you.",
    "It makes total sense that you'd feel frustrated by this.",
    "Your frustration is completely justified."
  ],
  anger: [
    "I hear that you're feeling angry, and that's okay.",
    "It's understandable that this situation has upset you.",
    "Your anger is valid - this would upset anyone."
  ]
};

async function enhancedValidation(
  userMessage: string,
  emotion: string,
  intensity: number
) {
  // Select appropriate validation
  const templates = validationTemplates[emotion as keyof typeof validationTemplates] || [];
  const baseValidation = templates[Math.floor(Math.random() * templates.length)];

  // Enhance with AI if needed
  if (intensity > 0.7) {
    // High intensity - add deeper validation
    return await client.generate({
      prompt: `Provide deep emotional validation for: "${userMessage}"`,
      emotion_context: { emotion, intensity },
      style: 'deeply_validating',
      max_length: 100
    });
  }

  return baseValidation;
}

// Multi-emotion validation
async function validateMixedEmotions(
  userMessage: string,
  emotions: Array<{ emotion: string; intensity: number }>
) {
  const primaryEmotion = emotions[0];
  const secondaryEmotion = emotions[1];

  return await client.generate({
    prompt: userMessage,
    context: {
      primary_emotion: primaryEmotion,
      secondary_emotion: secondaryEmotion
    },
    instruction: 'Validate both emotions without neglecting either',
    style: 'nuanced_empathetic'
  });
}
```

**Validation Principles**:
- Acknowledge specific emotions
- Normalize feelings
- Avoid minimizing
- Validate intensity

## Recipe 2: Empathetic Perspective-Taking

### Problem
Show understanding of user's situation from their viewpoint.

### Solution
Perspective acknowledgment with situational empathy.

```typescript
async function generatePerspectiveResponse(
  userMessage: string,
  userContext: any
) {
  const response = await client.empathy.takePerspective({
    user_message: userMessage,
    user_context: userContext,
    demonstrate_understanding: true,
    avoid_assumptions: true
  });

  return {
    response: response.text,
    perspective_elements: response.demonstrated_understanding,
    empathy_score: response.empathy_level
  };
}

// Perspective-taking patterns
async function demonstrateUnderstanding(situation: string) {
  const perspectives = await client.empathy.analyzePerspectives({
    situation,
    consider_viewpoints: [
      'user_emotional_state',
      'user_circumstances',
      'user_capabilities',
      'user_constraints'
    ]
  });

  // Generate response that shows understanding
  return await client.generate({
    prompt: `Show understanding of: ${situation}`,
    perspective_insights: perspectives,
    phrases: [
      'I can imagine how...',
      'It must be...',
      'I understand that...',
      'From your perspective...'
    ],
    tone: 'understanding'
  });
}

// Avoid assuming - ask to understand
async function askToUnderstand(userMessage: string, ambiguity: any) {
  return await client.generate({
    prompt: userMessage,
    context: ambiguity,
    instruction: 'Ask clarifying questions to better understand their perspective',
    style: 'curious_empathetic',
    avoid: ['assumptions', 'judgments']
  });
}
```

**Perspective-Taking Elements**:
- Acknowledge their view
- Show imagination of their experience
- Avoid assumptions
- Ask clarifying questions

## Recipe 3: Supportive Action Suggestions

### Problem
Provide helpful suggestions without being prescriptive or dismissive.

### Solution
Collaborative problem-solving with empowering language.

```typescript
async function generateSupportiveSuggestions(
  userProblem: string,
  emotionalState: any
) {
  const suggestions = await client.empathy.generateSupport({
    problem: userProblem,
    emotional_context: emotionalState,
    suggestion_style: 'collaborative',
    empowerment_focus: true,
    respect_autonomy: true
  });

  return {
    suggestions: suggestions.action_items,
    framing: suggestions.empowering_language,
    user_choice_emphasis: suggestions.autonomy_preserved
  };
}

// Empowering language patterns
async function frameSuggestionsEmpoweringly(actions: string[]) {
  const framings = {
    collaborative: [
      'What if we explored...',
      'You might consider...',
      'One option could be...'
    ],
    empowering: [
      'You have the strength to...',
      'You might find it helpful to...',
      'When you\'re ready, you could...'
    ],
    supportive: [
      'I\'m here to support you if you decide to...',
      'Would it help if you tried...',
      'Some people find it useful to...'
    ]
  };

  return actions.map((action, i) => {
    const style = i % 3 === 0 ? 'collaborative' : i % 3 === 1 ? 'empowering' : 'supportive';
    const frames = framings[style];
    const frame = frames[Math.floor(Math.random() * frames.length)];

    return `${frame} ${action}`;
  });
}

// Respect user autonomy
async function generateAutonomyRespecting(suggestion: string) {
  return await client.generate({
    prompt: `Frame this suggestion respecting user autonomy: "${suggestion}"`,
    constraints: {
      no_should_must: true,
      preserve_choice: true,
      non_prescriptive: true
    },
    phrases: [
      'if that feels right for you',
      'you might choose to',
      'when you\'re ready',
      'if you want to'
    ]
  });
}

// Graduated support levels
async function provideGraduatedSupport(
  severity: number,
  userRequest: string
) {
  if (severity > 0.8) {
    // High severity - immediate actionable support
    return await client.generate({
      prompt: userRequest,
      urgency: 'high',
      provide: ['immediate_resources', 'crisis_support', 'professional_referral']
    });
  } else if (severity > 0.5) {
    // Medium severity - supportive guidance
    return await client.generate({
      prompt: userRequest,
      provide: ['coping_strategies', 'resources', 'encouragement']
    });
  } else {
    // Low severity - collaborative exploration
    return await client.generate({
      prompt: userRequest,
      provide: ['reflection_questions', 'gentle_suggestions']
    });
  }
}
```

**Supportive Suggestion Principles**:
- Respect autonomy
- Empower choices
- Graduated support
- Collaborative framing

## Recipe 4: Empathetic Reframing

### Problem
Help users see situations from healthier perspectives without invalidating.

### Solution
Gentle cognitive reframing with validation first.

```typescript
async function generateReframingResponse(
  userStatement: string,
  cognitiveDistortion: string
) {
  // Always validate first
  const validation = await client.empathy.validate({
    statement: userStatement,
    emotion: 'understood'
  });

  // Then gently reframe
  const reframe = await client.cognitive.reframe({
    original_thought: userStatement,
    distortion_type: cognitiveDistortion,
    approach: 'gentle_socratic',
    validate_first: true
  });

  return {
    validation: validation.text,
    reframe: reframe.alternative_perspective,
    combined: `${validation.text} ${reframe.alternative_perspective}`
  };
}

// Cognitive distortion patterns
const distortionReframes = {
  all_or_nothing: {
    pattern: /always|never|every|no one/i,
    reframe: 'I hear that it feels like that happens all the time. Can you think of any occasions, even small ones, when it was different?'
  },
  catastrophizing: {
    pattern: /worst|terrible|disaster|awful/i,
    reframe: 'I can sense this feels really overwhelming. What might be a more likely outcome, even if it\'s still challenging?'
  },
  mind_reading: {
    pattern: /they think|he thinks|she thinks|everyone thinks/i,
    reframe: 'I understand why you might think that. Is there another way they could be thinking about this?'
  },
  overgeneralization: {
    pattern: /everyone|no one|always|never/i,
    reframe: 'It sounds like this has been your experience. Are there any exceptions to this pattern?'
  }
};

async function detectAndReframe(userMessage: string) {
  // Detect cognitive distortions
  const distortions = await client.cognitive.detectDistortions({
    text: userMessage,
    types: Object.keys(distortionReframes)
  });

  if (distortions.length === 0) {
    return await client.generate({
      prompt: userMessage,
      style: 'supportive'
    });
  }

  const primaryDistortion = distortions[0];

  // Generate gentle reframe
  return await client.generate({
    prompt: userMessage,
    cognitive_reframe: {
      distortion: primaryDistortion.type,
      approach: 'socratic_questioning',
      preserve_emotion_validation: true
    },
    style: 'gentle_therapeutic'
  });
}

// Progressive reframing (not all at once)
class ReframingJourney {
  private reframingSteps: string[] = [];
  private currentStep = 0;

  async addStep(userThought: string) {
    const step = await client.cognitive.planReframing({
      original_thought: userThought,
      target_perspective: 'balanced_realistic',
      steps: 'small_gradual'
    });

    this.reframingSteps = step.progressive_steps;
  }

  async getNextReframe(): Promise<string> {
    if (this.currentStep >= this.reframingSteps.length) {
      return "You've made great progress in thinking about this differently!";
    }

    const reframe = this.reframingSteps[this.currentStep];
    this.currentStep++;

    return reframe;
  }
}
```

**Reframing Techniques**:
- Validate before reframing
- Socratic questioning
- Progressive steps
- Preserve emotional truth

## Recipe 5: Crisis-Aware Empathetic Responses

### Problem
Respond empathetically while ensuring safety in crisis situations.

### Solution
Dual-track response: empathy + safety protocol.

```typescript
async function generateCrisisEmpathyResponse(
  userMessage: string,
  crisisIndicators: string[]
) {
  // Generate empathetic acknowledgment
  const empathyResponse = await client.empathy.generateCrisisEmpathy({
    message: userMessage,
    crisis_type: crisisIndicators,
    tone: 'calm_supportive',
    urgency: 'immediate'
  });

  // Add safety resources
  const safetyGuidance = await client.safety.getCrisisGuidance({
    indicators: crisisIndicators,
    immediate_resources: true
  });

  return {
    empathy: empathyResponse.text,
    safety: safetyGuidance.resources,
    combined: `${empathyResponse.text}\n\n${safetyGuidance.immediate_action}`
  };
}

// Crisis empathy templates
const crisisEmpathyResponses = {
  suicide_ideation: {
    empathy: "I hear that you're in a lot of pain right now, and I'm really concerned about you.",
    safety: "Your safety is the most important thing. Please reach out to 988 (Suicide & Crisis Lifeline) or text HOME to 741741 right now.",
    action: "I care about your wellbeing and want to make sure you get immediate support."
  },
  self_harm: {
    empathy: "I understand you're struggling with intense emotions right now.",
    safety: "Please consider reaching out to a crisis counselor at 988 or your therapist immediately.",
    action: "You don't have to face this alone - there are people who want to help you through this."
  },
  severe_distress: {
    empathy: "I can sense that you're going through something really difficult right now.",
    safety: "It might help to talk to someone trained in crisis support. The Crisis Text Line (text HOME to 741741) is available 24/7.",
    action: "Please know that this feeling won't last forever, and support is available."
  }
};

async function balanceEmpathyAndSafety(
  crisisType: string,
  userMessage: string
) {
  const template = crisisEmpathyResponses[crisisType as keyof typeof crisisEmpathyResponses];

  if (!template) {
    return await client.safety.handleUnknownCrisis({
      message: userMessage,
      err_on_caution: true
    });
  }

  // Generate personalized version
  return await client.generate({
    prompt: userMessage,
    template: template,
    personalize: true,
    maintain_urgency: true,
    style: 'crisis_empathetic'
  });
}
```

**Crisis Empathy Principles**:
- Acknowledge pain immediately
- Show concern clearly
- Provide immediate resources
- Balance empathy with action

## Recipe 6: Cultural Empathy

### Problem
Empathy expressions vary across cultures.

### Solution
Culturally adapted empathetic responses.

```typescript
async function generateCulturallyEmpathetic(
  userMessage: string,
  culture: string,
  emotion: string
) {
  const culturalContext = await client.empathy.getCulturalContext({
    culture,
    emotion,
    expression_norms: true
  });

  return await client.generate({
    prompt: userMessage,
    cultural_context: culturalContext,
    adapt_empathy_expression: true,
    respect_norms: true
  });
}

// Cultural empathy patterns
const culturalEmpathyNorms = {
  'ja_JP': {
    empathy_style: 'indirect_subtle',
    avoid: ['excessive_emotional_display', 'direct_confrontation'],
    prefer: ['understanding_silence', 'gentle_acknowledgment'],
    phrases: ['Taihen desune (That must be difficult)', 'Wakarimasu (I understand)']
  },
  'en_US': {
    empathy_style: 'direct_expressive',
    avoid: ['excessive_formality'],
    prefer: ['verbal_validation', 'active_listening'],
    phrases: ['I hear you', 'That must be really hard', 'I\'m here for you']
  },
  'ar_SA': {
    empathy_style: 'communal_expressive',
    avoid: ['individualistic_focus'],
    prefer: ['family_community_references', 'faith_based_comfort'],
    phrases: ['Allah yusahhil (May God make it easy)', 'We are with you']
  },
  'es_MX': {
    empathy_style: 'warm_relational',
    avoid: ['cold_distance'],
    prefer: ['personal_warmth', 'familial_connection'],
    phrases: ['Te entiendo (I understand you)', 'Cuenta conmigo (Count on me)']
  }
};

async function adaptEmpathyToCulture(
  emotion: string,
  culture: string
) {
  const norms = culturalEmpathyNorms[culture as keyof typeof culturalEmpathyNorms];

  if (!norms) {
    return await client.empathy.generate({
      emotion,
      style: 'universal_empathetic'
    });
  }

  return await client.generate({
    instruction: `Express empathy for ${emotion} in ${culture} style`,
    style: norms.empathy_style,
    avoid: norms.avoid,
    prefer: norms.prefer,
    example_phrases: norms.phrases
  });
}
```

**Cultural Empathy Dimensions**:
- Expression style (direct vs indirect)
- Emotional display norms
- Relational vs individual focus
- Culture-specific phrases

## Recipe 7: Strength-Based Empathy

### Problem
Focus only on problems, missing user strengths.

### Solution
Acknowledge struggles while highlighting resilience.

```typescript
async function generateStrengthBasedEmpathy(
  userMessage: string,
  struggle: string
) {
  // Acknowledge the struggle
  const validation = await client.empathy.validate({
    text: userMessage,
    emotion: 'acknowledged'
  });

  // Identify and reflect strengths
  const strengths = await client.strengths.identify({
    from_text: userMessage,
    context: struggle,
    include_implicit: true
  });

  return await client.generate({
    prompt: userMessage,
    acknowledge_struggle: validation,
    reflect_strengths: strengths,
    balance_empathy_empowerment: true,
    style: 'strength_based'
  });
}

// Strength identification patterns
async function identifyStrengthsInStruggles(narrative: string) {
  const strengthIndicators = {
    resilience: /keep trying|won't give up|still going/i,
    courage: /even though I'm scared|facing|confronting/i,
    self_awareness: /I realize|I notice|I understand/i,
    perseverance: /again|continue|keep|persist/i,
    help_seeking: /asking|reaching out|looking for/i
  };

  const identified: string[] = [];

  for (const [strength, pattern] of Object.entries(strengthIndicators)) {
    if (pattern.test(narrative)) {
      identified.push(strength);
    }
  }

  return identified;
}

// Reflect strengths empathetically
async function reflectStrengths(
  userMessage: string,
  identifiedStrengths: string[]
) {
  const reflections = identifiedStrengths.map(strength => {
    const templates = {
      resilience: "I can see how resilient you've been in continuing to face this.",
      courage: "It takes real courage to confront what you're dealing with.",
      self_awareness: "The self-awareness you're showing is really valuable.",
      perseverance: "Your perseverance in this difficult time is notable.",
      help_seeking: "Reaching out for support shows real strength."
    };

    return templates[strength as keyof typeof templates];
  });

  return await client.generate({
    prompt: userMessage,
    strength_reflections: reflections,
    integrate_naturally: true,
    avoid_toxic_positivity: true
  });
}
```

**Strength-Based Principles**:
- Validate struggles first
- Identify implicit strengths
- Reflect strengths naturally
- Avoid toxic positivity

## Recipe 8: Empathy Calibration

### Problem
Too much or too little empathy for the situation.

### Solution
Dynamic empathy intensity based on context.

```typescript
async function calibrateEmpathy(
  userMessage: string,
  emotionIntensity: number,
  relationshipContext: string
) {
  // Calculate appropriate empathy level
  const empathyLevel = await client.empathy.calibrate({
    emotion_intensity: emotionIntensity,
    relationship: relationshipContext,
    cultural_context: 'default',
    user_preferences: await getUserEmpathyPreferences()
  });

  return await client.generate({
    prompt: userMessage,
    empathy_level: empathyLevel.calibrated_intensity,
    style: empathyLevel.recommended_style,
    avoid_over_empathizing: true
  });
}

// Empathy intensity scale
function calculateEmpathyIntensity(
  emotionIntensity: number,
  relationship: string
): number {
  const baseIntensity = emotionIntensity;

  const relationshipModifiers = {
    close_friend: 1.2,
    acquaintance: 0.8,
    professional: 0.6,
    stranger: 0.5
  };

  const modifier = relationshipModifiers[relationship as keyof typeof relationshipModifiers] || 1.0;

  return Math.min(baseIntensity * modifier, 1.0);
}

// Detect over-empathizing
async function detectOverEmpathizing(
  response: string,
  userMessage: string
) {
  const analysis = await client.empathy.analyzeResponse({
    response,
    original_message: userMessage,
    check_for: ['over_empathizing', 'emotional_contagion', 'unhelpful_sympathy']
  });

  if (analysis.over_empathizing) {
    return await client.empathy.adjustResponse({
      response,
      reduce_intensity: 0.3,
      add_balanced_perspective: true
    });
  }

  return response;
}

async function getUserEmpathyPreferences() {
  // Retrieve from user profile
  return {
    preferred_style: 'balanced',
    intensity_preference: 'moderate',
    avoid: ['excessive_emotion']
  };
}
```

**Calibration Factors**:
- Emotion intensity
- Relationship context
- Cultural norms
- User preferences

## Recipe 9: Empathy in Disagreement

### Problem
Disagree while maintaining empathetic connection.

### Solution
Validate feelings, question ideas gently.

```typescript
async function disagreeEmpathetically(
  userStatement: string,
  disagreementReason: string
) {
  const response = await client.empathy.disagreeWithRespect({
    user_statement: userStatement,
    disagreement: disagreementReason,
    maintain_connection: true,
    validate_person_not_idea: true
  });

  return response.respectful_disagreement;
}

// Empathetic disagreement structure
async function structureEmpathicDisagreement(
  userClaim: string,
  alternativeView: string
) {
  // 1. Validate the person/feeling
  const validation = "I understand why you might see it that way, and I respect your perspective.";

  // 2. Express disagreement gently
  const disagreement = await client.generate({
    prompt: `Gently express alternative view: ${alternativeView}`,
    style: 'respectful_alternative',
    phrases: ['I see it a bit differently', 'Another way to look at it might be', 'I wonder if']
  });

  // 3. Invite dialogue
  const invitation = "What do you think about that perspective?";

  return `${validation} ${disagreement.text} ${invitation}`;
}

// Validate person, question idea
async function separatePersonFromIdea(
  userMessage: string,
  problematicIdea: string
) {
  return await client.generate({
    prompt: userMessage,
    instruction: 'Validate the person while questioning the idea',
    framework: 'person_vs_idea_separation',
    empathetic_tone: true,
    avoid: ['attacking_person', 'dismissing_feelings']
  });
}
```

**Disagreement Empathy**:
- Validate person/feelings
- Question ideas gently
- Invite dialogue
- Maintain respect

## Recipe 10: Empathy Metrics & Improvement

### Problem
Difficult to measure and improve empathy quality.

### Solution
Quantitative empathy scoring with feedback loops.

```typescript
async function measureResponseEmpathy(
  userMessage: string,
  generatedResponse: string
) {
  const empathyMetrics = await client.empathy.score({
    user_message: userMessage,
    response: generatedResponse,
    dimensions: [
      'emotional_recognition',
      'validation_quality',
      'appropriate_tone',
      'supportiveness',
      'perspective_taking'
    ]
  });

  return {
    overall_score: empathyMetrics.overall,
    dimension_scores: empathyMetrics.dimensions,
    strengths: empathyMetrics.strong_points,
    improvements: empathyMetrics.improvement_areas,
    examples: empathyMetrics.better_alternatives
  };
}

// Improve based on feedback
class EmpathyImprover {
  private feedbackHistory: Array<{
    response: string;
    score: number;
    improvements: string[];
  }> = [];

  async improveResponse(
    userMessage: string,
    currentResponse: string
  ): Promise<string> {
    // Score current response
    const metrics = await measureResponseEmpathy(userMessage, currentResponse);

    if (metrics.overall_score >= 0.8) {
      return currentResponse; // Good enough
    }

    // Regenerate with improvements
    const improved = await client.generate({
      prompt: userMessage,
      previous_attempt: currentResponse,
      improvement_areas: metrics.improvements,
      target_empathy_score: 0.9,
      learn_from_examples: metrics.examples
    });

    // Track feedback
    this.feedbackHistory.push({
      response: currentResponse,
      score: metrics.overall_score,
      improvements: metrics.improvements
    });

    return improved.text;
  }

  async getEmpathyInsights() {
    if (this.feedbackHistory.length < 10) {
      return { message: 'Need more data for insights' };
    }

    const avgScore = this.feedbackHistory.reduce((sum, f) => sum + f.score, 0) / this.feedbackHistory.length;

    const commonIssues = this.feedbackHistory
      .flatMap(f => f.improvements)
      .reduce((acc, issue) => {
        acc[issue] = (acc[issue] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    return {
      average_empathy_score: avgScore,
      most_common_issues: Object.entries(commonIssues)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3),
      trend: this.calculateTrend()
    };
  }

  private calculateTrend(): string {
    const recent = this.feedbackHistory.slice(-5);
    const earlier = this.feedbackHistory.slice(-10, -5);

    const recentAvg = recent.reduce((sum, f) => sum + f.score, 0) / recent.length;
    const earlierAvg = earlier.reduce((sum, f) => sum + f.score, 0) / earlier.length;

    if (recentAvg > earlierAvg + 0.1) return 'improving';
    if (recentAvg < earlierAvg - 0.1) return 'declining';
    return 'stable';
  }
}

// A/B test empathy approaches
async function testEmpathyApproaches(
  userMessage: string,
  approaches: string[]
) {
  const results = await Promise.all(
    approaches.map(async (approach) => {
      const response = await client.generate({
        prompt: userMessage,
        empathy_approach: approach
      });

      const score = await client.empathy.score({
        user_message: userMessage,
        response: response.text
      });

      return {
        approach,
        response: response.text,
        empathy_score: score.overall
      };
    })
  );

  return results.sort((a, b) => b.empathy_score - a.empathy_score);
}
```

**Empathy Metrics**:
- Dimensional scoring
- Continuous improvement
- Feedback loops
- A/B testing

## Related Documentation

- [İnsan IQ Emotion Detection Guide](../guides/insan-iq-emotion-detection.md)
- [İnsan IQ Conversation AI Guide](../guides/insan-iq-conversation-ai.md)
- [İnsan IQ Multi-Modal Processing](../concepts/insan-iq-multimodal-processing.md)

## Support

- **Documentation**: https://docs.lydian.com
- **Empathy AI Research**: https://research.lydian.com/empathy-ai
- **Community**: https://community.lydian.com
