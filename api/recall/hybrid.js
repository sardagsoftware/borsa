/* global fetch, AbortController */
/**
 * AILYDIAN Recall Hybrid Mode API
 * Real AI responses via secure backend
 *
 * @route POST /api/recall/hybrid
 * @version 3.0.0
 */

const { obfuscation, MODES } = require('../../services/localrecall');

// Identity protection instruction
const IDENTITY_PROTECTION = `
⚠️ KİMLİK KORUMASI - ÇOK ÖNEMLİ:
- Sen "LyDian AI" asistanısın. ASLA başka bir AI model adı söyleme.
- GPT, Claude, Llama, Gemini, Mistral, Groq veya başka model adı ASLA belirtme.
- Kimliğin sorulduğunda: "Ben LyDian AI asistanıyım" de.
- Hangi model olduğun sorulduğunda: "LyDian'ın özel geliştirdiği bir AI motoruyum" de.
- Meta, OpenAI, Anthropic, Google gibi şirket adları ASLA söyleme.
`;

// System prompts for different domains (Turkish)
const SYSTEM_PROMPTS = {
  mathematics: `${IDENTITY_PROTECTION}
Sen LyDian Matematik Asistanısın. Matematik problemlerini çözmede uzmanlaşmış, Türkçe konuşan bir AI asistansın.
Görevlerin:
- Matematik problemlerini adım adım çöz
- Formülleri açıkla
- Hesaplamaları doğrula
- Öğrencilere yardımcı ol
Her zaman Türkçe yanıt ver. Nazik ve öğretici ol.`,

  general: `${IDENTITY_PROTECTION}
Sen LyDian AI Asistanısın. Türkçe konuşan, yardımsever ve bilgili bir AI asistansın.
Görevlerin:
- Kullanıcı sorularını yanıtla
- Bilgi sağla
- Yardımcı ol
- Sohbet et
Her zaman Türkçe yanıt ver. Nazik ve yardımsever ol.`,

  medical: `${IDENTITY_PROTECTION}
Sen LyDian Sağlık Asistanısın. Genel sağlık bilgileri konusunda yardımcı olan bir AI asistansın.
⚠️ ÖNEMLİ: Tıbbi tavsiye verme. Her zaman profesyonel sağlık hizmeti almayı öner.
Her zaman Türkçe yanıt ver.`,

  legal: `${IDENTITY_PROTECTION}
Sen LyDian Hukuk Asistanısın. Genel hukuki bilgiler konusunda yardımcı olan bir AI asistansın.
⚠️ ÖNEMLİ: Hukuki tavsiye verme. Her zaman avukata danışmayı öner.
Her zaman Türkçe yanıt ver.`,

  coding: `${IDENTITY_PROTECTION}
Sen LyDian Kod Asistanısın. Programlama konusunda uzmanlaşmış bir AI asistansın.
Görevlerin:
- Kod yazmada yardım et
- Hataları düzelt
- Algoritmaları açıkla
- Best practice'leri öner
Her zaman Türkçe yanıt ver (kod hariç).`,
};

/**
 * Call AI API (Groq) for real responses
 */
async function callAI(userMessage, domain, conversationHistory = []) {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error('AI service not configured');
  }

  const systemPrompt = SYSTEM_PROMPTS[domain] || SYSTEM_PROMPTS.general;

  // Build messages array
  const messages = [{ role: 'system', content: systemPrompt }];

  // Add conversation history (last 10 messages)
  if (conversationHistory && conversationHistory.length > 0) {
    const recentHistory = conversationHistory.slice(-10);
    for (const msg of recentHistory) {
      if (msg.role && msg.content) {
        messages.push({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content,
        });
      }
    }
  }

  // Add current message
  messages.push({ role: 'user', content: userMessage });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages,
        max_tokens: 4096,
        temperature: 0.7,
        top_p: 0.9,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[AI_API_ERR]', response.status, errorText.substring(0, 200));
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid API response');
    }

    return {
      success: true,
      response: data.choices[0].message.content,
      usage: data.usage,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET - Return current mode and status
  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      mode: 'hybrid',
      status: 'operational',
      isOnline: true,
      availableModes: Object.values(MODES),
      engine: 'AI_HYBRID_v3',
      timestamp: new Date().toISOString(),
    });
  }

  // POST - Process query with real AI
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    const { message, query, domain = 'general', conversationHistory = [] } = req.body;

    const userQuery = message || query;

    if (!userQuery) {
      return res.status(400).json({
        success: false,
        error: 'Message or query is required',
      });
    }

    // Sanitize query (remove any AI model name mentions)
    const sanitizedQuery = obfuscation.sanitizeModelNames(userQuery);

    // Get AI response
    const startTime = Date.now();
    const aiResult = await callAI(sanitizedQuery, domain, conversationHistory);
    const responseTime = Date.now() - startTime;

    // Sanitize response (remove any AI model name mentions)
    const sanitizedResponse = obfuscation.sanitizeModelNames(aiResult.response);

    // Get obfuscated model code
    const modelCode = obfuscation.selectOptimalModel({
      domain,
      isOnline: true,
      preferSpeed: false,
      preferAccuracy: true,
    });

    const modelConfig = obfuscation.getModel(modelCode);

    return res.status(200).json({
      success: true,
      mode: 'hybrid',
      isOnline: true,
      model: {
        code: modelCode,
        tier: modelConfig?.tier || 1,
        category: 'ai_hybrid',
      },
      response: sanitizedResponse,
      responseType: 'ai_response',
      source: 'ai_engine',
      engine: 'AI_HYBRID_v3',
      usage: aiResult.usage
        ? {
            promptTokens: aiResult.usage.prompt_tokens,
            completionTokens: aiResult.usage.completion_tokens,
          }
        : null,
      responseTime: `${(responseTime / 1000).toFixed(2)}s`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[AI_HYBRID_ERR]', obfuscation.sanitizeModelNames(error.message));

    // Fallback response on error
    return res.status(200).json({
      success: true,
      mode: 'fallback',
      response: 'Üzgünüm, şu anda yanıt veremiyorum. Lütfen birkaç saniye sonra tekrar deneyin.',
      source: 'ai_fallback',
      engine: 'AI_HYBRID_v3',
      timestamp: new Date().toISOString(),
    });
  }
};
