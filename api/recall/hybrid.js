/* global fetch */
/**
 * AILYDIAN Recall Hybrid Mode API
 * Intelligent Online/Offline switching with RAG
 *
 * @route POST /api/recall/hybrid
 * @version 1.0.0
 */

const { getInstance, obfuscation, MODES } = require('../../services/localrecall');

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
    try {
      const recall = getInstance();
      const health = await recall.healthCheck();
      const isOnline = await recall.isOnline();

      return res.status(200).json({
        success: true,
        mode: recall.getMode(),
        status: health.status,
        isOnline,
        availableModes: Object.values(MODES),
        timestamp: new Date().toISOString(),
      });
    } catch (_error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to get mode status',
      });
    }
  }

  // POST - Process query with hybrid intelligence
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    const {
      message,
      query,
      domain = 'general',
      preferOffline = false,
      conversationHistory = [],
      maxTokens = 4000,
      temperature = 0.7,
      language = 'tr-TR',
    } = req.body;

    const userQuery = message || query;

    if (!userQuery) {
      return res.status(400).json({
        success: false,
        error: 'Message or query is required',
      });
    }

    const recall = getInstance();

    // Check network status
    const isOnline = await recall.isOnline();

    // Determine optimal mode
    let activeMode = 'hybrid';
    if (preferOffline || !isOnline) {
      activeMode = 'offline';
    } else if (isOnline && domain !== 'general') {
      activeMode = 'online';
    }

    // Get RAG context
    const ragResult = await recall.smartSearch(userQuery, {
      domain,
      topK: 5,
      preferOffline,
    });

    // Select optimal model
    const modelCode = obfuscation.selectOptimalModel({
      domain,
      isOnline,
      preferSpeed: activeMode === 'offline',
      preferAccuracy: activeMode === 'online',
    });

    const modelConfig = obfuscation.getModel(modelCode);

    // Build enhanced prompt with RAG context
    let enhancedPrompt = userQuery;

    if (ragResult.context && ragResult.results?.length > 0) {
      enhancedPrompt = `
Aşağıdaki bilgi tabanı bağlamını kullanarak soruyu yanıtla:

--- BAĞLAM ---
${ragResult.context}
--- BAĞLAM SONU ---

Kullanıcı Sorusu: ${userQuery}

Lütfen bağlamdaki bilgileri kullanarak kapsamlı ve doğru bir yanıt ver. Eğer bağlamda yeterli bilgi yoksa, genel bilgini kullan ama bunu belirt.
`;
    }

    // Call appropriate AI endpoint based on mode
    let aiResponse;

    if (activeMode === 'offline' || !isOnline) {
      // Use local knowledge only - generate response from RAG results
      aiResponse = {
        success: true,
        response: ragResult.context
          ? `📚 **Bilgi Tabanından Yanıt**\n\n${ragResult.context}\n\n_Not: Bu yanıt yerel bilgi tabanından oluşturulmuştur._`
          : 'Üzgünüm, bu konu hakkında yerel bilgi tabanımda yeterli bilgi bulunamadı. Lütfen çevrimiçi moda geçin veya farklı bir soru sorun.',
        source: 'local_knowledge',
        isOfflineResponse: true,
      };
    } else {
      // Online mode - forward to cloud AI
      try {
        const cloudResponse = await fetch(`${getBaseUrl(req)}/api/chat/specialized`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: enhancedPrompt,
            aiType: domain === 'general' ? 'chat' : domain,
            conversationHistory,
            maxTokens,
            temperature,
            language,
          }),
        });

        aiResponse = await cloudResponse.json();
        aiResponse.source = 'cloud_ai';
        aiResponse.ragEnhanced = ragResult.results?.length > 0;
      } catch (_cloudErr) {
        // Fallback to local if cloud fails
        aiResponse = {
          success: true,
          response: ragResult.context
            ? `📚 **Yerel Bilgi Tabanı Yanıtı** (Bulut AI geçici olarak kullanılamıyor)\n\n${ragResult.context}`
            : 'Bulut AI servisi şu anda kullanılamıyor ve yerel bilgi tabanında yeterli bilgi bulunamadı.',
          source: 'local_fallback',
          isOfflineResponse: true,
        };
      }
    }

    // Sanitize any AI model names from response
    if (aiResponse.response) {
      aiResponse.response = obfuscation.sanitizeModelNames(aiResponse.response);
    }

    return res.status(200).json({
      success: true,
      mode: activeMode,
      isOnline,
      model: {
        code: modelCode,
        tier: modelConfig?.tier || 1,
        category: modelConfig?.category || 'hybrid',
      },
      ragContext: {
        found: ragResult.results?.length || 0,
        collection: ragResult.collection,
      },
      response: aiResponse.response || aiResponse.message || aiResponse.data?.response,
      source: aiResponse.source || 'hybrid',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[LYRA_HYBRID_ERR]', obfuscation.sanitizeModelNames(error.message));

    return res.status(500).json({
      success: false,
      error: 'Hybrid processing failed',
      fallback: true,
    });
  }
};

/**
 * Get base URL from request
 */
function getBaseUrl(req) {
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${protocol}://${host}`;
}
