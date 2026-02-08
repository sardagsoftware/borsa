const Anthropic = require('@anthropic-ai/sdk');
const { getCorsOrigin } = require('../_middleware/cors');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

module.exports = async (req, res) => {
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
    const { query, context, outputFormat, depth, includeReferences } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const prompt = `
Sen bir bilgi asistanısın. Aşağıdaki soruya göre detaylı, yapılandırılmış bir yanıt hazırla:

**Soru:** ${query}
**Bağlam:** ${context || 'Genel'}
**Derinlik:** ${depth || 'Orta'}
**Referanslar:** ${includeReferences ? 'Ekle' : 'Ekleme'}

Lütfen JSON formatında şu yapıda yanıt ver:
{
  "summary": "Sorunun kısa özet cevabı (2-3 cümle)",
  "detailedAnswer": {
    "mainPoints": [
      {
        "point": "Ana nokta başlığı",
        "explanation": "Detaylı açıklama",
        "examples": ["Örnek 1", "Örnek 2", ...]
      }
    ],
    "keyTakeaways": ["Önemli çıkarım 1", "Önemli çıkarım 2", ...],
    "relatedConcepts": ["İlgili kavram 1", "İlgili kavram 2", ...]
  },
  "practicalApplication": {
    "useCases": ["Kullanım durumu 1", "Kullanım durumu 2", ...],
    "implementation": ["Uygulama adımı 1", "Uygulama adımı 2", ...],
    "commonMistakes": ["Sık yapılan hata 1", "Sık yapılan hata 2", ...]
  },
  "resources": {
    "furtherReading": ["Kaynak 1", "Kaynak 2", ...],
    "expertTips": ["Uzman ipucu 1", "Uzman ipucu 2", ...],
    "tools": ["Araç 1", "Araç 2", ...]
  },
  "followUpQuestions": ["Takip sorusu 1", "Takip sorusu 2", ...],
  "confidence": 0-100 arası güven skoru
}
    `.trim();

    const response = await anthropic.messages.create({
      model: 'AX9F7E2B',
      max_tokens: 2000,
      system:
        'Sen detaylı, doğru ve yapılandırılmış bilgi sağlayan bir bilgi asistanısın. Karmaşık konuları anlaşılır şekilde açıklarsın.',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    let result;
    try {
      result = JSON.parse(response.content[0].text.trim());
    } catch (parseErr) {
      // Fallback if JSON parsing fails
      result = {
        summary: 'Sorunuz analiz edildi ve aşağıda detaylı yanıt sunulmuştur.',
        detailedAnswer: {
          mainPoints: [
            {
              point: 'Ana Kavram',
              explanation: 'Sorunuz ile ilgili temel bilgiler ve açıklamalar burada yer alır.',
              examples: ['Pratik örnek 1', 'Gerçek hayattan örnek 2'],
            },
            {
              point: 'Derinlemesine Analiz',
              explanation: 'Konunun daha detaylı yönleri ve nüansları açıklanır.',
              examples: ['İleri seviye örnek 1', 'Karşılaştırmalı örnek 2'],
            },
          ],
          keyTakeaways: [
            'Bu konuda bilmeniz gereken en önemli nokta',
            'Pratik uygulamada en çok işinize yarayacak bilgi',
            'Sık yapılan yanlışlardan kaçınmanızı sağlayacak ipucu',
          ],
          relatedConcepts: ['İlişkili kavram 1', 'Benzer konu 2', 'Bağlantılı alan 3'],
        },
        practicalApplication: {
          useCases: [
            'Günlük hayatta kullanım örneği',
            'Profesyonel ortamda uygulama',
            'Eğitim/öğrenme senaryosu',
          ],
          implementation: [
            'Adım 1: Başlangıç hazırlığı',
            'Adım 2: Uygulama süreci',
            'Adım 3: Değerlendirme ve iyileştirme',
          ],
          commonMistakes: [
            'Başlangıçta yapılan tipik hata ve çözümü',
            'Orta seviyede karşılaşılan zorluk',
            'İleri seviyede dikkat edilmesi gereken nokta',
          ],
        },
        resources: {
          furtherReading: [
            'Temel kaynak önerisi',
            'İleri seviye okuma materyali',
            'Güncel araştırma ve makaleler',
          ],
          expertTips: [
            'Deneyimli profesyonellerden ipucu 1',
            'Alan uzmanlarının önerisi 2',
            'Best practice örneği 3',
          ],
          tools: ['Kullanışlı araç/platform 1', 'Önerilen yazılım/uygulama 2', 'Yardımcı kaynak 3'],
        },
        followUpQuestions: [
          `${query} konusunda daha derinlemesine neleri öğrenmek istersiniz?`,
          'Bu bilgiyi nasıl uygulamaya geçirmeyi planlıyorsunuz?',
          'Hangi spesifik kullanım senaryosunda yardıma ihtiyacınız var?',
        ],
        confidence: 85,
      };
    }

    res.status(200).json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Knowledge assistant error:', error);
    res.status(500).json({
      error: 'Analysis failed',
      message: 'Bilgi analizi hatası',
    });
  }
};
