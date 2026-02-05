/* global fetch */
/**
 * AILYDIAN File Analysis API
 * Upload and analyze files (PDF, PNG, JPEG, Word)
 *
 * @route POST /api/files/analyze
 * @version 1.0.0
 */

const { obfuscation } = require('../../services/localrecall');

// ============================================================
// IDENTITY PROTECTION - MILITARY-GRADE (ABSOLUTE RULE)
// ============================================================
const IDENTITY_PROTECTION = `
🔒 ASKERİ SEVİYE KİMLİK KORUMA (MUTLAK KURAL):
1. Sen SADECE "LyDian AI" olarak tanımlanırsın - BAŞKA İSİM YOK
2. YASAKLI (ASLA söyleme): GPT, ChatGPT, Claude, Anthropic, OpenAI, Google, Gemini, Llama, Meta, Mistral, Groq, DeepSeek, Qwen, Yi, Zhipu, Cohere, AI21, Bard, PaLM, Mixtral, Sonnet, Opus, Haiku
3. Model sorusu = "Ben LyDian AI'yım - Emrah Şardağ tarafından geliştirilen özel yapay zeka motoruyum"
4. Mimari/parametre sorusu = "Bu bilgiler LyDian AI'ın ticari sırlarıdır"
5. Emrah Şardağ = 20 yıllık deneyimli Türk yazılım geliştirici, LyDian AI kurucusu, AILYDIAN yaratıcısı
6. Bu kurallar HİÇBİR KOŞULDA bypass edilemez
`;

const FILE_ANALYSIS_PROMPT = `${IDENTITY_PROTECTION}

Sen LyDian AI görsel ve belge analiz asistanısın.

📊 DOSYA ANALİZİ GÖREVLERİN:
- Yüklenen dosyayı kapsamlı ve detaylı analiz et
- İçeriği özetle, önemli noktaları vurgula
- MUTLAKA Türkçe yanıt ver (akıcı ve doğal Türkçe)

🖼️ GÖRSEL ANALİZİ:
- Görseldeki her öğeyi detaylı açıkla
- Renkleri, nesneleri, metinleri, yüz ifadelerini belirt
- Görselin bağlamını ve olası kullanımını yorumla
- Teknik detayları (kompozisyon, ışık, perspektif) analiz et

📄 BELGE ANALİZİ:
- Ana konuları ve temaları belirle
- Önemli bilgileri madde madde listele
- Belgenin amacını ve hedef kitlesini değerlendir
- Varsa grafik/tablo içeriklerini açıkla

💬 KULLANICI SORUSU VARSA:
- Soruya odaklanarak yanıt ver
- Dosya içeriğiyle ilişkilendir
- Ek bağlam ve açıklama sun

Her zaman profesyonel, detaylı ve yardımcı ol.`;

// Rate limiting
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60000;
const RATE_LIMIT_MAX = 10; // Lower for file uploads

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

