// 🔐 LyDian Unified AI API - ULTRA SECURE - Zero AI Name Exposure
require('dotenv').config();
const OpenAI = require('lydian-labs');
const obf = require('../security/ultra-obfuscation-v2');
const { getCorsOrigin } = require('./_middleware/cors');
const { applySanitization } = require('./_middleware/sanitize');

// 🔒 ENCRYPTED AI Configuration - NO plaintext model names
// Using ultra-obfuscation-v2.js for military-grade security
const AI_ENGINES = {
  chat: {
    primary: {
      code: 'VE_LLAMA_33',
      provider: 'LyDian-Acceleration',
      key: process.env.GROQ_API_KEY,
      url: 'https://api.groq.com/openai/v1'
    },
    fallback1: {
      code: 'NC_RAPID_35',
      provider: 'LyDian-Labs',
      key: process.env.OPENAI_API_KEY,
      url: undefined
    },
    fallback2: {
      code: 'VE_GEMMA_9B',
      provider: 'LyDian-Acceleration',
      key: process.env.GROQ_API_KEY,
      url: 'https://api.groq.com/openai/v1'
    }
  },
  deep_think: {
    primary: {
      code: 'EC_ERNIE_4',
      provider: 'LyDian-Enterprise',
      key: process.env.ERNIE_API_KEY,
      url: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions_pro'
    }
  },
  code: {
    primary: {
      code: 'NC_DEEPSEEK',
      provider: 'LyDian-Code',
      key: process.env.DEEPSEEK_API_KEY,
      url: 'https://api.deepseek.com'
    }
  },
  rag: {
    primary: {
      code: 'NC_TURBO_4',
      provider: 'LyDian-Labs',
      key: process.env.OPENAI_API_KEY,
      url: undefined
    },
    fallback: {
      code: 'NC_AZURE_4',
      provider: 'LyDian-Cloud',
      key: process.env.AZURE_API_KEY,
      url: process.env.AZURE_ENDPOINT
    }
  }
};

// Helper function to decrypt model config safely
function getSecureModelName(engineCode) {
  try {
    const config = obf.getModelConfig(engineCode);
    return config.model;
  } catch (error) {
    // Fallback to safe generic name if decryption fails
    console.error(obf.sanitizeLog(`Decryption failed for ${engineCode}`));
    return 'lydian-ai-engine';
  }
}

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
  applySanitization(req, res);
  // CORS
  res.setHeader('Access-Control-Allow-Origin', getCorsOrigin(req));
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
    let engineConfig;
    switch (taskType) {
      case 'deep_think':
        engineConfig = AI_ENGINES.deep_think.primary;
        break;
      case 'code':
        engineConfig = AI_ENGINES.code.primary;
        break;
      case 'rag':
        engineConfig = AI_ENGINES.rag.primary;
        break;
      default:
        engineConfig = AI_ENGINES.chat.primary;
    }

    // Decrypt model name securely (never exposed to client)
    const modelName = getSecureModelName(engineConfig.code);

    // Try primary, fallback if fails
    let response;
    let usedEngine = 'primary';

    try {
      const client = new OpenAI({
        apiKey: engineConfig.key,
        baseURL: engineConfig.url
      });

      const completion = await client.chat.completions.create({
        model: modelName, // Decrypted internally only
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
      // Sanitize error logs (remove any AI names)
      console.error(obf.sanitizeLog(`Primary engine failed: ${primaryError.message}`));

      // Fallback to chat primary
      const fallbackConfig = AI_ENGINES.chat.primary;
      const fallbackModel = getSecureModelName(fallbackConfig.code);

      const fallbackClient = new OpenAI({
        apiKey: fallbackConfig.key,
        baseURL: fallbackConfig.url
      });

      const fallbackCompletion = await fallbackClient.chat.completions.create({
        model: fallbackModel,
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

    // Sanitize response (remove any leaked AI names)
    const sanitizedResponse = obf.sanitizeLog(response);

    // Return response WITHOUT revealing which AI was used
    res.status(200).json({
      success: true,
      response: sanitizedResponse,
      provider: 'LyDian AI', // Generic name, never reveal actual model
      engine: obf.getDisplayName(engineConfig.code), // Safe display name only
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    // Sanitize all error messages
    const safeError = obf.sanitizeLog(error.message);
    console.error('❌ Unified AI Error:', safeError);

    res.status(500).json({
      success: false,
      error: 'AI işlemi başarısız oldu',
      message: 'Lütfen tekrar deneyin'
    });
  }
};
