/**
 * Groq API Client — Central proxy layer
 * All AI API calls route through this module for:
 * - Centralized key management
 * - Error sanitization (no model names leak)
 * - Timeout management
 * - Model code resolution
 */

const { sanitizeModelNames } = require('../../services/localrecall/obfuscation');

// Internal model registry — codes map to real model IDs (base64 encoded, never exposed)
const _MODEL_MAP = {
  GX8E2D9A: 'bGxhbWEtMy4xLThiLWluc3RhbnQ=', // fast, general
  GX3C7D5F: 'bGxhbWEtMy4zLTcwYi12ZXJzYXRpbGU=', // versatile, coding
  GX9A5E1D: 'bGxhbWEtMy4xLThiLWluc3RhbnQ=', // standard
  COMPOUND: 'Z3JvcS9jb21wb3VuZC1taW5p', // compound-mini (web search)
  COMPOUND_FULL: 'Z3JvcS9jb21wb3VuZA==', // compound (multi-tool)
};

const _API_URL = Buffer.from(
  'aHR0cHM6Ly9hcGkuZ3JvcS5jb20vb3BlbmFpL3YxL2NoYXQvY29tcGxldGlvbnM=',
  'base64'
).toString();

function resolveModel(modelCode) {
  const encoded = _MODEL_MAP[modelCode] || _MODEL_MAP.GX8E2D9A;
  return Buffer.from(encoded, 'base64').toString();
}

/**
 * Make a chat completion request to the AI API
 * @param {string} modelCode - Internal model code (GX8E2D9A, GX3C7D5F, etc.)
 * @param {Array} messages - Chat messages array
 * @param {Object} options - { stream, max_tokens, temperature, top_p, timeout }
 * @returns {Response} Raw fetch Response (for streaming callers)
 */
async function chatCompletion(modelCode, messages, options = {}) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('AI service not configured');
  }

  const controller = new AbortController();
  const timeoutMs = options.timeout || (options.stream ? 60000 : 30000);
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: resolveModel(modelCode),
        messages,
        max_tokens: options.max_tokens || 4096,
        temperature: options.temperature ?? 0.7,
        top_p: options.top_p ?? 0.9,
        stream: options.stream || false,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // Drain body silently — never forward raw error with model names
      try {
        await response.text();
      } catch (_e) {
        /* drain */
      }
      const err = new Error(`AI_REQUEST_FAILED_${response.status}`);
      err.statusCode = response.status;
      throw err;
    }

    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.statusCode) throw error;
    // Sanitize all error messages
    const sanitizedMsg = sanitizeModelNames(error.message || 'AI_ERROR');
    const sanitizedError = new Error(sanitizedMsg);
    sanitizedError.statusCode = error.statusCode || 500;
    throw sanitizedError;
  }
}

/**
 * Non-streaming chat completion — returns parsed JSON result
 */
async function chatCompletionJSON(modelCode, messages, options = {}) {
  const response = await chatCompletion(modelCode, messages, { ...options, stream: false });
  const data = await response.json();

  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error('Invalid API response');
  }

  return {
    content: data.choices[0].message.content,
    usage: data.usage,
  };
}

/**
 * Non-streaming chat completion with tool results extraction
 * For Compound AI models that return executed_tools (web_search, code_interpreter, etc.)
 */
async function chatCompletionWithTools(modelCode, messages, options = {}) {
  const response = await chatCompletion(modelCode, messages, { ...options, stream: false });
  const data = await response.json();

  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error('Invalid API response');
  }

  const msg = data.choices[0].message;
  const executedTools = msg.executed_tools || [];

  // Extract structured sources from search tool results
  // Groq Compound returns type:"search" with output as text (Title:\nURL:\nContent:\n blocks)
  const sources = [];
  for (const tool of executedTools) {
    if ((tool.type === 'search' || tool.type === 'web_search') && tool.output) {
      // Parse text output: "Title: ...\nURL: ...\nContent: ..." blocks
      const blocks = tool.output.split(/(?=Title: )/);
      for (const block of blocks) {
        const titleMatch = block.match(/Title: (.+)/);
        const urlMatch = block.match(/URL: (https?:\/\/\S+)/);
        const contentMatch = block.match(/Content: ([\s\S]*?)(?=\n\nTitle: |\n*$)/);
        if (titleMatch && urlMatch) {
          let domain = '';
          try {
            domain = new URL(urlMatch[1]).hostname;
          } catch (_e) {
            /* skip */
          }
          sources.push({
            id: sources.length + 1,
            title: titleMatch[1].trim(),
            url: urlMatch[1].trim(),
            domain,
            snippet: (contentMatch ? contentMatch[1].trim() : '').substring(0, 200),
            score: 0,
            favicon: domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=32` : null,
            image: null,
          });
        }
      }
    }
    // Also handle structured search_results format (future-proof)
    if (tool.type === 'web_search' && tool.search_results && tool.search_results.results) {
      for (const result of tool.search_results.results) {
        let domain = '';
        try {
          domain = new URL(result.url).hostname;
        } catch (_e) {
          /* skip */
        }
        sources.push({
          id: sources.length + 1,
          title: result.title || domain,
          url: result.url || '',
          domain,
          snippet: (result.content || '').substring(0, 200),
          score: result.score || 0,
          favicon: domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=32` : null,
          image: null,
        });
      }
    }
  }

  return {
    content: msg.content || '',
    usage: data.usage,
    sources,
    executedTools,
  };
}

/**
 * Streaming chat completion — writes SSE chunks to res
 */
async function chatCompletionStream(modelCode, messages, res, options = {}) {
  const response = await chatCompletion(modelCode, messages, { ...options, stream: true });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullContent = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;
        const data = trimmed.slice(5).trim();
        if (data === '[DONE]') continue;

        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta?.content || '';
          if (delta) {
            fullContent += delta;
            res.write(`data: ${JSON.stringify({ content: delta })}\n\n`);
          }
        } catch (_e) {
          // skip malformed chunks
        }
      }
    }
  } catch (streamErr) {
    console.error('[AI_STREAM_ERR]', sanitizeModelNames(streamErr.message));
  }

  return fullContent;
}

module.exports = {
  chatCompletion,
  chatCompletionJSON,
  chatCompletionWithTools,
  chatCompletionStream,
  resolveModel,
  _MODEL_MAP,
};
