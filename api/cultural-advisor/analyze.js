const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
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
      originCountry,
      destinationCountry,
      purpose,
      duration,
      concerns,
      industry
    } = req.body;

    if (!originCountry || !destinationCountry) {
      return res.status(400).json({ error: 'Origin and destination countries are required' });
    }

    const prompt = `
Sen bir kültürlerarası iletişim uzmanısın. Aşağıdaki bilgilere göre detaylı bir kültürel uyum rehberi hazırla:

**Köken Ülke:** ${originCountry}
**Hedef Ülke:** ${destinationCountry}
**Amaç:** ${purpose || 'İş/Eğitim'}
**Süre:** ${duration || 'Uzun dönem'}
**Endişeler:** ${concerns || 'Genel uyum'}
**Sektör:** ${industry || 'Genel'}

Lütfen JSON formatında şu yapıda yanıt ver:
{
  "culturalOverview": {
    "keyDifferences": ["Ana kültürel fark 1", "Ana kültürel fark 2", ...],
    "commonMisconceptions": ["Yanlış kanı 1", "Yanlış kanı 2", ...],
    "adaptationDifficulty": "Kolay/Orta/Zor",
    "estimatedAdjustmentPeriod": "Tahmini uyum süresi"
  },
  "businessEtiquette": {
    "communicationStyle": "İletişim tarzı açıklaması",
    "meetingProtocol": ["Toplantı protokolü 1", "Toplantı protokolü 2", ...],
    "negotiationTips": ["Müzakere ipucu 1", "Müzakere ipucu 2", ...],
    "hierarchyDynamics": "Hiyerarşi yapısı açıklaması",
    "dresscode": "Kıyafet kodu önerisi"
  },
  "socialNorms": {
    "greetings": "Selamlaşma şekli",
    "personalSpace": "Kişisel alan mesafesi",
    "giftGiving": "Hediye verme kuralları",
    "diningEtiquette": ["Yemek görgü kuralı 1", "Yemek görgü kuralı 2", ...],
    "taboos": ["Yapılmaması gereken 1", "Yapılmaması gereken 2", ...]
  },
  "practicalTips": {
    "languageTips": ["Dil ipucu 1", "Dil ipucu 2", ...],
    "networkingStrategies": ["Networking stratejisi 1", ...],
    "culturalActivities": ["Katılınabilecek etkinlik 1", ...],
    "stressCopingMethods": ["Stres yönetimi 1", ...]
  },
  "weeklyRoadmap": [
    {
      "week": "Hafta 1-2",
      "focus": "Odak alanı",
      "activities": ["Aktivite 1", "Aktivite 2", ...],
      "goals": ["Hedef 1", "Hedef 2", ...]
    }
  ],
  "resources": {
    "languageApps": ["Dil öğrenme uygulaması 1", ...],
    "localCommunities": ["Yerel topluluk 1", ...],
    "culturalTraining": ["Eğitim kaynağı 1", ...],
    "emergencyContacts": ["İletişim bilgisi 1", ...]
  }
}
    `.trim();

    const response = await anthropic.messages.create({
      model: 'AX9F7E2B',
      max_tokens: 2500,
      system: 'Sen kültürlerarası iletişim uzmanısın. İnsanların farklı kültürlere uyum sağlamalarına ve kültürel engelleri aşmalarına yardımcı olursun.',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    let result;
    try {
      result = JSON.parse(response.content[0].text.trim());
    } catch (parseErr) {
      // Fallback if JSON parsing fails
      result = {
        culturalOverview: {
          keyDifferences: [
            "İş kültürü ve çalışma saatleri farklılığı",
            "İletişim tarzı farklılıkları",
            "Sosyal normlar ve beklentiler"
          ],
          commonMisconceptions: [
            "Klişe algılar gerçeği yansıtmayabilir",
            "Bireysel farklılıklar her zaman vardır"
          ],
          adaptationDifficulty: "Orta",
          estimatedAdjustmentPeriod: "3-6 ay"
        },
        businessEtiquette: {
          communicationStyle: "İletişim tarzı kültüre göre değişir",
          meetingProtocol: [
            "Zamanında olun",
            "Resmi kıyafet giyin",
            "Hiyerarşiye saygı gösterin"
          ],
          negotiationTips: [
            "Sabırlı olun",
            "Uzun vadeli ilişki kurmaya odaklanın",
            "Kültürel duyarlılık gösterin"
          ],
          hierarchyDynamics: "Hiyerarşi yapısını anlayın ve ona göre davranın",
          dresscode: "İş ortamına uygun, profesyonel kıyafet"
        },
        socialNorms: {
          greetings: "Yerel selamlaşma şeklini öğrenin",
          personalSpace: "Kültürel normlara göre ayarlayın",
          giftGiving: "Küçük, düşünceli hediyeler uygundur",
          diningEtiquette: [
            "Sofra adabına dikkat edin",
            "Yerel yemek alışkanlıklarını gözlemleyin"
          ],
          taboos: [
            "Hassas konulardan kaçının",
            "Kültürel sembollere saygı gösterin"
          ]
        },
        practicalTips: {
          languageTips: [
            "Temel ifadeleri öğrenin",
            "Günlük pratik yapın",
            "Yerel medya tüketin"
          ],
          networkingStrategies: [
            "Yerel etkinliklere katılın",
            "Profesyonel topluluklar bulun",
            "Mentor arayın"
          ],
          culturalActivities: [
            "Kültürel festivallere katılın",
            "Yerel müzeleri ziyaret edin",
            "Topluluk etkinliklerine dahil olun"
          ],
          stressCopingMethods: [
            "Destek grubu bulun",
            "Kendi kültürünüzle bağlantıyı koruyun",
            "Profesyonel yardım almaktan çekinmeyin"
          ]
        },
        weeklyRoadmap: [
          {
            week: "Hafta 1-2",
            focus: "Temel yerleşim ve keşif",
            activities: [
              "Çevreyi keşfedin",
              "Temel hizmetleri bulun",
              "İlk sosyal bağlantıları kurun"
            ],
            goals: [
              "Güvenli hissetmek",
              "Temel ihtiyaçları karşılamak"
            ]
          },
          {
            week: "Hafta 3-4",
            focus: "Kültürel öğrenme",
            activities: [
              "Dil dersleri başlatın",
              "Kültürel etkinliklere katılın",
              "Yerel insanlarla tanışın"
            ],
            goals: [
              "Temel iletişim kurabilmek",
              "Kültürel normları anlamak"
            ]
          },
          {
            week: "Hafta 5-8",
            focus: "Entegrasyon",
            activities: [
              "Düzenli sosyal rutinler oluşturun",
              "İş/okul network'ünü genişletin",
              "Hobi toplulukları bulun"
            ],
            goals: [
              "Rahat hissetmek",
              "Anlamlı ilişkiler kurmak"
            ]
          }
        ],
        resources: {
          languageApps: ["Duolingo", "Babbel", "HelloTalk"],
          localCommunities: ["Expat grupları", "Meetup grupları", "Profesyonel dernekler"],
          culturalTraining: ["Online kültürel farkındalık kursları", "Yerel kültür merkezleri"],
          emergencyContacts: ["Büyükelçilik/Konsolosluk", "Yerel acil servisler"]
        }
      };
    }

    res.status(200).json({
      success: true,
      ...result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Cultural advisor analysis error:', error);
    res.status(500).json({
      error: 'Analysis failed',
      message: error.message
    });
  }
};