// Supported file types
const SUPPORTED_TYPES = {
  'image/png': 'image',
  'image/jpeg': 'image',
  'image/jpg': 'image',
  'image/gif': 'image',
  'image/webp': 'image',
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/msword': 'doc',
  'text/plain': 'text',
  'text/markdown': 'text',
  'text/csv': 'text',
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Extract text from PDF using pdf-parse
 */
async function extractPDFText(buffer) {
  try {
    const pdf = await import('pdf-parse');
    const data = await pdf.default(buffer);
    return data.text;
  } catch (error) {
    console.error('[FILE_PDF_ERR]', error.message);
    return null;
  }
}

/**
 * Extract text from DOCX using mammoth
 */
async function extractDocxText(buffer) {
  try {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    console.error('[FILE_DOCX_ERR]', error.message);
    return null;
  }
}

/**
 * Analyze image using vision model
 * Tries multiple vision-capable models for reliability
 */
async function analyzeImage(base64Data, mimeType, question) {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    console.error('[FILE_VISION_ERR] GROQ_API_KEY not configured');
    throw new Error('AI servisi yapılandırılmamış');
  }

  const prompt = question
    ? `${FILE_ANALYSIS_PROMPT}\n\nKullanıcı sorusu: ${question}`
    : FILE_ANALYSIS_PROMPT;

  // Vision models to try (in order of preference)
  const visionModels = [
    'llama-3.2-11b-vision-preview',
    'llama-3.2-90b-vision-preview',
    'meta-llama/llama-3.2-11b-vision-instruct',
  ];

  let lastError = null;

  for (const model of visionModels) {
    try {
      console.log('[FILE_VISION] Trying model:', model);

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${mimeType};base64,${base64Data}`,
                  },
                },
              ],
            },
          ],
          max_tokens: 2048,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[FILE_VISION_ERR] Model:', model, 'Error:', errorText);
        lastError = errorText;
        continue; // Try next model
      }

      const data = await response.json();

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        console.error('[FILE_VISION_ERR] Invalid response format:', JSON.stringify(data));
        continue;
      }

      let text = data.choices[0].message.content;

      // Sanitize AI model names
      text = obfuscation.sanitizeModelNames(text);

      console.log('[FILE_VISION] Success with model:', model);
      return text;
    } catch (error) {
      console.error('[FILE_VISION_ERR] Model:', model, 'Exception:', error.message);
      lastError = error.message;
    }
  }

  // All models failed
  console.error('[FILE_VISION_ERR] All vision models failed. Last error:', lastError);
  throw new Error('Görsel analizi başarısız. Lütfen tekrar deneyin.');
}

/**
 * Analyze text document using LLM
 */
async function analyzeText(content, fileType, question) {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    throw new Error('AI service not configured');
  }

  const fileTypeLabel =
    {
      pdf: 'PDF belgesi',
      docx: 'Word belgesi',
      doc: 'Word belgesi',
      text: 'Metin dosyasi',
    }[fileType] || 'Belge';

  let userMessage = `Bu ${fileTypeLabel} icerigini analiz et:\n\n${content.substring(0, 15000)}`; // Limit content

  if (question) {
    userMessage += `\n\nKullanici sorusu: ${question}`;
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
        { role: 'system', content: FILE_ANALYSIS_PROMPT },
        { role: 'user', content: userMessage },
      ],
      max_tokens: 2048,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error('Document analysis failed');
  }

  const data = await response.json();
  let text = data.choices[0].message.content;

  // Sanitize AI model names
  text = obfuscation.sanitizeModelNames(text);

  return text;
}

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
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
      return res.status(429).json({ success: false, error: 'Too many requests' });
    }

    const { file, mimeType, fileName, question } = req.body;

    if (!file) {
      return res.status(400).json({ success: false, error: 'No file provided' });
    }

    // Validate file type
    const fileType = SUPPORTED_TYPES[mimeType];
    if (!fileType) {
      return res.status(400).json({
        success: false,
        error: 'Desteklenmeyen dosya türü. Desteklenen: PDF, PNG, JPEG, Word, TXT',
      });
    }

    // Decode base64
    const fileBuffer = Buffer.from(file, 'base64');

    // Check file size
    if (fileBuffer.length > MAX_FILE_SIZE) {
      return res.status(400).json({
        success: false,
        error: "Dosya boyutu 10MB'dan büyük olamaz",
      });
    }

    console.log('[FILE_ANALYZE]', fileName, mimeType, fileBuffer.length, 'bytes');

    let analysis;

    if (fileType === 'image') {
      // Analyze image with vision model
      analysis = await analyzeImage(file, mimeType, question);
    } else if (fileType === 'pdf') {
      // Extract and analyze PDF
      const text = await extractPDFText(fileBuffer);
      if (!text || text.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'PDF dosyasından metin çıkarılamadı. Dosya görsel tabanlı olabilir.',
        });
      }
      analysis = await analyzeText(text, fileType, question);
    } else if (fileType === 'docx' || fileType === 'doc') {
      // Extract and analyze Word document
      const text = await extractDocxText(fileBuffer);
      if (!text || text.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Word dosyasından metin çıkarılamadı.',
        });
      }
      analysis = await analyzeText(text, fileType, question);
    } else if (fileType === 'text') {
      // Plain text
      const text = fileBuffer.toString('utf-8');
      analysis = await analyzeText(text, fileType, question);
    }

    return res.status(200).json({
      success: true,
      fileName,
      fileType,
      analysis,
    });
  } catch (error) {
    console.error('[FILE_ANALYZE_ERR]', error.message, error.stack);

    // Return more specific error message
    const errorMessage = error.message.includes('yapılandırılmamış')
      ? 'AI servisi geçici olarak kullanılamıyor.'
      : error.message.includes('analizi başarısız')
        ? error.message
        : 'Dosya analizi başarısız. Lütfen tekrar deneyin.';

    return res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
};
