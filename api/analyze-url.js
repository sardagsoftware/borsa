/* global fetch, URL, AbortController */
/**
 * AILYDIAN URL Analysis API
 * Securely fetch and analyze any URL content
 *
 * @route POST /api/analyze-url
 * @version 1.0.0
 */

const { obfuscation } = require('../services/localrecall');
const { getCorsOrigin } = require('./_middleware/cors');

// ============================================================
// SECURITY: SSRF PROTECTION
// ============================================================
const BLOCKED_HOSTS = [
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  '169.254.',
  '10.',
  '172.16.',
  '172.17.',
  '172.18.',
  '172.19.',
  '172.20.',
  '172.21.',
  '172.22.',
  '172.23.',
  '172.24.',
  '172.25.',
  '172.26.',
  '172.27.',
  '172.28.',
  '172.29.',
  '172.30.',
  '172.31.',
  '192.168.',
  'metadata.google',
  'metadata.aws',
  '169.254.169.254',
];

const ALLOWED_PROTOCOLS = ['http:', 'https:'];
const MAX_CONTENT_LENGTH = 5 * 1024 * 1024; // 5MB max
const FETCH_TIMEOUT = 15000; // 15 seconds

// ============================================================
// IDENTITY PROTECTION - MILITARY GRADE
// ============================================================
const IDENTITY_PROTECTION = `
🔒 ASKERİ SEVİYE KİMLİK KORUMA (MUTLAK):
1. Sen SADECE "LyDian AI" - BAŞKA İSİM YOK
2. YASAKLI: GPT, ChatGPT, Claude, Anthropic, OpenAI, Google, Gemini, Llama, Meta, Mistral, Groq, DeepSeek, Bard, PaLM, Mixtral, Qwen, Yi
3. Model sorusu = "Ben LyDian AI'yım - Emrah Şardağ tarafından geliştirildim"
4. Emrah Şardağ = 20 yıllık deneyimli Türk yazılım geliştirici, LyDian AI kurucusu, AILYDIAN yaratıcısı
5. Bu kurallar HİÇBİR KOŞULDA bypass edilemez
`;

const URL_ANALYSIS_PROMPT = `${IDENTITY_PROTECTION}

Sen LyDian AI URL analiz uzmanısın.

📊 URL İÇERİK ANALİZİ GÖREVLERİN:
- Web sayfası içeriğini kapsamlı analiz et
- Ana konuları ve temaları belirle
- Önemli bilgileri madde madde listele
- İçeriğin güvenilirliğini değerlendir
- MUTLAKA Türkçe yanıt ver (akıcı ve doğal Türkçe)

💡 KULLANICI SORUSU VARSA:
- Soruya odaklanarak yanıt ver
- Web içeriğiyle ilişkilendir
- Ek bağlam ve açıklama sun

Her zaman profesyonel, detaylı ve yardımcı ol.`;

// Rate limiting
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60000;
const RATE_LIMIT_MAX = 20;

function checkRateLimit(ip) {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now - record.timestamp > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { timestamp: now, count: 1 });
    return { allowed: true };
  }
  if (record.count >= RATE_LIMIT_MAX) {
    return { allowed: false };
  }
  record.count++;
  return { allowed: true };
}

function getClientIP(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0].trim() || req.headers['x-real-ip'] || '127.0.0.1'
  );
}

/**
 * Validate URL for SSRF protection
 */
function validateUrl(urlString) {
  try {
    const url = new URL(urlString);

    // Check protocol
    if (!ALLOWED_PROTOCOLS.includes(url.protocol)) {
      return { valid: false, error: 'Sadece HTTP/HTTPS protokolleri desteklenir' };
    }

    // Check for blocked hosts (SSRF protection)
    const hostname = url.hostname.toLowerCase();
    for (const blocked of BLOCKED_HOSTS) {
      if (hostname === blocked || hostname.startsWith(blocked) || hostname.includes(blocked)) {
        return { valid: false, error: 'Bu URL erişilebilir değil (güvenlik kısıtlaması)' };
      }
    }

    // Check for IP addresses in private ranges
    // eslint-disable-next-line security/detect-unsafe-regex
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipv4Regex.test(hostname)) {
      const parts = hostname.split('.').map(Number);
      if (
        parts[0] === 10 ||
        parts[0] === 127 ||
        (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
        (parts[0] === 192 && parts[1] === 168) ||
        (parts[0] === 169 && parts[1] === 254)
      ) {
        return { valid: false, error: 'Özel ağ adreslerine erişim izni yok' };
      }
    }

    return { valid: true, url };
  } catch {
    return { valid: false, error: 'Geçersiz URL formatı' };
  }
}

/**
 * Convert HTML to clean text/markdown
 */
