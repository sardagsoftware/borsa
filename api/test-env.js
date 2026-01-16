/**
 * Test endpoint to verify environment variables
 * Temporary debug endpoint - REMOVE AFTER TESTING
 */

module.exports = (req, res) => {
  const groqKey = process.env.GROQ_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  res.json({
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    vercel: process.env.VERCEL || 'false',
    keys: {
      GROQ_API_KEY: groqKey ? `SET (${groqKey.length} chars, starts with: ${groqKey.substring(0, 8)}...)` : 'NOT SET',
      ANTHROPIC_API_KEY: anthropicKey ? `SET (${anthropicKey.length} chars)` : 'NOT SET',
      OPENAI_API_KEY: openaiKey ? `SET (${openaiKey.length} chars)` : 'NOT SET',
    },
    testValue: '5 + 3 = 8'
  });
};
