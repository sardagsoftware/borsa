// Direct Groq API test - bypass all middlewares
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

  // Get config at request time
  function getAIConfig() {
    return {
      groq: {
        apiKey: process.env.GROQ_API_KEY || '',
        endpoint: 'https://api.groq.com/openai/v1/chat/completions',
        model: 'llama-3.3-70b-versatile' // ✅ UPDATED: Active model
      }
    };
  }

  const CONFIG = getAIConfig();

  console.log('[TEST-GROQ] 🧪 Starting test...');
  console.log(`[TEST-GROQ] GROQ_API_KEY exists: ${!!process.env.GROQ_API_KEY}`);
  console.log(`[TEST-GROQ] GROQ_API_KEY length: ${(process.env.GROQ_API_KEY || '').length}`);
  console.log(`[TEST-GROQ] CONFIG.groq.apiKey exists: ${!!CONFIG.groq.apiKey}`);
  console.log(`[TEST-GROQ] CONFIG.groq.apiKey length: ${CONFIG.groq.apiKey.length}`);
  console.log(`[TEST-GROQ] Validation passes: ${CONFIG.groq.apiKey && CONFIG.groq.apiKey.length > 20 && !CONFIG.groq.apiKey.includes('YOUR_')}`);

  if (!CONFIG.groq.apiKey || CONFIG.groq.apiKey.length < 20) {
    return res.status(200).json({
      success: false,
      error: 'API key not found or too short',
      debug: {
        hasEnvVar: !!process.env.GROQ_API_KEY,
        envVarLength: (process.env.GROQ_API_KEY || '').length,
        configHasKey: !!CONFIG.groq.apiKey,
        configKeyLength: CONFIG.groq.apiKey.length
      }
    });
  }

  try {
    console.log('[TEST-GROQ] 🚀 Calling Groq API...');

    const response = await fetch(CONFIG.groq.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.groq.apiKey}`
      },
      body: JSON.stringify({
        model: CONFIG.groq.model,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant. Respond in Turkish.'
          },
          {
            role: 'user',
            content: '2+2 kaç eder? Kısa yanıt ver.'
          }
        ],
        max_tokens: 100,
        temperature: 0.3
      })
    });

    console.log(`[TEST-GROQ] Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[TEST-GROQ] ❌ API Error:', errorText);
      return res.status(200).json({
        success: false,
        error: 'Groq API error',
        statusCode: response.status,
        details: errorText.substring(0, 500)
      });
    }

    const data = await response.json();
    console.log('[TEST-GROQ] ✅ Success!');

    return res.status(200).json({
      success: true,
      message: 'Groq API test successful!',
      response: data.choices[0]?.message?.content || 'No content',
      model: data.model,
      usage: data.usage
    });

  } catch (error) {
    console.error('[TEST-GROQ] ❌ Exception:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
