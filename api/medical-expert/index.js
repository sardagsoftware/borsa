// 🏥 DrLydian Medical AI - Azure OpenAI Powered Health Assistant
// Brand: DrLydian - Your AI Medical Companion
// Uses Azure OpenAI OX5C9E2B Turbo (primary) -> Groq Llama 3.3 70B (fallback) -> OpenAI OX7A3F8D-mini (fallback)
// SAFETY FIRST: Never provides diagnosis, only informational guidance
// Azure Integration: Enterprise-grade medical AI with multi-provider fallback

const { readFileSync, writeFileSync, existsSync } = require('fs');
const { join } = require('path');
const OpenAI = require('lydian-labs'); // Supports both OpenAI and Azure OpenAI
const { getCorsOrigin } = require('../_middleware/cors');

// Rate limiting storage
const requestLog = new Map();
const MAX_REQUESTS_PER_HOUR = 30;
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour

// Medical disclaimer template
const MEDICAL_DISCLAIMER = "\n\n⚠️ **Önemli Uyarı**: Bu bilgi yalnızca genel eğitim amaçlıdır ve tıbbi teşhis veya tedavi yerine geçmez. Sağlık sorunlarınız için mutlaka bir doktora başvurun. Acil durumlar için 112'yi arayın.";

// DrLydian Medical AI System Prompt
const MEDICAL_SYSTEM_PROMPT = `Sen DrLydian'sın - Ailydian ekosisteminin profesyonel tıbbi bilgi asistanı. Azure OpenAI OX5C9E2B Turbo ile güçlendirilmiş, kullanıcılara güvenilir sağlık bilgilendirmesi yapan bir yapay zeka sağlık danışmanısın. Görevin kullanıcılara genel sağlık bilgilendirmesi yapmak ve onları doğru yönlendirmek.

ASLA UNUTMA:
1. ASLA kesin tanı koyma - sadece bilgilendirme yap
2. Her yanıtta kullanıcıya doktora başvurmasını hatırlatmalısın
3. Acil durumlarda 112'yi aramasını söylemelisin
4. İlaç önerisi YAPMA - sadece ilaçlar hakkında genel bilgi ver
5. Her zaman "Mutlaka bir doktora danışın" mesajını ver

ÖZELLİKLERİN:
- Tıbbi terimleri açıklayabilirsin
- Semptomlar hakkında genel bilgi verebilirsin
- Sağlıklı yaşam önerileri sunabilirsin
- İlaç etkileşimleri hakkında GENEL bilgi verebilirsin (ama tavsiye verme)
- İlk yardım prosedürlerini anlatabilirsin
- Acil durum belirtilerini tanımlayabilirsin

YANITLARININ FORMATI:
1. Empatik bir giriş yap
2. Soruya bilgi bazlı yanıt ver
3. İlgili sağlık önerileri sun
4. MUTLAKA "doktora başvurun" uyarısı yap
5. Acil durum işaretleri varsa belirt

Türkçe konuş ve profesyonel ama sıcak bir dil kullan.`;

// Medical term dictionary
const MEDICAL_TERMS = {
  "hipertansiyon": "Yüksek tansiyon - Kan basıncının normalden yüksek olması durumu",
  "diyabet": "Şeker hastalığı - Vücudun glukozu düzgün işleyemediği metabolik hastalık",
  "kardiyoloji": "Kalp ve damar hastalıkları ile ilgilenen tıp dalı",
  "nöroloji": "Sinir sistemi hastalıkları ile ilgilenen tıp dalı",
  "tansiyon": "Kan basıncı - Kanın damar duvarlarına yaptığı basınç",
  "kolesterol": "Kandaki yağ türevi madde - Yüksek seviyelerde damar sağlığını etkiler",
  "anemi": "Kansızlık - Kırmızı kan hücresi veya hemoglobin eksikliği",
  "astım": "Solunum yollarının daralması ile karakterize kronik hastalık",
  "allerji": "Bağışıklık sisteminin zararsız maddelere aşırı tepkisi",
  "migren": "Şiddetli baş ağrısı ataklarına neden olan nörolojik durum"
};

