#!/usr/bin/env node

/**
 * TIER 2 SEO META TAG GENERATOR
 *
 * Generates SEO-optimized meta tags for all LyDian AI pages
 * - 6 languages: TR, EN, DE, AR, RU, ZH
 * - GEO targeting
 * - hreflang tags
 * - Schema.org markup
 * - 100% White-Hat SEO compliant
 *
 * @version 2.0.0
 * @date 2025-10-25
 */

const fs = require('fs');
const path = require('path');

// ==================== CONFIGURATION ====================

const LANGUAGES = ['tr', 'en', 'de', 'ar', 'ru', 'zh'];

const GEO_TARGETING = {
  tr: {
    country: 'TR',
    region: 'İstanbul',
    position: '41.0082;28.9784',
    locale: 'tr_TR'
  },
  en: {
    country: 'US',
    region: 'California',
    position: '37.7749;-122.4194',
    locale: 'en_US'
  },
  de: {
    country: 'DE',
    region: 'Berlin',
    position: '52.5200;13.4050',
    locale: 'de_DE'
  },
  ar: {
    country: 'SA',
    region: 'Riyadh',
    position: '24.7136;46.6753',
    locale: 'ar_SA'
  },
  ru: {
    country: 'RU',
    region: 'Moscow',
    position: '55.7558;37.6173',
    locale: 'ru_RU'
  },
  zh: {
    country: 'CN',
    region: 'Beijing',
    position: '39.9042;116.4074',
    locale: 'zh_CN'
  }
};

// ==================== PAGE CATEGORIES ====================

const PAGE_CATEGORIES = {
  // TIER 1: Critical pages (highest traffic potential)
  tier1: [
    'index.html',
    'lydian-iq.html',
    'medical-expert.html',
    'chat.html',
    'legal-expert.html',
    'ai-advisor-hub.html'
  ],

  // TIER 2: High priority pages
  tier2: [
    'about.html',
    'blog.html',
    'docs.html',
    'api.html',
    'enterprise.html',
    'pricing.html',
    'ai-chat.html',
    'ai-assistant.html',
    'developers.html',
    'research.html',
    'education.html',
    'firildak-ai.html',
    'ai-ops-center.html',
    'governance-dashboard.html',
    'medical-ai.html',
    'video-ai.html',
    'image-generation.html',
    'knowledge-base.html',
    'models.html',
    'analytics.html'
  ],

  // TIER 3: Medium priority
  tier3: [
    'dashboard.html',
    'monitoring.html',
    'status.html',
    'help.html',
    'contact.html',
    'careers.html',
    'changelog.html',
    'api-docs.html',
    'api-reference.html',
    'connectors.html',
    'files.html',
    'tokens.html'
  ],

  // TIER 4: Low priority (legal, admin, system pages)
  tier4: [
    'privacy.html',
    'terms.html',
    'cookies.html',
    'auth.html',
    'billing.html',
    'settings.html'
  ]
};

// ==================== SEO CONTENT DATABASE ====================

