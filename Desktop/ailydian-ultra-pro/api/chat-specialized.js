// Production Chat API - Vercel Serverless Function (Groq Ultra-Fast)
const OpenAI = require('openai');

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, aiType = 'general', history = [], temperature = 0.7, max_tokens = 2000 } = req.body || {};

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    let providerUsed = 'Unknown';
    let response = '';
    let usage = {};

    // Use Groq Ultra-Fast API (Same as localhost)
    const groq = new OpenAI({
      apiKey: process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY,
      baseURL: process.env.GROQ_API_KEY ? 'https://api.groq.com/openai/v1' : undefined
    });

    const aiResponse = await groq.chat.completions.create({
      model: process.env.GROQ_API_KEY ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini',
      messages: [
        ...history,
        { role: 'user', content: message }
      ],
      temperature: temperature,
      max_tokens: max_tokens
    });

    response = aiResponse.choices[0].message.content;
    usage = aiResponse.usage;
    providerUsed = process.env.GROQ_API_KEY ? 'Groq Llama 3.3 70B (Ultra-Fast)' : 'GPT-4o-mini';

    if (!response) {
      return res.status(500).json({
        success: false,
        error: 'No AI provider available or configured'
      });
    }

    res.status(200).json({
      success: true,
      provider: providerUsed,
      aiType: aiType,
      response: response,
      usage: usage,
      timestamp: new Date().toISOString(),
      metadata: {
        temperature,
        max_tokens,
        history_length: history.length
      }
    });

  } catch (error) {
    console.error('❌ Chat API Error:', error);
    res.status(500).json({
      success: false,
      error: 'AI response generation failed',
      details: error.message,
      aiType: req.body?.aiType || 'unknown'
    });
  }
};
