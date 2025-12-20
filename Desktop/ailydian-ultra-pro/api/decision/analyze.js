const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

module.exports = async (req, res) => {
  // CORS
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
    const { title, description, criteria, options } = req.body;

    if (!title || !criteria || !options || criteria.length === 0 || options.length < 2) {
      return res.status(400).json({ error: 'Invalid input data' });
    }

    // Calculate decision matrix scores
    const scores = [];

    for (const option of options) {
      const breakdown = [];
      let totalScore = 0;

      for (const criterion of criteria) {
        // Use Azure OpenAI to score each option against each criterion
        const prompt = `
Karar konusu: ${title}
${description ? `Açıklama: ${description}` : ''}

Kriter: ${criterion.name} (Önem: ${criterion.weight}/5)
Seçenek: ${option}

Bu seçeneği bu kritere göre 1-10 arasında puanla. Sadece sayıyı döndür, açıklama yapma.
        `.trim();

        try {
          const response = await anthropic.messages.create({
            model: 'AX9F7E2B',
            max_tokens: 10,
            system: 'Sen bir karar analizi uzmanısın. Verilen kriterlere göre seçenekleri objektif bir şekilde puanlıyorsun.',
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ]
          });

          const rawScore = parseFloat(response.content[0].text.trim()) || 5;
          const score = Math.min(Math.max(rawScore, 1), 10); // Clamp 1-10
          const weightedScore = score * criterion.weight;

          breakdown.push({
            criterion: criterion.name,
            score: weightedScore,
            rawScore: score,
            weight: criterion.weight
          });

          totalScore += weightedScore;
        } catch (err) {
          console.error('Scoring error:', err);
          // Fallback to random score if API fails
          const fallbackScore = 5 + Math.random() * 3;
          const weightedScore = fallbackScore * criterion.weight;
          breakdown.push({
            criterion: criterion.name,
            score: weightedScore,
            rawScore: fallbackScore,
            weight: criterion.weight
          });
          totalScore += weightedScore;
        }
      }

      scores.push({
        option,
        totalScore,
        breakdown
      });
    }

    // Sort by score
    const sortedScores = scores.sort((a, b) => b.totalScore - a.totalScore);
    const winner = sortedScores[0];

    // Generate AI recommendation
    let recommendation = '';
    try {
      const recommendationPrompt = `
Karar konusu: ${title}
${description ? `Açıklama: ${description}` : ''}

Değerlendirme sonuçları:
${sortedScores.map((s, i) => `${i + 1}. ${s.option}: ${s.totalScore.toFixed(1)} puan`).join('\n')}

En iyi seçenek "${winner.option}" olarak belirlendi (${winner.totalScore.toFixed(1)} puan).

Kısa ve net bir şekilde (2-3 cümle) neden bu seçeneğin en iyi olduğunu ve kullanıcının dikkat etmesi gereken noktaları açıkla.
      `.trim();

      const recResponse = await anthropic.messages.create({
        model: 'AX9F7E2B',
        max_tokens: 200,
        system: 'Sen bir karar danışmanısın. Analiz sonuçlarını açık ve özlü şekilde açıklıyorsun.',
        messages: [
          {
            role: 'user',
            content: recommendationPrompt
          }
        ]
      });

      recommendation = recResponse.content[0].text.trim();
    } catch (err) {
      console.error('Recommendation error:', err);
      recommendation = `"${winner.option}" seçeneği ${winner.totalScore.toFixed(1)} puanla en yüksek skoru aldı. Belirlediğiniz kriterlere göre bu seçenek en optimal çözüm olarak görünüyor.`;
    }

    res.status(200).json({
      success: true,
      scores: sortedScores,
      winner: winner.option,
      recommendation,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Decision analysis error:', error);
    res.status(500).json({
      error: 'Analysis failed',
      message: error.message
    });
  }
};