const SEO_CONTENT = {
  'index.html': {
    tr: {
      title: 'LyDian AI — Kurumsal Yapay Zeka Platformu',
      description: 'Tıbbi AI, Hukuki AI, IQ Testi ve 8 Uzman Danışman. 40+ dilde çok modelli yapay zeka çözümleri. Hemen ücretsiz deneyin ve AI gücünü keşfedin.',
      keywords: 'yapay zeka platformu, ai türkiye, tıbbi yapay zeka, hukuki ai, iq testi ai, çok dilli ai, lydian ai'
    },
    en: {
      title: 'LyDian AI: Enterprise AI Platform | 20+ Languages',
      description: 'LyDian provides enterprise-grade AI solutions with multilingual NLP, computer vision, and decision support. Try free today.',
      keywords: 'enterprise AI platform, multilingual chatbot, AI solutions, natural language processing, computer vision, medical AI, legal AI'
    },
    de: {
      title: 'LyDian AI: Unternehmens-KI-Plattform | 20+ Sprachen',
      description: 'LyDian bietet KI-Lösungen für Unternehmen mit mehrsprachiger NLP, Computer Vision und Entscheidungsunterstützung. Jetzt kostenlos testen.',
      keywords: 'unternehmens-ki, mehrsprachiger chatbot, ki-lösungen, natürliche sprachverarbeitung, computer vision, medizinische ki'
    },
    ar: {
      title: 'LyDian AI: منصة الذكاء الاصطناعي للمؤسسات | +20 لغة',
      description: 'تقدم LyDian حلول الذكاء الاصطناعي للمؤسسات مع معالجة اللغة الطبيعية ورؤية الكمبيوتر ودعم القرار. جربها مجانًا اليوم.',
      keywords: 'منصة الذكاء الاصطناعي, روبوت محادثة متعدد اللغات, حلول الذكاء الاصطناعي, معالجة اللغة الطبيعية'
    },
    ru: {
      title: 'LyDian AI: Корпоративная платформа ИИ | 20+ языков',
      description: 'LyDian предоставляет корпоративные решения ИИ с многоязычной обработкой естественного языка и компьютерным зрением. Попробуйте бесплатно.',
      keywords: 'корпоративная платформа ии, многоязычный чатбот, решения ии, обработка естественного языка'
    },
    zh: {
      title: 'LyDian AI：企业人工智能平台 | 支持20+语言服务',
      description: 'LyDian提供企业级AI解决方案，包括多语言自然语言处理、计算机视觉和智能决策支持系统。立即免费试用，探索AI的强大力量和无限可能性，助力企业数字化转型升级。',
      keywords: '企业人工智能平台, 多语言聊天机器人, AI解决方案, 自然语言处理, 计算机视觉'
    }
  },

  'lydian-iq.html': {
    tr: {
      title: 'LyDian IQ — Bilimsel AI Zeka Testi | Online IQ Ölçümü',
      description: 'AI destekli bilimsel zeka testi. Çok modelli analiz, detaylı raporlar. 1M+ kullanıcı, %98 doğruluk. Ücretsiz teste başla.',
      keywords: 'iq testi, online zeka testi, ai iq testi, zeka ölçümü, ücretsiz iq testi, lydian iq'
    },
    en: {
      title: 'LyDian IQ — Scientific AI Intelligence Test | Online IQ',
      description: 'AI-powered scientific intelligence test. Multi-model analysis, detailed reports. 1M+ users, 98% accuracy. Start free test.',
      keywords: 'iq test, intelligence test online, ai iq test, intelligence measurement, free iq test, lydian iq'
    },
    de: {
      title: 'LyDian IQ — Wissenschaftlicher KI-Intelligenztest',
      description: 'KI-gestützter wissenschaftlicher Intelligenztest. Multi-Modell-Analyse, detaillierte Berichte. 1M+ Benutzer, 98% Genauigkeit. Jetzt kostenlos testen.',
      keywords: 'iq test, intelligenztest online, ki iq test, intelligenzmessung, kostenloser iq test'
    },
    ar: {
      title: 'LyDian IQ — اختبار الذكاء العلمي | اختبار IQ',
      description: 'اختبار ذكاء علمي مدعوم بالذكاء الاصطناعي. تحليل متعدد النماذج، تقارير مفصلة. أكثر من مليون مستخدم، دقة 98%. ابدأ الاختبار المجاني الآن.',
      keywords: 'اختبار الذكاء, اختبار معدل الذكاء عبر الإنترنت, اختبار ذكاء بالذكاء الاصطناعي'
    },
    ru: {
      title: 'LyDian IQ — Научный тест интеллекта с ИИ | IQ тест',
      description: 'Научный тест интеллекта на базе ИИ. Мультимодельный анализ, подробные отчеты. Более 1 млн пользователей, 98% точность. Начните бесплатный тест.',
      keywords: 'тест iq, тест интеллекта онлайн, тест iq с ии, измерение интеллекта'
    },
    zh: {
      title: 'LyDian IQ — 科学AI智力测试 | 在线智商IQ测试',
      description: 'AI驱动的科学智力测试平台。多模型智能分析，详细专业测试报告。100万+活跃用户，98%准确率。立即开始免费智商测试，全面了解您的智力水平和认知能力，获取权威分析结果。',
      keywords: 'iq测试, 在线智力测试, ai智商测试, 智力测量, 免费iq测试'
    }
  },

  'medical-expert.html': {
    tr: {
      title: 'Medical Expert — 7/24 AI Tıbbi Asistan | Sağlık',
      description: 'AI destekli sağlık danışmanlığı. Çok modelli teşhis desteği, tıbbi analiz, acil triaj. 500K+ başarılı danışma. Hemen ücretsiz deneyin.',
      keywords: 'tıbbi ai, ai doktor, sağlık danışmanı ai, tıbbi teşhis ai, medical expert, lydian medical'
    },
    en: {
      title: 'Medical Expert — 24/7 AI Medical Assistant | Healthcare',
      description: 'AI-powered healthcare consultation. Multi-model diagnosis support, medical analysis, emergency triage. 500K+ consultations. Try free today.',
      keywords: 'medical ai, ai doctor, healthcare advisor ai, medical diagnosis ai, medical expert'
    },
    de: {
      title: 'Medical Expert — 24/7 KI Medizinischer Assistent',
      description: 'KI-gestützte Gesundheitsberatung. Multi-Modell-Diagnoseunterstützung, medizinische Analyse. 500K+ Beratungen. Jetzt kostenlos testen.',
      keywords: 'medizinische ki, ki arzt, gesundheitsberater ki, medizinische diagnose ki'
    },
    ar: {
      title: 'Medical Expert — مساعد طبي بالذكاء الاصطناعي 24/7',
      description: 'استشارات صحية مدعومة بالذكاء الاصطناعي. دعم التشخيص متعدد النماذج، التحليل الطبي. أكثر من 500 ألف استشارة. جرب مجانًا اليوم.',
      keywords: 'الذكاء الاصطناعي الطبي, طبيب ذكاء اصطناعي, مستشار صحي ذكاء اصطناعي'
    },
    ru: {
      title: 'Medical Expert — Медицинский ИИ-ассистент 24/7',
      description: 'Медицинские консультации с ИИ. Мультимодельная поддержка диагностики, медицинский анализ. Более 500 тыс консультаций. Попробуйте бесплатно.',
      keywords: 'медицинский ии, ии врач, консультант по здоровью ии, медицинская диагностика ии'
    },
    zh: {
      title: 'Medical Expert — 全天候AI医疗助手 | 智能健康咨询',
      description: 'AI驱动的智能医疗咨询平台。多模型智能诊断支持，专业医学深度分析，紧急分诊快速服务。50万+成功咨询案例。立即免费体验，获取专业医疗建议和全面健康指导，保障您的健康安全。',
      keywords: '医疗ai, ai医生, 健康顾问ai, 医学诊断ai, 医疗专家'
    }
  },

  'chat.html': {
    tr: {
      title: 'AI Chat — Çok Modelli Yapay Zeka | OX5C9E2B, AX9F7E2B',
      description: '10+ AI modeli tek platformda. OX5C9E2B, AX9F7E2B 3.5, Gemini 1.5 Pro, DALL-E 3. Görsel, kod, analiz. Ücretsiz başla ve AI gücünü keşfet.',
      keywords: 'ai chat, yapay zeka sohbet, OX5C9E2B türkçe, AX9F7E2B türkçe, gemini ai, çok modelli ai'
    },
    en: {
      title: 'AI Chat — Multi-Model AI Platform | OX5C9E2B, AX9F7E2B',
      description: '10+ AI models in one platform. OX5C9E2B, AX9F7E2B 3.5, Gemini 1.5 Pro, DALL-E 3. Images, code, analysis. Start free and explore AI power.',
      keywords: 'ai chat, artificial intelligence chat, OX5C9E2B, AX9F7E2B ai, gemini ai, multi-model ai'
    },
    de: {
      title: 'AI Chat — Multi-Modell-KI | OX5C9E2B, AX9F7E2B',
      description: '10+ KI-Modelle auf einer Plattform. OX5C9E2B, AX9F7E2B 3.5, Gemini 1.5 Pro, DALL-E 3. Bilder, Code, Analyse. Jetzt kostenlos starten.',
      keywords: 'ki chat, künstliche intelligenz chat, OX5C9E2B, AX9F7E2B ki, gemini ki'
    },
    ar: {
      title: 'AI Chat — منصة ذكاء اصطناعي متعددة | OX5C9E2B',
      description: 'أكثر من 10 نماذج ذكاء اصطناعي في منصة واحدة. OX5C9E2B، AX9F7E2B 3.5، Gemini 1.5 Pro. الصور والكود والتحليل. ابدأ مجانًا واستكشف قوة الذكاء الاصطناعي.',
      keywords: 'دردشة ذكاء اصطناعي, OX5C9E2B, AX9F7E2B, gemini, نماذج ذكاء اصطناعي متعددة'
    },
    ru: {
      title: 'AI Chat — Мультимодельная ИИ-платформа | OX5C9E2B',
      description: '10+ моделей ИИ на одной платформе. OX5C9E2B, AX9F7E2B 3.5, Gemini 1.5 Pro, DALL-E 3. Изображения, код, анализ. Начните бесплатно и откройте силу ИИ.',
      keywords: 'ии чат, чат с искусственным интеллектом, OX5C9E2B, AX9F7E2B ии, gemini ии'
    },
    zh: {
      title: 'AI Chat — 多模型AI聊天平台 | OX5C9E2B, AX9F7E2B',
      description: '一个平台集成10+个顶级AI模型。OX5C9E2B、AX9F7E2B 3.5、Gemini 1.5 Pro、DALL-E 3。智能图像生成、代码编写、数据分析。立即免费开始，探索人工智能的无限潜力。',
      keywords: 'ai聊天, 人工智能聊天, OX5C9E2B, AX9F7E2B ai, gemini ai, 多模型ai'
    }
  },

  'legal-expert.html': {
    tr: {
      title: 'Legal AI — Hukuki Yapay Zeka | 7/24 Hukuk Asistanı',
      description: 'AI destekli hukuki danışmanlık. Sözleşme analizi, dava araştırma, yasal doküman hazırlama. 200K+ başarılı danışma. Hemen ücretsiz deneyin.',
      keywords: 'hukuki ai, ai avukat, hukuk asistanı ai, yasal danışman ai, legal ai, lydian legal'
    },
    en: {
      title: 'Legal AI — AI Legal Consultant | 24/7 Legal Assistant',
      description: 'AI-powered legal consultation. Contract analysis, case research, legal document preparation. 200K+ consultations. Try free today.',
      keywords: 'legal ai, ai lawyer, legal assistant ai, legal consultant ai, contract analysis ai'
    },
    de: {
      title: 'Legal AI — KI-Rechtsberater | 24/7 Rechtsassistent',
      description: 'KI-gestützte Rechtsberatung. Vertragsanalyse, Fallforschung, Erstellung rechtlicher Dokumente. 200K+ Beratungen. Jetzt kostenlos testen.',
      keywords: 'rechts-ki, ki anwalt, rechtsassistent ki, rechtsberater ki, vertragsanalyse ki'
    },
    ar: {
      title: 'Legal AI — مستشار قانوني بالذكاء الاصطناعي 24/7',
      description: 'استشارات قانونية مدعومة بالذكاء الاصطناعي. تحليل العقود، البحث في القضايا، إعداد المستندات القانونية. أكثر من 200 ألف استشارة. جرب مجانًا اليوم.',
      keywords: 'الذكاء الاصطناعي القانوني, محامي ذكاء اصطناعي, مساعد قانوني ذكاء اصطناعي'
    },
    ru: {
      title: 'Legal AI — Юридический ИИ-консультант 24/7',
      description: 'Юридические консультации с ИИ. Анализ контрактов, исследование дел, подготовка юридических документов. Более 200 тыс консультаций. Попробуйте бесплатно.',
      keywords: 'юридический ии, ии юрист, юридический ассистент ии, юридический консультант ии'
    },
    zh: {
      title: 'Legal AI — AI法律顾问 | 全天候法律助手服务平台',
      description: 'AI驱动的专业法律咨询平台。合同智能分析，案例深度研究，法律文件快速准备。20万+成功咨询案例。立即免费试用，获取专业法律建议和全面权益保障指导，维护您的合法权益。',
      keywords: '法律ai, ai律师, 法律助手ai, 法律顾问ai, 合同分析ai'
    }
  },

  'ai-advisor-hub.html': {
    tr: {
      title: 'AI Advisor Hub — 8 Uzman AI Danışmanı | İş, Finans',
      description: 'İş, finans, sağlık, yaşam koçu ve 4 uzman daha. 7/24 AI danışmanlık. Kişiselleştirilmiş öneriler. Hemen ücretsiz başlayın ve uzman desteği alın.',
      keywords: 'ai danışman, yapay zeka koç, iş danışmanı ai, finans danışmanı ai, yaşam koçu ai'
    },
    en: {
      title: 'AI Advisor Hub — 8 Expert AI Advisors | Business',
      description: 'Business, finance, health, life coach and 4 more experts. 24/7 AI consultation. Personalized recommendations. Start free and get expert support today.',
      keywords: 'ai advisor, artificial intelligence coach, business advisor ai, finance advisor ai, life coach ai'
    },
    de: {
      title: 'AI Advisor Hub — 8 KI-Expertenberater | Geschäft',
      description: 'Geschäft, Finanzen, Gesundheit, Life Coach und 4 weitere Experten. 24/7 KI-Beratung. Personalisierte Empfehlungen. Jetzt kostenlos starten.',
      keywords: 'ki berater, künstliche intelligenz coach, geschäftsberater ki, finanzberater ki'
    },
    ar: {
      title: 'AI Advisor Hub — 8 مستشارين خبراء بالذكاء الاصطناعي',
      description: 'الأعمال، المالية، الصحة، مدرب الحياة و4 خبراء آخرين. استشارات ذكاء اصطناعي على مدار الساعة. توصيات مخصصة. ابدأ مجانًا واحصل على الدعم الخبير اليوم.',
      keywords: 'مستشار ذكاء اصطناعي, مدرب ذكاء اصطناعي, مستشار أعمال ذكاء اصطناعي'
    },
    ru: {
      title: 'AI Advisor Hub — 8 экспертных ИИ-консультантов',
      description: 'Бизнес, финансы, здоровье, лайф-коуч и еще 4 эксперта. Консультации ИИ 24/7. Персонализированные рекомендации. Начните бесплатно и получите экспертную поддержку.',
      keywords: 'ии консультант, ии коуч, бизнес консультант ии, финансовый консультант ии'
    },
    zh: {
      title: 'AI Advisor Hub — 8位专家AI顾问 | 商业、金融',
      description: '商业、金融、健康、生活教练和其他4位顶级行业专家。全天候AI智能咨询服务平台。个性化专业建议和指导方案。立即免费开始，获取专家级支持和全方位解决方案，助力您的事业发展成功。',
      keywords: 'ai顾问, 人工智能教练, 商业顾问ai, 金融顾问ai, 生活教练ai'
    }
  }
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Generate hreflang tags for a page
 */
function generateHreflangTags(pagePath) {
  const tags = LANGUAGES.map(lang => {
    const url = `https://www.ailydian.com/${lang}/${pagePath}`;
    return `    <link rel="alternate" hreflang="${lang}" href="${url}" />`;
  });

  // Add x-default
  tags.push(`    <link rel="alternate" hreflang="x-default" href="https://www.ailydian.com/en/${pagePath}" />`);

  return tags.join('\n');
}

/**
 * Generate GEO targeting meta tags
 */
function generateGeoTags(lang) {
  const geo = GEO_TARGETING[lang];
  return `    <meta name="geo.region" content="${geo.country}" />
    <meta name="geo.placename" content="${geo.region}" />
    <meta name="geo.position" content="${geo.position}" />
    <meta name="ICBM" content="${geo.position}" />`;
}

/**
 * Generate Open Graph tags
 */
function generateOGTags(page, lang) {
  const content = SEO_CONTENT[page]?.[lang];
  if (!content) return '';

  const geo = GEO_TARGETING[lang];
  const url = `https://www.ailydian.com/${lang}/${page}`;
  const ogImage = `https://www.ailydian.com/og-images/${page.replace('.html', '')}-${lang}.png`;

  return `    <meta property="og:title" content="${content.title}" />
    <meta property="og:description" content="${content.description}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="${ogImage}" />
    <meta property="og:locale" content="${geo.locale}" />
    <meta property="og:site_name" content="LyDian AI" />`;
}

/**
 * Generate Twitter Card tags
 */
function generateTwitterTags(page, lang) {
  const content = SEO_CONTENT[page]?.[lang];
  if (!content) return '';

  const twitterImage = `https://www.ailydian.com/twitter-cards/${page.replace('.html', '')}-${lang}.png`;

  return `    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="@lydianai" />
    <meta name="twitter:title" content="${content.title}" />
    <meta name="twitter:description" content="${content.description}" />
    <meta name="twitter:image" content="${twitterImage}" />`;
}

/**
 * Generate complete SEO meta tags for a page
 */
function generateSEOTags(page, lang) {
  const content = SEO_CONTENT[page]?.[lang];
  if (!content) {
    console.warn(`⚠️  No SEO content for ${page} in ${lang}`);
    return null;
  }

  const canonicalUrl = `https://www.ailydian.com/${lang}/${page}`;

  const seoBlock = `
    <!-- SEO Meta Tags (${lang.toUpperCase()}) -->
    <title>${content.title}</title>
    <meta name="description" content="${content.description}" />
    <meta name="keywords" content="${content.keywords}" />
    <link rel="canonical" href="${canonicalUrl}" />

    <!-- hreflang Tags -->
${generateHreflangTags(page)}

    <!-- GEO Targeting -->
${generateGeoTags(lang)}

    <!-- Open Graph -->
${generateOGTags(page, lang)}

    <!-- Twitter Cards -->
${generateTwitterTags(page, lang)}

    <!-- Additional Meta -->
    <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
    <meta name="googlebot" content="index, follow" />
    <meta name="bingbot" content="index, follow" />
    <meta name="author" content="LyDian AI Ecosystem" />
    <meta name="language" content="${lang.toUpperCase()}" />
`;

  return seoBlock;
}

/**
 * Validate SEO meta tags
 */
function validateSEO(page, lang) {
  const content = SEO_CONTENT[page]?.[lang];
  if (!content) return { valid: false, errors: ['Missing SEO content'] };

  const errors = [];

  // Title validation (30-65 characters)
  if (content.title.length < 30 || content.title.length > 65) {
    errors.push(`Title length: ${content.title.length} (should be 30-65)`);
  }

  // Description validation (80-165 characters)
  if (content.description.length < 80 || content.description.length > 165) {
    errors.push(`Description length: ${content.description.length} (should be 80-165)`);
  }

  // Keywords validation (3-10 keywords, no stuffing)
  const keywordCount = content.keywords.split(',').length;
  if (keywordCount < 3 || keywordCount > 10) {
    errors.push(`Keyword count: ${keywordCount} (should be 3-10)`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// ==================== MAIN EXECUTION ====================

function main() {
  console.log('🚀 TIER 2 SEO META TAG GENERATOR\n');
  console.log('📊 Generating SEO meta tags for LyDian AI pages...\n');

  const tier1Pages = PAGE_CATEGORIES.tier1;
  let totalGenerated = 0;
  let totalErrors = 0;

  const report = {
    timestamp: new Date().toISOString(),
    pages: {},
    summary: {
      total_pages: tier1Pages.length,
      total_languages: LANGUAGES.length,
      total_combinations: tier1Pages.length * LANGUAGES.length,
      generated: 0,
      errors: 0
    }
  };

  // Generate for Tier 1 pages
  tier1Pages.forEach(page => {
    console.log(`\n📄 Processing: ${page}`);
    report.pages[page] = {};

    LANGUAGES.forEach(lang => {
      const validation = validateSEO(page, lang);

      if (validation.valid) {
        const seoTags = generateSEOTags(page, lang);
        if (seoTags) {
          totalGenerated++;
          console.log(`  ✅ ${lang.toUpperCase()}: Generated (${SEO_CONTENT[page][lang].description.length} chars)`);

          report.pages[page][lang] = {
            status: 'success',
            title_length: SEO_CONTENT[page][lang].title.length,
            description_length: SEO_CONTENT[page][lang].description.length,
            keywords_count: SEO_CONTENT[page][lang].keywords.split(',').length
          };
        }
      } else {
        totalErrors++;
        console.log(`  ❌ ${lang.toUpperCase()}: Validation failed`);
        validation.errors.forEach(err => console.log(`     - ${err}`));

        report.pages[page][lang] = {
          status: 'error',
          errors: validation.errors
        };
      }
    });
  });

  report.summary.generated = totalGenerated;
  report.summary.errors = totalErrors;

  // Save report
  const reportPath = path.join(__dirname, '../ops/reports/tier2-seo-generation-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log('\n' + '='.repeat(60));
  console.log('📊 GENERATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Pages:        ${tier1Pages.length}`);
  console.log(`Total Languages:    ${LANGUAGES.length}`);
  console.log(`Total Combinations: ${tier1Pages.length * LANGUAGES.length}`);
  console.log(`✅ Generated:       ${totalGenerated}`);
  console.log(`❌ Errors:          ${totalErrors}`);
  console.log(`📈 Success Rate:    ${((totalGenerated / (tier1Pages.length * LANGUAGES.length)) * 100).toFixed(1)}%`);
  console.log('\n📁 Report saved: ' + reportPath);
  console.log('\n✅ Generation complete!\n');
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  generateSEOTags,
  validateSEO,
  generateHreflangTags,
  SEO_CONTENT,
  PAGE_CATEGORIES,
  LANGUAGES,
  GEO_TARGETING
};
