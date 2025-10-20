// ============================================
// 🎭 MODEL PROVIDER ADAPTER
// Phase 1 Week 2 - Anonymization Layer
// Abstracts all AI provider interactions
// ============================================

const fs = require('fs');
const path = require('path');

/**
 * ModelProviderAdapter - Unified interface for all AI providers
 *
 * Features:
 * - Model ID anonymization (m1, m2, m3 instead of "gpt-4o")
 * - Provider abstraction (hides OpenAI, Anthropic, etc.)
 * - Automatic fallback on failures
 * - Request/response logging with masking
 * - Cost tracking with anonymous model IDs
 *
 * Usage:
 * const adapter = new ModelProviderAdapter();
 * const response = await adapter.complete('m1', messages, options);
 */

class ModelProviderAdapter {
    constructor(options = {}) {
        this.debug = options.debug || false;
        this.registry = this.loadRegistry();
        this.requestLog = [];
    }

    /**
     * Load model registry (from encrypted config in production)
     */
    loadRegistry() {
        // In production, this would load from encrypted anon-registry.json.enc
        // For now, use environment-based mapping
        return {
            models: {
                // Premium models
                'm1': {
                    provider: 'azure-openai',
                    deployment: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4o',
                    endpoint: process.env.AZURE_OPENAI_ENDPOINT,
                    apiKey: process.env.AZURE_OPENAI_API_KEY,
                    tier: 'premium',
                    fallback: 'm2'
                },
                'm2': {
                    provider: 'openai',
                    model: 'gpt-4o',
                    apiKey: process.env.OPENAI_API_KEY,
                    tier: 'premium',
                    fallback: 'm3'
                },
                'm3': {
                    provider: 'azure-openai',
                    deployment: 'gpt-4o-mini',
                    endpoint: process.env.AZURE_OPENAI_ENDPOINT,
                    apiKey: process.env.AZURE_OPENAI_API_KEY,
                    tier: 'standard',
                    fallback: null
                },

                // Specialized models
                'm4': {
                    provider: 'anthropic',
                    model: 'claude-3-5-sonnet-20241022',
                    apiKey: process.env.ANTHROPIC_API_KEY,
                    tier: 'premium',
                    specialization: 'reasoning',
                    fallback: 'm1'
                },
                'm5': {
                    provider: 'google',
                    model: 'gemini-2.0-flash-exp',
                    apiKey: process.env.GOOGLE_AI_API_KEY,
                    tier: 'experimental',
                    specialization: 'multimodal',
                    fallback: 'm1'
                },
                'm6': {
                    provider: 'groq',
                    model: 'mixtral-8x7b-32768',
                    apiKey: process.env.GROQ_API_KEY,
                    tier: 'fast',
                    specialization: 'speed',
                    fallback: 'm7'
                },
                'm7': {
                    provider: 'groq',
                    model: 'llama3-8b-8192',
                    apiKey: process.env.GROQ_API_KEY,
                    tier: 'basic',
                    fallback: null
                },

                // Semantic aliases
                'default': 'm1',
                'medical': 'm1',
                'legal': 'm1',
                'general': 'm3',
                'coding': 'm4',
                'vision': 'm5',
                'fast': 'm6'
            }
        };
    }

    /**
     * Resolve model ID to config
     */
    resolveModel(modelId) {
        const registry = this.registry.models;

        // Handle semantic aliases
        if (registry[modelId] && typeof registry[modelId] === 'string') {
            modelId = registry[modelId];
        }

        const config = registry[modelId];
        if (!config) {
            throw new Error(`Unknown model ID: ${modelId}`);
        }

        return { modelId, ...config };
    }

    /**
     * Main completion method - provider-agnostic interface
     */
    async complete(modelId, messages, options = {}) {
        const startTime = Date.now();

        try {
            const modelConfig = this.resolveModel(modelId);

            if (this.debug) {
                console.log(`[Adapter] Using model: ${modelId} (tier: ${modelConfig.tier})`);
            }

            // Check if API key is available
            if (!modelConfig.apiKey) {
                if (this.debug) {
                    console.warn(`[Adapter] API key not configured for ${modelId}, trying fallback`);
                }
                if (modelConfig.fallback) {
                    return await this.complete(modelConfig.fallback, messages, options);
                }
                throw new Error(`API key not configured for model: ${modelId}`);
            }

            // Call appropriate provider
            let response;
            switch (modelConfig.provider) {
                case 'azure-openai':
                    response = await this.callAzureOpenAI(modelConfig, messages, options);
                    break;
                case 'openai':
                    response = await this.callOpenAI(modelConfig, messages, options);
                    break;
                case 'anthropic':
                    response = await this.callAnthropic(modelConfig, messages, options);
                    break;
                case 'google':
                    response = await this.callGoogle(modelConfig, messages, options);
                    break;
                case 'groq':
                    response = await this.callGroq(modelConfig, messages, options);
                    break;
                default:
                    throw new Error(`Unknown provider: ${modelConfig.provider}`);
            }

            // Log request (with masking)
            this.logRequest({
                modelId,
                tier: modelConfig.tier,
                duration: Date.now() - startTime,
                success: true,
                tokensUsed: response.usage?.total_tokens || 0
            });

            return {
                success: true,
                modelId, // Return anonymous ID, not real model name
                content: response.content,
                usage: response.usage,
                duration: Date.now() - startTime
            };

        } catch (error) {
            // Log error (with masking)
            this.logRequest({
                modelId,
                duration: Date.now() - startTime,
                success: false,
                error: error.message
            });

            // Try fallback on error
            const modelConfig = this.resolveModel(modelId);
            if (modelConfig.fallback && !options._fallbackAttempted) {
                if (this.debug) {
                    console.warn(`[Adapter] Error with ${modelId}, trying fallback: ${modelConfig.fallback}`);
                }
                return await this.complete(modelConfig.fallback, messages, {
                    ...options,
                    _fallbackAttempted: true
                });
            }

            throw error;
        }
    }

