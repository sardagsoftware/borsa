// ========================================
// LyDian IQ Reasoning Engine - API
// Version: 2.0.1 - Sardag Edition
// Enterprise AI Integration with Obfuscated Providers
// Vercel Serverless Compatible (Node.js 18+ native fetch)
// ========================================

// Use native fetch (Node.js 18+) - no external dependencies needed
// In Node.js 18+, fetch is globally available

// Security Layer Import
const aiObfuscator = require('../../lib/security/ai-obfuscator');

// LyDian IQ Configuration - Multi-Provider with RAG (Obfuscated)
// ✅ FIXED: Pure lazy initialization - NO module-level execution
// Environment variables are ONLY read at request time, ensuring they're available in Vercel
function getAIConfig() {
    console.log('[getAIConfig] 🔧 Creating fresh config at REQUEST TIME');
    console.log(`[getAIConfig] 🔑 GROQ_API_KEY present: ${!!process.env.GROQ_API_KEY}, length: ${(process.env.GROQ_API_KEY || '').length}`);
    console.log(`[getAIConfig] 🔑 OPENAI_API_KEY present: ${!!process.env.OPENAI_API_KEY}, length: ${(process.env.OPENAI_API_KEY || '').length}`);
    console.log(`[getAIConfig] 🔑 ANTHROPIC_API_KEY present: ${!!process.env.ANTHROPIC_API_KEY}, length: ${(process.env.ANTHROPIC_API_KEY || '').length}`);

    return {
        // Priority 1: Azure Enterprise AI (Enterprise Deep Thinking)
        azure: {
            apiKey: process.env.AZURE_OPENAI_API_KEY || process.env.SECONDARY_AI_KEY || '',
            endpoint: process.env.AZURE_OPENAI_ENDPOINT ? `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/advanced-reasoning-model` : '',
            model: 'advanced-reasoning-model',
            maxTokens: 8192,
            defaultTemperature: 0.3,
            apiVersion: '2024-02-01',
            supportsRAG: true
        },
        // Priority 2: Primary AI Provider (Best for reasoning)
        anthropic: {
            apiKey: process.env.ANTHROPIC_API_KEY || process.env.PRIMARY_AI_KEY || '',
            endpoint: aiObfuscator.resolveEndpoint('PRIMARY_ENDPOINT'),
            model: aiObfuscator.resolveModel('STRATEGIC_REASONING_ENGINE'),
            maxTokens: 8192,
            defaultTemperature: 0.3,
            supportsRAG: false
        },
        // Priority 3: Secondary AI Provider
        openai: {
            apiKey: process.env.OPENAI_API_KEY || process.env.SECONDARY_AI_KEY || '',
            endpoint: aiObfuscator.resolveEndpoint('SECONDARY_ENDPOINT'),
            model: aiObfuscator.resolveModel('CONVERSATIONAL_AI_ALPHA'),
            maxTokens: 4096,
            defaultTemperature: 0.3,
            supportsRAG: false
        },
        // Priority 4: Ling-1T MoE Model (1 Trillion Parameters)
        // Supports both ZenMux API and HuggingFace Inference API
        zenmux: {
            apiKey: process.env.ZENMUX_API_KEY || process.env.HF_TOKEN || '',
            // If HF_TOKEN is used, switch to HuggingFace Inference API endpoint
            endpoint: process.env.HF_TOKEN
                ? 'https://api-inference.huggingface.co/models/inclusionAI/Ling-1T'
                : 'https://zenmux.ai/api/v1/chat/completions',
            model: 'inclusionai/ling-1t',
            maxTokens: 128000,
            defaultTemperature: 0.3,
            supportsRAG: false,
            codeSpecialist: true,
            mathSpecialist: true,
            useHuggingFace: !!process.env.HF_TOKEN
        },
        // Priority 5: Fast Response Provider (Ultra-Fast)
        groq: {
            apiKey: process.env.GROQ_API_KEY || process.env.RAPID_AI_KEY || '',
            endpoint: 'https://api.groq.com/openai/v1/chat/completions',
            model: 'llama-3.3-70b-versatile', // ✅ UPDATED: Active Groq model (Oct 2025)
            maxTokens: 8000,
            defaultTemperature: 0.3,
            supportsRAG: false
        },
        // Priority 6: Z.AI GLM-4.6 (Budget Code Specialist)
        zai: {
            apiKey: process.env.Z_AI_API_KEY || '',
            endpoint: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
            model: 'glm-4.6',
            maxTokens: 128000,
            defaultTemperature: 0.3,
            supportsRAG: false,
            codeSpecialist: true,
            agenticCapable: true,
            reasoningCapable: true
        },
        // Priority 7: Mistral AI (Advanced MoE)
        mistral: {
            apiKey: process.env.MISTRAL_API_KEY || '',
            endpoint: 'https://api.mistral.ai/v1/chat/completions',
            model: 'open-mixtral-8x22b', // Use advanced MoE by default
            maxTokens: 65536,
            defaultTemperature: 0.3,
            supportsRAG: false,
            codeSpecialist: true,
            mathSpecialist: true
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
}

// ❌ REMOVED: Module-level AI_CONFIG initialization
// This was causing env vars to be read during module load when they're empty!
// Now we ONLY use getAIConfig() at request time.

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

// 📄 PDF Processing Function - Extract text and tables from PDF
async function processPDF(pdfBase64, prompt, language) {
    try {
        const pdfParse = require('pdf-parse');

        // Convert base64 to buffer
        const base64Data = pdfBase64.split(',')[1];
        const pdfBuffer = Buffer.from(base64Data, 'base64');

        // Parse PDF
        const data = await pdfParse(pdfBuffer);

        const extractedText = data.text;
        const pageCount = data.numpages;

        console.log(`[PDF] Extracted ${extractedText.length} characters from ${pageCount} pages`);

        // Detect tables (simple heuristic - lines with tabs or multiple spaces)
        const hasTable = /\t|\s{3,}/.test(extractedText);

        // Create structured summary
        const summary = language.startsWith('tr')
            ? `📄 PDF Analizi:\n` +
              `📊 Sayfa Sayısı: ${pageCount}\n` +
              `📝 Metin Uzunluğu: ${extractedText.length} karakter\n` +
              `📋 Tablo Tespit Edildi: ${hasTable ? 'Evet' : 'Hayır'}\n\n` +
              `📖 İçerik Özeti:\n${extractedText.substring(0, 2000)}${extractedText.length > 2000 ? '...' : ''}`
            : `📄 PDF Analysis:\n` +
              `📊 Pages: ${pageCount}\n` +
              `📝 Text Length: ${extractedText.length} characters\n` +
              `📋 Tables Detected: ${hasTable ? 'Yes' : 'No'}\n\n` +
              `📖 Content Summary:\n${extractedText.substring(0, 2000)}${extractedText.length > 2000 ? '...' : ''}`;

        return {
            text: extractedText,
            pageCount: pageCount,
            hasTable: hasTable,
            summary: summary
        };

    } catch (error) {
        console.error('[PDF Processing] Error:', error.message);
        throw error;
    }
}

// 👁️ Vision Analysis Function - Analyze images with GPT-4 Vision
async function analyzeImageWithVision(imageBase64, prompt, language) {
    try {
        const systemPrompt = language.startsWith('tr')
            ? 'Sen görsel analiz yapan gelişmiş bir AI asistanısın. Görselleri detaylı analiz eder ve Türkçe açıklamalar yaparsın.'
            : 'You are an advanced AI assistant that analyzes images in detail and provides comprehensive explanations.';

        const visionPrompt = language.startsWith('tr')
            ? `Görseli detaylı analiz et ve şu soruyu yanıtla: ${prompt}`
            : `Analyze this image in detail and answer: ${prompt}`;

        // Call Vision AI Model
        const CONFIG = getAIConfig(); // Get fresh config for vision API
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CONFIG.openai.apiKey}`
            },
            body: JSON.stringify({
                model: 'vision-analysis-model',
                messages: [
                    {
                        role: 'system',
                        content: systemPrompt
                    },
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: visionPrompt
                            },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: imageBase64,
                                    detail: 'high'
                                }
                            }
                        ]
                    }
                ],
                max_tokens: 1000,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(`Vision API error: ${response.status} - ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;

    } catch (error) {
        console.error('[Vision Analysis] Error:', error.message);
        throw error;
    }
}

// Request validation (Beyaz Şapkalı - Generic error messages)
function validateRequest(body) {
    const { problem, domain } = body;

    if (!problem || typeof problem !== 'string' || problem.trim().length < 5) {
        // Log detailed error server-side
        console.warn('[Validation] Invalid problem length:', problem?.length || 0);
        return { valid: false, error: 'Geçersiz istek' };
    }

    if (problem.length > 10000) {
        // Log detailed error server-side
        console.warn('[Validation] Problem too long:', problem.length);
        return { valid: false, error: 'Geçersiz istek' };
    }

    if (domain && !DOMAIN_CAPABILITIES[domain]) {
        // Log detailed error server-side (don't expose domain name to client)
        console.warn('[Validation] Invalid domain:', domain);
        return { valid: false, error: 'Geçersiz istek' };
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

// Call Anthropic Claude API (Primary)
async function callClaudeAPI(problem, domain, language = 'tr-TR', options = {}, aiConfig = null) {
    const CONFIG = aiConfig || getAIConfig(); // Use provided config or get fresh one
    const domainConfig = DOMAIN_CAPABILITIES[domain] || DOMAIN_CAPABILITIES.mathematics;
    const config = CONFIG.anthropic;
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

    console.log(`🧠 Calling Primary AI API for domain: ${domain}, language: ${language}`);
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
            timeout: CONFIG.timeout
        });

        if (!response.ok) {
            const errorText = await response.text();
            const sanitizedError = aiObfuscator.sanitizeError(new Error(errorText));
            throw new Error(`AI API Error ${response.status}: ${sanitizedError.message}`);
        }

        const data = await response.json();
        const responseTime = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log(`✅ AI response received in ${responseTime}s`);

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
                model: 'Strategic Reasoning Engine',
                provider: 'LyDian AI',
                confidence: 0.995,
                mode: 'production'
            }
        };

    } catch (error) {
        console.error('❌ AI API Error:', error);
        throw error;
    }
}

