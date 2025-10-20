# AI OBFUSCATION QUICK REFERENCE GUIDE

## 🚀 QUICK START

### Import the Obfuscator
```javascript
const aiObfuscator = require('../lib/security/ai-obfuscator');
```

---

## 📋 COMMON PATTERNS

### 1. Replace Model Names
```javascript
// ❌ BEFORE (Exposed)
const model = 'claude-3-5-sonnet-20241022';

// ✅ AFTER (Obfuscated)
const model = aiObfuscator.resolveModel('STRATEGIC_REASONING_ENGINE');
```

### 2. Replace Provider Names
```javascript
// ❌ BEFORE (Exposed)
const provider = 'anthropic';

// ✅ AFTER (Obfuscated)
const provider = aiObfuscator.resolveProvider('PRIMARY_AI_PROVIDER');
```

### 3. Replace API Endpoints
```javascript
// ❌ BEFORE (Exposed)
const endpoint = 'https://api.anthropic.com/v1/messages';

// ✅ AFTER (Obfuscated)
const endpoint = aiObfuscator.resolveEndpoint('PRIMARY_ENDPOINT');
```

### 4. Sanitize Error Messages
```javascript
// ❌ BEFORE (Leaks Provider Info)
catch (error) {
  return res.json({ error: error.message });
}

// ✅ AFTER (Sanitized)
catch (error) {
  const sanitized = aiObfuscator.sanitizeError(error);
  return res.json({ error: sanitized.message });
}
```

### 5. Sanitize Response Headers
```javascript
// ❌ BEFORE (Exposes Provider Headers)
return response;

// ✅ AFTER (Cleaned)
const sanitizedHeaders = aiObfuscator.sanitizeHeaders(response.headers);
return { ...response, headers: sanitizedHeaders };
```

### 6. Validate No Leaks
```javascript
// Before sending response to client
const responseData = { model: 'strategic-reasoning', provider: 'Lydian AI' };

if (!aiObfuscator.validateNoLeaks(responseData)) {
  console.warn('⚠️ Potential leak detected in response');
}
```

---

## 🔑 AVAILABLE ALIASES

### Model Aliases
```javascript
aiObfuscator.MODEL.STRATEGIC_REASONING   // → claude-3-5-sonnet-20241022
aiObfuscator.MODEL.ADVANCED_PROCESSOR    // → claude-3-opus-20240229
aiObfuscator.MODEL.RAPID_RESPONSE        // → claude-3-haiku-20240307
aiObfuscator.MODEL.MULTIMODAL_VISION     // → claude-3-5-sonnet-20241022
aiObfuscator.MODEL.LEGACY_V3             // → claude-3-sonnet-20240229
```

### Provider Aliases
```javascript
aiObfuscator.PROVIDER.PRIMARY      // → anthropic
aiObfuscator.PROVIDER.SECONDARY    // → openai
aiObfuscator.PROVIDER.TERTIARY     // → perplexity
aiObfuscator.PROVIDER.MULTIMODAL   // → google
```

---

## 📝 NAMING CONVENTIONS

### User-Facing Names (Frontend/API Responses)
```javascript
// Use generic, branded names:
'Lydian AI'
'LyDian AI'
'Strategic Reasoning Engine'
'Advanced Language Processor'
'Rapid Response Unit'
```

### Internal Variable Names (Code)
```javascript
// Use descriptive but non-identifying names:
AI_CONFIG, AI_MODELS, AI_API_KEY
primaryAI, secondaryAI, fastAI
advancedModel, standardModel
```

### Console Logs
```javascript
// ❌ BEFORE
console.log('🤖 Calling Claude API...');

// ✅ AFTER
console.log('🤖 Calling Primary AI API...');
```

---

## 🛡️ SECURITY CHECKLIST

When modifying AI integration code:

- [ ] Import `aiObfuscator` at top of file
- [ ] Replace all hardcoded model names with `resolveModel()`
- [ ] Replace all hardcoded provider names with `resolveProvider()`
- [ ] Sanitize all error messages with `sanitizeError()`
- [ ] Use generic names in API responses (never "Claude", "GPT", etc.)
- [ ] Update console.log messages to be generic
- [ ] Sanitize headers with `sanitizeHeaders()`
- [ ] Validate responses with `validateNoLeaks()` before sending
- [ ] Run validation script: `node ops/security/validate-ai-obfuscation.js`