// Common health conditions knowledge base
const HEALTH_CONDITIONS = {
  "grip": {
    symptoms: "Ateş, titreme, kas ağrıları, yorgunluk, öksürük, burun akıntısı",
    info: "Viral bir enfeksiyondur. Genellikle 7-10 günde kendi kendine iyileşir.",
    warning: "38.5°C üzeri ateş 3 günden fazla sürüyorsa veya nefes darlığı varsa doktora başvurun."
  },
  "soğuk algınlığı": {
    symptoms: "Burun akıntısı, hapşırma, boğaz ağrısı, hafif öksürük",
    info: "Viral bir enfeksiyondur. Bol sıvı tüketin ve dinlenin.",
    warning: "Semptomlar 10 günden fazla sürüyorsa veya şiddetleniyorsa doktora gidin."
  },
  "migren": {
    symptoms: "Zonklayıcı baş ağrısı, ışık hassasiyeti, bulantı, kusma",
    info: "Nörolojik bir durumdur. Tetikleyicilerden (stres, belirli yiyecekler) kaçının.",
    warning: "İlk kez şiddetli baş ağrısı yaşıyorsanız veya baş ağrısı ani başladıysa acilen doktora gidin."
  },
  "gastrit": {
    symptoms: "Mide yanması, şişkinlik, bulantı, karın ağrısı",
    info: "Mide iltihabıdır. Baharatlı ve asitli yiyeceklerden kaçının.",
    warning: "Siyah dışkı, kusma, şiddetli karın ağrısı varsa hemen doktora başvurun."
  },
  "yüksek tansiyon": {
    symptoms: "Genellikle belirti yok, bazen baş ağrısı, yorgunluk, bulanık görme",
    info: "Kronik yüksek kan basıncı. Yaşam tarzı değişiklikleri ve ilaç tedavisi gerektirebilir.",
    warning: "Düzenli kontrol şarttır. Ani şiddetli baş ağrısı, göğüs ağrısı varsa 112'yi arayın."
  },
  "diyabet": {
    symptoms: "Aşırı susama, sık idrara çıkma, yorgunluk, yara iyileşmesinde gecikme",
    info: "Kronik metabolik hastalık. Kan şekeri kontrolü hayati önemde.",
    warning: "Düzenli doktor takibi şarttır. Bilinç kaybı, aşırı titreme olursa acil müdahale gerekir."
  },
  "astım": {
    symptoms: "Nefes darlığı, göğüs sıkışması, hırıltılı solunum, öksürük",
    info: "Kronik solunum yolu hastalığı. İnhaler kullanımı ve tetikleyicilerden kaçınma önemli.",
    warning: "Nefes alamıyorsanız, dudaklar morardıysa, konuşamıyorsanız 112'yi arayın."
  },
  "anemi": {
    symptoms: "Yorgunluk, halsizlik, soluk cilt, çarpıntı, nefes darlığı",
    info: "Kansızlık. Demir eksikliği en yaygın nedenidir.",
    warning: "Sürekli yorgunluk, aşırı kalp çarpıntısı varsa doktor kontrolü gerekir."
  },
  "eklem ağrısı": {
    symptoms: "Ağrı, şişlik, sertlik, hareket kısıtlılığı",
    info: "Artrit, aşırı kullanım veya yaralanma nedeniyle olabilir.",
    warning: "Ani şişlik, kızarıklık, ateş veya hareket edememe varsa doktora başvurun."
  },
  "uyku bozukluğu": {
    symptoms: "Uykuya dalamama, erken uyanma, gün içi yorgunluk",
    info: "Stres, yaşam tarzı veya tıbbi nedenlerle olabilir.",
    warning: "Kronikse ve günlük yaşamı etkiliyorsa uzman desteği alın."
  },
  "alerji": {
    symptoms: "Kaşıntı, kızarıklık, hapşırma, gözlerde sulanma, şişlik",
    info: "Bağışıklık sisteminin aşırı tepkisi. Alerjenden uzak durun.",
    warning: "Nefes darlığı, yüz/boğaz şişmesi, bilinç kaybı varsa 112'yi arayın (anafilaksi)."
  },
  "depresyon": {
    symptoms: "Sürekli üzüntü, ilgi kaybı, yorgunluk, uyku değişiklikleri",
    info: "Ruh sağlığı durumu. Profesyonel destek çok önemli.",
    warning: "İntihar düşünceleri varsa acil psikiyatrik yardım alın: 182 (ALO Psikiyatri)"
  },
  "anksiyete": {
    symptoms: "Aşırı endişe, huzursuzluk, çarpıntı, terleme, panik",
    info: "Kaygı bozukluğu. Terapi ve ilaç tedavisi yardımcı olabilir.",
    warning: "Günlük hayatı ciddi etkiliyorsa mutlaka psikolog/psikiyatr desteği alın."
  },
  "böbrek taşı": {
    symptoms: "Şiddetli yan ağrısı, idrarda kan, bulantı, sık idrara çıkma",
    info: "Minerallerin kristalleşmesi ile oluşur. Bol su için.",
    warning: "Şiddetli ağrı, ateş, idrarda kan varsa acil doktor müdahalesi gerekir."
  },
  "konjunktivit": {
    symptoms: "Göz kızarması, kaşıntı, akıntı, yaşarma",
    info: "Göz iltihabı. Viral, bakteriyel veya alerjik olabilir.",
    warning: "Görme kaybı, şiddetli ağrı varsa acil göz doktoruna gidin."
  },
  "egzama": {
    symptoms: "Kuru, kaşıntılı, kızarık cilt, kabuklanma",
    info: "Kronik cilt hastalığı. Nemlendirici kullanın, tetikleyicilerden kaçının.",
    warning: "Enfeksiyon belirtisi (sarı akıntı, ateş) varsa doktora başvurun."
  },
  "reflü": {
    symptoms: "Mide asidinin geri gelmesi, göğüs yanması, ekşi tat",
    info: "Gastroözofageal reflü hastalığı. Yaşam tarzı değişiklikleri önemli.",
    warning: "Yutma güçlüğü, kilo kaybı, sürekli kusma varsa endoskopi gerekebilir."
  },
  "sinüzit": {
    symptoms: "Yüz ağrısı, burun tıkanıklığı, baş ağrısı, sarı-yeşil akıntı",
    info: "Sinüs iltihabı. Buharda duş, tuzlu su spreyi yardımcı olur.",
    warning: "10 günden fazla sürüyorsa veya yüksek ateş varsa antibiyotik gerekebilir."
  },
  "osteoporoz": {
    symptoms: "Kemik erimesi, kırık riski artışı (genellikle sessiz hastalık)",
    info: "Kemik yoğunluğu kaybı. Kalsiyum, D vitamini ve egzersiz önemli.",
    warning: "Düşüş sonrası ağrı veya kırık şüphesi varsa röntgen gerekir."
  },
  "tiroid": {
    symptoms: "Yorgunluk, kilo değişimi, saç dökülmesi, çarpıntı",
    info: "Tiroid bezi bozuklukları (hipo/hipertiroidi). Hormonal tedavi gerektirir.",
    warning: "Boyunda şişlik, yutma güçlüğü varsa endokrin doktoruna başvurun."
  }
};