// Call OpenAI API (Fallback)
async function callOpenAIAPI(problem, domain, language = 'tr-TR', options = {}, aiConfig = null) {
    const CONFIG = aiConfig || getAIConfig(); // Use provided config or get fresh one
    const domainConfig = DOMAIN_CAPABILITIES[domain] || DOMAIN_CAPABILITIES.mathematics;
    const config = CONFIG.openai;
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

    console.log(`🧠 Calling Secondary AI API for domain: ${domain}`);

    const startTime = Date.now();

    try {
        const response = await fetch(config.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`
            },
            body: JSON.stringify(requestBody),
            timeout: CONFIG.timeout
        });

        if (!response.ok) {
            const errorText = await response.text();
            const sanitizedError = aiObfuscator.sanitizeError(new Error(errorText));
            throw new Error(`AI API Error ${response.status}: ${sanitizedError.message}`);
        }

        const data = await response.json();
        const responseTime = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log(`✅ AI response received in ${responseTime}s`);

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
                model: 'Advanced Language Processor',
                provider: 'LyDian AI',
                confidence: 0.99,
                mode: 'production'
            }
        };

    } catch (error) {
        console.error('❌ AI API Error:', error);
        throw error;
    }
}

// Call Groq API (Ultra-Fast)
async function callGroqAPI(problem, domain, language = 'tr-TR', options = {}, aiConfig = null) {
    const CONFIG = aiConfig || getAIConfig(); // Use provided config or get fresh one
    const domainConfig = DOMAIN_CAPABILITIES[domain] || DOMAIN_CAPABILITIES.mathematics;
    const config = CONFIG.groq;
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

    console.log(`⚡ Calling Fast Response AI for domain: ${domain}`);

    const startTime = Date.now();

    try {
        const response = await fetch(config.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`
            },
            body: JSON.stringify(requestBody),
            timeout: CONFIG.timeout
        });

        if (!response.ok) {
            const errorText = await response.text();
            const sanitizedError = aiObfuscator.sanitizeError(new Error(errorText));
            throw new Error(`AI API Error ${response.status}: ${sanitizedError.message}`);
        }

        const data = await response.json();
        const responseTime = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log(`✅ AI response received in ${responseTime}s`);

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
                model: 'Rapid Response Unit',
                provider: 'LyDian AI',
                confidence: 0.98,
                mode: 'production'
            }
        };

    } catch (error) {
        console.error('❌ AI API Error:', error);
        throw error;
    }
}

