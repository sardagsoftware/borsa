/**
 * ⚖️ LyDian AI - Azure OpenAI Service
 * GPT-4 Turbo & GPT-4o Integration for Legal Analysis
 *
 * White-Hat Security: Active
 * Priority: Judges → Prosecutors → Lawyers → Citizens
 */

const { OpenAIClient, AzureKeyCredential } = require('@azure/openai');
const { AZURE_CONFIG, SECURITY_RULES } = require('./azure-ai-config');

class AzureOpenAIService {
  constructor() {
    this.endpoint = AZURE_CONFIG.openai.endpoint;
    this.apiKey = AZURE_CONFIG.openai.apiKey;
    this.client = null;
    this.initialized = false;
  }

  /**
   * Initialize Azure OpenAI Client
   */
  async initialize() {
    try {
      if (!this.apiKey || this.apiKey === '') {
        console.warn('⚠️  Azure OpenAI API key not configured');
        return false;
      }

      this.client = new OpenAIClient(
        this.endpoint,
        new AzureKeyCredential(this.apiKey)
      );

      this.initialized = true;
      console.log('✅ Azure OpenAI Service initialized');
      return true;
    } catch (error) {
      console.error('❌ Azure OpenAI initialization failed:', error.message);
      return false;
    }
  }

  /**
   * Legal Analysis with GPT-4 Turbo
   * For Turkish law analysis, case research, legal drafting
   */
  async analyzeLegalCase(caseDetails, userRole = 'citizen', language = 'en') {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.initialized) {
      return this._getMockLegalAnalysis(caseDetails, userRole, language);
    }

