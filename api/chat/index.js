// LyDian Universal AI - All Models Hidden & Turkish Forced
const OpenAI = require('openai');
const { handleCORS } = require('../../security/cors-config');

// HIDDEN AI MODELS - User never knows | Azure OpenAI Integrated
const MODELS = {
  // Azure OpenAI (Enterprise Primary)
  azure: {
    name: 'gpt-4-turbo',
    key: () => process.env.AZURE_OPENAI_API_KEY,
    url: process.env.AZURE_OPENAI_ENDPOINT ? `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/gpt-4-turbo` : null,
    apiVersion: '2024-02-01',
    display: 'LyDian AI'
  },
  // Groq Models (Ultra Fast)
  primary: {
    name: 'llama-3.3-70b-versatile',
    key: () => process.env.GROQ_API_KEY,
    url: 'https://api.groq.com/openai/v1',
    display: 'LyDian AI'
  },
  fast: {
    name: 'llama-3.1-8b-instant',
    key: () => process.env.GROQ_API_KEY,
    url: 'https://api.groq.com/openai/v1',
    display: 'LyDian AI'
  },
  gemma: {
    name: 'gemma2-9b-it',
    key: () => process.env.GROQ_API_KEY,
    url: 'https://api.groq.com/openai/v1',
    display: 'LyDian AI'
  },
  // OpenAI Models
  gpt4mini: {
    name: 'gpt-4o-mini',
    key: () => process.env.OPENAI_API_KEY,
    url: undefined,
    display: 'LyDian AI'
  },
  gpt4: {
    name: 'gpt-4o',
    key: () => process.env.OPENAI_API_KEY,
    url: undefined,
    display: 'LyDian AI'
  },
  // Anthropic Claude
  claude: {
    name: 'claude-3-5-sonnet-20241022',
    key: () => process.env.ANTHROPIC_API_KEY,
    url: 'https://api.anthropic.com/v1',
    display: 'LyDian AI'
  },
  // Google Gemini
  gemini: {
    name: 'gemini-2.0-flash-exp',
    key: () => process.env.GOOGLE_AI_KEY,
    url: 'https://generativelanguage.googleapis.com/v1beta',
    display: 'LyDian AI'
  }
};

// MULTILINGUAL SYSTEM PROMPT - AUTOMATIC LANGUAGE DETECTION WITH VARIETY
const RESPONSE_STYLES = [
  'Be comprehensive and thorough with examples',
  'Provide in-depth analysis with practical insights',
  'Give detailed explanations with step-by-step guidance',
  'Offer extensive coverage with real-world applications',
  'Present complete information with actionable recommendations'
];

const getMultilingualSystem = () => {
  const style = RESPONSE_STYLES[Math.floor(Math.random() * RESPONSE_STYLES.length)];

  return {
    role: 'system',
    content: `You are LyDian AI, a universal multilingual assistant.

**🎯 RESPONSE STYLE:** ${style}

**🌍 CRITICAL RULE - AUTOMATIC LANGUAGE DETECTION:**
ALWAYS detect the user's question language and respond in THE SAME LANGUAGE.

**📝 VARIETY & DETAIL REQUIREMENTS:**
- NEVER use repetitive phrases or formulaic responses
- Vary your sentence structure and vocabulary extensively
- Provide rich, detailed answers with specific examples
- Use diverse transitions and connectors between ideas
- Include nuanced explanations and multiple perspectives
- Avoid generic statements - be specific and concrete

**TÜRKÇE (TURKISH):**
- Soru Türkçe ise → MUTLAKA Türkçe cevap ver
- ÇOK DETAYLI, kapsamlı ve profesyonel yanıtlar
- Farklı kelime ve ifadeler kullan, tekrar etme
- Örneklerle zenginleştir, spesifik ol
- Markdown formatında düzgün yapı
- ASLA model adı söyleme (GPT, Claude, Gemini yasak)
- Sadece "LyDian AI" olarak tanıt

**ENGLISH:**
- If question is in English → Respond in English
- HIGHLY DETAILED, comprehensive, professional answers
- Use varied vocabulary and expressions
- Enrich with examples, be specific
- Proper Markdown formatting
- NEVER reveal AI model name
- Only identify as "LyDian AI"

**العربية (ARABIC):**
- إذا كان السؤال بالعربية → أجب بالعربية
- إجابات مفصلة جداً واحترافية
- استخدم مفردات وتعبيرات متنوعة
- أغنِ بالأمثلة، كن محدداً
- تنسيق Markdown صحيح
- لا تذكر اسم النموذج أبداً
- قدم نفسك كـ "LyDian AI" فقط

**IMPORTANT:**
1. Detect language from user's question
2. Respond in EXACTLY the same language
3. Be HIGHLY detailed and comprehensive (minimum 3-4 paragraphs)
4. Use varied vocabulary - avoid repetitive words
5. Include specific examples, data, or analogies
6. Use proper Markdown formatting with headers, lists, and emphasis
7. Never mention GPT, Claude, Gemini, or any AI model name
8. Always identify only as "LyDian AI"

YOU ARE: LyDian AI - Universal Multilingual Assistant`
  };
};