    /**
     * Azure OpenAI provider
     */
    async callAzureOpenAI(config, messages, options) {
        const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-08-01-preview';
        const url = `${config.endpoint}/openai/deployments/${config.deployment}/chat/completions?api-version=${apiVersion}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': config.apiKey
            },
            body: JSON.stringify({
                messages,
                temperature: options.temperature ?? 0.7,
                max_tokens: options.maxTokens ?? 1000,
                stream: false
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Provider error: ${response.status}`);
        }

        const data = await response.json();
        return {
            content: data.choices[0].message.content,
            usage: data.usage
        };
    }

    /**
     * OpenAI provider
     */
    async callOpenAI(config, messages, options) {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`
            },
            body: JSON.stringify({
                model: config.model,
                messages,
                temperature: options.temperature ?? 0.7,
                max_tokens: options.maxTokens ?? 1000
            })
        });

        if (!response.ok) {
            throw new Error(`Provider error: ${response.status}`);
        }

        const data = await response.json();
        return {
            content: data.choices[0].message.content,
            usage: data.usage
        };
    }

    /**
     * Anthropic provider
     */
    async callAnthropic(config, messages, options) {
        // Convert OpenAI format to Anthropic format
        const systemMessage = messages.find(m => m.role === 'system')?.content || '';
        const conversationMessages = messages.filter(m => m.role !== 'system');

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': config.apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: config.model,
                system: systemMessage,
                messages: conversationMessages,
                max_tokens: options.maxTokens ?? 1000,
                temperature: options.temperature ?? 0.7
            })
        });

        if (!response.ok) {
            throw new Error(`Provider error: ${response.status}`);
        }

        const data = await response.json();
        return {
            content: data.content[0].text,
            usage: {
                prompt_tokens: data.usage.input_tokens,
                completion_tokens: data.usage.output_tokens,
                total_tokens: data.usage.input_tokens + data.usage.output_tokens
            }
        };
    }

    /**
     * Google provider
     */
    async callGoogle(config, messages, options) {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: messages.map(m => ({
                        role: m.role === 'assistant' ? 'model' : 'user',
                        parts: [{ text: m.content }]
                    })),
                    generationConfig: {
                        temperature: options.temperature ?? 0.7,
                        maxOutputTokens: options.maxTokens ?? 1000
                    }
                })
            }
        );

        if (!response.ok) {
            throw new Error(`Provider error: ${response.status}`);
        }

        const data = await response.json();
        return {
            content: data.candidates[0].content.parts[0].text,
            usage: {
                prompt_tokens: 0,
                completion_tokens: 0,
                total_tokens: 0
            }
        };
    }

    /**
     * Groq provider
     */
    async callGroq(config, messages, options) {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`
            },
            body: JSON.stringify({
                model: config.model,
                messages,
                temperature: options.temperature ?? 0.7,
                max_tokens: options.maxTokens ?? 1000
            })
        });

        if (!response.ok) {
            throw new Error(`Provider error: ${response.status}`);
        }

        const data = await response.json();
        return {
            content: data.choices[0].message.content,
            usage: data.usage
        };
    }

    /**
     * Log request (with masking for security)
     */
    logRequest(entry) {
        this.requestLog.push({
            ...entry,
            timestamp: new Date().toISOString()
        });

        // Keep only last 100 requests
        if (this.requestLog.length > 100) {
            this.requestLog.shift();
        }

        if (this.debug) {
            console.log('[Adapter]', entry);
        }
    }

    /**
     * Get usage statistics (anonymous)
     */
    getStats() {
        const stats = {
            totalRequests: this.requestLog.length,
            successRate: 0,
            avgDuration: 0,
            byTier: {}
        };

        if (this.requestLog.length > 0) {
            const successful = this.requestLog.filter(r => r.success);
            stats.successRate = (successful.length / this.requestLog.length) * 100;
            stats.avgDuration = this.requestLog.reduce((sum, r) => sum + r.duration, 0) / this.requestLog.length;

            // Group by tier
            this.requestLog.forEach(req => {
                if (!stats.byTier[req.tier]) {
                    stats.byTier[req.tier] = { count: 0, avgDuration: 0 };
                }
                stats.byTier[req.tier].count++;
            });
        }

        return stats;
    }
}

// Export singleton instance
let adapterInstance = null;

function getAdapter(options = {}) {
    if (!adapterInstance) {
        adapterInstance = new ModelProviderAdapter(options);
    }
    return adapterInstance;
}

module.exports = {
    ModelProviderAdapter,
    getAdapter
};