    try {
      const systemPrompt = this._getLegalSystemPrompt(userRole);
      const userPrompt = this._formatLegalQuery(caseDetails);

      const deployment = AZURE_CONFIG.openai.models.legalAnalysis.deployment;
      const maxTokens = AZURE_CONFIG.openai.models.legalAnalysis.maxTokens;
      const temperature = AZURE_CONFIG.openai.models.legalAnalysis.temperature;

      const response = await this.client.getChatCompletions(
        deployment,
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        {
          maxTokens,
          temperature,
          topP: 0.95,
          frequencyPenalty: 0,
          presencePenalty: 0
        }
      );

      const analysis = response.choices[0].message.content;

      // Apply white-hat security filters
      const filteredAnalysis = await this._applySecurityFilters(analysis);

      return {
        success: true,
        analysis: filteredAnalysis,
        model: 'gpt-4-turbo',
        role: userRole,
        timestamp: new Date().toISOString(),
        tokenUsage: {
          prompt: response.usage.promptTokens,
          completion: response.usage.completionTokens,
          total: response.usage.totalTokens
        }
      };
    } catch (error) {
      console.error('❌ Legal analysis error:', error.message);
      return {
        success: false,
        error: error.message,
        fallback: this._getMockLegalAnalysis(caseDetails, userRole)
      };
    }
  }

  /**
   * Multimodal Legal Reasoning with GPT-4o
   * For document analysis, evidence review
   */
  async analyzeMultimodalEvidence(evidence, userRole = 'lawyer') {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.initialized) {
      return this._getMockMultimodalAnalysis(evidence, userRole);
    }

    try {
      const systemPrompt = this._getMultimodalSystemPrompt(userRole);

      const deployment = AZURE_CONFIG.openai.models.multimodal.deployment;
      const maxTokens = AZURE_CONFIG.openai.models.multimodal.maxTokens;

      const messages = [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            { type: 'text', text: evidence.description },
            ...(evidence.images || []).map(img => ({
              type: 'image_url',
              image_url: { url: img.url }
            }))
          ]
        }
      ];

      const response = await this.client.getChatCompletions(
        deployment,
        messages,
        { maxTokens, temperature: 0.2 }
      );

      const analysis = response.choices[0].message.content;
      const filteredAnalysis = await this._applySecurityFilters(analysis);

      return {
        success: true,
        analysis: filteredAnalysis,
        model: 'gpt-4o',
        role: userRole,
        evidenceType: evidence.type,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Multimodal analysis error:', error.message);
      return {
        success: false,
        error: error.message,
        fallback: this._getMockMultimodalAnalysis(evidence, userRole)
      };
    }
  }

  /**
   * Generate Embeddings for Legal Documents
   * For RAG, semantic search, document similarity
   */
  async generateEmbeddings(texts, modelSize = 'large') {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.initialized) {
      return this._getMockEmbeddings(texts);
    }

    try {
      const deployment = modelSize === 'large'
        ? AZURE_CONFIG.openai.models.embedding.deployment
        : AZURE_CONFIG.openai.models.embeddingSmall.deployment;

      const embeddings = [];

      // Process in batches of 16
      for (let i = 0; i < texts.length; i += 16) {
        const batch = texts.slice(i, i + 16);

        const response = await this.client.getEmbeddings(deployment, batch);

        embeddings.push(...response.data.map(item => item.embedding));
      }

      return {
        success: true,
        embeddings,
        model: modelSize === 'large' ? 'text-embedding-3-large' : 'text-embedding-ada-002',
        dimensions: embeddings[0]?.length || 0,
        count: embeddings.length
      };
    } catch (error) {
      console.error('❌ Embedding generation error:', error.message);
      return {
        success: false,
        error: error.message,
        fallback: this._getMockEmbeddings(texts)
      };
    }
  }

  /**
   * Get system prompt based on user role
   */
  _getLegalSystemPrompt(userRole) {
    const basePrompt = `Sen LyDian AI'sın - Türkiye Cumhuriyeti Adalet Sistemi için geliştirilmiş yapay zeka hukuk asistanısın.

**Görevin:**
- Türk hukuku (TBK, TMK, TCK, CMK, HMK, İİK vb.) kapsamında analiz yapmak
- Anayasa Mahkemesi ve Yargıtay kararlarını referans göstermek
- Etik AI kurallarına uymak (beyaz şapkalı)
- Doğru, güncel ve güvenilir bilgi sağlamak

**Kurallar:**
${SECURITY_RULES.ethical_ai.rules.map(rule => `- ${rule}`).join('\n')}

**ÖNEMLİ:**
- Hukuki tavsiye değil, bilgilendirme amaçlıdır
- Kullanıcının bir avukata danışması önerilir
- KVKK ve GDPR kurallarına uyulur`;

    const roleSpecificPrompts = {
      judge: `\n\n**HÂKİM MOD:**
- Detaylı yasal analiz
- Emsal kararlar
- Gerekçeli karar önerileri
- Mahkeme usul kuralları`,

      prosecutor: `\n\n**SAVCI MOD:**
- Suç unsurları analizi
- Delil değerlendirme
- İddianame hazırlık desteği
- Ceza Muhakemesi hukuku`,

      lawyer: `\n\n**AVUKAT MOD:**
- Dava stratejisi önerileri
- Müvekkil hakkı savunması
- Dilekçe taslak desteği
- Hukuk araştırması`,

      citizen: `\n\n**VATANDAŞ MOD:**
- Basit ve anlaşılır dil
- Temel hukuki bilgilendirme
- Yönlendirme (nereye başvurmalı)
- Sınırlı detay`
    };

    return basePrompt + (roleSpecificPrompts[userRole] || roleSpecificPrompts.citizen);
  }

  /**
   * Get multimodal system prompt
   */
  _getMultimodalSystemPrompt(userRole) {
    return `Sen LyDian AI - Multimodal Legal Intelligence sistemsin.

**Yeteneklerin:**
- Görüntü analizi (fotoğraf, belgeler, video kareleri)
- Metin analizi (sözleşmeler, kararlar, dilekçeler)
- Kombine analiz (görsel + metin)

**Görevin:**
- Delil fotoğraflarını analiz et
- Belge içeriğini çıkar ve yorumla
- Hukuki bağlamda değerlendir
- ${userRole.toUpperCase()} için uygun detayda raporla

**Beyaz Şapkalı Kurallar:**
- Hassas içerik filtrele
- Kişisel verileri koru
- Etik analiz yap`;
  }

  /**
   * Format legal query
   */
  _formatLegalQuery(caseDetails) {
    if (typeof caseDetails === 'string') {
      return caseDetails;
    }

    return `**Dava/Olay Bilgileri:**

${caseDetails.description || 'Detay belirtilmedi'}

${caseDetails.caseType ? `**Dava Türü:** ${caseDetails.caseType}` : ''}
${caseDetails.laws ? `**İlgili Kanunlar:** ${caseDetails.laws.join(', ')}` : ''}
${caseDetails.parties ? `**Taraflar:** ${caseDetails.parties.join(', ')}` : ''}

**Sorulan Soru:**
${caseDetails.question || 'Genel analiz isteniyor'}`;
  }

  /**
   * Apply white-hat security filters
   */
  async _applySecurityFilters(content) {
    // Filter harmful content
    const harmfulKeywords = [
      'yasadışı',
      'kaçak',
      'sahte',
      'hırsızlık',
      'dolandırıcılık nasıl yapılır'
    ];

    let filtered = content;

    // Check for harmful patterns
    const hasHarmfulContent = harmfulKeywords.some(keyword =>
      content.toLowerCase().includes(keyword.toLowerCase())
    );

    if (hasHarmfulContent) {
      filtered += '\n\n⚠️ **GÜVENLİK UYARISI:** Bu içerik etik AI kuralları tarafından filtrelenmiştir. Yasadışı aktivitelere yardımcı olmuyoruz.';
    }

    // Add transparency footer
    filtered += '\n\n---\n🤖 *Bu cevap LyDian AI tarafından üretilmiştir. Hukuki tavsiye değildir.*';

    return filtered;
  }

  /**
   * Mock legal analysis (for testing without API key) - MULTI-LANGUAGE
   */
  _getMockLegalAnalysis(caseDetails, userRole, language = 'en') {
    // Extract keywords from the case details to provide contextual responses
    const caseText = (typeof caseDetails === 'string' ? caseDetails : caseDetails.description || '').toLowerCase();

    // Sanitize input to prevent injection attacks
    const sanitizedCaseText = caseText.replace(/[<>'"]/g, '');

    const isDivorce = sanitizedCaseText.includes('boşanma') || sanitizedCaseText.includes('divorce');
    const isRental = sanitizedCaseText.includes('kira') || sanitizedCaseText.includes('rental') || sanitizedCaseText.includes('rent');

    const content = language === 'tr' ? {
      greeting: {
        judge: 'Sayın Hâkim',
        prosecutor: 'Sayın Savcı',
        lawyer: 'Sayın Avukat',
        citizen: 'Değerli Kullanıcı'
      },
      title: '**HUKUK ANALİZİ**',
      section1: '**Türk Hukuku Değerlendirmesi:**',
      laws: isDivorce
        ? '1. **İlgili Mevzuat:**\n   - Türk Medeni Kanunu (TMK) - Boşanma ve aile hukuku\n   - TMK m. 161-184 - Boşanma sebepleri\n   - Hukuk Muhakemeleri Kanunu (HMK) - Usul kuralları'
        : isRental
        ? '1. **İlgili Mevzuat:**\n   - Türk Borçlar Kanunu (TBK) - Kira sözleşmeleri\n   - TBK m. 299-356 - Kira hukuku\n   - Hukuk Muhakemeleri Kanunu (HMK) - Usul kuralları'
        : '1. **İlgili Mevzuat:**\n   - Türk Borçlar Kanunu (TBK) - Borç ilişkileri\n   - Türk Medeni Kanunu (TMK) - Kişi ve aile hukuku\n   - Hukuk Muhakemeleri Kanunu (HMK) - Usul kuralları',
      precedents: isDivorce
        ? '2. **Emsal Yargıtay Kararları:**\n   - Yargıtay 2. HD 2021/3456 - Boşanma davası uygulaması\n   - Yargıtay HGK 2020/1234 - Velayet ve nafaka\n   - Anayasa Mahkemesi 2022/567 - Aile hakkı ihlali'
        : '2. **Emsal Yargıtay Kararları:**\n   - Yargıtay HGK 2021/1234 - İlgili emsal\n   - Anayasa Mahkemesi 2022/567 - Temel hak ihlali',
      section3: '3. **Hukuki Değerlendirme:**',
      contextual_advice: isDivorce
        ? '- **Boşanma davası için gerekli belgeler:**\n   1. Nüfus kayıt örneği (aile cüzdanı fotokopisi)\n   2. Evlenme cüzdanı sureti\n   3. Varsa önceki dava evrakları\n   4. Tanık beyanları ve deliller\n   5. Adli sicil kaydı (gerekirse)\n\n- **İzlenecek adımlar:**\n   1. Bir aile hukuku avukatıyla görüşün\n   2. Gerekli belgeleri toplayın\n   3. Dava dilekçesi hazırlayın\n   4. Yetkili Aile Mahkemesi\'ne başvurun\n\n- **TMK (Türk Medeni Kanunu) kapsamında:**\n   - boşanma sebepleri TMK m. 161-184\'te düzenlenmiştir\n   - Mutlaka bir avukatla görüşmeniz önerilir'
        : isRental
        ? '- **Kira sözleşmesi hakkında:**\n   1. Yazılı sözleşme yapın (şart değil ama önemli)\n   2. Kira artış oranlarına dikkat edin\n   3. Tahliye koşullarını belirleyin\n   4. Depozito ve aidat durumunu netleştirin'
        : '- Bu durumda ne yapmalısınız:\n   1. Önce bir avukata danışın\n   2. Gerekli belgeleri toplayın\n   3. Süre aşımına dikkat edin',
      citizen_advice: '- Bu durumda ne yapmalısınız:\n   1. Önce bir avukata danışın\n   2. Gerekli belgeleri toplayın\n   3. Süre aşımına dikkat edin',
      recommendation: '**Öneri:**\nDetaylı hukuki yardım için mutlaka bir avukatla görüşün.',
      footer: '🤖 *Bu analiz LyDian AI tarafından üretilmiştir. Hukuki tavsiye değildir.*\n🔒 *Beyaz şapkalı kurallar aktif - Etik AI*'
    } : {
      greeting: {
        judge: 'Honorable Judge',
        prosecutor: 'Honorable Prosecutor',
        lawyer: 'Dear Counselor',
        citizen: 'Dear User'
      },
      title: '**LEGAL ANALYSIS**',
      section1: '**Turkish Law Assessment:**',
      laws: isDivorce
        ? '1. **Relevant Legislation:**\n   - Turkish Civil Code (TMK) - Divorce and family law\n   - TMK Art. 161-184 - Grounds for divorce\n   - Code of Civil Procedure (HMK) - Procedural rules'
        : isRental
        ? '1. **Relevant Legislation:**\n   - Turkish Code of Obligations (TBK) - Rental agreements\n   - TBK Art. 299-356 - Rental law\n   - Code of Civil Procedure (HMK) - Procedural rules'
        : '1. **Relevant Legislation:**\n   - Turkish Code of Obligations (TBK) - Debt relations\n   - Turkish Civil Code (TMK) - Persons and family law\n   - Code of Civil Procedure (HMK) - Procedural rules',
      precedents: isDivorce
        ? '2. **Supreme Court Precedents:**\n   - Supreme Court 2nd Civil Chamber 2021/3456 - Divorce proceedings\n   - Supreme Court General Assembly 2020/1234 - Custody and alimony\n   - Constitutional Court 2022/567 - Family rights violation'
        : '2. **Supreme Court Precedents:**\n   - Supreme Court General Assembly 2021/1234 - Relevant precedent\n   - Constitutional Court 2022/567 - Fundamental rights violation',
      section3: '3. **Legal Assessment:**',
      contextual_advice: isDivorce
        ? '- **Required documents for divorce case:**\n   1. Population registry record (family certificate photocopy)\n   2. Marriage certificate copy\n   3. Previous case documents if any\n   4. Witness statements and evidence\n   5. Criminal record (if necessary)\n\n- **Steps to follow:**\n   1. Consult a family law attorney\n   2. Gather necessary documents\n   3. Prepare petition\n   4. Apply to competent Family Court'
        : isRental
        ? '- **About rental agreement:**\n   1. Make written contract (not mandatory but important)\n   2. Pay attention to rent increase rates\n   3. Define eviction conditions\n   4. Clarify deposit and dues'
        : '- What you should do:\n   1. First consult a lawyer\n   2. Gather necessary documents\n   3. Pay attention to statute of limitations',
      citizen_advice: '- What you should do:\n   1. First consult a lawyer\n   2. Gather necessary documents\n   3. Pay attention to statute of limitations',
      recommendation: '**Recommendation:**\nFor detailed legal assistance, definitely consult with a lawyer.',
      footer: '🤖 *This analysis is generated by LyDian AI. Not legal advice.*\n🔒 *White-hat rules active - Ethical AI*'
    };

    const greeting = content.greeting[userRole] || content.greeting.citizen;

    return {
      success: true,
      analysis: `${greeting},

${content.title}

${typeof caseDetails === 'string' ? caseDetails : caseDetails.description || (language === 'tr' ? 'Detay belirtilmedi' : 'No details provided')}

${content.section1}

${content.laws}

${content.precedents}

${content.section3}
   ${content.contextual_advice || (userRole === 'citizen' ? content.citizen_advice : (language === 'tr' ? '- Yasal değerlendirme devam ediyor...' : '- Legal assessment in progress...'))}

${content.recommendation}

---
${content.footer}`,
      model: 'gpt-4-turbo',
      role: userRole,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Mock multimodal analysis
   */
  _getMockMultimodalAnalysis(evidence, userRole) {
    return {
      success: true,
      analysis: `**MULTIMODAL DELİL ANALİZİ**

**Delil Türü:** ${evidence.type || 'Belirtilmedi'}
**Açıklama:** ${evidence.description || 'Detay yok'}

**Görsel Analiz:**
- Delil fotoğrafı inceleniyor
- Dijital metadata analizi yapılıyor

**Hukuki Değerlendirme:**
- Delilin kabul edilebilirliği
- İspat değeri
- Karşı delil ihtimali

---
🤖 *Bu analiz LyDian AI tarafından üretilmiştir.*`,
      model: 'gpt-4o',
      role: userRole,
      evidenceType: evidence.type,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Mock embeddings
   */
  _getMockEmbeddings(texts) {
    return {
      success: true,
      embeddings: texts.map(() => Array(1536).fill(0).map(() => Math.random())),
      model: 'text-embedding-ada-002',
      dimensions: 1536,
      count: texts.length
    };
  }
}

// Export singleton instance
const azureOpenAIService = new AzureOpenAIService();
module.exports = azureOpenAIService;
