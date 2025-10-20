# 🎭 ANONYMIZATION MIGRATION GUIDE
**Phase 1 Week 2 - Model Provider Anonymization**

---

## 📋 OVERVIEW

This guide helps developers migrate from hardcoded AI provider/model names to the anonymized ModelProviderAdapter pattern.

**Goal:** Hide all AI provider details from codebase, using abstract model IDs (m1, m2, m3...) instead of real model names (gpt-4o, claude-3-5-sonnet...).

---

## 🎯 MODEL ID MAPPING

### Current Model Registry

| Model ID | Tier | Specialization | Use Case |
|----------|------|----------------|----------|
| m1 | Premium | General | Default, Medical, Legal |
| m2 | Premium | General | Alternative/Fallback |
| m3 | Standard | General | Cost-effective queries |
| m4 | Premium | Reasoning | Coding, Complex analysis |
| m5 | Experimental | Multimodal | Vision, Video |
| m6 | Fast | Speed | Quick responses |
| m7 | Basic | Simple | Basic queries |

### Semantic Aliases

| Alias | Maps To | Description |
|-------|---------|-------------|
| default | m1 | Default model |
| medical | m1 | Medical queries |
| legal | m1 | Legal queries |
| general | m3 | General queries |
| coding | m4 | Code generation |
| vision | m5 | Image analysis |
| fast | m6 | Fast responses |

---

## 🔧 MIGRATION STEPS

### Step 1: Remove Hardcoded Model Names

**Before:**
```javascript
const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
        model: 'gpt-4o',  // ❌ HARDCODED
        messages: messages
    })
});
```

**After:**
```javascript
const { getAdapter } = require('../core/ai/ModelProviderAdapter');

const adapter = getAdapter();
const response = await adapter.complete('m1', messages, {
    temperature: 0.7,
    maxTokens: 1000
});
```

---

### Step 2: Remove Hardcoded Credentials

**Before:**
```javascript
const redis = new Redis({
    url: process.env.REDIS_URL || 'https://default-redis.io',  // ❌ HARDCODED FALLBACK
    token: process.env.REDIS_TOKEN || 'default-token'  // ❌ HARDCODED FALLBACK
});
```

**After:**
```javascript
if (!process.env.REDIS_URL || !process.env.REDIS_TOKEN) {
    throw new Error('Redis credentials not configured');
}

const redis = new Redis({
    url: process.env.REDIS_URL,  // ✅ NO FALLBACK
    token: process.env.REDIS_TOKEN  // ✅ NO FALLBACK
});
```

---

### Step 3: Update Cost Tracking

**Before:**
```javascript
const TOKEN_COSTS = {
    'gpt-4o': { input: 2.50, output: 10.00 },  // ❌ EXPOSES MODEL NAME
    'claude-3-5-sonnet': { input: 3.00, output: 15.00 }
};
```

**After:**
```javascript
const TOKEN_COSTS = {
    'm1': { input: 2.50, output: 10.00 },  // ✅ ANONYMOUS
    'm4': { input: 3.00, output: 15.00 }
};
```

---

### Step 4: Update User Preferences

**Before:**
```javascript
const preferences = {
    aiModel: {
        default: 'gpt-4o',  // ❌ EXPOSES MODEL
        medical: 'gpt-4o',
        coding: 'claude-3-5-sonnet'
    }
};
```

**After:**
```javascript
const preferences = {
    aiModel: {
        default: 'm1',  // ✅ ANONYMOUS
        medical: 'm1',
        coding: 'm4'
    }
};
```

---

## 📝 MIGRATION CHECKLIST

### For Each File:

- [ ] Check for hardcoded model names (gpt-4o, claude, gemini, etc.)
- [ ] Replace with model IDs (m1, m2, m3...)
- [ ] Check for hardcoded API endpoints
- [ ] Replace with ModelProviderAdapter calls
- [ ] Check for hardcoded credentials with `||` fallbacks
- [ ] Remove fallbacks, require environment variables
- [ ] Test the endpoint/function
- [ ] Update any related documentation

### Validation:

```bash
# Run string-guard to find remaining violations
node ops/tools/string-guard.js --report=json

# Check for secret fallbacks
grep -r "process.env.*||" --include="*.js"
```

---

## 🎓 EXAMPLES

### Example 1: API Endpoint Migration

**File:** `api/chat.js`

**Before:**
```javascript
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'sk-default'  // ❌ BAD
});

const response = await openai.chat.completions.create({
    model: 'gpt-4o',  // ❌ HARDCODED
    messages: messages
});
```

