/**
 * Vercel Serverless Chat API - DEMO MODE
 * Production-ready mock responses for real users
 */

module.exports = async (req, res) => {
  // CORS headers
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
    const { message, model = 'premium-model-1', language = 'tr' } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Simulate processing delay (realistic UX)
    await new Promise(resolve => setTimeout(resolve, 800));

    // Turkish legal AI demo responses
    const demoResponses = {
      tr: `**LyDian Hukuk AI - Demo Modu**

Merhaba! Ben LyDian Hukuk AI asistanınızım. Şu anda **demo modunda** çalışıyorum.

**Sorulunuz:** "${message.substring(0, 100)}..."

**Demo Yanıt:**
Türk hukuku konusunda profesyonel destek sağlıyorum. Gerçek sistemde aşağıdaki özelliklere erişebilirsiniz:

✅ **23+ Premium AI Model** (Enterprise düzey yapay zeka modelleri)
✅ **8 Dil Desteği** (TR, EN, DE, FR, ES, AR, RU, ZH)
✅ **Hukuki Bilgi Bankası** (Neo4j Knowledge Graph)
✅ **İçtihat Analizi** (Yargıtay, Danıştay kararları)
✅ **Mevzuat Araştırması** (Kanun, tüzük, yönetmelik)

📌 **Production sürümünde:**
- Gerçek AI model yanıtları
- Knowledge Graph entegrasyonu
- Azure Cognitive Services
- Tam hukuki veri erişimi

🔗 **Model:** ${model}
🌍 **Dil:** ${language}
⏱️ **Yanıt süresi:** 0.8s

*Not: Bu demo yanıttır. Production deployment için backend API entegrasyonu gereklidir.*`,

      en: `**LyDian Legal AI - Demo Mode**

Hello! I'm your LyDian Legal AI assistant. Currently running in **demo mode**.

**Your Question:** "${message.substring(0, 100)}..."

**Demo Response:**
I provide professional support on Turkish law. In the full system, you'll have access to:

✅ **23+ Premium AI Models** (Enterprise-grade artificial intelligence)
✅ **8 Language Support** (TR, EN, DE, FR, ES, AR, RU, ZH)
✅ **Legal Knowledge Base** (Neo4j Knowledge Graph)
✅ **Case Law Analysis** (Court of Cassation, Council of State decisions)
✅ **Legislation Research** (Laws, regulations, directives)

📌 **In production:**
- Real AI model responses
- Knowledge Graph integration
- Azure Cognitive Services
- Full legal data access

🔗 **Model:** ${model}
🌍 **Language:** ${language}
⏱️ **Response time:** 0.8s

*Note: This is a demo response. Production deployment requires backend API integration.*`
    };

    const responseText = demoResponses[language] || demoResponses['en'];

    res.status(200).json({
      success: true,
      model: model,
      response: responseText,
      usage: {
        prompt_tokens: message.length,
        completion_tokens: responseText.length,
        total_tokens: message.length + responseText.length
      },
      demo: true,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      error: error.message,
      demo: true
    });
  }
};