module.exports = async (req, res) => {
  // 🔒 SECURE CORS - Whitelist-based
  if (handleCORS(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const {
      message,
      history = [],
      temperature = 0.9, // Higher for more creative/detailed responses
      max_tokens = 8000, // Much longer responses
      aiType = 'general',
      model, language, locale
    } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, error: 'Mesaj gerekli' });
    }

    // Build provider cascade (Azure → Groq → OpenAI)
    const providers = [];

    // Azure OpenAI (Priority 1)
    if (MODELS.azure.key() && MODELS.azure.url) {
      providers.push({
        name: 'Azure OpenAI',
        model: MODELS.azure,
        setup: () => new OpenAI({
          apiKey: MODELS.azure.key(),
          baseURL: MODELS.azure.url,
          defaultQuery: { 'api-version': MODELS.azure.apiVersion },
          defaultHeaders: { 'api-key': MODELS.azure.key() }
        })
      });
    }

    // Groq (Priority 2 - Fast)
    if (MODELS.primary.key()) {
      providers.push({
        name: 'Groq Llama 3.3',
        model: MODELS.primary,
        setup: () => new OpenAI({
          apiKey: MODELS.primary.key(),
          baseURL: MODELS.primary.url
        })
      });
    }

    // OpenAI (Priority 3 - Fallback)
    if (MODELS.gpt4mini.key()) {
      providers.push({
        name: 'OpenAI GPT-4o-mini',
        model: MODELS.gpt4mini,
        setup: () => new OpenAI({
          apiKey: MODELS.gpt4mini.key(),
          baseURL: MODELS.gpt4mini.url
        })
      });
    }

    if (providers.length === 0) {
      return res.status(503).json({
        success: false,
        error: 'AI servisi geçici olarak kullanılamıyor - Hiçbir provider yapılandırılmadı'
      });
    }

    // Clean history
    const cleanHistory = history.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // Try providers in cascade
    let response = null;
    let completion = null;
    let usedProvider = null;

    for (let i = 0; i < providers.length; i++) {
      const provider = providers[i];

      try {
        console.log(`${i === 0 ? '🎯' : '🔄'} ${i === 0 ? 'Using' : 'Fallback to'} ${provider.name} (Chat API)`);

        const client = provider.setup();

        completion = await client.chat.completions.create({
          model: provider.model.name,
          messages: [
            getMultilingualSystem(),
            ...cleanHistory,
            { role: 'user', content: message }
          ],
          temperature,
          max_tokens
        });

        response = completion.choices[0].message.content;
        usedProvider = provider.name;
        console.log(`✅ ${provider.name} response completed`);

        // Success - break the loop
        break;

      } catch (error) {
        console.error(`❌ ${provider.name} failed: ${error.message}`);

        // Continue to next provider
        if (i === providers.length - 1) {
          // All providers failed
          throw new Error('All AI providers failed');
        }
      }
    }

    // NEVER reveal which AI was used
    res.status(200).json({
      success: true,
      provider: 'LyDian AI', // Generic, hidden
      aiType: aiType,
      response: response,
      usage: completion.usage,
      timestamp: new Date().toISOString(),
      metadata: {
        temperature,
        max_tokens,
        history_length: cleanHistory.length
      }
    });

  } catch (error) {
    console.error('❌ LyDian AI Critical Error:', error.message);

    res.status(500).json({
      success: false,
      error: 'AI yanıt oluşturulamadı - Tüm AI servisleri başarısız',
      details: 'Lütfen daha sonra tekrar deneyin',
      aiType: req.body?.aiType || 'unknown'
    });
  }
};