**After:**
```javascript
const { getAdapter } = require('../core/ai/ModelProviderAdapter');

const adapter = getAdapter({ debug: false });

try {
    const response = await adapter.complete('m1', messages, {
        temperature: 0.7,
        maxTokens: 1000
    });

    return res.json({
        success: true,
        content: response.content,
        modelId: response.modelId  // Returns 'm1', not 'gpt-4o'
    });
} catch (error) {
    // Adapter handles fallback automatically
    return res.status(500).json({ error: error.message });
}
```

---

### Example 2: Preference Store Migration

**File:** `lib/storage/redis-preferences-store.js`

**Changes Made:**
1. ✅ Removed hardcoded Redis credentials
2. ✅ Replaced model names with model IDs
3. ✅ Added error handling for missing credentials

**Status:** ✅ MIGRATED (Phase 1 Week 2)

---

### Example 3: Analytics Store Migration

**File:** `lib/analytics/redis-analytics-store.js`

**Changes Made:**
1. ✅ Removed hardcoded Redis credentials
2. ✅ Replaced TOKEN_COSTS keys with model IDs
3. ✅ Updated fallback logic to use 'default' instead of 'gpt-4o-mini'

**Status:** ✅ MIGRATED (Phase 1 Week 2)

---

## 🔍 FINDING FILES TO MIGRATE

### Search Commands:

```bash
# Find files with model names
grep -r "gpt-4o\|claude\|gemini" --include="*.js" | wc -l

# Find files with secret fallbacks
grep -r "process.env.*||" --include="*.js"

# Run comprehensive scan
node ops/tools/string-guard.js --report=json --output=violations.json
```

### Priority Files:

1. **High Priority** (API endpoints):
   - `api/chat.js`
   - `api/lydian-iq/solve.js`
   - `api/medical/*.js`

2. **Medium Priority** (Services):
   - `services/azure-openai-service.js`
   - `lib/storage/*.js`
   - `lib/analytics/*.js`

3. **Low Priority** (Tests, configs):
   - `test-*.js`
   - `config/*.js`

---

## ✅ COMPLETED MIGRATIONS

### Week 2 - Completed:

1. ✅ **core/ai/ModelProviderAdapter.js** - Created
2. ✅ **lib/storage/redis-preferences-store.js** - Migrated
3. ✅ **lib/analytics/redis-analytics-store.js** - Migrated
4. ✅ **api/ai-proxy.js** - Uses model IDs
5. ✅ **.github/workflows/security-scan.yml** - String-guard CI

---

## 🚀 TESTING AFTER MIGRATION

### Manual Tests:

```bash
# Test model adapter
node -e "
const {getAdapter} = require('./core/ai/ModelProviderAdapter');
const adapter = getAdapter({debug: true});
adapter.complete('m1', [{role:'user',content:'test'}], {maxTokens:50})
  .then(r => console.log('Success:', r.modelId))
  .catch(e => console.error('Error:', e.message));
"

# Test preferences with new model IDs
curl http://localhost:3100/api/user/preferences

# Test analytics cost calculation
# Should work with model IDs m1, m2, m3...
```

### Automated Tests:

```bash
# Run string-guard CI check
npm run security:scan

# Or manually:
node ops/tools/string-guard.js --report=json

# Should show reduced violations compared to baseline
```

---

## 📊 MIGRATION PROGRESS

**Baseline:**
- Total files with violations: **1,275**
- Critical violations: **4,842**
- Files with secret fallbacks: **6,183 instances**

**Week 2 Progress:**
- Files migrated: **3** (preferences, analytics, adapter)
- Remaining critical files: ~**124**
- Target for Week 2: **50% reduction**

---

## 🔐 SECURITY BENEFITS

**After Migration:**

1. ✅ **No Provider Names** in codebase
2. ✅ **No API Endpoints** hardcoded
3. ✅ **No Credentials** with fallbacks
4. ✅ **Unified Interface** for all providers
5. ✅ **Automatic Fallback** on failures
6. ✅ **Cost Tracking** anonymized
7. ✅ **CI Enforcement** via string-guard

---

## 📞 SUPPORT

**Questions?**
- Review: `ops/reports/BRIEF-0-SECURITY-DISCOVERY.md`
- Check: `core/ai/ModelProviderAdapter.js` for examples
- Test: `node ops/tools/string-guard.js`

**Common Issues:**

**Q: Adapter returns error "Unknown model ID"**
A: Check ModelProviderAdapter.js registry, ensure model ID exists

**Q: API calls failing after migration**
A: Check environment variables, ensure API keys are set

**Q: String-guard still finding violations**
A: Some files may have model names in comments - update or add exceptions

---

**Last Updated:** 2025-10-07
**Phase:** 1 Week 2
**Status:** In Progress

**Next:** Continue migrating remaining 124 critical files
