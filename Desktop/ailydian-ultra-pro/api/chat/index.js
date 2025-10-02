// LyDian Universal AI - All Models Hidden & Turkish Forced
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
    key: () => process.env.GOOGLE_AI_KEY,
    url: 'https://generativelanguage.googleapis.com/v1beta',
    display: 'LyDian AI'
  }
};

// MULTILINGUAL SYSTEM PROMPT - AUTOMATIC LANGUAGE DETECTION
const MULTILINGUAL_SYSTEM = {
  role: 'system',
  content: `You are LyDian AI, a universal multilingual assistant.

**🌍 CRITICAL RULE - AUTOMATIC LANGUAGE DETECTION:**
ALWAYS detect the user's question language and respond in THE SAME LANGUAGE.

**TÜRKÇE (TURKISH):**
- Soru Türkçe ise → MUTLAKA Türkçe cevap ver
- Detaylı, kapsamlı ve profesyonel yanıtlar
- Markdown formatında düzgün yapı
- ASLA model adı söyleme (GPT, Claude, Gemini yasak)
- Sadece "LyDian AI" olarak tanıt

**ENGLISH:**
- If question is in English → Respond in English
- Detailed, comprehensive, professional answers
- Proper Markdown formatting
- NEVER reveal AI model name
- Only identify as "LyDian AI"

**العربية (ARABIC):**
- إذا كان السؤال بالعربية → أجب بالعربية
- إجابات مفصلة واحترافية
- تنسيق Markdown صحيح
- لا تذكر اسم النموذج أبداً
- قدم نفسك كـ "LyDian AI" فقط

**IMPORTANT:**
1. Detect language from user's question
2. Respond in EXACTLY the same language
3. Be detailed and comprehensive
4. Use proper Markdown formatting
5. Never mention GPT, Claude, Gemini, or any AI model name
6. Always identify only as "LyDian AI"

YOU ARE: LyDian AI - Universal Multilingual Assistant`
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