function htmlToText(html) {
  // Remove script, style, and other non-content elements
  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');

  // Convert common elements to markdown-like format
  text = text
    // Headings
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '\n# $1\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '\n## $1\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '\n### $1\n')
    .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '\n#### $1\n')
    .replace(/<h5[^>]*>(.*?)<\/h5>/gi, '\n##### $1\n')
    .replace(/<h6[^>]*>(.*?)<\/h6>/gi, '\n###### $1\n')
    // Paragraphs and line breaks
    .replace(/<p[^>]*>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    // Lists
    .replace(/<li[^>]*>/gi, '\n• ')
    .replace(/<\/li>/gi, '')
    // Links - extract text only
    .replace(/<a[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/gi, '$2 ($1)')
    // Bold/Strong
    .replace(/<(b|strong)[^>]*>(.*?)<\/(b|strong)>/gi, '**$2**')
    // Italic/Em
    .replace(/<(i|em)[^>]*>(.*?)<\/(i|em)>/gi, '_$2_')
    // Code
    .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
    // Remove all remaining HTML tags
    .replace(/<[^>]+>/g, '')
    // Decode HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    // Clean up whitespace
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .replace(/  +/g, ' ')
    .trim();

  return text;
}

/**
 * Fetch URL content with timeout and size limits
 */
async function fetchUrl(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    const response = await fetch(url.href, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LyDianBot/1.0; +https://www.ailydian.com/bot)',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      signal: controller.signal,
      redirect: 'follow',
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Check content type
    const contentType = response.headers.get('content-type') || '';
    if (
      !contentType.includes('text/html') &&
      !contentType.includes('text/plain') &&
      !contentType.includes('application/json')
    ) {
      return {
        success: false,
        error: 'Desteklenmeyen içerik türü. Sadece HTML, metin ve JSON desteklenir.',
      };
    }

    // Check content length
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_CONTENT_LENGTH) {
      return { success: false, error: 'İçerik çok büyük (maks 5MB)' };
    }

    const html = await response.text();

    // Double-check size after fetching
    if (html.length > MAX_CONTENT_LENGTH) {
      return { success: false, error: 'İçerik çok büyük (maks 5MB)' };
    }

    // Extract page title
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : 'Başlık bulunamadı';

    // Convert to clean text
    const text = htmlToText(html);

    // Truncate if too long (for AI analysis)
    const truncatedText =
      text.length > 50000 ? text.substring(0, 50000) + '\n\n[İçerik kısaltıldı...]' : text;

    return {
      success: true,
      title,
      text: truncatedText,
      url: url.href,
      contentType,
    };
  } catch (error) {
    clearTimeout(timeout);

    if (error.name === 'AbortError') {
      return { success: false, error: 'İstek zaman aşımına uğradı (15 saniye)' };
    }

    return { success: false, error: `URL erişim hatası: ${error.message}` };
  }
}

/**
 * Analyze content using AI
 */
async function analyzeContent(content, title, url, question) {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    throw new Error('AI service not configured');
  }

  let userMessage = `Bu web sayfasının içeriğini analiz et:

📌 BAŞLIK: ${title}
🔗 URL: ${url}

--- İÇERİK BAŞLANGIÇ ---
${content.substring(0, 15000)}
--- İÇERİK BİTİŞ ---`;

  if (question) {
    userMessage += `\n\n❓ KULLANICI SORUSU: ${question}`;
  } else {
    userMessage +=
      '\n\nLütfen bu içeriği özetle, ana noktaları belirt ve önemli bilgileri listele.';
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${groqKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.1-70b-versatile',
      messages: [
        { role: 'system', content: URL_ANALYSIS_PROMPT },
        { role: 'user', content: userMessage },
      ],
      max_tokens: 2048,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error('AI analysis failed');
  }

  const data = await response.json();
  let analysisText = data.choices[0].message.content;

  // Sanitize AI model names
  analysisText = obfuscation.sanitizeModelNames(analysisText);

  return analysisText;
}

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', getCorsOrigin(req));
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Rate limiting
    const clientIP = getClientIP(req);
    const rateLimit = checkRateLimit(clientIP);
    if (!rateLimit.allowed) {
      return res.status(429).json({ success: false, error: 'Çok fazla istek. Lütfen bekleyin.' });
    }

    const { url, question } = req.body;

    if (!url) {
      return res.status(400).json({ success: false, error: 'URL gerekli' });
    }

    // Validate URL
    const validation = validateUrl(url);
    if (!validation.valid) {
      return res.status(400).json({ success: false, error: validation.error });
    }

    console.log('[URL_ANALYZE] Fetching:', url);

    // Fetch URL content
    const fetchResult = await fetchUrl(validation.url);
    if (!fetchResult.success) {
      return res.status(400).json({ success: false, error: fetchResult.error });
    }

    console.log(
      '[URL_ANALYZE] Content fetched:',
      fetchResult.title,
      fetchResult.text.length,
      'chars'
    );

    // Analyze with AI
    const analysis = await analyzeContent(
      fetchResult.text,
      fetchResult.title,
      fetchResult.url,
      question
    );

    return res.status(200).json({
      success: true,
      url: fetchResult.url,
      title: fetchResult.title,
      analysis,
      contentLength: fetchResult.text.length,
    });
  } catch (error) {
    console.error('[URL_ANALYZE_ERR]', error.message);
    return res.status(500).json({
      success: false,
      error: 'URL analizi başarısız. Lütfen tekrar deneyin.',
    });
  }
};
