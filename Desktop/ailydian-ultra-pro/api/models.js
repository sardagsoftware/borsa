/**
 * Vercel Serverless Models API
 * Returns available AI models
 */

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const models = [
      // Azure Models
      { id: 'azure-gpt-4o', name: 'Azure GPT-4o', provider: 'azure-openai', premium: true },
      { id: 'azure-gpt-4-turbo', name: 'Azure GPT-4 Turbo', provider: 'azure-openai', premium: true },
      { id: 'azure-gpt-4', name: 'Azure GPT-4', provider: 'azure-openai', premium: true },
      { id: 'azure-gpt-35-turbo', name: 'Azure GPT-3.5 Turbo', provider: 'azure-openai', premium: false },

      // OpenAI Models
      { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', premium: true },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'openai', premium: true },
      { id: 'gpt-4', name: 'GPT-4', provider: 'openai', premium: true },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'openai', premium: false },

      // Anthropic Models
      { id: 'claude-3-opus', name: 'Claude 3 Opus', provider: 'anthropic', premium: true },
      { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', provider: 'anthropic', premium: true },
      { id: 'claude-3-haiku', name: 'Claude 3 Haiku', provider: 'anthropic', premium: false },

      // Google Models
      { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash', provider: 'google', premium: true },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'google', premium: true },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: 'google', premium: false },

      // Groq Models (Fast)
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', provider: 'groq', premium: false },
      { id: 'llama-3.1-70b-versatile', name: 'Llama 3.1 70B', provider: 'groq', premium: false },
      { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', provider: 'groq', premium: false },

      // DeepSeek Models
      { id: 'deepseek-chat', name: 'DeepSeek Chat', provider: 'deepseek', premium: false },
      { id: 'deepseek-r1', name: 'DeepSeek R1 (Reasoning)', provider: 'deepseek', premium: true },

      // Perplexity Models
      { id: 'sonar-pro', name: 'Sonar Pro', provider: 'perplexity', premium: true },
      { id: 'sonar', name: 'Sonar', provider: 'perplexity', premium: false },

      // Z.ai Models
      { id: 'z-chat', name: 'Z Chat', provider: 'z.ai', premium: false },

      // xAI Models
      { id: 'grok-2', name: 'Grok 2', provider: 'xai', premium: true }
    ];

    res.status(200).json({
      models,
      total: models.length,
      providers: ['azure-openai', 'openai', 'anthropic', 'google', 'groq', 'deepseek', 'perplexity', 'z.ai', 'xai'],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};
