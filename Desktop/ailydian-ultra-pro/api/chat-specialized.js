// Minimal Production Chat API - Vercel Serverless Function
const Anthropic = require('@anthropic-ai/sdk');
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

    // Select AI provider based on aiType
    switch (aiType) {
      case 'code':
      case 'developer':
        // Use Claude 3.5 Sonnet for coding
        if (process.env.ANTHROPIC_API_KEY) {
          const anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY
          });

          const aiResponse = await anthropic.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: max_tokens,
            temperature: temperature,
            messages: [
              ...history.map(h => ({ role: h.role, content: h.content })),
              { role: 'user', content: message }
            ]
          });

          response = aiResponse.content[0].text;
          usage = {
            input_tokens: aiResponse.usage.input_tokens,
            output_tokens: aiResponse.usage.output_tokens
          };
          providerUsed = 'Claude 3.5 Sonnet (Code Expert)';
        }
        break;

      case 'creative':
      case 'writer':
        // Use GPT-4 for creative writing
        if (process.env.OPENAI_API_KEY) {
          const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
          });

          const aiResponse = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [
              ...history,
              { role: 'user', content: message }
            ],
            temperature: temperature,
            max_tokens: max_tokens
          });

          response = aiResponse.choices[0].message.content;
          usage = {
            prompt_tokens: aiResponse.usage.prompt_tokens,
            completion_tokens: aiResponse.usage.completion_tokens,
            total_tokens: aiResponse.usage.total_tokens
          };
          providerUsed = 'GPT-4 (Creative Writer)';
        }
        break;

      case 'fast':
        // Use GPT-4o-mini for fast responses
        if (process.env.OPENAI_API_KEY) {
          const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
          });

          const aiResponse = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
              ...history,
              { role: 'user', content: message }
            ],
            temperature: 0.5,
            max_tokens: 1000
          });

          response = aiResponse.choices[0].message.content;
          usage = {
            prompt_tokens: aiResponse.usage.prompt_tokens,
            completion_tokens: aiResponse.usage.completion_tokens,
            total_tokens: aiResponse.usage.total_tokens
          };
          providerUsed = 'GPT-4o-mini (Fast)';
        }
        break;

      default:
      case 'general':
        // Use Claude 3.5 Sonnet as default
        if (process.env.ANTHROPIC_API_KEY) {
          const anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY
          });

          const aiResponse = await anthropic.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: max_tokens,
            temperature: temperature,
            messages: [
              ...history.map(h => ({ role: h.role, content: h.content })),
              { role: 'user', content: message }
            ]
          });

          response = aiResponse.content[0].text;
          usage = {
            input_tokens: aiResponse.usage.input_tokens,
            output_tokens: aiResponse.usage.output_tokens
          };
          providerUsed = 'Claude 3.5 Sonnet (General)';
        } else if (process.env.OPENAI_API_KEY) {
          // Fallback to OpenAI
          const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
          });

          const aiResponse = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [
              ...history,
              { role: 'user', content: message }
            ],
            temperature: temperature,
            max_tokens: max_tokens
          });

          response = aiResponse.choices[0].message.content;
          usage = {
            prompt_tokens: aiResponse.usage.prompt_tokens,
            completion_tokens: aiResponse.usage.completion_tokens,
            total_tokens: aiResponse.usage.total_tokens
          };
          providerUsed = 'GPT-4 (Fallback)';
        }
        break;
    }

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
