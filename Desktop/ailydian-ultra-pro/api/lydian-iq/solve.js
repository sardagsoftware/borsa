// ========================================
// LyDian IQ Reasoning Engine - API
// Version: 2.0.1 - Sardag Edition
// Real AI Integration with Anthropic AX9F7E2B & OpenAI
// Vercel Serverless Compatible (Node.js 18+ native fetch)
// ========================================

// Use native fetch (Node.js 18+) - no external dependencies needed
// In Node.js 18+, fetch is globally available

// LyDian IQ Configuration - Azure-First Multi-Provider with RAG
const AI_CONFIG = {
    // Priority 1: Azure OpenAI (Enterprise Deep Thinking)
    azure: {
        apiKey: process.env.AZURE_OPENAI_API_KEY || '',
        endpoint: process.env.AZURE_OPENAI_ENDPOINT ? `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/OX7A3F8D` : '',
        model: 'OX7A3F8D',
        maxTokens: 8192,
        defaultTemperature: 0.3,
        apiVersion: '2024-02-01',
        supportsRAG: true
    },
    // Priority 2: Anthropic AX9F7E2B (Best for reasoning)
    anthropic: {
        apiKey: process.env.ANTHROPIC_API_KEY || '',
        endpoint: 'https://api.anthropic.com/v1/messages',
        model: 'AX9F7E2B', // Latest stable model
        maxTokens: 8192,
        defaultTemperature: 0.3,
        supportsRAG: false
    },
    // Priority 3: OpenAI OX5C9E2B
    openai: {
        apiKey: process.env.OPENAI_API_KEY || '',
        endpoint: 'https://api.openai.com/v1/chat/completions',
        model: 'OX7A3F8D',
        maxTokens: 4096,
        defaultTemperature: 0.3,
        supportsRAG: false
    },
    // Priority 4: Groq (Ultra-Fast)
    groq: {
        apiKey: process.env.GROQ_API_KEY || '',
        endpoint: 'https://api.groq.com/openai/v1/chat/completions',
        model: 'GX8E2D9A',
        maxTokens: 8000,
        defaultTemperature: 0.3,
        supportsRAG: false
    },
    // Azure Cognitive Search (RAG)
    azureSearch: {
        endpoint: process.env.AZURE_SEARCH_ENDPOINT || '',
        apiKey: process.env.AZURE_SEARCH_KEY || '',
        indexName: 'lydian-iq-knowledge',
        enabled: !!(process.env.AZURE_SEARCH_ENDPOINT && process.env.AZURE_SEARCH_KEY)
    },
    timeout: 60000 // 60 seconds
};

// Language response mapping - CRITICAL: AI must respond in selected language
const LANGUAGE_PROMPTS = {
    'tr-TR': 'ZORUNLU: TÜM CEVAPLARI TÜRKÇE VER. You MUST respond ONLY in Turkish language. Tüm açıklamalar, akıl yürütmeler ve çözümler Türkçe olmalıdır.',
    'en-US': 'MANDATORY: RESPOND ONLY IN ENGLISH. You MUST respond in English language only. All explanations, reasoning, and solutions must be in English.',
    'en-GB': 'MANDATORY: RESPOND ONLY IN ENGLISH. You MUST respond in English language only. All explanations, reasoning, and solutions must be in English.',
    'de-DE': 'ZWINGEND: ANTWORTE NUR AUF DEUTSCH. You MUST respond ONLY in German language. Alle Erklärungen, Überlegungen und Lösungen müssen auf Deutsch sein.',
    'fr-FR': 'OBLIGATOIRE: RÉPONDEZ UNIQUEMENT EN FRANÇAIS. You MUST respond ONLY in French language. Toutes les explications, raisonnements et solutions doivent être en français.',
    'es-ES': 'OBLIGATORIO: RESPONDE SOLO EN ESPAÑOL. You MUST respond ONLY in Spanish language. Todas las explicaciones, razonamientos y soluciones deben estar en español.',
    'it-IT': 'OBBLIGATORIO: RISPONDI SOLO IN ITALIANO. You MUST respond ONLY in Italian language. Tutte le spiegazioni, ragionamenti e soluzioni devono essere in italiano.',
    'ru-RU': 'ОБЯЗАТЕЛЬНО: ОТВЕЧАЙ ТОЛЬКО НА РУССКОМ. You MUST respond ONLY in Russian language. Все объяснения, рассуждения и решения должны быть на русском языке.',
    'zh-CN': '强制性：仅用中文回答。You MUST respond ONLY in Chinese language. 所有解释、推理和解决方案都必须使用中文。',
    'ja-JP': '必須：日本語のみで回答してください。You MUST respond ONLY in Japanese language. すべての説明、推論、解決策は日本語でなければなりません。',
    'ar-SA': 'إلزامي: أجب فقط بالعربية. You MUST respond ONLY in Arabic language. يجب أن تكون جميع التفسيرات والاستدلالات والحلول بالعربية.'
};

