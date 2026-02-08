const Anthropic = require('@anthropic-ai/sdk');
const { getSecureKey, getModelConfig, sanitizeInput } = require('../_lib/security');
const { getCorsOrigin } = require('../_middleware/cors');

const anthropic = new Anthropic({
  apiKey: getSecureKey()
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
    const {
      symptoms,
      duration,
      severity,
      medicalHistory,
      medications,
      age,
      gender
    } = req.body;

    if (!symptoms) {
      return res.status(400).json({ error: 'Symptoms are required' });
    }

    const prompt = `
Sen deneyimli bir tıbbi danışman AI'sın. Aşağıdaki bilgilere göre detaylı bir tıbbi değerlendirme yap:

**Semptomlar:** ${sanitizeInput(symptoms)}
**Süre:** ${duration || 'Belirtilmedi'}
**Şiddet:** ${severity || 'Orta'}
**Tıbbi Geçmiş:** ${medicalHistory || 'Yok'}
**Kullanılan İlaçlar:** ${medications || 'Yok'}
**Yaş:** ${age || 'Belirtilmedi'}
**Cinsiyet:** ${gender || 'Belirtilmedi'}

ÖNEMLİ UYARI: Bu bir tıbbi tavsiye DEĞİLDİR. Sadece bilgilendirme amaçlıdır. Kesin tanı için mutlaka bir sağlık profesyoneline başvurun.

Lütfen JSON formatında şu yapıda yanıt ver:
{
  "assessment": {
    "overview": "Genel durum özeti",
    "urgencyLevel": "Düşük/Orta/Yüksek/Acil",
    "possibleConditions": [
      {
        "condition": "Olası durum adı",
        "probability": "Yüksek/Orta/Düşük",
        "description": "Kısa açıklama"
      }
    ]
  },
  "recommendations": {
    "immediate": ["Hemen yapılması gereken 1", "Hemen yapılması gereken 2"],
    "shortTerm": ["Kısa vadede yapılması gereken 1", "Kısa vadede yapılması gereken 2"],
    "lifestyle": ["Yaşam tarzı önerisi 1", "Yaşam tarzı önerisi 2"]
  },
  "warningSignsn": [
    "Dikkat edilmesi gereken belirti 1",
    "Dikkat edilmesi gereken belirti 2"
  ],
  "whenToSeek": {
    "immediate": "Acil servise ne zaman gidilmeli",
    "appointment": "Normal randevu ne zaman alınmalı",
    "monitor": "Evde takip kriterleri"
  },
  "disclaimer": "Bu bilgiler yalnızca eğitim amaçlıdır. Kesin tanı ve tedavi için mutlaka bir sağlık profesyoneline başvurun."
}
    `.trim();

    const modelConfig = getModelConfig();
    const response = await anthropic.messages.create({
      model: modelConfig.model,
      max_tokens: 3000,
      temperature: 0.5, // Lower temperature for medical accuracy
      system: `Sen deneyimli, empatik ve sorumlu bir tıbbi danışman AI'sın.

ÖNEMLİ İLKELER:
1. Kesinlikle tanı koyma, sadece olası durumlar hakkında bilgi ver
2. Her zaman profesyonel sağlık hizmeti alınması gerektiğini vurgula
3. Acil durumlarda hemen hastaneye gidilmesi gerektiğini belirt
4. İlaç önerme, sadece genel yaşam tarzı tavsiyeleri ver
5. Bilimsel ve güncel bilgilere dayalı bilgi ver
6. Empatik ve destekleyici bir dil kullan

Verdiğin tüm bilgiler sadece bilgilendirme amaçlıdır, tıbbi tavsiye yerine geçmez.`,
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
        assessment: {
          overview: "Lütfen belirttiğiniz semptomlar için bir sağlık profesyoneline başvurun.",
          urgencyLevel: "Orta",
          possibleConditions: [
            {
              condition: "Değerlendirme gerekli",
              probability: "Belirsiz",
              description: "Detaylı bir tıbbi muayene gereklidir."
            }
          ]
        },
        recommendations: {
          immediate: [
            "Bir sağlık profesyoneline danışın",
            "Semptomlarınızı not edin ve takip edin"
          ],
          shortTerm: [
            "Düzenli kontroller yaptırın",
            "Sağlıklı beslenmeye dikkat edin"
          ],
          lifestyle: [
            "Yeterli uyku alın",
            "Stres yönetimi yapın",
            "Düzenli egzersiz yapın"
          ]
        },
        warningSigns: [
          "Semptomlar şiddetlenirse",
          "Yeni semptomlar ortaya çıkarsa",
          "48 saat içinde iyileşme olmazsa"
        ],
        whenToSeek: {
          immediate: "Nefes darlığı, göğüs ağrısı, bilinç kaybı gibi acil belirtiler varsa hemen 112'yi arayın",
          appointment: "Semptomlar devam ediyorsa 24-48 saat içinde doktora başvurun",
          monitor: "Semptomları günlük olarak kaydedin ve değişimleri takip edin"
        },
        disclaimer: "Bu bilgiler yalnızca eğitim amaçlıdır. Kesin tanı ve tedavi için mutlaka bir sağlık profesyoneline başvurun. Acil durumlarda 112'yi arayın."
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
      provider: 'AILYDIAN_MEDICAL_AI_v3'
    });
  } catch (error) {
    // Obfuscate error details for security
    const errorCode = `MED_ERR_${Date.now().toString(36).toUpperCase()}`;
    console.error(`[${errorCode}] Medical analysis error:`, error);
    res.status(500).json({
      error: 'Medical service temporarily unavailable',
      code: errorCode,
      message: 'Please try again later or contact emergency services if urgent'
    });
  }
};