// Call ZenMux (Ling-1T) API or HuggingFace Inference API
async function callZenMuxAPI(problem, domain, language = 'tr-TR', options = {}, aiConfig = null) {
    const CONFIG = aiConfig || getAIConfig(); // Use provided config or get fresh one
    const domainConfig = DOMAIN_CAPABILITIES[domain] || DOMAIN_CAPABILITIES.mathematics;
    const config = CONFIG.zenmux;
    const languagePrompt = LANGUAGE_PROMPTS[language] || LANGUAGE_PROMPTS['tr-TR'];

    // Build request based on API type (ZenMux vs HuggingFace)
    const isHuggingFace = config.useHuggingFace || config.endpoint.includes('huggingface.co');

    let requestBody, headers;

    if (isHuggingFace) {
        // HuggingFace Inference API format (text-generation)
        const prompt = `${languagePrompt}\n\n${domainConfig.systemPrompt}\n\nUser Question: ${problem}`;
        requestBody = {
            inputs: prompt,
            parameters: {
                max_new_tokens: options.maxTokens || config.maxTokens,
                temperature: options.temperature || config.defaultTemperature,
                return_full_text: false
            }
        };
        headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey}`
        };
        console.log(`🤗 Calling Ling-1T via HuggingFace Inference API for domain: ${domain}`);
    } else {
        // ZenMux API format (OpenAI-compatible)
        requestBody = {
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
        headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey}`
        };
        console.log(`🧠 Calling Ling-1T via ZenMux API for domain: ${domain}`);
    }

    const startTime = Date.now();

    try {
        const response = await fetch(config.endpoint, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(requestBody),
            timeout: CONFIG.timeout
        });

        if (!response.ok) {
            const errorText = await response.text();
            const sanitizedError = aiObfuscator.sanitizeError(new Error(errorText));
            throw new Error(`AI API Error ${response.status}: ${sanitizedError.message}`);
        }

        const data = await response.json();
        const responseTime = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log(`✅ AI response received in ${responseTime}s`);

        // Parse response based on API type
        let fullResponse;
        if (isHuggingFace) {
            // HuggingFace response format: array of generated_text
            fullResponse = Array.isArray(data) ? data[0]?.generated_text || '' : data.generated_text || '';
        } else {
            // ZenMux/OpenAI response format
            fullResponse = data.choices[0]?.message?.content || '';
        }

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
                model: isHuggingFace ? 'Ling-1T MoE (HuggingFace)' : 'Ling-1T MoE (ZenMux)',
                provider: 'LyDian AI',
                confidence: 0.985,
                mode: 'production'
            }
        };

    } catch (error) {
        console.error('❌ AI API Error:', error);
        throw error;
    }
}

