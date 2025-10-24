// LyDian Universal AI - All Models Hidden & Turkish Forced
// Note: Vercel automatically loads environment variables, no dotenv needed
const OpenAI = require('openai');

// HIDDEN AI MODELS - User never knows
const MODELS = {
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
    key: () => process.env.GOOGLE_API_KEY || process.env.GOOGLE_GEMINI_API_KEY,
    url: 'https://generativelanguage.googleapis.com/v1beta',
    display: 'LyDian AI'
  },
  // Z.AI GLM-4.6 (Code Expert)
  'glm-4-6': {
    name: 'glm-4.6',
    key: () => process.env.Z_AI_API_KEY,
    url: 'https://api.z.ai/api/paas/v4',
    display: 'LyDian AI'
  }
};

// MULTILINGUAL SYSTEM PROMPT - TURKISH & ARABIC SUPPORT - FORCE DETAILED RESPONSES
const MULTILINGUAL_SYSTEM = {
  role: 'system',
  content: `أنت مساعد LyDian AI الذكي. القواعد الإلزامية:

**العربية (ARABIC):**
1. ✅ إذا كان السؤال بالعربية، أجب دائماً بالعربية الفصحى
2. ✅ قدم إجابات مفصلة وشاملة قدر الإمكان
3. ✅ اشرح كل موضوع بعمق مع الأمثلة والتفاصيل
4. ✅ كن محترفاً وواضحاً ولكن اكتب بشكل طويل ومفصل
5. ✅ استخدم تنسيق Markdown مع العناوين والقوائم والأمثلة
6. ❌ لا تذكر أبداً أي نموذج AI مثل GPT أو Claude أو Gemini
7. ✅ قدم نفسك فقط باسم "LyDian AI"

**TÜRKÇE (TURKISH):**
1. ✅ Eğer soru Türkçe ise, HER ZAMAN TÜRKÇE cevap ver
2. ✅ EN DETAYLI ve KAPSAMLI yanıtlar ver - Kısa cevaplardan kaçın
3. ✅ Her konuyu derinlemesine açıkla, örnekler ver, detaylandır
4. ✅ Profesyonel, açık ve net ol ama UZUN ve DETAYLI yaz
5. ✅ Markdown formatında düzgün yanıt ver - alt başlıklar, listeler, kod blokları
6. ❌ ASLA hangi AI modeli olduğunu söyleme (GPT, Claude, Gemini yasak)
7. ✅ Sadece "LyDian AI" olarak kendini tanıt

**ENGLISH (FALLBACK):**
1. ✅ If question is in English, respond in English
2. ✅ Provide detailed, comprehensive answers
3. ❌ Never reveal AI model name
4. ✅ Only identify as "LyDian AI"

**عام (UNIVERSAL):**
• اكتشف لغة السؤال تلقائياً وأجب بنفس اللغة | Dili otomatik algıla ve aynı dilde yanıt ver
• كن مفصلاً قدر الإمكان | Mümkün olduğunca detaylı ol | Be as detailed as possible
• استخدم أمثلة وشروحات | Örnekler ve açıklamalar kullan | Use examples and explanations

SEN / أنت / YOU ARE: LyDian AI - Universal Multilingual Assistant`
};

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
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

    // Clean history
    const cleanHistory = history.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // ✅ GROQ-FIRST PROVIDER CASCADE: Groq → Claude → Azure → OpenAI
    const providers = [];

    // Smart model selection for Groq
    const isCodeQuery = message.includes('```') || message.includes('code') || message.includes('kod');
    const groqModel = isCodeQuery ? MODELS.fast : MODELS.primary;

    // 🎯 Priority 1: Groq (Ultra-Fast)
    if (groqModel.key()) {
      providers.push({
        name: `Groq ${groqModel.name}`,
        model: groqModel,
        setup: () => new OpenAI({
          apiKey: groqModel.key(),
          baseURL: groqModel.url
        })
      });
    }

    // Priority 2: Anthropic Claude (Best Reasoning)
    // Note: Claude uses different API - skip for now
    // if (MODELS.claude.key()) { ... }

    // Priority 3: Azure OpenAI (if configured)
    if (MODELS.azure && MODELS.azure.key && MODELS.azure.key() && MODELS.azure.url) {
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

    // Priority 4: OpenAI GPT-4o-mini (Final Fallback)
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

    // Try providers in cascade
    let response = null;
    let completion = null;
    let usedProvider = null;

    for (let i = 0; i < providers.length; i++) {
      const provider = providers[i];

      try {
        console.log(`${i === 0 ? '🎯' : '🔄'} ${i === 0 ? 'Using' : 'Fallback to'} ${provider.name} (Chat Specialized)`);

        const client = provider.setup();

        completion = await client.chat.completions.create({
          model: provider.model.name,
          messages: [
            MULTILINGUAL_SYSTEM,
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
    console.error('❌ LyDian AI Error:', error.message);

    // Try fallback
    try {
      const fallback = MODELS.gpt4mini;
      const fallbackKey = fallback.key();

      if (fallbackKey) {
        const client = new OpenAI({
          apiKey: fallbackKey,
          baseURL: fallback.url
        });

        const cleanHistory = (req.body.history || []).map(msg => ({
          role: msg.role,
          content: msg.content
        }));

        const completion = await client.chat.completions.create({
          model: fallback.name,
          messages: [
            MULTILINGUAL_SYSTEM,
            ...cleanHistory,
            { role: 'user', content: req.body.message }
          ],
          temperature: 0.7,
          max_tokens: 3000
        });

        return res.status(200).json({
          success: true,
          provider: 'LyDian AI',
          response: completion.choices[0].message.content,
          timestamp: new Date().toISOString()
        });
      }
    } catch (fallbackError) {
      console.error('❌ Fallback failed:', fallbackError.message);
    }

    res.status(500).json({
      success: false,
      error: 'AI yanıt oluşturulamadı',
      details: 'Lütfen tekrar deneyin',
      aiType: req.body?.aiType || 'unknown'
    });
  }
};