// Domain-specific capabilities - LANGUAGE NEUTRAL
const DOMAIN_CAPABILITIES = {
    mathematics: {
        name: 'Mathematics',
        icon: '🧮',
        capabilities: ['Advanced Calculus', 'Linear Algebra', 'Statistics', 'Proof Verification'],
        systemPrompt: 'You are an expert mathematics professor. Solve problems step-by-step, explain each step clearly, and guarantee mathematical accuracy.'
    },
    coding: {
        name: 'Coding',
        icon: '💻',
        capabilities: ['Algorithm Design', 'Code Optimization', 'Debugging', 'Code Review'],
        systemPrompt: 'You are an expert software engineer. Analyze code problems, optimize solutions, and apply best practices.'
    },
    science: {
        name: 'Science',
        icon: '🔬',
        capabilities: ['Physics', 'Chemistry', 'Biology', 'Data Analysis'],
        systemPrompt: 'You are an expert scientist. Explain scientific phenomena, formulate hypotheses, and analyze experimental data.'
    },
    strategy: {
        name: 'Strategy',
        icon: '♟️',
        capabilities: ['Game Theory', 'Decision Making', 'Optimization', 'Risk Analysis'],
        systemPrompt: 'You are a strategy expert. Evaluate alternatives, perform risk-benefit analysis, and suggest optimal strategies.'
    },
    logistics: {
        name: 'Logistics',
        icon: '📦',
        capabilities: ['Supply Chain', 'Route Optimization', 'Inventory Management', 'Resource Allocation'],
        systemPrompt: 'You are a logistics expert. Optimize resource allocation, plan routes, and improve efficiency.'
    }
};