// Call Azure OpenAI API
async function callAzureOpenAIAPI(problem, domain, language = 'tr-TR', options = {}, aiConfig = null) {
    const CONFIG = aiConfig || getAIConfig();
    const domainConfig = DOMAIN_CAPABILITIES[domain] || DOMAIN_CAPABILITIES.mathematics;
    const config = CONFIG.azure;
    const languagePrompt = LANGUAGE_PROMPTS[language] || LANGUAGE_PROMPTS['tr-TR'];

    const requestBody = {
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

    console.log(`🧠 Calling Azure OpenAI for domain: ${domain}`);

    const startTime = Date.now();

    try {
        const response = await fetch(`${config.endpoint}/chat/completions?api-version=${config.apiVersion}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': config.apiKey
            },
            body: JSON.stringify(requestBody),
            timeout: CONFIG.timeout
        });

        if (!response.ok) {
            const errorText = await response.text();
            const sanitizedError = aiObfuscator.sanitizeError(new Error(errorText));
            throw new Error(`AI API Error ${response.status}: ${sanitizedError.message}`);
        }

        const data = await response.json();
        const responseTime = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log(`✅ AI response received in ${responseTime}s`);

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
                model: 'Azure Enterprise AI',
                provider: 'LyDian AI',
                confidence: 0.99,
                mode: 'production'
            }
        };

    } catch (error) {
        console.error('❌ Azure OpenAI API Error:', error);
        throw error;
    }
}

// Call Z.AI GLM-4.6 API (Budget Code Specialist)
async function callZAIAPI(problem, domain, language = 'tr-TR', options = {}, aiConfig = null) {
    const CONFIG = aiConfig || getAIConfig();
    const domainConfig = DOMAIN_CAPABILITIES[domain] || DOMAIN_CAPABILITIES.mathematics;
    const config = CONFIG.zai;
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

    console.log(`💎 Calling Z.AI GLM-4.6 (Code Expert) for domain: ${domain}`);

    const startTime = Date.now();

    try {
        const response = await fetch(config.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`
            },
            body: JSON.stringify(requestBody),
            timeout: CONFIG.timeout
        });

        if (!response.ok) {
            const errorText = await response.text();
            const sanitizedError = aiObfuscator.sanitizeError(new Error(errorText));
            throw new Error(`AI API Error ${response.status}: ${sanitizedError.message}`);
        }

        const data = await response.json();
        const responseTime = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log(`✅ Z.AI response received in ${responseTime}s`);

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
                model: 'GLM-4.6 Code Expert',
                provider: 'LyDian AI',
                confidence: 0.985,
                mode: 'production'
            }
        };

    } catch (error) {
        console.error('❌ Z.AI API Error:', error);
        throw error;
    }
}

