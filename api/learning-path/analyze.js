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
    const { topic, currentLevel, targetLevel, learningStyle, timeCommitment, goalDescription } =
      req.body;

    if (!topic || !currentLevel || !targetLevel) {
      return res.status(400).json({ error: 'Topic, current level, and target level are required' });
    }

    const prompt = `
Sen bir öğrenme tasarımcısı ve eğitim danışmanısın. Aşağıdaki bilgilere göre kişiselleştirilmiş bir öğrenme yol haritası oluştur:

**Konu:** ${topic}
**Mevcut Seviye:** ${currentLevel}
**Hedef Seviye:** ${targetLevel}
**Öğrenme Stili:** ${learningStyle || 'Karma'}
**Haftalık Zaman:** ${timeCommitment || '5-10 saat'}
**Hedef:** ${goalDescription || 'Konuya hakim olmak'}

Lütfen JSON formatında şu yapıda yanıt ver:
{
  "pathOverview": {
    "estimatedDuration": "Tahmini süre (örn: 3-4 ay)",
    "difficultyLevel": "Kolay/Orta/Zor",
    "prerequisiteGap": "Eksik ön koşullar varsa listele",
    "learningOutcomes": ["Öğrenme çıktısı 1", "Öğrenme çıktısı 2", ...]
  },
  "phases": [
    {
      "phase": "Faz 1: Temel Kavramlar",
      "duration": "2-3 hafta",
      "objectives": ["Amaç 1", "Amaç 2", ...],
      "resources": [
        {
          "type": "Video/Kitap/Kurs/Proje",
          "title": "Kaynak adı",
          "provider": "Kaynak sağlayıcı",
          "estimatedTime": "Tahmini süre",
          "difficulty": "Başlangıç/Orta/İleri",
          "priority": "Yüksek/Orta/Düşük"
        }
      ],
      "practiceProjects": ["Proje 1", "Proje 2", ...],
      "assessmentCriteria": ["Değerlendirme kriteri 1", ...]
    }
  ],
  "studySchedule": {
    "weeklyPattern": "Haftalık çalışma düzeni önerisi",
    "dailyTips": ["Günlük ipucu 1", "Günlük ipucu 2", ...],
    "breakStrategy": "Mola stratejisi"
  },
  "resources": {
    "mustRead": ["Mutlaka okunması gereken kaynak 1", ...],
    "communities": ["Topluluk/Forum 1", ...],
    "tools": ["Kullanılacak araç 1", ...],
    "certifications": ["İlgili sertifika 1", ...]
  },
  "milestones": [
    {
      "milestone": "Kilometre taşı adı",
      "expectedWeek": "Hafta numarası",
      "checkpointTest": "Kendini test etme yöntemi"
    }
  ]
}
    `.trim();

    const response = await anthropic.messages.create({
      model: 'AX9F7E2B',
      max_tokens: 2500,
      system:
        'Sen deneyimli bir eğitim tasarımcısı ve öğrenme danışmanısın. İnsanların etkili ve sürdürülebilir şekilde öğrenmelerine yardımcı olursun.',
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
        pathOverview: {
          estimatedDuration: '3-4 ay',
          difficultyLevel: 'Orta',
          prerequisiteGap: 'Temel bilgi yeterli',
          learningOutcomes: [
            `${topic} konusunda pratik beceri kazanma`,
            'Gerçek projeler geliştirebilme',
            'İleri seviye kavramları anlama',
          ],
        },
        phases: [
          {
            phase: 'Faz 1: Temeller',
            duration: '2-3 hafta',
            objectives: ['Temel kavramları öğrenmek', 'İlk projeyi tamamlamak'],
            resources: [
              {
                type: 'Kurs',
                title: `${topic} Temelleri`,
                provider: 'Online Platform',
                estimatedTime: '10 saat',
                difficulty: 'Başlangıç',
                priority: 'Yüksek',
              },
            ],
            practiceProjects: ['Basit başlangıç projesi'],
            assessmentCriteria: ['Temel kavramları açıklayabilme'],
          },
          {
            phase: 'Faz 2: Derinleşme',
            duration: '3-4 hafta',
            objectives: ['İleri konuları öğrenmek', 'Orta seviye proje'],
            resources: [
              {
                type: 'Kitap',
                title: `${topic} İleri Seviye`,
                provider: 'Yayınevi',
                estimatedTime: '15 saat',
                difficulty: 'Orta',
                priority: 'Yüksek',
              },
            ],
            practiceProjects: ['Orta seviye uygulama projesi'],
            assessmentCriteria: ['Bağımsız proje geliştirebilme'],
          },
          {
            phase: 'Faz 3: Uzmanlık',
            duration: '4-6 hafta',
            objectives: ['Uzman seviye beceriler', 'Kapsamlı proje'],
            resources: [
              {
                type: 'Proje',
                title: 'Gerçek Dünya Projesi',
                provider: 'Kendi Portföyünüz',
                estimatedTime: '20 saat',
                difficulty: 'İleri',
                priority: 'Yüksek',
              },
            ],
            practiceProjects: ['Portföy projesi'],
            assessmentCriteria: ['Profesyonel seviye çıktı üretebilme'],
          },
        ],
        studySchedule: {
          weeklyPattern: 'Hafta içi her gün 1-2 saat, hafta sonu 3-4 saat derin çalışma',
          dailyTips: [
            'Sabah en zor konulara odaklanın',
            'Akşam tekrar ve pratik yapın',
            'Günlük notlar alın',
          ],
          breakStrategy: 'Her 45 dakikada 10 dakika mola (Pomodoro)',
        },
        resources: {
          mustRead: [`${topic} resmi dokümantasyonu`, 'Topluluk tarafından önerilen kaynaklar'],
          communities: ['Reddit ilgili subreddit', 'Discord toplulukları'],
          tools: ['İlgili geliştirme araçları', 'Pratik platformları'],
          certifications: [`${topic} profesyonel sertifika`],
        },
        milestones: [
          {
            milestone: 'Temel projeyi tamamlama',
            expectedWeek: '3',
            checkpointTest: 'Peer review',
          },
          {
            milestone: 'Orta seviye proje',
            expectedWeek: '7',
            checkpointTest: 'Teknik mülakat simulasyonu',
          },
          {
            milestone: 'Portföy projesi',
            expectedWeek: '12',
            checkpointTest: 'Gerçek kullanıcı geri bildirimi',
          },
        ],
      };
    }

    res.status(200).json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Learning path analysis error:', error);
    res.status(500).json({
      error: 'Analysis failed',
      message: 'Analiz hatası. Lütfen tekrar deneyin.',
    });
  }
};
