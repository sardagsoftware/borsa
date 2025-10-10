/**
 * 🧠 Intent Parsing Engine - Natural Language to Actions
 * Slash-free intent detection with fuzzy matching and synonym support
 */

(function(window) {
  'use strict';

  if (!window.IntentNormalize) {
    console.error('❌ IntentNormalize module not loaded!');
    return;
  }

  const { safeText, toTRLower, normalize, extractVendor, extractTrackingNo, extractAmount, extractTerm, extractPercent } = window.IntentNormalize;

  const INTENTS = [
    {
      id: 'shipment.track',
      patterns: [
        /(?:aras|hepsijet|yurtiçi|yurtici|mng|sürat|surat|ups|dhl)\s+kargo\s+(\d{10,})/i,
        /(\d{10,})\s+(?:numaralı|numarali|nolu)?\s*(?:kargo|gönderi)/i,
        /kargo\s+(?:takip|sorgula|nerede)\s+(\d{10,})/i
      ],
      extract: (match) => ({ vendor: extractVendor(match), trackingNo: extractTrackingNo(match) }),
      score: 0.95
    },
    {
      id: 'price.sync',
      patterns: [
        /(trendyol|hepsiburada|migros|a101|bim|şok|sok)\s+fiyat/i,
        /fiyat.*?(trendyol|hepsiburada)/i,
        /%([\d.]+)\s+(?:indirim|düş|dus)/i
      ],
      extract: (match) => ({ vendor: extractVendor(match), percent: extractPercent(match) }),
      score: 0.90
    },
    {
      id: 'inventory.sync',
      patterns: [
        /(trendyol|hepsiburada|migros|a101|bim)\s+stok/i,
        /stok.*?(senkronize|güncel|sync)/i
      ],
      extract: (match) => ({ vendor: extractVendor(match) }),
      score: 0.88
    },
    {
      id: 'connector.show',
      patterns: [
        /(trendyol|hepsiburada|migros|wolt|ups)\s+(?:göster|goster|bilgi)/i,
        /(?:göster|goster)\s+(trendyol|hepsiburada|migros|wolt|ups)/i
      ],
      extract: (match) => ({ vendor: extractVendor(match) }),
      score: 0.80
    },
    {
      id: 'loan.compare',
      patterns: [
        /([\d.]+)\s*(?:bin|k|tl)?\s*([\d]+)\s*(?:ay|aylık)/i,
        /kredi\s+(?:karşılaştır|kıyasla)/i
      ],
      extract: (match) => ({ amount: extractAmount(match), term: extractTerm(match) }),
      score: 0.92
    }
  ];

  function parseUtterance(utterance, minScore = 0.55) {
    const cleaned = safeText(utterance);
    if (!cleaned) return [];

    const results = [];

    for (const intent of INTENTS) {
      let maxScore = 0;
      let bestMatch = null;

      for (const pattern of intent.patterns) {
        const match = pattern.exec(cleaned);
        if (match) {
          maxScore = intent.score;
          bestMatch = match;
          break;
        }
      }

      if (maxScore >= minScore) {
        const params = bestMatch ? intent.extract(bestMatch) : {};
        results.push({
          intent: intent.id,
          confidence: maxScore,
          params,
          raw: cleaned
        });
      }
    }

    return results.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
  }

  function detectLocale(text) {
    const safe = safeText(text);
    if (/[ğüşiöçİĞÜŞÖÇ]/.test(safe)) return 'tr';
    if (/[\u0600-\u06FF]/.test(safe)) return 'ar';
    return 'en';
  }

  window.IntentEngine = {
    parseUtterance,
    detectLocale,
    INTENTS
  };

  console.log(`✅ Intent Engine loaded (${INTENTS.length} intents)`);

})(window);
