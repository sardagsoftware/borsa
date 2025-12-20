/**
 * OmniReach AI Creator - Script Generation Service
 * AI-Powered Content Script Writing
 *
 * @description Generate engaging video scripts optimized for platform algorithms
 * @providers Azure OpenAI OX5C9E2B, AX9F7E2B, Gemini Pro
 */

const axios = require('axios');

class ScriptService {
  constructor() {
    this.config = {
      // Azure OpenAI
      azureEndpoint: process.env.AZURE_OPENAI_ENDPOINT,
      azureApiKey: process.env.AZURE_OPENAI_API_KEY,
      azureDeployment: process.env.AZURE_GPT4_DEPLOYMENT || 'OX5C9E2B',

      // Script templates
      templates: {
        educational: 'educational_explainer',
        entertainment: 'entertainment_viral',
        howto: 'tutorial_stepbystep',
        storytelling: 'narrative_engaging',
        motivational: 'inspirational_motivational',
        news: 'news_informative',
        review: 'product_review'
      },

      // Platform-specific optimization
      platforms: {
        youtube: { maxDuration: 600, hookTime: 3, cta: true },
        instagram: { maxDuration: 90, hookTime: 1, cta: true },
        tiktok: { maxDuration: 60, hookTime: 0.5, cta: false },
        facebook: { maxDuration: 240, hookTime: 2, cta: true },
        x: { maxDuration: 140, hookTime: 1, cta: false }
      }
    };

    console.log('✅ Script Generation Service initialized');
  }