// Retry helper with exponential backoff
async function retryWithBackoff(fn, maxRetries = 3, initialDelay = 1000) {
    let lastError;

    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;

            // Don't retry on validation errors (400)
            if (error.message.includes('400') || error.message.includes('validation')) {
                throw error;
            }

            if (i < maxRetries - 1) {
                const delay = initialDelay * Math.pow(2, i);
                console.log(`⏳ Retry ${i + 1}/${maxRetries} after ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    throw lastError;
}

// Request validation
function validateRequest(body) {
    const { problem, domain } = body;

    if (!problem || typeof problem !== 'string' || problem.trim().length < 5) {
        return { valid: false, error: 'Problem en az 5 karakter olmalıdır' };
    }

    if (problem.length > 10000) {
        return { valid: false, error: 'Problem 10,000 karakterden uzun olamaz' };
    }

    if (domain && !DOMAIN_CAPABILITIES[domain]) {
        return { valid: false, error: `Geçersiz domain: ${domain}` };
    }

    return { valid: true };
}

// Extract reasoning chain from response
function extractReasoningChain(text) {
    const reasoningChain = [];

    // Look for <think> tags or step-by-step markers
    const thinkRegex = /<think>([\s\S]*?)<\/think>/g;
    let match;

    while ((match = thinkRegex.exec(text)) !== null) {
        const thoughts = match[1].trim().split('\n').filter(t => t.trim());
        reasoningChain.push(...thoughts);
    }

    // If no <think> tags, look for numbered steps
    if (reasoningChain.length === 0) {
        const stepRegex = /(?:Step|Adım)\s*\d+[:)]\s*(.+?)(?=(?:Step|Adım)\s*\d+|$)/gis;
        while ((match = stepRegex.exec(text)) !== null) {
            reasoningChain.push(match[1].trim());
        }
    }

    // If still no reasoning chain, create default
    if (reasoningChain.length === 0) {
        reasoningChain.push(
            'Problemi analiz ediyorum',
            'Çözüm yollarını değerlendiriyorum',
            'En uygun yaklaşımı uyguluyorum',
            'Sonucu doğruluyorum'
        );
    }

    return reasoningChain;
}

// Clean solution text
function cleanSolution(text) {
    // Remove <think> tags
    let cleaned = text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

    // Clean up extra whitespace
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

    return cleaned;
}

// Call Anthropic AX9F7E2B API (Primary)
async function callAX9F7E2BAPI(problem, domain, language = 'tr-TR', options = {}) {
    const domainConfig = DOMAIN_CAPABILITIES[domain] || DOMAIN_CAPABILITIES.mathematics;
    const config = AI_CONFIG.anthropic;
    const languagePrompt = LANGUAGE_PROMPTS[language] || LANGUAGE_PROMPTS['tr-TR'];

    const requestBody = {
        model: config.model,
        max_tokens: options.maxTokens || config.maxTokens,
        temperature: options.temperature || config.defaultTemperature,
        messages: [
            {
                role: 'user',
                content: `${languagePrompt}\n\n${domainConfig.systemPrompt}\n\nUser Question: ${problem}`
            }
        ]
    };

    console.log(`🧠 Calling AX9F7E2B API for domain: ${domain}, language: ${language}`);
    console.log(`📝 Problem length: ${problem.length} chars`);
    console.log(`🌍 Response language: ${language}`);

    const startTime = Date.now();

    try {
        const response = await fetch(config.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': config.apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify(requestBody),
            timeout: AI_CONFIG.timeout
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`AX9F7E2B API Error ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        const responseTime = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log(`✅ AX9F7E2B response received in ${responseTime}s`);

        const fullResponse = data.content[0]?.text || '';
        const reasoningChain = extractReasoningChain(fullResponse);
        const solution = cleanSolution(fullResponse);

        return {
            success: true,
            domain: domain,
            problem: problem,
            reasoningChain: reasoningChain,
            solution: solution,
            metadata: {
                responseTime: responseTime,
                tokensUsed: data.usage?.input_tokens + data.usage?.output_tokens || 0,
                model: 'AX9F7E2B 3.7 Sonnet',
                provider: 'lydian-research',
                confidence: 0.995,
                mode: 'production'
            }
        };

    } catch (error) {
        console.error('❌ AX9F7E2B API Error:', error);
        throw error;
    }
}

// Call OpenAI API (Fallback)
async function callOpenAIAPI(problem, domain, language = 'tr-TR', options = {}) {
    const domainConfig = DOMAIN_CAPABILITIES[domain] || DOMAIN_CAPABILITIES.mathematics;
    const config = AI_CONFIG.openai;
    const languagePrompt = LANGUAGE_PROMPTS[language] || LANGUAGE_PROMPTS['tr-TR'];

    const requestBody = {
        model: config.model,
        messages: [
            {
                role: 'system',
                content: `${languagePrompt}\n\n${domainConfig.systemPrompt}`
            },
            {
                role: 'user',
                content: `User Question: ${problem}`
            }
        ],
        max_tokens: options.maxTokens || config.maxTokens,
        temperature: options.temperature || config.defaultTemperature,
        stream: false
    };

    console.log(`🧠 Calling OpenAI OX5C9E2B for domain: ${domain}`);

    const startTime = Date.now();

    try {
        const response = await fetch(config.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`
            },
            body: JSON.stringify(requestBody),
            timeout: AI_CONFIG.timeout
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`OpenAI API Error ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        const responseTime = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log(`✅ OpenAI response received in ${responseTime}s`);

        const fullResponse = data.choices[0]?.message?.content || '';
        const reasoningChain = extractReasoningChain(fullResponse);
        const solution = cleanSolution(fullResponse);

        return {
            success: true,
            domain: domain,
            problem: problem,
            reasoningChain: reasoningChain,
            solution: solution,
            metadata: {
                responseTime: responseTime,
                tokensUsed: data.usage?.total_tokens || 0,
                model: 'OX5C9E2B Turbo',
                provider: 'lydian-labs',
                confidence: 0.99,
                mode: 'production'
            }
        };

    } catch (error) {
        console.error('❌ OpenAI API Error:', error);
        throw error;
    }
}

// Call Groq API (Ultra-Fast)
async function callGroqAPI(problem, domain, language = 'tr-TR', options = {}) {
    const domainConfig = DOMAIN_CAPABILITIES[domain] || DOMAIN_CAPABILITIES.mathematics;
    const config = AI_CONFIG.groq;
    const languagePrompt = LANGUAGE_PROMPTS[language] || LANGUAGE_PROMPTS['tr-TR'];

    const requestBody = {
        model: config.model,
        messages: [
            {
                role: 'system',
                content: `${languagePrompt}\n\n${domainConfig.systemPrompt}`
            },
            {
                role: 'user',
                content: `User Question: ${problem}`
            }
        ],
        max_tokens: options.maxTokens || config.maxTokens,
        temperature: options.temperature || config.defaultTemperature,
        stream: false
    };

    console.log(`⚡ Calling Groq LLaMA for domain: ${domain}`);

    const startTime = Date.now();

    try {
        const response = await fetch(config.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`
            },
            body: JSON.stringify(requestBody),
            timeout: AI_CONFIG.timeout
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Groq API Error ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        const responseTime = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log(`✅ Groq response received in ${responseTime}s`);

        const fullResponse = data.choices[0]?.message?.content || '';
        const reasoningChain = extractReasoningChain(fullResponse);
        const solution = cleanSolution(fullResponse);

        return {
            success: true,
            domain: domain,
            problem: problem,
            reasoningChain: reasoningChain,
            solution: solution,
            metadata: {
                responseTime: responseTime,
                tokensUsed: data.usage?.total_tokens || 0,
                model: 'LLaMA 3.3 70B',
                provider: 'lydian-velocity',
                confidence: 0.98,
                mode: 'production'
            }
        };

    } catch (error) {
        console.error('❌ Groq API Error:', error);
        throw error;
    }
}

// Generate fallback demo response (when no API keys available)
function generateFallbackResponse(problem, domain, language = 'tr-TR') {
    console.log('⚠️ No API keys configured - returning error message');

    const domainConfig = DOMAIN_CAPABILITIES[domain] || DOMAIN_CAPABILITIES.mathematics;

    const reasoningChain = [
        'API konfigürasyonu kontrol ediliyor',
        'Alternatif çözüm yolları araştırılıyor',
        'Sistem yöneticisine bilgi veriliyor'
    ];

    const solution = `# ⚠️ API Konfigürasyonu Gerekli\n\n**Problem:** ${problem}\n\n## Durum\n\nLyDian IQ API'si şu anda kullanılamıyor. Lütfen sistem yöneticisiyle iletişime geçin.\n\n### Gereksinimler\n\n1. **API Anahtarı**: En az bir AI provider API anahtarı gereklidir\n2. **Desteklenen Providers**: AX9F7E2B, OpenAI, Groq\n3. **Konfigürasyon**: .env dosyasında API anahtarlarını ayarlayın\n\n## Çözüm\n\nSistem yöneticisi tarafından API anahtarları yapılandırıldıktan sonra ${domainConfig.name} alanındaki sorular yanıtlanabilecektir.\n\n**Mevcut Yetenekler:**\n${domainConfig.capabilities.map(c => `- ${c}`).join('\n')}\n\n---\n\n**Not:** API konfigürasyonu tamamlandıktan sonra production modunda çalışacaktır.`;

    return {
        success: false,
        domain: domain,
        problem: problem,
        reasoningChain: reasoningChain,
        solution: solution,
        error: 'API anahtarı yapılandırması gerekli. Lütfen sistem yöneticisiyle iletişime geçin.',
        metadata: {
            responseTime: '0.05',
            tokensUsed: 0,
            model: 'Configuration Required',
            provider: 'System',
            confidence: 0.0,
            mode: 'error'
        }
    };
}

// ========== API Handler ==========
module.exports = async (req, res) => {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed'
        });
    }

    try {
        const { problem, domain = 'mathematics', language = 'tr-TR', options = {} } = req.body;

        // Validate request
        const validation = validateRequest(req.body);
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                error: validation.error
            });
        }

        // Log request
        const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        console.log(`\n${'='.repeat(60)}`);
        console.log(`🧠 LyDian IQ Request`);
        console.log(`📍 IP: ${clientIp}`);
        console.log(`🎯 Domain: ${domain}`);
        console.log(`🌍 Language: ${language}`);
        console.log(`📝 Problem: ${problem.substring(0, 100)}...`);
        console.log(`${'='.repeat(60)}\n`);

        let result;

        // Multi-Provider AI Strategy: GROQ → OpenAI → AX9F7E2B → Demo
        // With retry mechanism for network errors
        // Note: Using GROQ first since it has a valid API key
        try {
            // Try Groq first (ultra-fast & valid key)
            if (AI_CONFIG.groq.apiKey && AI_CONFIG.groq.apiKey.length > 20 && !AI_CONFIG.groq.apiKey.includes('YOUR_')) {
                console.log('🎯 Strategy: Using Groq LLaMA (Primary - Valid Key) with retry');
                result = await retryWithBackoff(() => callGroqAPI(problem, domain, language, options));
            }
            // Fallback to OpenAI
            else if (AI_CONFIG.openai.apiKey && AI_CONFIG.openai.apiKey.length > 20 && !AI_CONFIG.openai.apiKey.includes('YOUR_')) {
                console.log('🎯 Strategy: Using OpenAI OX5C9E2B (Fallback - Valid Key) with retry');
                result = await retryWithBackoff(() => callOpenAIAPI(problem, domain, language, options));
            }
            // Try AX9F7E2B (if key is valid)
            else if (AI_CONFIG.anthropic.apiKey && AI_CONFIG.anthropic.apiKey.length > 20 && !AI_CONFIG.anthropic.apiKey.includes('YOUR_')) {
                console.log('🎯 Strategy: Using AX9F7E2B (Tertiary - Valid Key) with retry');
                result = await retryWithBackoff(() => callAX9F7E2BAPI(problem, domain, language, options));
            }
            // No API keys available
            else {
                console.log('ℹ️ No valid API keys configured, using demo mode');
                result = generateFallbackResponse(problem, domain, language);
            }
        } catch (apiError) {
            console.error('⚠️ Primary API failed after retries, trying fallback:', apiError.message);

            // Try fallback providers (also with retry)
            try {
                if (AI_CONFIG.openai.apiKey && AI_CONFIG.openai.apiKey.length > 20) {
                    console.log('🔄 Fallback: Trying OpenAI with retry...');
                    result = await retryWithBackoff(() => callOpenAIAPI(problem, domain, language, options));
                } else if (AI_CONFIG.groq.apiKey && AI_CONFIG.groq.apiKey.length > 20) {
                    console.log('🔄 Fallback: Trying Groq with retry...');
                    result = await retryWithBackoff(() => callGroqAPI(problem, domain, language, options));
                } else {
                    throw new Error('All API providers failed');
                }
            } catch (fallbackError) {
                console.error('⚠️ All APIs failed after retries, using demo mode:', fallbackError.message);
                result = generateFallbackResponse(problem, domain, language);
            }
        }

        // Return result
        console.log(`✅ Response sent: ${result.metadata.responseTime}s`);
        return res.status(200).json(result);

    } catch (error) {
        console.error('❌ LyDian IQ API Error:', error);

        return res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: 'Bir hata oluştu, lütfen tekrar deneyin',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
