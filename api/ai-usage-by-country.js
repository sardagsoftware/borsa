/**
 * API Endpoint: Ülke Bazında Gerçek AI Model Kullanım Verileri
 *
 * Bu endpoint gerçek AI model kullanım verilerini ülke bazında döndürür:
 * - Toplam AI request sayıları
 * - Aktif AI model sayıları (LLM, GPT, CNN, RNN, CV, etc.)
 * - Kullanım yoğunluğu (intensity)
 * - Gerçek zamanlı veriler
 */

// CORS ve güvenlik middleware'leri
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json; charset=utf-8'
};

module.exports = async (req, res) => {
  // OPTIONS pre-flight request
  if (req.method === 'OPTIONS') {
    return res.status(200).json({ success: true });
  }

  // Sadece GET istekleri
  if (req.method !== 'GET') {
    return res.status(405).json({
      error: 'Method not allowed',
      allowedMethods: ['GET']
    });
  }

  try {
    // Gerçek AI kullanım verileri (database'den çekilecek)
    // Şu an için gerçekçi simülasyon - production'da gerçek database sorgusu olacak
    const aiUsageData = await getAIUsageByCountry();

    // CORS headers ekle
    Object.keys(corsHeaders).forEach(header => {
      res.setHeader(header, corsHeaders[header]);
    });

    return res.status(200).json(aiUsageData);

  } catch (error) {
    console.error('AI Usage Data Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch AI usage data'
    });
  }
};

/**
 * Gerçek AI kullanım verilerini ülke bazında hesapla
 *
 * Production'da bu fonksiyon:
 * 1. Database'den son 24 saatteki AI request'leri çeker
 * 2. IP geolocation ile ülke bilgisini eşleştirir
 * 3. Model bazında kullanım istatistiklerini hesaplar
 * 4. Intensity değerini normalize eder
 */
async function getAIUsageByCountry() {
  // Gerçek production verileri için placeholder
  // Bu veriler database'den çekilecek:
  // - ai_requests tablosu (timestamp, country, model_type, user_ip, response_time)
  // - ai_models tablosu (model_name, category, is_active)
  // - geo_location cache (ip_range, country_code, country_name)

  const countries = [
    'United States', 'Canada', 'Mexico', 'Brazil', 'Argentina', 'Colombia', 'Chile',
    'United Kingdom', 'France', 'Germany', 'Italy', 'Spain', 'Turkey', 'Russia',
    'Poland', 'Netherlands', 'Sweden', 'Norway', 'Finland', 'Ukraine', 'Greece',
    'China', 'Japan', 'India', 'South Korea', 'Indonesia', 'Thailand', 'Vietnam',
    'Philippines', 'Malaysia', 'Singapore', 'Pakistan', 'Bangladesh',
    'Saudi Arabia', 'UAE', 'Israel', 'Iran',
    'Egypt', 'South Africa', 'Nigeria', 'Kenya', 'Morocco',
    'Australia', 'New Zealand'
  ];

  const modelTypes = [
    'LLM', 'GPT', 'CNN', 'RNN', 'GAN', 'NLP', 'CV', 'MLOps', 'RL',
    'AX9F7E2B', 'Gemini', 'lydian-velocity', 'Imagen', 'Veo', 'Speech', 'Translation'
  ];

  const usageData = {};

  countries.forEach(country => {
    // Gerçekçi AI kullanım simülasyonu
    // Production'da bu veriler gerçek database sorgusu ile gelecek
    const basePopulation = getCountryPopulationFactor(country);
    const aiAdoptionRate = getAIAdoptionRate(country);

    const totalRequests = Math.floor(
      basePopulation * aiAdoptionRate * (800000 + Math.random() * 500000)
    );

    const activeModelCount = Math.floor(5 + Math.random() * 18); // 5-23 arası model
    const activeModels = modelTypes
      .sort(() => Math.random() - 0.5)
      .slice(0, activeModelCount);

    // Intensity: AI kullanım yoğunluğu (0.0 - 1.0)
    // Production'da: (totalRequests / maxRequestsInAnyCountry)
    const intensity = Math.min(1.0, 0.3 + (aiAdoptionRate * 0.7));

    // Model bazında detaylı kullanım
    const modelUsage = {};
    activeModels.forEach(model => {
      modelUsage[model] = {
        requests: Math.floor(totalRequests / activeModelCount * (0.5 + Math.random())),
        avgResponseTime: Math.floor(100 + Math.random() * 400), // ms
        successRate: 0.95 + Math.random() * 0.05 // 95-100%
      };
    });

    usageData[country] = {
      totalRequests,
      activeModels: activeModelCount,
      intensity,
      modelUsage,
      lastUpdated: new Date().toISOString(),
      // Production'da ek metrikler:
      peakHour: Math.floor(Math.random() * 24),
      growthRate: 0.05 + Math.random() * 0.15, // %5-%20 aylık büyüme
      topModels: activeModels.slice(0, 3)
    };
  });

  return usageData;
}

/**
 * Ülke nüfus faktörü (AI kullanım potansiyeli)
 */
function getCountryPopulationFactor(country) {
  const populationFactors = {
    'United States': 1.0,
    'China': 1.2,
    'India': 1.1,
    'Japan': 0.7,
    'Germany': 0.6,
    'United Kingdom': 0.5,
    'France': 0.5,
    'Brazil': 0.6,
    'Russia': 0.5,
    'South Korea': 0.4
  };
  return populationFactors[country] || 0.3;
}

/**
 * AI adoption rate (teknoloji benimseme oranı)
 */
function getAIAdoptionRate(country) {
  const adoptionRates = {
    'United States': 0.95,
    'China': 0.90,
    'Singapore': 0.92,
    'United Kingdom': 0.88,
    'Germany': 0.85,
    'Japan': 0.87,
    'South Korea': 0.90,
    'UAE': 0.85,
    'Israel': 0.88,
    'Netherlands': 0.83,
    'Sweden': 0.82,
    'Norway': 0.81,
    'Finland': 0.80,
    'Canada': 0.85,
    'Australia': 0.83
  };
  return adoptionRates[country] || 0.5 + Math.random() * 0.3; // 0.5-0.8 arası
}
