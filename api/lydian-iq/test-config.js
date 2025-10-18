// Test endpoint to verify AI config is loading correctly
module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Test lazy initialization
  function getAIConfig() {
    return {
      groq: {
        apiKey: process.env.GROQ_API_KEY || process.env.RAPID_AI_KEY || '',
        hasKey: !!process.env.GROQ_API_KEY,
        length: (process.env.GROQ_API_KEY || '').length
      },
      openai: {
        apiKey: process.env.OPENAI_API_KEY || process.env.SECONDARY_AI_KEY || '',
        hasKey: !!process.env.OPENAI_API_KEY,
        length: (process.env.OPENAI_API_KEY || '').length
      },
      anthropic: {
        apiKey: process.env.ANTHROPIC_API_KEY || process.env.PRIMARY_AI_KEY || '',
        hasKey: !!process.env.ANTHROPIC_API_KEY,
        length: (process.env.ANTHROPIC_API_KEY || '').length
      }
    };
  }

  const CONFIG = getAIConfig();

  const result = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    vercelEnv: process.env.VERCEL_ENV || 'unknown',
    configTest: {
      groq: {
        hasKey: CONFIG.groq.hasKey,
        keyLength: CONFIG.groq.length,
        preview: CONFIG.groq.apiKey ? CONFIG.groq.apiKey.substring(0, 8) + '...' : 'EMPTY',
        passesValidation: CONFIG.groq.apiKey && CONFIG.groq.apiKey.length > 20 && !CONFIG.groq.apiKey.includes('YOUR_')
      },
      openai: {
        hasKey: CONFIG.openai.hasKey,
        keyLength: CONFIG.openai.length,
        preview: CONFIG.openai.apiKey ? CONFIG.openai.apiKey.substring(0, 8) + '...' : 'EMPTY',
        passesValidation: CONFIG.openai.apiKey && CONFIG.openai.apiKey.length > 20 && !CONFIG.openai.apiKey.includes('YOUR_')
      },
      anthropic: {
        hasKey: CONFIG.anthropic.hasKey,
        keyLength: CONFIG.anthropic.length,
        preview: CONFIG.anthropic.apiKey ? CONFIG.anthropic.apiKey.substring(0, 8) + '...' : 'EMPTY',
        passesValidation: CONFIG.anthropic.apiKey && CONFIG.anthropic.apiKey.length > 20 && !CONFIG.anthropic.apiKey.includes('YOUR_')
      }
    }
  };

  res.status(200).json(result);
};
