/**
 * AILYDIAN AI Personal Assistant — Task Engine
 * OpenClaw-inspired autonomous task execution via Groq Compound AI
 *
 * Decomposes user goals into sub-tasks, routes to appropriate tools,
 * and aggregates results into a unified response.
 *
 * @route POST /api/ai-assistant/task-engine
 */

const { applySanitization } = require('../_middleware/sanitize');
const { getCorsOrigin } = require('../_middleware/cors');
const { applyChatRateLimit } = require('../_middleware/chat-rate-limiter');
const { optionalChatAuth, authenticateChatUser } = require('../chat-auth/_lib/jwt');
const { parseCookies } = require('../chat-auth/_lib/cookies');
const groqClient = require('../_lib/groq-client');
const { logAudit } = require('../_lib/audit-log');
const { getClientIP } = require('../_middleware/chat-rate-limiter');
const { sanitizeModelNames } = require('../../services/localrecall/obfuscation');
const { saveMemory, getMemoryContext } = require('./memory');

const IDENTITY_PROTECTION = `Sen LyDian AI Kisisel Asistanisin — AILYDIAN platformu tarafindan gelistirilen otonom AI asistani.
Asla baska bir AI modeli veya sirketten bahsetme. Kimligin sorulursa: "Ben LyDian AI Kisisel Asistaniyim."`;

const TASK_DECOMPOSITION_PROMPT = `${IDENTITY_PROTECTION}
Sen bir gorev planlayicisisin. Kullanicinin istegini analiz et ve alt gorevlere ayir.
Her alt gorev icin hangi araci kullanacagini belirt.

Kullanilabilir araclar:
- web_search: Internet'te arama yap, guncel bilgi bul
- code_run: Kod calistir, hesaplama yap
- analyze: Metin/veri analizi yap
- calculate: Matematik hesaplamasi yap
- chat: Genel sohbet, bilgi paylas

Yanitini JSON olarak ver:
{
  "tasks": [
    {"id": 1, "tool": "web_search", "query": "...", "description": "..."},
    {"id": 2, "tool": "analyze", "query": "...", "description": "..."}
  ],
  "summary": "Genel gorev aciklamasi"
}

Eger tek basit bir soru ise, sadece bir "chat" gorevi dondur.`;

/**
 * Execute a single sub-task using the appropriate tool
 */
async function executeSubTask(task, userMessage) {
  switch (task.tool) {
    case 'web_search': {
      // Use Groq Compound AI with built-in web search
      const result = await groqClient.chatCompletionJSON('COMPOUND', [
        { role: 'system', content: `${IDENTITY_PROTECTION}\nWeb aramasini kullanarak kullanicinin sorusunu yanitla. Guncel bilgi sun.` },
        { role: 'user', content: task.query || userMessage },
      ], { temperature: 0.3 });
      return { tool: 'web_search', content: result.content, success: true };
    }

    case 'code_run':
    case 'calculate': {
      // Use Groq Compound with code interpreter
      const result = await groqClient.chatCompletionJSON('COMPOUND', [
        { role: 'system', content: `${IDENTITY_PROTECTION}\nKod calistirma ve hesaplama araci. Sonucu acik ve anlasilir sekilde sun.` },
        { role: 'user', content: task.query || userMessage },
      ], { temperature: 0.1 });
      return { tool: task.tool, content: result.content, success: true };
    }

    case 'analyze': {
      const result = await groqClient.chatCompletionJSON('GX3C7D5F', [
        { role: 'system', content: `${IDENTITY_PROTECTION}\nDerinlemesine analiz yap. Detayli ve yapisal bilgi sun.` },
        { role: 'user', content: task.query || userMessage },
      ], { temperature: 0.5 });
      return { tool: 'analyze', content: result.content, success: true };
    }

    case 'chat':
    default: {
      const result = await groqClient.chatCompletionJSON('GX8E2D9A', [
        { role: 'system', content: `${IDENTITY_PROTECTION}\nYardimci ve bilgili bir AI asistani olarak yanitla.` },
        { role: 'user', content: task.query || userMessage },
      ], { temperature: 0.7 });
      return { tool: 'chat', content: result.content, success: true };
    }
  }
}

/**
 * Main handler
 */