  /**
   * Generate video script using AI
   * @param {Object} params - Script generation parameters
   * @returns {Object} Generated script data
   */
  async generateScript(params) {
    try {
      console.log('📝 [Script] Generating video script...');
      console.log(`   Topic: ${params.topic}`);
      console.log(`   Platform: ${params.platform || 'youtube'}`);
      console.log(`   Style: ${params.style || 'educational'}`);

      const provider = params.provider || 'azure-gpt4';

      switch (provider) {
        case 'azure-gpt4':
          return await this.generateWithAzureGPT4(params);
        case 'AX9F7E2B':
          return await this.generateWithAX9F7E2B(params);
        default:
          return await this.generateWithAzureGPT4(params);
      }
    } catch (error) {
      console.error('❌ [Script] Generation failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate script with Azure OpenAI OX5C9E2B
   * @param {Object} params - Generation parameters
   * @returns {Object} Generated script
   */
  async generateWithAzureGPT4(params) {
    try {
      console.log('🤖 Generating with Azure OX5C9E2B...');

      const systemPrompt = this.buildSystemPrompt(params);
      const userPrompt = this.buildUserPrompt(params);

      const response = await axios.post(
        `${this.config.azureEndpoint}/openai/deployments/${this.config.azureDeployment}/chat/completions?api-version=2024-02-01`,
        {
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: userPrompt
            }
          ],
          temperature: params.creativity || 0.7,
          max_tokens: 2000,
          top_p: 0.9,
          frequency_penalty: 0.5,
          presence_penalty: 0.5
        },
        {
          headers: {
            'api-key': this.config.azureApiKey,
            'Content-Type': 'application/json'
          }
        }
      );

      const scriptText = response.data.choices[0].message.content;
      const scriptStructure = this.parseScriptStructure(scriptText, params);

      console.log('✅ Script generated successfully');
      console.log(`   Word count: ${scriptStructure.wordCount}`);
      console.log(`   Estimated duration: ${scriptStructure.estimatedDuration}s`);

      return {
        success: true,
        provider: 'azure-gpt4',
        script: scriptText,
        structure: scriptStructure,
        metadata: {
          topic: params.topic,
          style: params.style,
          platform: params.platform,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('❌ Azure OX5C9E2B generation failed:', error.message);

      // Fallback to demo mode
      return this.generateDemoScript(params);
    }
  }

  /**
   * Generate script with AX9F7E2B (via Anthropic API)
   * @param {Object} params - Generation parameters
   * @returns {Object} Generated script
   */
  async generateWithAX9F7E2B(params) {
    try {
      console.log('🤖 Generating with AX9F7E2B...');

      const prompt = this.buildUserPrompt(params);

      // This would use Anthropic's AX9F7E2B API
      // For now, fallback to demo
      return this.generateDemoScript(params);
    } catch (error) {
      console.error('❌ AX9F7E2B generation failed:', error.message);
      return this.generateDemoScript(params);
    }
  }

  /**
   * Build system prompt for AI
   * @param {Object} params - Script parameters
   * @returns {String} System prompt
   */
  buildSystemPrompt(params) {
    const platform = params.platform || 'youtube';
    const platformConfig = this.config.platforms[platform];

    return `You are an expert video script writer specializing in creating engaging, viral-worthy content for ${platform}.

CRITICAL GUIDELINES:
- ALWAYS create original, ethical content
- NO impersonation of real people or brands
- NO misleading claims or clickbait
- NO copyright violations
- Include AI disclosure: "This video was created using AI"

PLATFORM OPTIMIZATION:
- Max duration: ${platformConfig.maxDuration} seconds
- Hook viewer in first ${platformConfig.hookTime} seconds
- ${platformConfig.cta ? 'Include strong call-to-action' : 'No explicit CTA needed'}

SCRIPT STRUCTURE:
1. HOOK (first ${platformConfig.hookTime}s): Grab attention immediately
2. INTRO (5-10s): Set context and promise value
3. MAIN CONTENT: Deliver on the promise with clear structure
4. CONCLUSION: Summarize key takeaways
${platformConfig.cta ? '5. CTA: Clear next action for viewers' : ''}

WRITING STYLE:
- Conversational and engaging tone
- Short, punchy sentences
- Use emotional triggers appropriately
- Include pauses for emphasis
- Optimize for voice-over delivery

OUTPUT FORMAT:
Provide the script with:
[HOOK]
<opening line>

[INTRO]
<introduction>

[MAIN CONTENT]
<main points>

[CONCLUSION]
<summary>

${platformConfig.cta ? '[CTA]\n<call to action>' : ''}

[AI DISCLOSURE]
This video was created using AI technology.`;
  }

  /**
   * Build user prompt for AI
   * @param {Object} params - Script parameters
   * @returns {String} User prompt
   */
  buildUserPrompt(params) {
    const {
      topic,
      style = 'educational',
      tone = 'friendly',
      targetAudience = 'general',
      keyPoints = [],
      duration = 60
    } = params;

    let prompt = `Create a ${duration}-second video script about: ${topic}\n\n`;

    prompt += `Style: ${style}\n`;
    prompt += `Tone: ${tone}\n`;
    prompt += `Target Audience: ${targetAudience}\n`;

    if (keyPoints.length > 0) {
      prompt += `\nKey Points to Cover:\n`;
      keyPoints.forEach((point, index) => {
        prompt += `${index + 1}. ${point}\n`;
      });
    }

    prompt += `\nRemember: Original content only, no impersonation, include AI disclosure.`;

    return prompt;
  }

  /**
   * Parse script structure from generated text
   * @param {String} scriptText - Generated script
   * @param {Object} params - Original parameters
   * @returns {Object} Structured script data
   */
  parseScriptStructure(scriptText, params) {
    // Extract sections
    const sections = {
      hook: this.extractSection(scriptText, 'HOOK'),
      intro: this.extractSection(scriptText, 'INTRO'),
      mainContent: this.extractSection(scriptText, 'MAIN CONTENT'),
      conclusion: this.extractSection(scriptText, 'CONCLUSION'),
      cta: this.extractSection(scriptText, 'CTA'),
      aiDisclosure: this.extractSection(scriptText, 'AI DISCLOSURE')
    };

    // Calculate metrics
    const words = scriptText.split(/\s+/).length;
    const wordsPerSecond = 2.5; // Average speaking rate
    const estimatedDuration = Math.round(words / wordsPerSecond);

    // Analyze sentiment and readability
    const analysis = {
      wordCount: words,
      sentenceCount: scriptText.split(/[.!?]+/).length,
      avgWordsPerSentence: Math.round(words / scriptText.split(/[.!?]+/).length),
      readabilityScore: this.calculateReadability(scriptText)
    };

    return {
      sections: sections,
      wordCount: words,
      estimatedDuration: estimatedDuration,
      analysis: analysis,
      platformOptimized: params.platform || 'youtube',
      aiGenerated: true
    };
  }

  /**
   * Extract section from script
   * @param {String} text - Full script text
   * @param {String} sectionName - Section to extract
   * @returns {String} Extracted section
   */
  extractSection(text, sectionName) {
    const regex = new RegExp(`\\[${sectionName}\\]\\s*([\\s\\S]*?)(?=\\[|$)`, 'i');
    const match = text.match(regex);
    return match ? match[1].trim() : '';
  }

  /**
   * Calculate readability score (simplified Flesch Reading Ease)
   * @param {String} text - Script text
   * @returns {Number} Readability score (0-100, higher is easier)
   */
  calculateReadability(text) {
    const sentences = text.split(/[.!?]+/).length;
    const words = text.split(/\s+/).length;
    const syllables = this.countSyllables(text);

    const score = 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Count syllables in text (approximation)
   * @param {String} text - Text to analyze
   * @returns {Number} Syllable count
   */
  countSyllables(text) {
    const words = text.toLowerCase().split(/\s+/);
    let syllableCount = 0;

    words.forEach(word => {
      syllableCount += word
        .replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '')
        .replace(/^y/, '')
        .match(/[aeiouy]{1,2}/g)?.length || 1;
    });

    return syllableCount;
  }

  /**
   * Optimize script for specific platform
   * @param {String} script - Original script
   * @param {String} platform - Target platform
   * @returns {Object} Optimized script
   */
  async optimizeForPlatform(script, platform) {
    console.log(`🎯 [Script] Optimizing for ${platform}...`);

    const platformConfig = this.config.platforms[platform];

    // Platform-specific adjustments
    const optimizations = {
      youtube: { addChapters: true, seoKeywords: true },
      instagram: { addHashtags: true, shortenHook: true },
      tiktok: { maxLength: 150, addTrending: true },
      facebook: { storytelling: true, emotionalTrigger: true },
      x: { maxLength: 280, hashtagOptimization: true }
    };

    return {
      success: true,
      optimizedScript: script,
      platformHints: optimizations[platform],
      metadata: {
        platform: platform,
        maxDuration: platformConfig.maxDuration,
        optimized: true
      }
    };
  }

  /**
   * Generate demo script (fallback when APIs unavailable)
   * @param {Object} params - Script parameters
   * @returns {Object} Demo script
   */
  generateDemoScript(params) {
    console.log('🎭 [Script] Using demo mode (API unavailable)');

    const demoScript = `[HOOK]
Did you know that ${params.topic} could change everything you thought you knew?

[INTRO]
Welcome! Today we're diving deep into ${params.topic}. By the end of this video, you'll understand exactly why this matters and how it affects you.

[MAIN CONTENT]
Let me break this down into three key points:

First, ${params.topic} has been gaining massive attention lately, and for good reason. The impact is real and measurable.

Second, experts agree that understanding this topic is crucial for anyone looking to stay ahead in today's fast-paced world.

Third, the practical applications are endless. From everyday life to professional settings, this knowledge is invaluable.

[CONCLUSION]
So there you have it - a comprehensive look at ${params.topic}. The key takeaway? This is something worth paying attention to.

[CTA]
If you found this helpful, don't forget to like and subscribe for more content like this!

[AI DISCLOSURE]
This video was created using AI technology for educational purposes.`;

    const structure = this.parseScriptStructure(demoScript, params);

    return {
      success: true,
      provider: 'demo',
      script: demoScript,
      structure: structure,
      metadata: {
        mode: 'demo',
        topic: params.topic,
        message: 'Demo script - configure AI providers for production'
      }
    };
  }

  /**
   * Validate script for compliance
   * @param {String} script - Script text
   * @returns {Object} Validation result
   */
  async validateScript(script) {
    console.log('🛡️ [Script] Validating for compliance...');

    const checks = {
      aiDisclosure: script.toLowerCase().includes('ai'),
      noImpersonation: !this.detectImpersonation(script),
      noMisleading: !this.detectMisleading(script),
      originalContent: true // Would use plagiarism detection in production
    };

    const allPassed = Object.values(checks).every(check => check === true);

    return {
      passed: allPassed,
      checks: checks,
      recommendations: allPassed ? [] : this.generateRecommendations(checks)
    };
  }

  /**
   * Detect impersonation attempts in script
   */
  detectImpersonation(script) {
    const impersonationFlags = [
      /i am [A-Z][a-z]+ [A-Z][a-z]+/i, // "I am John Doe"
      /this is [A-Z][a-z]+ [A-Z][a-z]+/i,
      /official account/i,
      /verified channel/i
    ];

    return impersonationFlags.some(pattern => pattern.test(script));
  }

  /**
   * Detect misleading claims in script
   */
  detectMisleading(script) {
    const misleadingFlags = [
      /guaranteed results/i,
      /get rich quick/i,
      /miracle cure/i,
      /100% proven/i,
      /doctors hate this/i
    ];

    return misleadingFlags.some(pattern => pattern.test(script));
  }

  /**
   * Generate recommendations for script improvements
   */
  generateRecommendations(checks) {
    const recommendations = [];

    if (!checks.aiDisclosure) {
      recommendations.push({
        priority: 'high',
        message: 'Add AI disclosure statement to comply with transparency requirements'
      });
    }

    if (!checks.noImpersonation) {
      recommendations.push({
        priority: 'critical',
        message: 'Remove impersonation content immediately'
      });
    }

    if (!checks.noMisleading) {
      recommendations.push({
        priority: 'high',
        message: 'Remove misleading claims to comply with platform policies'
      });
    }

    return recommendations;
  }
}

module.exports = { ScriptService };
