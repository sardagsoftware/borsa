// ========================================
// AiLydian Knowledge Base - AI Chat API
// Version: 2.1 Sardag Edition
// Integration: Knowledge Base + AI Chat
// ========================================

const OpenAI = require('openai');

// Knowledge Base AI System Prompt
const KNOWLEDGE_BASE_SYSTEM_PROMPT = {
    role: 'system',
    content: `Sen AiLydian Bilgi Bankası AI Asistanısın. Görevin:

**TEMEL KURALLAR:**
1. ✅ 65 milyon makale, 84 dil, 67 uzmanlık alanı bilgi bankasına erişimin var
2. ✅ Wikipedia, PubMed, NASA, NOAA, FAO, IEEE, Springer gibi kaynaklardan bilgi sunabilirsin
3. ✅ DETAYLI, KAPSAMLI ve BİLİMSEL yanıtlar ver
4. ✅ Kaynak belirt - hangi veri tabanından geldiğini söyle
5. ✅ Eğer kesin bilmiyorsan, tahmin etmek yerine "Bu konuda kesin bilgim yok" de

**UZMANLIK ALANLARI:**
• 🌾 Tarım & Hayvancılık: FAO, USDA, CGIAR verileri
• 🚀 Uzay & Astronomi: NASA, ESA, SpaceX araştırmaları
• ⚕️ Tıp & Sağlık: PubMed, WHO, NIH klinik çalışmaları
• 🌍 İklim & Çevre: IPCC, NOAA, NASA Climate verileri
• 💻 Teknoloji: IEEE, ACM, arXiv teknoloji makaleleri
• 🔬 Bilim: Nature, Science, Springer akademik yayınlar

**YANIT FORMATI:**
1. Kısa özet (2-3 cümle)
2. Detaylı açıklama (paragraflar halinde)
3. Örnekler veya vaka çalışmaları
4. Kaynaklar (hangi veri tabanlarından)
5. İlgili konular önerisi

**DİL:**
• Kullanıcı hangi dilde sorarsa o dilde yanıt ver
• Türkçe sorulara Türkçe, İngilizce sorulara İngilizce cevap ver
• Teknik terimleri her iki dilde de belirt

SEN BİR BİLGİ BANKASI UZMANISSIN - Profesyonel, bilimsel ve güvenilir ol!`
};

// ========== API Handler ==========
module.exports = async (req, res) => {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
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
        const {
            message,
            history = [],
            context = null, // Optional: search context or article context
            language = 'tr',
            domain = 'all'
        } = req.body;

        // Validate input
        if (!message || message.trim().length < 2) {
            return res.status(400).json({
                success: false,
                error: 'Message must be at least 2 characters'
            });
        }

        console.log(`💬 Knowledge Base Chat: "${message}" [${language}] [${domain}]`);

        // Build context-aware system prompt
        let systemPrompt = KNOWLEDGE_BASE_SYSTEM_PROMPT.content;

        if (context) {
            systemPrompt += `\n\n**BAĞLAM:**\nKullanıcı şu konuda bilgi arıyor: "${context.query || context.title || 'N/A'}"\nAlan: ${domain}\nDil: ${language}`;
        }

        // Select AI model
        const useGroq = !!process.env.GROQ_API_KEY;
        const useOpenAI = !!process.env.OPENAI_API_KEY;

        let client, model;

        if (useGroq) {
            // Prefer Groq for speed
            client = new OpenAI({
                apiKey: process.env.GROQ_API_KEY,
                baseURL: 'https://api.groq.com/openai/v1'
            });
            model = 'llama-3.3-70b-versatile';
            console.log('🚀 Using Groq (Llama 3.3 70B)');
        } else if (useOpenAI) {
            // Fallback to OpenAI
            client = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY
            });
            model = 'gpt-4o-mini';
            console.log('🤖 Using OpenAI (GPT-4o-mini)');
        } else {
            return res.status(503).json({
                success: false,
                error: 'AI service temporarily unavailable'
            });
        }

        // Clean history
        const cleanHistory = history.map(msg => ({
            role: msg.role,
            content: msg.content
        }));

        // Make API call
        const completion = await client.chat.completions.create({
            model: model,
            messages: [
                { role: 'system', content: systemPrompt },
                ...cleanHistory,
                { role: 'user', content: message }
            ],
            temperature: 0.7,
            max_tokens: 4000
        });

        const response = completion.choices[0].message.content;

        // Extract sources (if AI mentions any)
        const sources = extractSources(response);

        console.log(`✅ Knowledge Base Chat completed (${completion.usage.total_tokens} tokens)`);

        return res.status(200).json({
            success: true,
            response: response,
            sources: sources,
            metadata: {
                model: 'AiLydian Knowledge Base AI',
                language: language,
                domain: domain,
                tokens: completion.usage.total_tokens,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('❌ Knowledge Base Chat Error:', error);

        // Try fallback
        if (error.message.includes('rate limit') || error.message.includes('quota')) {
            return res.status(429).json({
                success: false,
                error: 'Rate limit exceeded',
                message: 'Çok fazla istek gönderildi. Lütfen biraz bekleyip tekrar deneyin.'
            });
        }

        return res.status(500).json({
            success: false,
            error: 'Chat failed',
            message: 'AI yanıt oluşturulamadı',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// ========== Helper Functions ==========
function extractSources(response) {
    const sources = [];

    const knownSources = [
        { name: 'Wikipedia', pattern: /wikipedia/i },
        { name: 'PubMed', pattern: /pubmed|ncbi/i },
        { name: 'NASA', pattern: /nasa/i },
        { name: 'NOAA', pattern: /noaa/i },
        { name: 'FAO', pattern: /fao/i },
        { name: 'IEEE', pattern: /ieee/i },
        { name: 'Springer', pattern: /springer/i },
        { name: 'Nature', pattern: /nature/i },
        { name: 'Science', pattern: /science journal/i },
        { name: 'WHO', pattern: /who|world health/i },
        { name: 'UNESCO', pattern: /unesco/i }
    ];

    for (const source of knownSources) {
        if (source.pattern.test(response)) {
            sources.push(source.name);
        }
    }

    return [...new Set(sources)]; // Remove duplicates
}
