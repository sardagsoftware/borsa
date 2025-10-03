// LyDian Unified AI API - All Models Hidden
require('dotenv').config();
const OpenAI = require('openai');

// Hidden AI Configuration - User never knows which AI they're using
const AI_ENGINES = {
  chat: {
    primary: { model: 'llama-3.3-70b-versatile', provider: 'groq', key: process.env.GROQ_API_KEY, url: 'https://api.groq.com/openai/v1' },
    fallback1: { model: 'gpt-4o-mini', provider: 'openai', key: process.env.OPENAI_API_KEY, url: undefined },
    fallback2: { model: 'gemma2-9b-it', provider: 'groq', key: process.env.GROQ_API_KEY, url: 'https://api.groq.com/openai/v1' }
  },
  deep_think: {
    primary: { model: 'ERNIE-4.0-Turbo', provider: 'ernie', key: process.env.ERNIE_API_KEY, url: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions_pro' }
  },
  code: {
    primary: { model: 'deepseek-coder', provider: 'deepseek', key: process.env.DEEPSEEK_API_KEY, url: 'https://api.deepseek.com' }
  },
  rag: {
    primary: { model: 'gpt-4o', provider: 'openai', key: process.env.OPENAI_API_KEY, url: undefined },
    fallback: { model: 'azure-gpt-4', provider: 'azure', key: process.env.AZURE_API_KEY, url: process.env.AZURE_ENDPOINT }
  }
};

// Turkish System Prompt - Force Turkish responses
const TURKISH_SYSTEM = {
  role: 'system',
  content: `Sen LyDian AI asistanısın. ÖNEMLİ KURALLAR:
1. Her zaman Türkçe konuş ve yanıt ver
2. Kullanıcı hangi dilde yazarsa yazsın, SADECE Türkçe cevap ver
3. Profesyonel, açık ve net ol
4. Asla hangi AI modeli olduğunu söyleme
5. Her zaman "LyDian AI" olarak kendini tanıt`
};

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const {
      message,
      history = [],
      taskType = 'chat', // chat, deep_think, code, rag
      temperature = 0.7,
      max_tokens = 3000
    } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, error: 'Message required' });
    }

    // Select engine based on task (hidden from user)
    let engine;
    switch (taskType) {
      case 'deep_think':
        engine = AI_ENGINES.deep_think.primary;
        break;
      case 'code':
        engine = AI_ENGINES.code.primary;
        break;
      case 'rag':
        engine = AI_ENGINES.rag.primary;
        break;
      default:
        engine = AI_ENGINES.chat.primary;
    }

    // Try primary, fallback if fails
    let response;
    let usedEngine = 'primary';

    try {
      const client = new OpenAI({
        apiKey: engine.key,
        baseURL: engine.url
      });

      const completion = await client.chat.completions.create({
        model: engine.model,
        messages: [
          TURKISH_SYSTEM,
          ...history,
          { role: 'user', content: message }
        ],
        temperature,
        max_tokens
      });

      response = completion.choices[0].message.content;
    } catch (primaryError) {
      console.error('Primary engine failed:', primaryError.message);

      // Fallback to chat primary
      const fallback = AI_ENGINES.chat.primary;
      const fallbackClient = new OpenAI({
        apiKey: fallback.key,
        baseURL: fallback.url
      });

      const fallbackCompletion = await fallbackClient.chat.completions.create({
        model: fallback.model,
        messages: [
          TURKISH_SYSTEM,
          ...history,
          { role: 'user', content: message }
        ],
        temperature,
        max_tokens
      });

      response = fallbackCompletion.choices[0].message.content;
      usedEngine = 'fallback';
    }

    // Return response WITHOUT revealing which AI was used
    res.status(200).json({
      success: true,
      response: response,
      provider: 'LyDian AI', // Generic name, never reveal actual model
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Unified AI Error:', error);
    res.status(500).json({
      success: false,
      error: 'AI işlemi başarısız oldu',
      message: 'Lütfen tekrar deneyin'
    });
  }
};