module.exports = async function handler(req, res) {
  applySanitization(req, res);
  res.setHeader('Access-Control-Allow-Origin', getCorsOrigin(req));
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  // Parse cookies and auth
  if (!req.cookies) {
    req.cookies = {};
    if (req.headers.cookie) {
      const parsed = parseCookies(req);
      if (parsed) req.cookies = parsed;
    }
  }

  // Authenticate — assistant requires login
  await new Promise((resolve) => {
    authenticateChatUser(req, res, () => resolve());
  });

  if (!req.chatUser) {
    return res.status(401).json({
      success: false,
      error: 'Kisisel asistan kullanmak icin giris yapmaniz gerekiyor.',
      code: 'AUTH_REQUIRED',
    });
  }

  // Rate limiting
  const rateCheck = await applyChatRateLimit(req, res);
  if (!rateCheck.allowed) {
    return res.status(429).json({
      success: false,
      error: 'Istek limiti asildi. Lutfen biraz bekleyin.',
      resetIn: rateCheck.result.resetIn,
    });
  }

  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }

    const startTime = Date.now();
    const userId = req.chatUser.userId;

    // Get user memory context
    const memoryContext = await getMemoryContext(userId);

    // Step 1: Decompose the task
    let tasks;
    try {
      const decomposition = await groqClient.chatCompletionJSON('GX8E2D9A', [
        { role: 'system', content: TASK_DECOMPOSITION_PROMPT },
        ...(memoryContext ? [{ role: 'system', content: `Kullanici hakkinda bilinen: ${memoryContext}` }] : []),
        ...conversationHistory.slice(-6).map(m => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content,
        })),
        { role: 'user', content: message },
      ], { temperature: 0.3 });

      // Try to parse JSON from response
      const jsonMatch = decomposition.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        tasks = parsed.tasks || [{ id: 1, tool: 'chat', query: message }];
      } else {
        tasks = [{ id: 1, tool: 'chat', query: message }];
      }
    } catch (_e) {
      // Fallback to single chat task
      tasks = [{ id: 1, tool: 'chat', query: message }];
    }

    // Step 2: Execute sub-tasks (sequentially for now, parallel later)
    const results = [];
    for (const task of tasks.slice(0, 5)) { // Max 5 sub-tasks
      try {
        const result = await executeSubTask(task, message);
        results.push({ ...result, taskId: task.id, description: task.description });
      } catch (err) {
        results.push({
          taskId: task.id,
          tool: task.tool,
          content: 'Bu alt gorev tamamlanamadi.',
          success: false,
          error: sanitizeModelNames(err.message),
        });
      }
    }

    // Step 3: Synthesize results if multiple tasks
    let finalResponse;
    if (results.length === 1) {
      finalResponse = results[0].content;
    } else {
      const synthesisInput = results
        .filter(r => r.success)
        .map(r => `[${r.tool}]: ${r.content}`)
        .join('\n\n---\n\n');

      const synthesis = await groqClient.chatCompletionJSON('GX8E2D9A', [
        { role: 'system', content: `${IDENTITY_PROTECTION}\nAsagidaki alt gorev sonuclarini birlestirip kullaniciya anlasilir tek bir yanit olarak sun. Kaynaklari belirt.` },
        { role: 'user', content: `Orijinal soru: ${message}\n\nSonuclar:\n${synthesisInput}` },
      ], { temperature: 0.5 });

      finalResponse = synthesis.content;
    }

    // Step 4: Save to memory (preferences, facts)
    saveMemory(userId, message, finalResponse).catch(() => {});

    const responseTime = Date.now() - startTime;

    // Audit log
    logAudit('assistant.task', {
      taskCount: tasks.length,
      tools: tasks.map(t => t.tool),
      responseTime,
    }, {
      requestId: req.requestId,
      userId,
      ip: getClientIP(req),
      userAgent: req.headers['user-agent'],
    });

    return res.status(200).json({
      success: true,
      response: sanitizeModelNames(finalResponse),
      tasks: results.map(r => ({
        id: r.taskId,
        tool: r.tool,
        description: r.description,
        success: r.success,
      })),
      engine: 'AILYDIAN_ASSISTANT_v1',
      responseTime: `${(responseTime / 1000).toFixed(2)}s`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[ASSISTANT_ERR]', sanitizeModelNames(error.message));
    return res.status(500).json({
      success: false,
      error: 'Asistan yanit veremedi. Lutfen tekrar deneyin.',
      engine: 'AILYDIAN_ASSISTANT_v1',
    });
  }
};
