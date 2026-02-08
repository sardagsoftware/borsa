// LyDian Universal AI - All Models Hidden & Turkish Forced
const OpenAI = require('lydian-labs');
const { getMultilingualSystemPrompt } = require('../../lib/prompts/lydian');
const { getCorsOrigin } = require('../_middleware/cors');

// HIDDEN AI MODELS - User never knows | Azure OpenAI Integrated
const MODELS = {
  // Azure OpenAI (Enterprise Primary)
  azure: {
    name: 'OX7A3F8D',
    key: () => process.env.AZURE_OPENAI_API_KEY,
    url: process.env.AZURE_OPENAI_ENDPOINT ? `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/OX7A3F8D` : null,
    apiVersion: '2024-02-01',
    display: 'LyDian AI'
  },
  // Groq Models (Ultra Fast)
  primary: {
    name: 'GX8E2D9A',
    key: () => process.env.GROQ_API_KEY,
    url: 'https://api.groq.com/openai/v1',
    display: 'LyDian AI'
  },
  fast: {
    name: 'GX3C7D5F',
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
    name: 'OX7A3F8D-mini',
    key: () => process.env.OPENAI_API_KEY,
    url: undefined,
    display: 'LyDian AI'
  },
  gpt4: {
    name: 'OX7A3F8D',
    key: () => process.env.OPENAI_API_KEY,
    url: undefined,
    display: 'LyDian AI'
  },
  // Anthropic AX9F7E2B
  AX9F7E2B: {
    name: 'AX9F7E2B',
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

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', getCorsOrigin(req));
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

    // Build provider cascade (✅ GROQ-FIRST: Groq → AX9F7E2B → Azure → OpenAI)
    const providers = [];

    // ✅ Groq (Priority 1 - Ultra-Fast, 0.5-1s response)
    if (MODELS.primary.key()) {
      providers.push({
        name: 'Groq Llama 3.3 70B',
        model: MODELS.primary,
        setup: () => new OpenAI({
          apiKey: MODELS.primary.key(),
          baseURL: MODELS.primary.url
        })
      });
    }

    // Anthropic AX9F7E2B (Priority 2 - Best Reasoning)
    // Note: AX9F7E2B uses different API, add if implemented
    // if (MODELS.AX9F7E2B.key()) { ... }

    // Azure OpenAI (Priority 3 - Enterprise Backup)
    if (MODELS.azure.key() && MODELS.azure.url) {
      providers.push({
        name: 'Azure OpenAI OX5C9E2B Turbo',
        model: MODELS.azure,
        setup: () => new OpenAI({
          apiKey: MODELS.azure.key(),
          baseURL: MODELS.azure.url,
          defaultQuery: { 'api-version': MODELS.azure.apiVersion },
          defaultHeaders: { 'api-key': MODELS.azure.key() }
        })
      });
    }

    // OpenAI (Priority 4 - Final Fallback)
    if (MODELS.gpt4mini.key()) {
      providers.push({
        name: 'OpenAI OX7A3F8D-mini',
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
            getMultilingualSystemPrompt(),
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