---

## 🔍 VALIDATION

### Run Validation Script
```bash
node /Users/sardag/Desktop/ailydian-ultra-pro/ops/security/validate-ai-obfuscation.js
```

### Check Specific File
```bash
grep -i "claude\|anthropic\|gpt-4\|openai" /path/to/file.js
```

---

## 🚫 BANNED TERMS IN API RESPONSES

**Never expose these terms to frontend:**
- claude, Claude
- anthropic, Anthropic
- gpt-4, GPT-4, gpt-3
- openai, OpenAI
- gemini, Gemini
- perplexity, Perplexity

**Always use instead:**
- Lydian AI, LyDian AI
- AI Model, Language Model
- Strategic Reasoning Engine
- Advanced Language Processor

---

## 🌐 ENVIRONMENT VARIABLES

### Standard Names (Keep These)
```env
ANTHROPIC_API_KEY=sk-ant-xxx
OPENAI_API_KEY=sk-xxx
GROQ_API_KEY=gsk_xxx
```

### Optional Aliases (For Extra Security)
```env
PRIMARY_AI_KEY=${ANTHROPIC_API_KEY}
SECONDARY_AI_KEY=${OPENAI_API_KEY}
RAPID_AI_KEY=${GROQ_API_KEY}
```

---

## 📚 EXAMPLES

### Example 1: Simple API Call
```javascript
const aiObfuscator = require('../lib/security/ai-obfuscator');

// Get obfuscated config
const config = aiObfuscator.createSecureConfig(
  'STRATEGIC_REASONING_ENGINE',  // Model alias
  'PRIMARY_AI_PROVIDER'           // Provider alias
);

// Use in API call
const response = await fetch(config.endpoint, {
  headers: {
    'x-api-key': config.apiKey,
    ...config.headers
  },
  body: JSON.stringify({ model: config.model })
});
```

### Example 2: Error Handling
```javascript
try {
  const result = await callAIAPI();
  return res.json({ success: true, result });
} catch (error) {
  const sanitized = aiObfuscator.sanitizeError(error);
  console.error('AI Error:', sanitized.message);
  return res.status(500).json({
    success: false,
    error: sanitized.message
  });
}
```

### Example 3: Response Validation
```javascript
const response = {
  model: 'strategic-reasoning',
  provider: 'Lydian AI',
  result: 'AI response here'
};

// Validate before sending
if (!aiObfuscator.validateNoLeaks(response)) {
  console.warn('Response contains sensitive terms!');
}

res.json(response);
```

---

## 🔧 TROUBLESHOOTING

### "Model alias not found"
```javascript
// Make sure alias exists in ai-obfuscator.js
// Check: AI_MODEL_REGISTRY in /lib/security/ai-obfuscator.js
```

### "Validation script shows violations"
```javascript
// Expected in Phase 1 - only core files are obfuscated
// For new files, follow patterns in chat-claude.js
```

### "API key not found"
```javascript
// Ensure .env has both standard and alias keys
ANTHROPIC_API_KEY=sk-ant-xxx
PRIMARY_AI_KEY=${ANTHROPIC_API_KEY}
```

---

## 📂 KEY FILES

- **Security Layer:** `/lib/security/ai-obfuscator.js`
- **Validation Script:** `/ops/security/validate-ai-obfuscation.js`
- **Example Implementation:** `/api/chat-claude.js`
- **Multi-Provider Example:** `/api/lydian-iq/solve.js`

---

## ✅ BEST PRACTICES

1. **Always obfuscate at the source** - Don't hardcode provider names
2. **Sanitize all errors** - Never let provider errors reach the frontend
3. **Use environment variables** - Never commit API keys
4. **Validate responses** - Check for leaks before sending to client
5. **Generic console logs** - Help debugging without exposing providers
6. **Test thoroughly** - Ensure functionality unchanged after obfuscation

---

**Last Updated:** 2025-10-12
**Version:** 1.0
**Status:** Production Ready