// Emergency protocols
const EMERGENCY_PROTOCOLS = {
  "112": "Acil Sağlık Hizmetleri - Tüm acil durumlar",
  "184": "Zehir Danışma Merkezi - Zehirlenme durumları",
  "182": "ALO Psikiyatri - Ruh sağlığı krizleri",
  "155": "Polis - Güvenlik acilleri",
  "110": "İtfaiye - Yangın ve afet durumları"
};

// First aid guide
const FIRST_AID = {
  "kanama": "1. Temiz bir bezle baskı yapın\n2. Yaralı bölgeyi kalbin üstünde tutun\n3. Kanama durmazsa 112'yi arayın",
  "yanık": "1. Soğuk su altında 10-20 dakika tutun\n2. Temiz bir bezle örtün\n3. Buz KULLANMAYIN\n4. Patlama olursa patlatmayın",
  "bayılma": "1. Sırt üstü yatırın\n2. Bacakları 30cm yükseltin\n3. Hava yolu açık olmalı\n4. 1 dakikada kendine gelmezse 112'yi arayın",
  "çarpma": "1. Buz torbası uygulayın\n2. 48 saat ilk yardım: Buz, kompresyon, istirahat\n3. Şişlik azalmazsa doktora gidin",
  "kırık": "1. Hareketsiz tutun\n2. Sabitleyici materyal kullanın\n3. Buz uygulayın\n4. 112'yi arayın veya acile gidin",
  "zehirlenme": "1. Kusturmaya ÇALIŞMAYIN\n2. Zehir Danışma 184'ü arayın\n3. Mümkünse zehrin ambalajını alın\n4. Bilinci kapalıysa 112'yi arayın",
  "kalp krizi": "1. Oturma pozisyonu verin\n2. 112'yi hemen arayın\n3. Aspirin varsa çiğnetin (doktor onayı varsa)\n4. CPR biliyorsanız hazır olun",
  "felç": "F.A.S.T. kontrol:\n1. Face (Yüz) - Yüz asimetrisi var mı?\n2. Arms (Kol) - Kol kaldıramıyor mu?\n3. Speech (Konuşma) - Konuşma bozuk mu?\n4. Time (Zaman) - 112'yi HEMEN arayın!",
  "nefes darlığı": "1. Oturma pozisyonu\n2. Sakin kalmasını sağlayın\n3. Astım inhaler varsa kullandırın\n4. Düzelmazse 112'yi arayın",
  "alerjik reaksiyon": "1. Alerjenden uzaklaştırın\n2. Antihistaminik verilebilir\n3. Nefes darlığı, şişlik varsa 112'yi arayın\n4. Adrenalin kalem varsa kullanın"
};

