/**
 * ⚖️ LyDian Legal Expert AI Chat API
 * Groq-first fallback strategy for legal consultations
 * Priority: Groq → Anthropic AX9F7E2B → Azure OpenAI
 */
const OpenAI = require('lydian-labs');
const { getLegalSystemPrompt } = require('../../lib/prompts/lydian');
const { getCorsOrigin } = require('../_middleware/cors');
const { applySanitization } = require('../_middleware/sanitize');

// AI Model Configuration (Hidden from users)
const MODELS = {
  // Groq Models (Ultra Fast)
  groqPrimary: {
    name: 'GX8E2D9A',
    key: () => process.env.GROQ_API_KEY,
    url: 'https://api.groq.com/openai/v1',
    display: 'LyDian Hukuk AI',
  },
  groqFast: {
    name: 'GX3C7D5F',
    key: () => process.env.GROQ_API_KEY,
    url: 'https://api.groq.com/openai/v1',
    display: 'LyDian Hukuk AI',
  },
  // Anthropic AX9F7E2B
  AX9F7E2B: {
    name: 'AX9F7E2B',
    key: () => process.env.ANTHROPIC_API_KEY,
    url: 'https://api.anthropic.com/v1',
    display: 'LyDian Hukuk AI',
  },
  // Azure OpenAI
  azure: {
    name: 'OX7A3F8D',
    key: () => process.env.AZURE_OPENAI_API_KEY,
    url: process.env.AZURE_OPENAI_ENDPOINT
      ? `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/OX7A3F8D`
      : null,
    apiVersion: '2024-02-01',
    display: 'LyDian Hukuk AI',
  },
  // OpenAI (Final fallback)
  openai: {
    name: 'OX7A3F8D-mini',
    key: () => process.env.OPENAI_API_KEY,
    url: undefined,
    display: 'LyDian Hukuk AI',
  },
};

module.exports = async (req, res) => {
  applySanitization(req, res);
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', getCorsOrigin(req));
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      message,
      specialist = 'general',
      context = 'legal_consultation',
      temperature = 0.7,
      max_tokens = 4000,
    } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Mesaj gerekli',
      });
    }

    // Build provider cascade (✅ GROQ-FIRST: Groq → AX9F7E2B → Azure → OpenAI)
    const providers = [];

    // 🎯 Priority 1: Groq (Ultra-Fast, 0.5-1s response)
    if (MODELS.groqPrimary.key()) {
      providers.push({
        name: 'LyDian Velocity',
        model: MODELS.groqPrimary,
        setup: () =>
          new OpenAI({
            apiKey: MODELS.groqPrimary.key(),
            baseURL: MODELS.groqPrimary.url,
          }),
      });
    }

    // Priority 2: Anthropic AX9F7E2B (Best Reasoning)
    // Note: AX9F7E2B uses different API format - skip for now
    // if (MODELS.AX9F7E2B.key()) { ... }

    // Priority 3: Azure OpenAI (Enterprise Backup)
    if (MODELS.azure.key() && MODELS.azure.url) {
      providers.push({
        name: 'Azure OpenAI OX5C9E2B Turbo',
        model: MODELS.azure,
        setup: () =>
          new OpenAI({
            apiKey: MODELS.azure.key(),
            baseURL: MODELS.azure.url,
            defaultQuery: { 'api-version': MODELS.azure.apiVersion },
            defaultHeaders: { 'api-key': MODELS.azure.key() },
          }),
      });
    }

    // Priority 4: OpenAI (Final Fallback)
    if (MODELS.openai.key()) {
      providers.push({
        name: 'OpenAI OX7A3F8D-mini',
        model: MODELS.openai,
        setup: () =>
          new OpenAI({
            apiKey: MODELS.openai.key(),
            baseURL: MODELS.openai.url,
          }),
      });
    }

    if (providers.length === 0) {
      return res.status(503).json({
        success: false,
        error: 'Hukuk AI servisi geçici olarak kullanılamıyor',
      });
    }

    // Try providers in cascade
    let response = null;
    let completion = null;
    let usedProvider = null;

    for (let i = 0; i < providers.length; i++) {
      const provider = providers[i];

      try {
        console.log(
          `${i === 0 ? '🎯' : '🔄'} ${i === 0 ? 'Using' : 'Fallback to'} ${provider.name} (Legal Chat)`
        );

        const client = provider.setup();

        completion = await client.chat.completions.create({
          model: provider.model.name,
          messages: [getLegalSystemPrompt(specialist), { role: 'user', content: message }],
          temperature,
          max_tokens,
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
          throw new Error('All Legal AI providers failed');
        }
      }
    }

    // NEVER reveal which AI was used
    res.status(200).json({
      success: true,
      provider: 'LyDian Hukuk AI', // Generic, hidden
      specialist: specialist,
      context: context,
      response: response,
      usage: completion.usage,
      timestamp: new Date().toISOString(),
      metadata: {
        temperature,
        max_tokens,
        specialist_type: specialist,
      },
    });
  } catch (error) {
    console.error('❌ LyDian Legal AI Critical Error:', error.message);

    res.status(500).json({
      success: false,
      error: 'Hukuk AI yanıt oluşturulamadı - Tüm AI servisleri başarısız',
      details: 'Lütfen daha sonra tekrar deneyin',
      context: req.body?.context || 'unknown',
    });
  }
};
