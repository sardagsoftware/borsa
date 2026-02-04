/* global fetch */
/**
 * AILYDIAN Recall Hybrid Mode API
 * Pure RAG-based responses - No external AI models
 *
 * @route POST /api/recall/hybrid
 * @version 2.0.0
 */

const { getInstance, obfuscation, MODES } = require('../../services/localrecall');

// Built-in knowledge base for common queries
const KNOWLEDGE_BASE = {
  mathematics: {
    greeting:
      'Merhaba! Ben LYRA Matematik Asistanı. Size matematik problemlerinde yardımcı olabilirim.',
    capabilities: [
      'Temel aritmetik işlemler',
      'Cebir problemleri',
      'Geometri hesaplamaları',
      'Trigonometri',
      'Diferansiyel ve integral',
      'İstatistik ve olasılık',
    ],
    examples: {
      algebra: 'Örnek: 2x + 5 = 15 → x = 5',
      geometry: 'Örnek: Daire alanı = πr²',
      trigonometry: 'Örnek: sin²θ + cos²θ = 1',
    },
  },
  general: {
    greeting: 'Merhaba! Ben LYRA AI Asistanı. Size nasıl yardımcı olabilirim?',
    capabilities: [
      'Genel bilgi sorguları',
      'Metin analizi',
      'Özet çıkarma',
      'Çeviri yardımı',
      'Yazım düzeltme',
    ],
  },
  medical: {
    greeting:
      'Merhaba! Ben LYRA Sağlık Bilgi Asistanı. Genel sağlık bilgileri konusunda yardımcı olabilirim.',
    disclaimer:
      '⚠️ Bu bilgiler sadece eğitim amaçlıdır. Tıbbi tavsiye için mutlaka bir sağlık profesyoneline danışın.',
  },
  legal: {
    greeting:
      'Merhaba! Ben LYRA Hukuk Bilgi Asistanı. Genel hukuki bilgiler konusunda yardımcı olabilirim.',
    disclaimer:
      '⚠️ Bu bilgiler sadece eğitim amaçlıdır. Hukuki tavsiye için mutlaka bir avukata danışın.',
  },
};

// Intelligent response generator
function generateIntelligentResponse(query, domain, ragContext) {
  const domainKB = KNOWLEDGE_BASE[domain] || KNOWLEDGE_BASE.general;
  const queryLower = query.toLowerCase();

  // Check for greetings
  if (/^(merhaba|selam|hey|hi|hello)/i.test(queryLower)) {
    return {
      response: domainKB.greeting,
      type: 'greeting',
    };
  }

  // Check for capability questions
  if (/ne yapabilir|neler yapabilir|özellik|yetenek|capability/i.test(queryLower)) {
    const capabilities = domainKB.capabilities || KNOWLEDGE_BASE.general.capabilities;
    return {
      response: `**LYRA ${domain.charAt(0).toUpperCase() + domain.slice(1)} Asistanı Yetenekleri:**\n\n${capabilities.map((c, i) => `${i + 1}. ${c}`).join('\n')}`,
      type: 'capabilities',
    };
  }

  // If RAG context available, use it
  if (ragContext && ragContext.trim().length > 50) {
    return {
      response: `📚 **Bilgi Tabanı Yanıtı**\n\n${ragContext}\n\n---\n_Bu yanıt LYRA bilgi tabanından oluşturulmuştur._`,
      type: 'rag_response',
      ragUsed: true,
    };
  }

  // Domain-specific fallback responses
  if (domain === 'mathematics') {
    // Try to detect math expressions
    if (/[\d+\-*/^=()x²³√∫∑]/.test(query)) {
      return {
        response: `📐 **Matematik Sorgusu Algılandı**\n\nSorunuz: ${query}\n\nBu matematik problemini çözmek için daha fazla bağlam bilgisine ihtiyacım var. Lütfen problemi adım adım açıklar mısınız?\n\n**İpucu:** Formüller, bilinmeyen değerler ve beklenen sonuç hakkında detay verirseniz daha iyi yardımcı olabilirim.`,
        type: 'math_query',
      };
    }
  }

  // Generic intelligent response
  return {
    response: `🤖 **LYRA Yanıtı**\n\nSorunuz: "${query}"\n\nBu konuda size yardımcı olmak istiyorum. Ancak şu anda bilgi tabanımda bu spesifik sorguya doğrudan karşılık gelen bir içerik bulamadım.\n\n**Öneriler:**\n1. Sorunuzu daha spesifik hale getirmeyi deneyin\n2. Farklı anahtar kelimeler kullanın\n3. Konuyu daha küçük parçalara ayırın\n\n_LYRA sürekli öğrenmektedir. Geri bildirimleriniz sistemin gelişmesine yardımcı olur._`,
    type: 'fallback',
  };
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
        engine: 'LYRA_RAG_PURE',
        timestamp: new Date().toISOString(),
      });
    } catch (_error) {
      return res.status(200).json({
        success: true,
        mode: 'standalone',
        status: 'operational',
        isOnline: true,
        engine: 'LYRA_RAG_PURE',
        timestamp: new Date().toISOString(),
      });
    }
  }

  // POST - Process query with pure RAG intelligence
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
      language = 'tr-TR',
    } = req.body;

    const userQuery = message || query;

    if (!userQuery) {
      return res.status(400).json({
        success: false,
        error: 'Message or query is required',
      });
    }

    // Sanitize query
    const sanitizedQuery = obfuscation.sanitizeModelNames(userQuery);

    // Try to get RAG context
    let ragResult = { results: [], context: null };
    let ragContext = null;

    try {
      const recall = getInstance();
      ragResult = await recall.smartSearch(sanitizedQuery, {
        domain,
        topK: 5,
        preferOffline: true, // Always prefer offline for pure RAG
      });
      ragContext = ragResult.context;
    } catch (_ragErr) {
      // RAG service unavailable, continue with built-in knowledge
    }

    // Generate intelligent response
    const intelligentResponse = generateIntelligentResponse(sanitizedQuery, domain, ragContext);

    // Select model code for display (obfuscated)
    const modelCode = obfuscation.selectOptimalModel({
      domain,
      isOnline: true,
      preferSpeed: true,
      preferAccuracy: false,
    });

    const modelConfig = obfuscation.getModel(modelCode);

    // Sanitize response
    const finalResponse = obfuscation.sanitizeModelNames(intelligentResponse.response);

    return res.status(200).json({
      success: true,
      mode: 'rag_pure',
      isOnline: true,
      model: {
        code: modelCode,
        tier: modelConfig?.tier || 1,
        category: 'lyra_rag',
      },
      ragContext: {
        found: ragResult.results?.length || 0,
        collection: ragResult.collection || domain,
        used: intelligentResponse.ragUsed || false,
      },
      response: finalResponse,
      responseType: intelligentResponse.type,
      source: 'lyra_rag_engine',
      engine: 'LYRA_RAG_PURE_v2',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[LYRA_RAG_ERR]', obfuscation.sanitizeModelNames(error.message));

    // Even on error, provide a helpful response
    return res.status(200).json({
      success: true,
      mode: 'fallback',
      response:
        '🔄 LYRA sistemi şu anda yoğun talep altında. Lütfen birkaç saniye sonra tekrar deneyin.\n\n_Sistem otomatik olarak yeniden bağlanmaya çalışacaktır._',
      source: 'lyra_fallback',
      engine: 'LYRA_RAG_PURE_v2',
      timestamp: new Date().toISOString(),
    });
  }
};
