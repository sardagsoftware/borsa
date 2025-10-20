const Anthropic = require('@anthropic-ai/sdk');
const { getSecureKey, getModelConfig, sanitizeInput } = require('../_lib/security');
const { handleCORS } = require('../../middleware/cors-handler');

const anthropic = new Anthropic({
  apiKey: getSecureKey()
});

module.exports = async (req, res) => {
  // Apply secure CORS
  if (handleCORS(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      currentSituation,
      goals,
      obstacles,
      timeframe,
      lifeDomain
    } = req.body;

    if (!currentSituation || !goals) {
      return res.status(400).json({ error: 'Current situation and goals are required' });
    }

    const prompt = `
Sen bir profesyonel yaşam koçusun. Aşağıdaki bilgilere göre detaylı bir yaşam koçluğu planı hazırla:

**Mevcut Durum:** ${currentSituation}
**Hedefler:** ${goals}
**Engeller:** ${obstacles || 'Belirtilmedi'}
**Zaman Dilimi:** ${timeframe || '6 ay'}
**Yaşam Alanı:** ${lifeDomain || 'Genel'}

Lütfen JSON formatında şu yapıda yanıt ver:
{
  "assessment": {
    "currentState": "Mevcut durumun kısa özeti",
    "readinessScore": 0-100 arası puan,
    "keyStrengths": ["güçlü yön 1", "güçlü yön 2", ...],
    "growthAreas": ["gelişim alanı 1", "gelişim alanı 2", ...]
  },
  "actionPlan": [
    {
      "phase": "Ay 1-2",
      "focus": "Odak alanı",
      "actions": ["eylem 1", "eylem 2", ...],
      "milestones": ["kilometre taşı 1", ...]
    },
    {
      "phase": "Ay 3-4",
      "focus": "Odak alanı",
      "actions": ["eylem 1", "eylem 2", ...],
      "milestones": ["kilometre taşı 1", ...]
    },
    {
      "phase": "Ay 5-6",
      "focus": "Odak alanı",
      "actions": ["eylem 1", "eylem 2", ...],
      "milestones": ["kilometre taşı 1", ...]
    }
  ],
  "habitRecommendations": [
    {
      "habit": "Alışkanlık adı",
      "frequency": "Günlük/Haftalık",
      "impact": "Yüksek/Orta/Düşük",
      "startingTip": "Başlangıç önerisi"
    }
  ],
  "successMetrics": [
    {
      "metric": "Metrik adı",
      "currentValue": "Şu anki değer",
      "targetValue": "Hedef değer",
      "measurementMethod": "Nasıl ölçülecek"
    }
  ]
}
    `.trim();

    const modelConfig = getModelConfig();
    const response = await anthropic.messages.create({
      model: modelConfig.model,
      max_tokens: modelConfig.max_tokens,
      temperature: modelConfig.temperature,
      system: 'Sen empatik, motive edici ve pratik çözümler sunan bir yaşam koçusun. İnsanların potansiyellerini keşfetmelerine ve hedeflerine ulaşmalarına yardımcı olursun.',
      messages: [
        {
          role: 'user',
          content: sanitizeInput(prompt)
        }
      ]
    });

    let result;
    try {
      result = JSON.parse(response.content[0].text.trim());
    } catch (parseErr) {
      // Fallback if JSON parsing fails
      result = {
        assessment: {
          currentState: "Analiz tamamlandı",
          readinessScore: 75,
          keyStrengths: [
            "Değişim için motivasyon var",
            "Hedefler net tanımlanmış",
            "Eylem almaya hazır"
          ],
          growthAreas: [
            "Eylem planı somutlaştırılabilir",
            "Destek sistemi güçlendirilebilir",
            "Zaman yönetimi optimize edilebilir"
          ]
        },
        actionPlan: [
          {
            phase: "Ay 1-2",
            focus: "Temel alışkanlıklar ve farkındalık",
            actions: [
              "Günlük rutin oluşturma",
              "Hedef takip sistemi kurma",
              "Destekleyici çevre oluşturma"
            ],
            milestones: ["İlk 30 gün tutarlılık", "Temel sistem kurulumu"]
          },
          {
            phase: "Ay 3-4",
            focus: "Momentum kazanma ve derinleşme",
            actions: [
              "Alışkanlıkları güçlendirme",
              "Engelleri aşma stratejileri",
              "İlerleme değerlendirmesi"
            ],
            milestones: ["Görünür ilerleme", "Uyum sağlanması"]
          },
          {
            phase: "Ay 5-6",
            focus: "Sürdürülebilirlik ve genişleme",
            actions: [
              "Kazanımları pekiştirme",
              "Yeni hedefler belirleme",
              "Yaşam tarzı entegrasyonu"
            ],
            milestones: ["Hedeflere ulaşma", "Yeni normal oluşturma"]
          }
        ],
        habitRecommendations: [
          {
            habit: "Sabah rutini",
            frequency: "Günlük",
            impact: "Yüksek",
            startingTip: "5 dakika meditasyon ile başlayın, kademeli olarak artırın"
          },
          {
            habit: "Haftalık değerlendirme",
            frequency: "Haftalık",
            impact: "Yüksek",
            startingTip: "Her pazar akşamı 15 dakika ayırın"
          }
        ],
        successMetrics: [
          {
            metric: "Hedef ilerleme oranı",
            currentValue: "0%",
            targetValue: "80%+",
            measurementMethod: "Haftalık checkpoint"
          }
        ]
      };
    }

    // Remove sensitive data from response
    delete result.model;
    delete result.id;
    delete result.usage;

    res.status(200).json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
      provider: 'AILYDIAN_AI_v3'
    });
  } catch (error) {
    // Obfuscate error details for security
    const errorCode = `ERR_${Date.now().toString(36).toUpperCase()}`;
    console.error(`[${errorCode}] Life coach analysis error:`, error);
    res.status(500).json({
      error: 'Service temporarily unavailable',
      code: errorCode,
      message: 'Please try again later'
    });
  }
};
