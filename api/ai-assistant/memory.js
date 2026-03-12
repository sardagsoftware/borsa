/**
 * AILYDIAN AI Personal Assistant — Memory System
 * Persistent user preferences and conversation context stored in Upstash Redis
 *
 * Memory types:
 * - prefs: User preferences (language, style, interests)
 * - facts: Learned facts about the user
 * - recent: Recent conversation summaries (last 20)
 */

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const useUpstash = !!(UPSTASH_URL && UPSTASH_TOKEN);

// In-memory fallback
const memoryFallback = new Map();

async function redis(command, ...args) {
  if (!useUpstash) return null;
  try {
    const response = await fetch(UPSTASH_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([command, ...args]),
    });
    const data = await response.json();
    return data.result;
  } catch (_err) {
    return null;
  }
}

/**
 * Save a preference for a user
 */
async function savePref(userId, key, value) {
  if (useUpstash) {
    await redis('HSET', `chat:memory:${userId}:prefs`, key, value);
    await redis('EXPIRE', `chat:memory:${userId}:prefs`, 365 * 24 * 60 * 60); // 1 year
  } else {
    const prefs = memoryFallback.get(`prefs:${userId}`) || {};
    prefs[key] = value;
    memoryFallback.set(`prefs:${userId}`, prefs);
  }
}

/**
 * Get all preferences for a user
 */
async function getPrefs(userId) {
  if (useUpstash) {
    const data = await redis('HGETALL', `chat:memory:${userId}:prefs`);
    if (!data || data.length === 0) return {};
    const prefs = {};
    for (let i = 0; i < data.length; i += 2) {
      prefs[data[i]] = data[i + 1];
    }
    return prefs;
  }
  return memoryFallback.get(`prefs:${userId}`) || {};
}

/**
 * Save a fact about the user
 */
async function saveFact(userId, fact) {
  if (useUpstash) {
    await redis('LPUSH', `chat:memory:${userId}:facts`, fact);
    await redis('LTRIM', `chat:memory:${userId}:facts`, 0, 49); // Keep last 50 facts
    await redis('EXPIRE', `chat:memory:${userId}:facts`, 365 * 24 * 60 * 60);
  } else {
    const facts = memoryFallback.get(`facts:${userId}`) || [];
    facts.unshift(fact);
    if (facts.length > 50) facts.length = 50;
    memoryFallback.set(`facts:${userId}`, facts);
  }
}

/**
 * Get user facts
 */
async function getFacts(userId, limit = 10) {
  if (useUpstash) {
    return (await redis('LRANGE', `chat:memory:${userId}:facts`, 0, limit - 1)) || [];
  }
  return (memoryFallback.get(`facts:${userId}`) || []).slice(0, limit);
}

/**
 * Get memory context string for AI prompt injection
 */
async function getMemoryContext(userId) {
  try {
    const prefs = await getPrefs(userId);
    const facts = await getFacts(userId, 5);

    const parts = [];
    if (prefs.language) parts.push(`Tercih edilen dil: ${prefs.language}`);
    if (prefs.name) parts.push(`Isim: ${prefs.name}`);
    if (prefs.interests) parts.push(`Ilgi alanlari: ${prefs.interests}`);
    if (facts.length > 0) parts.push(`Bilinen bilgiler: ${facts.join('; ')}`);

    return parts.length > 0 ? parts.join('. ') : null;
  } catch (_err) {
    return null;
  }
}

/**
 * Auto-save memory from conversation (fire-and-forget)
 * Extracts preferences and facts from user message + AI response
 */
async function saveMemory(userId, userMessage, aiResponse) {
  try {
    // Simple heuristic extraction — detect name mentions
    const nameMatch = userMessage.match(/\bbenim\s+adim\s+(\w+)/i) ||
                      userMessage.match(/\bmy\s+name\s+is\s+(\w+)/i);
    if (nameMatch) {
      await savePref(userId, 'name', nameMatch[1]);
    }

    // Detect language preference
    const turkishChars = (userMessage.match(/[çğıöşü]/g) || []).length;
    if (turkishChars > 2) {
      await savePref(userId, 'language', 'tr');
    } else if (userMessage.length > 20 && turkishChars === 0) {
      await savePref(userId, 'language', 'en');
    }

    // Save significant exchanges as facts (over 100 chars of meaningful content)
    if (userMessage.length > 50 && aiResponse.length > 100) {
      const summary = userMessage.substring(0, 100).replace(/\n/g, ' ');
      await saveFact(userId, `${new Date().toISOString().split('T')[0]}: ${summary}`);
    }
  } catch (_err) {
    // Silent fail — memory is non-critical
  }
}

/**
 * Clear all memory for a user
 */
async function clearMemory(userId) {
  if (useUpstash) {
    await redis('DEL', `chat:memory:${userId}:prefs`);
    await redis('DEL', `chat:memory:${userId}:facts`);
  } else {
    memoryFallback.delete(`prefs:${userId}`);
    memoryFallback.delete(`facts:${userId}`);
  }
}

module.exports = {
  savePref,
  getPrefs,
  saveFact,
  getFacts,
  getMemoryContext,
  saveMemory,
  clearMemory,
};
