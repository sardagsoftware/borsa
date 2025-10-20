/**
 * AI MODEL OBFUSCATOR MIDDLEWARE
 * Hides AI provider names and model identifiers from responses
 * SECURITY: Protects trade secrets and competitive advantage
 */

/**
 * Model name obfuscation map
 * Maps real model names to generic aliases
 */
const MODEL_OBFUSCATION_MAP = {
  // Anthropic/Claude
  'claude': 'neural-alpha',
  'claude-3': 'neural-alpha-3',
  'claude-3-opus': 'neural-alpha-pro',
  'claude-3-sonnet': 'neural-alpha-standard',
  'claude-3-haiku': 'neural-alpha-lite',
  'claude-2': 'neural-alpha-2',
  'anthropic': 'lydian-ai-systems',

  // OpenAI
  'openai': 'neural-provider-a',
  'chatgpt': 'lydian-chat',
  'gpt-4': 'advanced-model-x4',
  'gpt-4-turbo': 'advanced-model-x4-turbo',
  'gpt-4o': 'advanced-model-x4-optimized',
  'gpt-3.5': 'standard-model-x3',
  'gpt-3.5-turbo': 'standard-model-x3-turbo',
  'text-davinci': 'text-model-d',
  'dall-e': 'image-model-e',
  'whisper': 'audio-model-w',

  // Google
  'gemini': 'neural-model-g',
  'gemini-pro': 'neural-model-g-pro',
  'gemini-ultra': 'neural-model-g-ultra',
  'palm': 'language-model-p',
  'bard': 'lydian-assistant',

  // Meta
  'llama': 'open-model-l',
  'llama-2': 'open-model-l2',
  'llama-3': 'open-model-l3',
  'meta-ai': 'neural-provider-m',

  // Groq
  'groq': 'inference-engine-q',

  // Mistral
  'mistral': 'neural-model-m',
  'mixtral': 'hybrid-model-mx',

  // Cohere
  'cohere': 'neural-provider-c',
  'command': 'instruction-model',

  // Hugging Face
  'huggingface': 'model-hub',
  'hugging face': 'model-hub',

  // Azure
  'azure-openai': 'cloud-ai-platform',
  'azure-cognitive': 'cognitive-services'
};

/**
 * Obfuscate model name in string
 */
function obfuscateModelName(text) {
  if (!text || typeof text !== 'string') return text;

  let obfuscated = text;

  // Case-insensitive replacement
  for (const [real, alias] of Object.entries(MODEL_OBFUSCATION_MAP)) {
    const regex = new RegExp(real, 'gi');
    obfuscated = obfuscated.replace(regex, alias);
  }

  return obfuscated;
}

/**
 * Deep obfuscate object (recursively)
 */
function obfuscateObject(obj) {
  if (!obj) return obj;

  if (typeof obj === 'string') {
    return obfuscateModelName(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => obfuscateObject(item));
  }

  if (typeof obj === 'object') {
    const obfuscated = {};
    for (const [key, value] of Object.entries(obj)) {
      // Obfuscate both key and value
      const newKey = obfuscateModelName(key);
      obfuscated[newKey] = obfuscateObject(value);
    }
    return obfuscated;
  }

  return obj;
}

/**
 * Response obfuscation middleware
 * Intercepts JSON responses and masks AI model names
 */
function obfuscateResponseMiddleware(req, res, next) {
  const originalJson = res.json;

  res.json = function(data) {
    // Skip obfuscation in development if DEBUG_AI_MODELS is set
    if (process.env.NODE_ENV === 'development' && process.env.DEBUG_AI_MODELS === 'true') {
      return originalJson.call(this, data);
    }

    // Obfuscate the response data
    const obfuscatedData = obfuscateObject(data);

    // Call original json method with obfuscated data
    return originalJson.call(this, obfuscatedData);
  };

  next();
}

/**
 * Remove AI provider headers from response
 */
function removeAIHeadersMiddleware(req, res, next) {
  const originalSetHeader = res.setHeader;

  res.setHeader = function(name, value) {
    // Block AI provider headers
    const blockedHeaders = [
      'openai-',
      'anthropic-',
      'x-groq-',
      'x-cohere-',
      'x-ai-'
    ];

    const lowerName = name.toLowerCase();
    for (const blocked of blockedHeaders) {
      if (lowerName.startsWith(blocked)) {
        // Don't set this header
        return;
      }
    }

    // Obfuscate value if it contains model names
    const obfuscatedValue = typeof value === 'string'
      ? obfuscateModelName(value)
      : value;

    return originalSetHeader.call(this, name, obfuscatedValue);
  };

  next();
}

/**
 * Console log obfuscator (for production logs)
 */
function obfuscateConsoleOutput() {
  if (process.env.NODE_ENV !== 'production') return;

  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;

  console.log = function(...args) {
    const obfuscated = args.map(arg =>
      typeof arg === 'string' ? obfuscateModelName(arg) : arg
    );
    originalLog.apply(console, obfuscated);
  };

  console.error = function(...args) {
    const obfuscated = args.map(arg =>
      typeof arg === 'string' ? obfuscateModelName(arg) : arg
    );
    originalError.apply(console, obfuscated);
  };

  console.warn = function(...args) {
    const obfuscated = args.map(arg =>
      typeof arg === 'string' ? obfuscateModelName(arg) : arg
    );
    originalWarn.apply(console, obfuscated);
  };
}

/**
 * Get reverse mapping (for internal use only)
 * Never expose this to frontend!
 */
function getReverseMap() {
  const reverse = {};
  for (const [real, alias] of Object.entries(MODEL_OBFUSCATION_MAP)) {
    reverse[alias] = real;
  }
  return reverse;
}

module.exports = {
  obfuscateResponseMiddleware,
  removeAIHeadersMiddleware,
  obfuscateModelName,
  obfuscateObject,
  obfuscateConsoleOutput,
  MODEL_OBFUSCATION_MAP
};