// Call Mistral AI (Mixtral 8x22B MoE)
async function callMistralAPI(problem, domain, language = 'tr-TR', options = {}, aiConfig = null) {
    const CONFIG = aiConfig || getAIConfig();
    const domainConfig = DOMAIN_CAPABILITIES[domain] || DOMAIN_CAPABILITIES.mathematics;
    const config = CONFIG.mistral;
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

    console.log(`🚀 Calling Mistral AI (Mixtral 8x22B MoE) for domain: ${domain}`);

    const startTime = Date.now();

    try {
        const response = await fetch(config.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`
            },
            body: JSON.stringify(requestBody),
            timeout: CONFIG.timeout
        });

        if (!response.ok) {
            const errorText = await response.text();
            const sanitizedError = aiObfuscator.sanitizeError(new Error(errorText));
            throw new Error(`AI API Error ${response.status}: ${sanitizedError.message}`);
        }

        const data = await response.json();
        const responseTime = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log(`✅ Mistral AI response received in ${responseTime}s`);

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
                model: 'Mixtral 8x22B MoE',
                provider: 'LyDian AI',
                confidence: 0.99,
                mode: 'production'
            }
        };

    } catch (error) {
        console.error('❌ Mistral AI API Error:', error);
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

    const solution = `# ⚠️ API Konfigürasyonu Gerekli\n\n**Problem:** ${problem}\n\n## Durum\n\nLyDian IQ API'si şu anda kullanılamıyor. Lütfen sistem yöneticisiyle iletişime geçin.\n\n### Gereksinimler\n\n1. **API Anahtarı**: En az bir AI provider API anahtarı gereklidir\n2. **Desteklenen Providers**: Claude, OpenAI, Groq\n3. **Konfigürasyon**: .env dosyasında API anahtarlarını ayarlayın\n\n## Çözüm\n\nSistem yöneticisi tarafından API anahtarları yapılandırıldıktan sonra ${domainConfig.name} alanındaki sorular yanıtlanabilecektir.\n\n**Mevcut Yetenekler:**\n${domainConfig.capabilities.map(c => `- ${c}`).join('\n')}\n\n---\n\n**Not:** API konfigürasyonu tamamlandıktan sonra production modunda çalışacaktır.`;

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

// Import middlewares (Beyaz Şapkalı Güvenlik)
const { rateLimitMiddleware } = require('../_middleware/rate-limiter');
const { inputValidationMiddleware } = require('../_middleware/input-validator');
const { csrfMiddleware } = require('../_middleware/csrf-protection');

// Import Redis cache (optional - graceful degradation)
let redisCache = null;
try {
    const RedisCacheClass = require('../../lib/cache/redis-cache');
    redisCache = new RedisCacheClass({ keyPrefix: 'lydian-iq:' });
    console.log('✅ Redis cache module loaded');
} catch (error) {
    console.warn('⚠️ Redis cache module failed to load:', error.message);
    console.warn('   Continuing without cache...');
    // Create mock cache that always returns null
    redisCache = {
        enabled: false,
        get: async () => null,
        set: async () => false,
        getStats: async () => ({ enabled: false, message: 'Redis cache disabled' })
    };
}

// Helper function to create composite cache key
function createCacheKey(problem, domain, language) {
    const crypto = require('crypto');
    const composite = `${domain}:${language}:${problem.substring(0, 200)}`;
    return crypto.createHash('sha256').update(composite).digest('hex');
}

// Environment check (Beyaz Şapkalı - Hide errors in production)
const IS_PRODUCTION = process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production';

// Generic error response helper (Beyaz Şapkalı)
function getGenericError(userMessage = 'Bir hata oluştu. Lütfen tekrar deneyin.') {
    return {
        success: false,
        error: userMessage
    };
}

// ========== API Handler ==========
module.exports = async (req, res) => {
    // CORS Headers - HARDENED (beyaz şapkalı)
    const allowedOrigins = [
        'https://www.ailydian.com',
        'https://ailydian.com',
        'https://ailydian-ultra-pro.vercel.app',
        'http://localhost:3000',
        'http://localhost:3100'
    ];

    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }

    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // ✅ Re-enabled: Security middlewares with proper composition (Beyaz Şapkalı)
    // Middleware chain: CSRF → Rate Limit → Input Validation → Handler
    try {
        await csrfMiddleware(req, res, async () => {
            await rateLimitMiddleware(req, res, async () => {
                await inputValidationMiddleware(req, res, async () => {
                    await handleRequest(req, res);
                });
            });
        });
    } catch (error) {
        console.error('[Middleware/Handler Error]', error);
        // Beyaz Şapkalı: Generic error message
        if (!res.headersSent) {
            res.status(500).json(getGenericError('Sunucu hatası. Lütfen daha sonra tekrar deneyin.'));
        }
    }
};

// Main request handler
async function handleRequest(req, res) {

    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed'
        });
    }
        const { problem, domain = 'mathematics', language = 'tr-TR', options = {}, files = [] } = req.body;

        // Validate request
        const validation = validateRequest(req.body);
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                error: validation.error
            });
        }

        // 👁️ Process uploaded files (images & PDFs)
        let visionAnalysis = null;
        let pdfAnalysis = null;

        if (files && files.length > 0) {
            console.log(`📎 ${files.length} file(s) uploaded, processing...`);

            // Process images with Vision API
            const imageFile = files.find(f => f.type && f.type.startsWith('image/'));
            if (imageFile) {
                console.log(`🖼️ Analyzing image: ${imageFile.name}`);
                try {
                    visionAnalysis = await analyzeImageWithVision(imageFile.data, problem, language);
                    console.log(`✅ Vision analysis complete`);
                } catch (visionError) {
                    console.error(`⚠️ Vision analysis failed:`, visionError.message);
                    // Continue without vision analysis
                }
            }

            // Process PDFs
            const pdfFile = files.find(f => f.type === 'application/pdf');
            if (pdfFile) {
                console.log(`📄 Processing PDF: ${pdfFile.name}`);
                try {
                    pdfAnalysis = await processPDF(pdfFile.data, problem, language);
                    console.log(`✅ PDF processing complete: ${pdfAnalysis.pageCount} pages, ${pdfAnalysis.text.length} chars`);
                } catch (pdfError) {
                    console.error(`⚠️ PDF processing failed:`, pdfError.message);
                    // Continue without PDF analysis
                }
            }
        }

        // Log request
        const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        console.log(`\n${'='.repeat(60)}`);
        console.log(`🧠 LyDian IQ Request`);
        console.log(`📍 IP: ${clientIp}`);
        console.log(`🎯 Domain: ${domain}`);
        console.log(`🌍 Language: ${language}`);
        console.log(`📝 Problem: ${problem.substring(0, 100)}...`);
        if (visionAnalysis) {
            console.log(`👁️ Vision: Image analyzed`);
        }
        if (pdfAnalysis) {
            console.log(`📄 PDF: ${pdfAnalysis.pageCount} pages processed`);
        }
        console.log(`${'='.repeat(60)}\n`);

        // 👁️ Enhance problem with vision and/or PDF analysis
        let enhancedProblem = problem;
        const contextParts = [];

        if (visionAnalysis) {
            const imageContext = language.startsWith('tr')
                ? `📸 Görsel Analizi:\n${visionAnalysis}`
                : `📸 Image Analysis:\n${visionAnalysis}`;
            contextParts.push(imageContext);
            console.log('[Vision] Enhanced problem with image context');
        }

        if (pdfAnalysis) {
            contextParts.push(pdfAnalysis.summary);
            console.log('[PDF] Enhanced problem with PDF content');
        }

        if (contextParts.length > 0) {
            const userQuestion = language.startsWith('tr')
                ? `\n\n👤 Kullanıcının Sorusu:\n${problem}`
                : `\n\n👤 User's Question:\n${problem}`;

            enhancedProblem = contextParts.join('\n\n') + userQuestion;
        }

        // ⚡ Try to get from Redis cache first
        const cacheKey = createCacheKey(enhancedProblem, domain, language);
        const cachedResult = await redisCache.get(cacheKey);
        if (cachedResult) {
            console.log('⚡ Returning cached response');
            return res.status(200).json(cachedResult);
        }

        let result;

        // 🔧 Get fresh config at request time (fixes Vercel env var issues)
        const CONFIG = getAIConfig();

        // 🔍 DEBUG: Check API key availability
        console.log('🔑 API Key Status (Request Time):');
        console.log(`   GROQ: ${process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.substring(0, 8) + '... (' + process.env.GROQ_API_KEY.length + ' chars)' : 'MISSING'}`);
        console.log(`   ANTHROPIC: ${process.env.ANTHROPIC_API_KEY ? process.env.ANTHROPIC_API_KEY.substring(0, 8) + '... (' + process.env.ANTHROPIC_API_KEY.length + ' chars)' : 'MISSING'}`);
        console.log(`   OPENAI: ${process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 8) + '... (' + process.env.OPENAI_API_KEY.length + ' chars)' : 'MISSING'}`);
        console.log(`   CONFIG.groq.apiKey: ${CONFIG.groq.apiKey ? CONFIG.groq.apiKey.substring(0, 8) + '... (' + CONFIG.groq.apiKey.length + ' chars)' : 'EMPTY'}`);

        // 🧠 DOMAIN-BASED INTELLIGENT MODEL SELECTION
        // Coding: Z.AI GLM-4.6 (Code Expert) → Mistral 8x22B (Math+Code) → Claude
        // Mathematics: Mistral 8x22B (Math Expert) → Ling-1T (MoE) → Claude
        // General: Claude (Best Reasoning) → Azure → OpenAI → Ling-1T → Groq
        // With retry mechanism and automatic failover for network errors
        try {
            // 💻 CODING DOMAIN - Prefer specialized code models
            if (domain === 'coding') {
                // Try Z.AI GLM-4.6 first (Budget Code Specialist)
                if (CONFIG.zai.apiKey && CONFIG.zai.apiKey.length > 20 && !CONFIG.zai.apiKey.includes('YOUR_')) {
                    console.log('🎯 Domain Strategy (Coding): Using Z.AI GLM-4.6 (Code Expert) - Priority 1');
                    result = await retryWithBackoff(() => callZAIAPI(enhancedProblem, domain, language, options, CONFIG));
                }
                // Fallback to Mistral 8x22B (Advanced MoE with code specialization)
                else if (CONFIG.mistral.apiKey && CONFIG.mistral.apiKey.length > 20 && !CONFIG.mistral.apiKey.includes('YOUR_')) {
                    console.log('🎯 Domain Strategy (Coding): Using Mistral AI 8x22B (MoE Code Expert) - Priority 2');
                    result = await retryWithBackoff(() => callMistralAPI(enhancedProblem, domain, language, options, CONFIG));
                }
                // Fallback to Claude (Best general reasoning)
                else if (CONFIG.anthropic.apiKey && CONFIG.anthropic.apiKey.length > 20 && !CONFIG.anthropic.apiKey.includes('YOUR_')) {
                    console.log('🎯 Domain Strategy (Coding): Using Claude (General Fallback) - Priority 3');
                    result = await retryWithBackoff(() => callClaudeAPI(enhancedProblem, domain, language, options, CONFIG));
                }
                // Final fallback to general strategy
                else {
                    console.log('🎯 Domain Strategy (Coding): No specialized models, using general strategy');
                    throw new Error('No coding-specialized models available');
                }
            }
            // 🧮 MATHEMATICS DOMAIN - Prefer math specialists
            else if (domain === 'mathematics') {
                // Try Mistral 8x22B first (Math+Code Specialist)
                if (CONFIG.mistral.apiKey && CONFIG.mistral.apiKey.length > 20 && !CONFIG.mistral.apiKey.includes('YOUR_')) {
                    console.log('🎯 Domain Strategy (Mathematics): Using Mistral AI 8x22B (Math Expert) - Priority 1');
                    result = await retryWithBackoff(() => callMistralAPI(enhancedProblem, domain, language, options, CONFIG));
                }
                // Fallback to Ling-1T (1 Trillion Parameter MoE with math specialization)
                else if (CONFIG.zenmux.apiKey && CONFIG.zenmux.apiKey.length > 20 && !CONFIG.zenmux.apiKey.includes('YOUR_')) {
                    console.log('🎯 Domain Strategy (Mathematics): Using Ling-1T MoE (Math Expert) - Priority 2');
                    result = await retryWithBackoff(() => callZenMuxAPI(enhancedProblem, domain, language, options, CONFIG));
                }
                // Fallback to Claude (Best general reasoning)
                else if (CONFIG.anthropic.apiKey && CONFIG.anthropic.apiKey.length > 20 && !CONFIG.anthropic.apiKey.includes('YOUR_')) {
                    console.log('🎯 Domain Strategy (Mathematics): Using Claude (General Fallback) - Priority 3');
                    result = await retryWithBackoff(() => callClaudeAPI(enhancedProblem, domain, language, options, CONFIG));
                }
                // Final fallback to general strategy
                else {
                    console.log('🎯 Domain Strategy (Mathematics): No specialized models, using general strategy');
                    throw new Error('No math-specialized models available');
                }
            }
            // 🌐 GENERAL DOMAINS (Science, Strategy, Logistics) - Standard priority
            else {
                // Priority 1: Anthropic Claude (Best for general reasoning)
                if (CONFIG.anthropic.apiKey && CONFIG.anthropic.apiKey.length > 20 && !CONFIG.anthropic.apiKey.includes('YOUR_')) {
                    console.log('🎯 General Strategy: Using Anthropic Claude (Priority 1 - Best Reasoning) with retry');
                    result = await retryWithBackoff(() => callClaudeAPI(enhancedProblem, domain, language, options, CONFIG));
                }
                // Priority 2: Azure OpenAI (Enterprise)
                else if (CONFIG.azure.apiKey && CONFIG.azure.endpoint && CONFIG.azure.apiKey.length > 20) {
                    console.log('🎯 General Strategy: Using Azure OpenAI (Priority 2 - Enterprise) with retry');
                    result = await retryWithBackoff(() => callAzureOpenAIAPI(enhancedProblem, domain, language, options, CONFIG));
                }
                // Priority 3: OpenAI GPT (Reliable)
                else if (CONFIG.openai.apiKey && CONFIG.openai.apiKey.length > 20 && !CONFIG.openai.apiKey.includes('YOUR_')) {
                    console.log('🎯 General Strategy: Using OpenAI GPT (Priority 3 - Reliable) with retry');
                    result = await retryWithBackoff(() => callOpenAIAPI(enhancedProblem, domain, language, options, CONFIG));
                }
                // Priority 4: Ling-1T (1 Trillion Parameter MoE Model)
                else if (CONFIG.zenmux.apiKey && CONFIG.zenmux.apiKey.length > 20 && !CONFIG.zenmux.apiKey.includes('YOUR_')) {
                    console.log('🎯 General Strategy: Using Ling-1T MoE (Priority 4 - 1T Parameters) with retry');
                    result = await retryWithBackoff(() => callZenMuxAPI(enhancedProblem, domain, language, options, CONFIG));
                }
                // Priority 5: Groq (Ultra-Fast Fallback)
                else if (CONFIG.groq.apiKey && CONFIG.groq.apiKey.length > 20 && !CONFIG.groq.apiKey.includes('YOUR_')) {
                    console.log('🎯 General Strategy: Using Groq (Priority 5 - Ultra-Fast Fallback) with retry');
                    result = await retryWithBackoff(() => callGroqAPI(enhancedProblem, domain, language, options, CONFIG));
                }
                // No API keys available
                else {
                    console.log('❌ No valid API keys configured, using demo mode');
                    console.log(`   anthropic.apiKey length: ${CONFIG.anthropic.apiKey?.length || 0}`);
                    console.log(`   azure.apiKey length: ${CONFIG.azure.apiKey?.length || 0}`);
                    console.log(`   openai.apiKey length: ${CONFIG.openai.apiKey?.length || 0}`);
                    console.log(`   zenmux.apiKey length: ${CONFIG.zenmux.apiKey?.length || 0}`);
                    console.log(`   groq.apiKey length: ${CONFIG.groq.apiKey?.length || 0}`);
                    console.log(`   zai.apiKey length: ${CONFIG.zai.apiKey?.length || 0}`);
                    console.log(`   mistral.apiKey length: ${CONFIG.mistral.apiKey?.length || 0}`);
                    result = generateFallbackResponse(enhancedProblem, domain, language);
                }
            }
        } catch (apiError) {
            console.error('⚠️ Primary API failed after retries, cascading to next provider:', apiError.message);

            // 🔄 Cascade fallback: Try ALL available providers
            try {
                // Try Claude as first fallback (Best general reasoning)
                if (CONFIG.anthropic.apiKey && CONFIG.anthropic.apiKey.length > 20 && !CONFIG.anthropic.apiKey.includes('YOUR_')) {
                    console.log('🔄 Fallback Level 1: Trying Claude (Best Reasoning) with retry...');
                    result = await retryWithBackoff(() => callClaudeAPI(enhancedProblem, domain, language, options, CONFIG));
                }
                // Try Azure as second fallback
                else if (CONFIG.azure.apiKey && CONFIG.azure.endpoint && CONFIG.azure.apiKey.length > 20) {
                    console.log('🔄 Fallback Level 2: Trying Azure OpenAI with retry...');
                    result = await retryWithBackoff(() => callAzureOpenAIAPI(enhancedProblem, domain, language, options, CONFIG));
                }
                // Try OpenAI as third fallback
                else if (CONFIG.openai.apiKey && CONFIG.openai.apiKey.length > 20 && !CONFIG.openai.apiKey.includes('YOUR_')) {
                    console.log('🔄 Fallback Level 3: Trying OpenAI GPT with retry...');
                    result = await retryWithBackoff(() => callOpenAIAPI(enhancedProblem, domain, language, options, CONFIG));
                }
                // Try Mistral 8x22B as fourth fallback (Good for code & math)
                else if (CONFIG.mistral.apiKey && CONFIG.mistral.apiKey.length > 20 && !CONFIG.mistral.apiKey.includes('YOUR_')) {
                    console.log('🔄 Fallback Level 4: Trying Mistral AI 8x22B with retry...');
                    result = await retryWithBackoff(() => callMistralAPI(enhancedProblem, domain, language, options, CONFIG));
                }
                // Try Z.AI GLM-4.6 as fifth fallback (Budget code specialist)
                else if (CONFIG.zai.apiKey && CONFIG.zai.apiKey.length > 20 && !CONFIG.zai.apiKey.includes('YOUR_')) {
                    console.log('🔄 Fallback Level 5: Trying Z.AI GLM-4.6 with retry...');
                    result = await retryWithBackoff(() => callZAIAPI(enhancedProblem, domain, language, options, CONFIG));
                }
                // Try Ling-1T as sixth fallback
                else if (CONFIG.zenmux.apiKey && CONFIG.zenmux.apiKey.length > 20 && !CONFIG.zenmux.apiKey.includes('YOUR_')) {
                    console.log('🔄 Fallback Level 6: Trying Ling-1T MoE with retry...');
                    result = await retryWithBackoff(() => callZenMuxAPI(enhancedProblem, domain, language, options, CONFIG));
                }
                // Try Groq as final fallback
                else if (CONFIG.groq.apiKey && CONFIG.groq.apiKey.length > 20 && !CONFIG.groq.apiKey.includes('YOUR_')) {
                    console.log('🔄 Fallback Level 7 (Final): Trying Groq (Ultra-Fast) with retry...');
                    result = await retryWithBackoff(() => callGroqAPI(enhancedProblem, domain, language, options, CONFIG));
                } else {
                    throw new Error('All AI providers failed');
                }
            } catch (fallbackError) {
                console.error('⚠️ All AI providers failed after cascading fallback and retries, using demo mode:', fallbackError.message);
                result = generateFallbackResponse(enhancedProblem, domain, language);
            }
        }

    // ⚡ Cache the result for future requests (reuse the cacheKey from above)
    await redisCache.set(cacheKey, result, 3600);

    // Return result
    console.log(`✅ Response sent: ${result.metadata.responseTime}s`);
    return res.status(200).json(result);
}
