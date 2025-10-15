// LyDian Universal AI - All Models Hidden & Turkish Forced
// Note: Vercel automatically loads environment variables, no dotenv needed
const OpenAI = require('openai');
const { handleCORS } = require('../../security/cors-config');

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

    // Smart model selection (hidden from user)
    let selectedModel = MODELS.primary;

    // Code detection - use fast model
    if (message.includes('```') || message.includes('code') || message.includes('kod')) {
      selectedModel = MODELS.fast;
    }
    // Long complex queries - use primary
    else if (message.length > 500) {
      selectedModel = MODELS.primary;
    }

    const apiKey = selectedModel.key();
    if (!apiKey) {
      // Fallback to another model
      selectedModel = MODELS.gpt4mini;
      const fallbackKey = selectedModel.key();
      if (!fallbackKey) {
        return res.status(500).json({
          success: false,
          error: 'AI servisi geçici olarak kullanılamıyor'
        });
      }
    }

    // Initialize AI client
    const client = new OpenAI({
      apiKey: apiKey,
      baseURL: selectedModel.url
    });

    // Clean history
    const cleanHistory = history.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // Make API call
    const completion = await client.chat.completions.create({
      model: selectedModel.name,
      messages: [
        MULTILINGUAL_SYSTEM,
        ...cleanHistory,
        { role: 'user', content: message }
      ],
      temperature,
      max_tokens
    });

    const response = completion.choices[0].message.content;

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
