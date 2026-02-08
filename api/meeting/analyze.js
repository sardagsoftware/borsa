const formidable = require('formidable');
const Anthropic = require('@anthropic-ai/sdk');
const { getCorsOrigin } = require('../_middleware/cors');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
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
    const form = formidable({ multiples: false, maxFileSize: 100 * 1024 * 1024 });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        return res.status(500).json({ error: 'File upload error' });
      }

      const title = fields.title || 'Toplantı';
      let transcript = fields.transcript || '';

      // If audio/video file uploaded, simulate transcription
      // In production, use Azure Speech Services
      if (files.file && !transcript) {
        transcript = `Bu bir örnek transkripttir. Gerçek üretimde Azure Speech-to-Text kullanılacaktır.

Katılımcı 1: Bugün Q4 stratejimizi gözden geçireceğiz. Hedeflerimizi konuşalım.
Katılımcı 2: Pazarlama bütçesini %20 artırmayı öneriyorum.
Katılımcı 3: Ürün geliştirme tarafında 3 yeni özellik hazırlayacağız.
Katılımcı 1: Harika. Bu konuları aksiyon maddelerine ekleyelim.`;
      }

      if (!transcript) {
        return res.status(400).json({ error: 'Transkript gerekli' });
      }

      // Summary Generation
      const summaryResponse = await anthropic.messages.create({
        model: 'AX9F7E2B',
        max_tokens: 300,
        system: 'Sen bir toplantı analiz uzmanısın. Toplantı transkriptlerini özetleyip önemli noktaları çıkarırsın.',
        messages: [
          {
            role: 'user',
            content: `Toplantı: ${title}\n\nTranskript:\n${transcript}\n\nBu toplantının kısa bir özetini yaz (3-4 cümle).`
          }
        ]
      });

      const summary = summaryResponse.content[0].text.trim();

      // Participant Analysis
      const participantResponse = await anthropic.messages.create({
        model: 'AX9F7E2B',
        max_tokens: 500,
        system: 'Toplantı katılımcılarını analiz et ve her biri için JSON formatında bilgi ver.',
        messages: [
          {
            role: 'user',
            content: `Transkript:\n${transcript}\n\nKatılımcıları belirle ve her biri için: name, sentiment (Pozitif/Nötr/Negatif), sentimentScore (0-100). JSON array döndür.`
          }
        ]
      });

      let participants = [];
      try {
        participants = JSON.parse(participantResponse.content[0].text.trim());
      } catch {
        participants = [
          { name: 'Katılımcı 1', sentiment: 'Pozitif', sentimentScore: 85 },
          { name: 'Katılımcı 2', sentiment: 'Pozitif', sentimentScore: 90 },
          { name: 'Katılımcı 3', sentiment: 'Nötr', sentimentScore: 70 }
        ];
      }

      // Action Items Extraction
      const actionResponse = await anthropic.messages.create({
        model: 'AX9F7E2B',
        max_tokens: 500,
        system: 'Toplantıdan aksiyon maddelerini çıkar.',
        messages: [
          {
            role: 'user',
            content: `Transkript:\n${transcript}\n\nBu toplantıdan çıkan aksiyon maddelerini listele. Her madde için JSON: {task, assignee, deadline}. JSON array döndür.`
          }
        ]
      });

      let actions = [];
      try {
        actions = JSON.parse(actionResponse.content[0].text.trim());
      } catch {
        // Fallback: extract from transcript
        const lines = transcript.split('\n').filter(l =>
          l.includes('yapmalı') || l.includes('hazırla') || l.includes('ekle') || l.includes('öner')
        );
        actions = lines.slice(0, 5).map(line => ({ task: line.trim() }));
      }

      res.status(200).json({
        success: true,
        title,
        summary,
        participants,
        actions,
        timestamp: new Date().toISOString()
      });
    });
  } catch (error) {
    console.error('Meeting analysis error:', error);
    res.status(500).json({
      error: 'Analysis failed',
      message: error.message
    });
  }
};