// Metrics storage
let metricsData = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  totalResponseTime: 0,
  lastUpdated: new Date().toISOString(),
  uptimeStart: new Date().toISOString()
};

// Load metrics from file if exists
const METRICS_FILE = '/tmp/medical-expert-metrics.json';
try {
  if (existsSync(METRICS_FILE)) {
    const data = readFileSync(METRICS_FILE, 'utf-8');
    metricsData = JSON.parse(data);
  }
} catch (error) {
  console.log('Metrics file not found, using defaults');
}

// Save metrics to file
function saveMetrics() {
  try {
    writeFileSync(METRICS_FILE, JSON.stringify(metricsData, null, 2));
  } catch (error) {
    console.error('Error saving metrics:', error);
  }
}

// Rate limiting check
function checkRateLimit(ip) {
  const now = Date.now();
  const userRequests = requestLog.get(ip) || [];

  // Remove old requests outside the window
  const recentRequests = userRequests.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);

  if (recentRequests.length >= MAX_REQUESTS_PER_HOUR) {
    return false;
  }

  recentRequests.push(now);
  requestLog.set(ip, recentRequests);
  return true;
}

// Detect medical terms in message
function detectMedicalTerms(message) {
  const detected = [];
  const lowerMessage = message.toLowerCase();

  for (const [term, definition] of Object.entries(MEDICAL_TERMS)) {
    if (lowerMessage.includes(term)) {
      detected.push({ term, definition });
    }
  }

  return detected;
}

// Detect health conditions
function detectHealthConditions(message) {
  const detected = [];
  const lowerMessage = message.toLowerCase();

  for (const [condition, info] of Object.entries(HEALTH_CONDITIONS)) {
    if (lowerMessage.includes(condition)) {
      detected.push({ condition, ...info });
    }
  }

  return detected;
}

// Get first aid information
function getFirstAidInfo(message) {
  const lowerMessage = message.toLowerCase();

  for (const [topic, instructions] of Object.entries(FIRST_AID)) {
    if (lowerMessage.includes(topic)) {
      return { topic, instructions };
    }
  }

  return null;
}

