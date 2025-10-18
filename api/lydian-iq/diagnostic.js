// Diagnostic endpoint for checking environment variables
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

  // Check if API keys exist (but don't expose actual values)
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    vercelEnv: process.env.VERCEL_ENV || 'unknown',
    apiKeys: {
      groq: {
        exists: !!process.env.GROQ_API_KEY,
        length: process.env.GROQ_API_KEY?.length || 0,
        preview: process.env.GROQ_API_KEY?.substring(0, 8) + '...' || 'NONE'
      },
      anthropic: {
        exists: !!process.env.ANTHROPIC_API_KEY,
        length: process.env.ANTHROPIC_API_KEY?.length || 0,
        preview: process.env.ANTHROPIC_API_KEY?.substring(0, 8) + '...' || 'NONE'
      },
      openai: {
        exists: !!process.env.OPENAI_API_KEY,
        length: process.env.OPENAI_API_KEY?.length || 0,
        preview: process.env.OPENAI_API_KEY?.substring(0, 8) + '...' || 'NONE'
      },
      azureOpenai: {
        exists: !!process.env.AZURE_OPENAI_API_KEY,
        length: process.env.AZURE_OPENAI_API_KEY?.length || 0,
        preview: process.env.AZURE_OPENAI_API_KEY?.substring(0, 8) + '...' || 'NONE'
      }
    },
    allEnvKeys: Object.keys(process.env).filter(k =>
      k.includes('API') || k.includes('KEY') || k.includes('AI')
    ).sort()
  };

  res.status(200).json(diagnostics);
};
