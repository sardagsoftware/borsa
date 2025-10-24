/**
 * Specialized Chat Service
 * Wrapper for OpenAI GPT-4 Turbo for legal analysis
 */

const { OpenAI } = require('openai');
require('dotenv').config();

class SpecializedChatService {
    constructor() {
        this.hasOpenAI = !!process.env.OPENAI_API_KEY;
        this.demoMode = !this.hasOpenAI;

        if (this.hasOpenAI) {
            this.openai = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY
            });
            console.log('✅ Specialized Chat Service initialized (GPT-4 Turbo)');
        } else {
            console.log('⚠️ OpenAI API key not found - Chat service in DEMO mode');
        }
    }

    async chat(options) {
        const { model, messages, temperature, max_tokens } = options;

        if (this.demoMode) {
            // DEMO MODE - Return mock response
            const userMessage = messages[messages.length - 1]?.content || '';
            return {
                content: `DEMO MOD: Gerçek AI analizi için OpenAI API anahtarı ekleyin.\n\nSorunuz: "${userMessage}"\n\nBu bir demo yanıttır. Gerçek GPT-4 Turbo analizi için .env dosyasına OPENAI_API_KEY ekleyin.\n\n🛡️ Beyaz Şapka Kuralları Aktif\n🔒 Şifreli ve Güvenli`,
                model: model || 'gpt-4-turbo (DEMO)',
                usage: {
                    prompt_tokens: 0,
                    completion_tokens: 0,
                    total_tokens: 0
                },
                demoMode: true
            };
        }

        try {
            const response = await this.openai.chat.completions.create({
                model: model || 'gpt-4-turbo',
                messages: messages,
                temperature: temperature || 0.7,
                max_tokens: max_tokens || 2048
            });

            return {
                content: response.choices[0].message.content,
                model: response.model,
                usage: response.usage
            };
        } catch (error) {
            console.error('❌ Chat service error:', error);
            throw error;
        }
    }

    getStatus() {
        return {
            initialized: true,
            hasOpenAI: this.hasOpenAI,
            demoMode: this.demoMode,
            model: 'gpt-4-turbo'
        };
    }
}

// Singleton
const chatService = new SpecializedChatService();

module.exports = chatService;