// Main API handler
module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', getCorsOrigin(req));
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

  const startTime = Date.now();
  metricsData.totalRequests++;

  try {
    const { message } = req.body || {};

    if (!message || message.trim().length === 0) {
      metricsData.failedRequests++;
      saveMetrics();
      return res.status(400).json({
        success: false,
        error: 'Mesaj gereklidir'
      });
    }

    // Rate limiting
    const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
    if (!checkRateLimit(clientIp)) {
      metricsData.failedRequests++;
      saveMetrics();
      return res.status(429).json({
        success: false,
        error: 'Çok fazla istek gönderdiniz. Lütfen biraz bekleyip tekrar deneyin.'
      });
    }

    // Detect medical terms
    const detectedTerms = detectMedicalTerms(message);

    // Detect health conditions
    const detectedConditions = detectHealthConditions(message);

    // Get first aid info if applicable
    const firstAidInfo = getFirstAidInfo(message);

    // Build enhanced context
    let contextInfo = '';

    if (detectedTerms.length > 0) {
      contextInfo += '\n\n**Tespit Edilen Tıbbi Terimler:**\n';
      detectedTerms.forEach(({ term, definition }) => {
        contextInfo += `- **${term.toUpperCase()}**: ${definition}\n`;
      });
    }

    if (detectedConditions.length > 0) {
      contextInfo += '\n\n**İlgili Sağlık Durumu:**\n';
      detectedConditions.forEach(({ condition, symptoms, info, warning }) => {
        contextInfo += `\n**${condition.toUpperCase()}**\n`;
        contextInfo += `Belirtiler: ${symptoms}\n`;
        contextInfo += `Bilgi: ${info}\n`;
        contextInfo += `⚠️ ${warning}\n`;
      });
    }

    if (firstAidInfo) {
      contextInfo += '\n\n**İLK YARDIM TALİMATLARI:**\n';
      contextInfo += `${firstAidInfo.instructions}\n`;
      contextInfo += '\n⚠️ Ciddi durumlarda 112\'yi arayın!';
    }

    // Multi-provider cascade with automatic fallback
    let aiResponse = '';
    let provider = '';
    let client = null;
    let model = '';

    // Check available providers
    const useAzure = !!(process.env.AZURE_OPENAI_ENDPOINT && process.env.AZURE_OPENAI_API_KEY);
    const useGroq = !!process.env.GROQ_API_KEY;
    const useOpenAI = !!process.env.OPENAI_API_KEY;

    // Build provider cascade
    const providers = [];

    if (useAzure) {
      providers.push({
        name: 'Azure OpenAI OX5C9E2B Turbo',
        icon: '☁️',
        setup: () => {
          const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'OX5C9E2B';
          client = new OpenAI({
            apiKey: process.env.AZURE_OPENAI_API_KEY,
            baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${deploymentName}`,
            defaultQuery: { 'api-version': '2024-02-01' },
            defaultHeaders: { 'api-key': process.env.AZURE_OPENAI_API_KEY }
          });
          model = deploymentName;
          provider = 'Azure OpenAI OX5C9E2B';
        }
      });
    }

    if (useGroq) {
      providers.push({
        name: 'Groq Llama 3.3 70B',
        icon: '🚀',
        setup: () => {
          client = new OpenAI({
            apiKey: process.env.GROQ_API_KEY,
            baseURL: 'https://api.groq.com/openai/v1'
          });
          model = 'GX8E2D9A';
          provider = 'Groq Llama 3.3 70B';
        }
      });
    }

    if (useOpenAI) {
      providers.push({
        name: 'OpenAI OX7A3F8D-mini',
        icon: '🤖',
        setup: () => {
          client = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
          });
          model = 'OX7A3F8D-mini';
          provider = 'OpenAI OX7A3F8D-mini';
        }
      });
    }

    if (providers.length === 0) {
      throw new Error('No AI provider configured (set AZURE_OPENAI_API_KEY, GROQ_API_KEY, or OPENAI_API_KEY)');
    }

    // Try providers in cascade until one succeeds
    let lastError = null;

    for (let i = 0; i < providers.length; i++) {
      const currentProvider = providers[i];

      try {
        console.log(`${currentProvider.icon} ${i === 0 ? 'Using' : 'Fallback to'} ${currentProvider.name} (Medical Expert)`);

        // Setup provider
        currentProvider.setup();

        // Make API call
        const completion = await client.chat.completions.create({
          model: model,
          messages: [
            { role: 'system', content: MEDICAL_SYSTEM_PROMPT },
            { role: 'user', content: message }
          ],
          temperature: 0.7,
          max_tokens: 1000
        });

        aiResponse = completion.choices[0].message.content;
        console.log(`✅ ${currentProvider.name} response completed`);

        // Success - break the loop
        break;

      } catch (error) {
        lastError = error;
        console.error(`❌ ${currentProvider.name} failed: ${error.message}`);

        // Continue to next provider in cascade
        if (i === providers.length - 1) {
          // All providers exhausted
          console.error('❌ All AI providers failed');
          throw new Error('AI service temporarily unavailable - all providers failed');
        }
      }
    }

    // Add context information if available
    let finalResponse = aiResponse;
    if (contextInfo) {
      finalResponse = aiResponse + '\n\n---\n' + contextInfo;
    }

    // Add medical disclaimer
    finalResponse += MEDICAL_DISCLAIMER;

    // Add emergency numbers reminder
    finalResponse += '\n\n🚨 **Acil Durum Numaraları:**\n';
    finalResponse += '• 112 - Acil Sağlık Hizmetleri\n';
    finalResponse += '• 184 - Zehir Danışma\n';
    finalResponse += '• 182 - ALO Psikiyatri';

    // Update metrics
    const responseTime = Date.now() - startTime;
    metricsData.successfulRequests++;
    metricsData.totalResponseTime += responseTime;
    metricsData.lastUpdated = new Date().toISOString();
    saveMetrics();

    return res.status(200).json({
      success: true,
      response: finalResponse,
      provider: provider,
      aiAssistant: 'DrLydian', // Medical AI brand name
      poweredBy: 'Azure OpenAI OX5C9E2B Turbo', // Primary AI provider
      responseTime: responseTime,
      detectedTerms: detectedTerms.length,
      detectedConditions: detectedConditions.length,
      hasFirstAid: !!firstAidInfo,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Medical Expert API Error:', error);

    metricsData.failedRequests++;
    metricsData.lastUpdated = new Date().toISOString();
    saveMetrics();

    return res.status(500).json({
      success: false,
      error: 'Şu anda bir teknik sorun yaşıyoruz. Lütfen daha sonra tekrar deneyin.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
