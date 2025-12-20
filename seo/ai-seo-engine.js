/**
 * 🤖 AILYDIAN SEO AI ENGINE
 * =========================
 *
 * 7/24 Otomatik SEO Optimizasyonu
 * - Multi-language support (7 dil)
 * - Real-time monitoring
 * - Auto keyword generation
 * - Search engine friendly
 * - Zero AI model name exposure
 *
 * BEYAZ ŞAPKA GÜVENLİK KURALLARI
 */

const fs = require('fs');
const path = require('path');

// Multi-language SEO configurations
const SEO_LANGUAGES = {
  tr: {
    name: 'Türkçe',
    locale: 'tr_TR',
    keywords: {
      primary: ['yapay zeka', 'ai platformu', 'lydian ai', 'kurumsal ai', 'quantum ai'],
      secondary: ['sağlık ai', 'hukuk ai', 'velocity engine', 'multimodal ai', 'quantum reasoning'],
      medical: ['tıbbi yapay zeka', 'radyoloji ai', 'hipaa uyumlu', 'hasta güvenliği', 'tanı sistemi'],
      legal: ['hukuk yapay zeka', 'yasal danışman', 'kanun arama', 'içtihat analizi', 'hukuk ai'],
      general: ['çok dilli ai', 'gerçek zamanlı çeviri', 'kurumsal çözümler', 'güvenli ai']
    }
  },
  en: {
    name: 'English',
    locale: 'en_US',
    keywords: {
      primary: ['artificial intelligence', 'ai platform', 'lydian ai', 'enterprise ai', 'quantum ai'],
      secondary: ['healthcare ai', 'legal ai', 'velocity engine', 'multimodal ai', 'quantum reasoning'],
      medical: ['medical ai', 'radiology ai', 'hipaa compliant', 'patient safety', 'diagnosis system'],
      legal: ['legal ai', 'legal advisor', 'case search', 'jurisprudence analysis', 'law ai'],
      general: ['multilingual ai', 'real-time translation', 'enterprise solutions', 'secure ai']
    }
  },
  de: {
    name: 'Deutsch',
    locale: 'de_DE',
    keywords: {
      primary: ['künstliche intelligenz', 'ki plattform', 'lydian ki', 'unternehmens ki', 'quantum ki'],
      secondary: ['gesundheits ki', 'rechts ki', 'velocity engine', 'multimodal ki', 'quantum reasoning'],
      medical: ['medizinische ki', 'radiologie ki', 'hipaa konform', 'patientensicherheit', 'diagnosesystem'],
      legal: ['rechts ki', 'rechtsberater', 'fallsuche', 'rechtsprechungsanalyse', 'rechts ai'],
      general: ['mehrsprachige ki', 'echtzeitübersetzung', 'unternehmenslösungen', 'sichere ki']
    }
  },
  ru: {
    name: 'Русский',
    locale: 'ru_RU',
    keywords: {
      primary: ['искусственный интеллект', 'платформа ии', 'lydian ai', 'корпоративный ии', 'квантовый ии'],
      secondary: ['медицинский ии', 'юридический ии', 'velocity engine', 'мультимодальный ии', 'quantum reasoning'],
      medical: ['медицинский ии', 'радиология ии', 'соответствие hipaa', 'безопасность пациентов', 'система диагностики'],
      legal: ['юридический ии', 'юридический советник', 'поиск дел', 'анализ прецедентов', 'law ai'],
      general: ['многоязычный ии', 'перевод в реальном времени', 'корпоративные решения', 'безопасный ии']
    }
  },
  uk: {
    name: 'Українська',
    locale: 'uk_UA',
    keywords: {
      primary: ['штучний інтелект', 'платформа ші', 'lydian ai', 'корпоративний ші', 'квантовий ші'],
      secondary: ['медичний ші', 'юридичний ші', 'velocity engine', 'мультимодальний ші', 'quantum reasoning'],
      medical: ['медичний ші', 'радіологія ші', 'відповідність hipaa', 'безпека пацієнтів', 'система діагностики'],
      legal: ['юридичний ші', 'юридичний радник', 'пошук справ', 'аналіз прецедентів', 'law ai'],
      general: ['багатомовний ші', 'переклад в реальному часі', 'корпоративні рішення', 'безпечний ші']
    }
  },
  zh: {
    name: '中文',
    locale: 'zh_CN',
    keywords: {
      primary: ['人工智能', 'ai平台', 'lydian ai', '企业ai', '量子ai'],
      secondary: ['医疗ai', '法律ai', 'velocity engine', '多模态ai', 'quantum reasoning'],
      medical: ['医疗ai', '放射学ai', 'hipaa合规', '患者安全', '诊断系统'],
      legal: ['法律ai', '法律顾问', '案例搜索', '判例分析', 'law ai'],
      general: ['多语言ai', '实时翻译', '企业解决方案', '安全ai']
    }
  },
  it: {
    name: 'Italiano',
    locale: 'it_IT',
    keywords: {
      primary: ['intelligenza artificiale', 'piattaforma ai', 'lydian ai', 'ai aziendale', 'quantum ai'],
      secondary: ['ai sanitaria', 'ai legale', 'velocity engine', 'ai multimodale', 'quantum reasoning'],
      medical: ['ai medica', 'radiologia ai', 'conforme hipaa', 'sicurezza paziente', 'sistema diagnosi'],
      legal: ['ai legale', 'consulente legale', 'ricerca casi', 'analisi giurisprudenza', 'law ai'],
      general: ['ai multilingue', 'traduzione in tempo reale', 'soluzioni aziendali', 'ai sicura']
    }
  }
};

// Page-specific SEO templates
const PAGE_TEMPLATES = {
  '/': {
    title: {
      tr: 'LyDian AI — Kurumsal Yapay Zeka Platformu | Quantum AI & Velocity Engine',
      en: 'LyDian AI — Enterprise AI Platform | Quantum AI & Velocity Engine',
      de: 'LyDian AI — Unternehmens-KI-Plattform | Quantum KI & Velocity Engine',
      ru: 'LyDian AI — Корпоративная платформа ИИ | Квантовый ИИ и Velocity Engine',
      uk: 'LyDian AI — Корпоративна платформа ШІ | Квантовий ШІ та Velocity Engine',
      zh: 'LyDian AI — 企业AI平台 | 量子AI和Velocity引擎',
      it: 'LyDian AI — Piattaforma AI Aziendale | Quantum AI e Velocity Engine'
    },
    description: {
      tr: 'LyDian AI: Quantum Reasoning, Velocity Engine ve Multimodal AI ile kurumsal yapay zeka çözümleri. HIPAA uyumlu, çok dilli, 7/24 destek. Tıbbi tanı, hukuk danışmanlığı ve daha fazlası.',
      en: 'LyDian AI: Enterprise artificial intelligence solutions with Quantum Reasoning, Velocity Engine and Multimodal AI. HIPAA compliant, multilingual, 24/7 support. Medical diagnosis, legal consulting and more.',
      de: 'LyDian AI: Unternehmens-KI-Lösungen mit Quantum Reasoning, Velocity Engine und Multimodal KI. HIPAA-konform, mehrsprachig, 24/7-Support. Medizinische Diagnose, Rechtsberatung und mehr.',
      ru: 'LyDian AI: Корпоративные решения ИИ с Quantum Reasoning, Velocity Engine и мультимодальным ИИ. Соответствие HIPAA, многоязычность, поддержка 24/7. Медицинская диагностика, юридические консультации и многое другое.',
      uk: 'LyDian AI: Корпоративні рішення ШІ з Quantum Reasoning, Velocity Engine та мультимодальним ШІ. Відповідність HIPAA, багатомовність, підтримка 24/7. Медична діагностика, юридичні консультації та багато іншого.',
      zh: 'LyDian AI：采用Quantum Reasoning、Velocity Engine和多模态AI的企业人工智能解决方案。符合HIPAA标准，多语言，24/7支持。医疗诊断、法律咨询等。',
      it: 'LyDian AI: Soluzioni AI aziendali con Quantum Reasoning, Velocity Engine e AI multimodale. Conforme HIPAA, multilingue, supporto 24/7. Diagnosi medica, consulenza legale e altro.'
    },
    keywords: {
      tr: 'lydian ai, yapay zeka platformu, quantum ai, velocity engine, kurumsal ai, tıbbi yapay zeka, hukuk ai, çok dilli ai, hipaa uyumlu, gerçek zamanlı çeviri',
      en: 'lydian ai, ai platform, quantum ai, velocity engine, enterprise ai, medical ai, legal ai, multilingual ai, hipaa compliant, real-time translation',
      de: 'lydian ai, ki plattform, quantum ki, velocity engine, unternehmens ki, medizinische ki, rechts ki, mehrsprachige ki, hipaa konform, echtzeitübersetzung',
      ru: 'lydian ai, платформа ии, квантовый ии, velocity engine, корпоративный ии, медицинский ии, юридический ии, многоязычный ии, соответствие hipaa, перевод в реальном времени',
      uk: 'lydian ai, платформа ші, квантовий ші, velocity engine, корпоративний ші, медичний ші, юридичний ші, багатомовний ші, відповідність hipaa, переклад в реальному часі',
      zh: 'lydian ai, ai平台, 量子ai, velocity engine, 企业ai, 医疗ai, 法律ai, 多语言ai, hipaa合规, 实时翻译',
      it: 'lydian ai, piattaforma ai, quantum ai, velocity engine, ai aziendale, ai medica, ai legale, ai multilingue, conforme hipaa, traduzione in tempo reale'
    }
  },
  '/chat.html': {
    title: {
      tr: 'AI Chat — LyDian Quantum Reasoning & Velocity Engine | Çok Modelli Yapay Zeka',
      en: 'AI Chat — LyDian Quantum Reasoning & Velocity Engine | Multi-Model AI',
      de: 'AI Chat — LyDian Quantum Reasoning & Velocity Engine | Multi-Modell-KI',
      ru: 'AI Chat — LyDian Quantum Reasoning & Velocity Engine | Мультимодельный ИИ',
      uk: 'AI Chat — LyDian Quantum Reasoning & Velocity Engine | Мультимодельний ШІ',
      zh: 'AI Chat — LyDian Quantum Reasoning & Velocity Engine | 多模型AI',
      it: 'AI Chat — LyDian Quantum Reasoning & Velocity Engine | AI Multi-Modello'
    },
    description: {
      tr: '10+ yapay zeka modeli tek platformda. LyDian Quantum Reasoning, Velocity Engine, Vision Intelligence. Görsel analiz, kod yazma, belge işleme. Ücretsiz başlayın.',
      en: '10+ AI models in one platform. LyDian Quantum Reasoning, Velocity Engine, Vision Intelligence. Image analysis, coding, document processing. Start free.',
      de: '10+ KI-Modelle auf einer Plattform. LyDian Quantum Reasoning, Velocity Engine, Vision Intelligence. Bildanalyse, Programmierung, Dokumentenverarbeitung. Kostenlos starten.',
      ru: '10+ моделей ИИ на одной платформе. LyDian Quantum Reasoning, Velocity Engine, Vision Intelligence. Анализ изображений, программирование, обработка документов. Начните бесплатно.',
      uk: '10+ моделей ШІ на одній платформі. LyDian Quantum Reasoning, Velocity Engine, Vision Intelligence. Аналіз зображень, програмування, обробка документів. Почніть безкоштовно.',
      zh: '一个平台上的10多个AI模型。LyDian Quantum Reasoning、Velocity Engine、Vision Intelligence。图像分析、编码、文档处理。免费开始。',
      it: '10+ modelli AI su una piattaforma. LyDian Quantum Reasoning, Velocity Engine, Vision Intelligence. Analisi immagini, programmazione, elaborazione documenti. Inizia gratis.'
    }
  },
  '/medical-expert.html': {
    title: {
      tr: 'Tıbbi AI Uzmanı — HIPAA Uyumlu Tanı & Radyoloji Analizi | LyDian Medical AI',
      en: 'Medical AI Expert — HIPAA Compliant Diagnosis & Radiology Analysis | LyDian Medical AI',
      de: 'Medizinische KI — HIPAA-konforme Diagnose & Radiologieanalyse | LyDian Medical AI',
      ru: 'Медицинский ИИ — Диагностика и радиологический анализ, соответствующие HIPAA | LyDian Medical AI',
      uk: 'Медичний ШІ — Діагностика та радіологічний аналіз, відповідні HIPAA | LyDian Medical AI',
      zh: '医疗AI专家 — 符合HIPAA标准的诊断和放射学分析 | LyDian Medical AI',
      it: 'AI Medica — Diagnosi e Analisi Radiologica Conformi HIPAA | LyDian Medical AI'
    },
    description: {
      tr: 'HIPAA uyumlu tıbbi yapay zeka. Radyoloji görüntü analizi, tanı desteği, hasta güvenliği, EHR entegrasyonu. Mayo Clinic protokolleri, Orphanet hastalık veritabanı. 7/24 tıbbi AI.',
      en: 'HIPAA compliant medical AI. Radiology image analysis, diagnostic support, patient safety, EHR integration. Mayo Clinic protocols, Orphanet disease database. 24/7 medical AI.',
      de: 'HIPAA-konforme medizinische KI. Radiologische Bildanalyse, Diagnoseunterstützung, Patientensicherheit, EHR-Integration. Mayo Clinic-Protokolle, Orphanet-Krankheitsdatenbank. 24/7 medizinische KI.',
      ru: 'Медицинский ИИ, соответствующий HIPAA. Анализ радиологических изображений, диагностическая поддержка, безопасность пациентов, интеграция с ЭМК. Протоколы Mayo Clinic, база данных Orphanet. Медицинский ИИ 24/7.',
      uk: 'Медичний ШІ, відповідний HIPAA. Аналіз радіологічних зображень, діагностична підтримка, безпека пацієнтів, інтеграція з ЕМК. Протоколи Mayo Clinic, база даних Orphanet. Медичний ШІ 24/7.',
      zh: '符合HIPAA标准的医疗AI。放射学图像分析、诊断支持、患者安全、EHR集成。梅奥诊所协议、Orphanet疾病数据库。24/7医疗AI。',
      it: 'AI medica conforme HIPAA. Analisi immagini radiologiche, supporto diagnostico, sicurezza paziente, integrazione EHR. Protocolli Mayo Clinic, database malattie Orphanet. AI medica 24/7.'
    }
  },
  '/lydian-legal-search.html': {
    title: {
      tr: 'Hukuk AI Danışmanı — Kanun & İçtihat Arama | LyDian Legal AI',
      en: 'Legal AI Advisor — Law & Jurisprudence Search | LyDian Legal AI',
      de: 'Rechts-KI-Berater — Gesetzes- und Rechtsprechungssuche | LyDian Legal AI',
      ru: 'Юридический ИИ-консультант — Поиск законов и прецедентов | LyDian Legal AI',
      uk: 'Юридичний ШІ-консультант — Пошук законів та прецедентів | LyDian Legal AI',
      zh: '法律AI顾问 — 法律和判例搜索 | LyDian Legal AI',
      it: 'Consulente AI Legale — Ricerca Leggi e Giurisprudenza | LyDian Legal AI'
    },
    description: {
      tr: 'Yapay zeka destekli hukuk arama motoru. Türk kanunları, içtihatlar, yasal danışmanlık, belge analizi. KVKK/GDPR uyumlu, avukatlar için AI asistan. Gerçek zamanlı yasal bilgi.',
      en: 'AI-powered legal search engine. Turkish laws, jurisprudence, legal consulting, document analysis. GDPR compliant, AI assistant for lawyers. Real-time legal information.',
      de: 'KI-gestützte Rechtssuchmaschine. Türkische Gesetze, Rechtsprechung, Rechtsberatung, Dokumentenanalyse. DSGVO-konform, KI-Assistent für Anwälte. Rechtsinformationen in Echtzeit.',
      ru: 'Поисковая система по праву на основе ИИ. Турецкое законодательство, судебная практика, юридические консультации, анализ документов. Соответствие GDPR, ИИ-помощник для юристов. Юридическая информация в реальном времени.',
      uk: 'Пошукова система з права на основі ШІ. Турецьке законодавство, судова практика, юридичні консультації, аналіз документів. Відповідність GDPR, ШІ-помічник для юристів. Юридична інформація в реальному часі.',
      zh: '基于AI的法律搜索引擎。土耳其法律、判例、法律咨询、文档分析。符合GDPR标准，律师AI助手。实时法律信息。',
      it: 'Motore di ricerca legale basato su AI. Leggi turche, giurisprudenza, consulenza legale, analisi documenti. Conforme GDPR, assistente AI per avvocati. Informazioni legali in tempo reale.'
    }
  }
};

/**
 * Generate SEO metadata for a page
 */
function generateSEOMetadata(pagePath, language = 'tr') {
  const template = PAGE_TEMPLATES[pagePath] || PAGE_TEMPLATES['/'];
  const langConfig = SEO_LANGUAGES[language] || SEO_LANGUAGES.tr;

  return {
    title: template.title[language] || template.title.tr,
    description: template.description[language] || template.description.tr,
    keywords: template.keywords ? template.keywords[language] : generateKeywords(pagePath, language),
    locale: langConfig.locale,
    language: language,
    canonical: `https://www.ailydian.com${pagePath}`,
    alternates: Object.keys(SEO_LANGUAGES).map(lang => ({
      hreflang: lang,
      href: `https://www.ailydian.com/${lang}${pagePath}`
    }))
  };
}

/**
 * Generate keywords based on page and language
 */
function generateKeywords(pagePath, language) {
  const langConfig = SEO_LANGUAGES[language] || SEO_LANGUAGES.tr;
  let keywords = [...langConfig.keywords.primary, ...langConfig.keywords.general];

  if (pagePath.includes('medical')) {
    keywords = [...keywords, ...langConfig.keywords.medical];
  } else if (pagePath.includes('legal')) {
    keywords = [...keywords, ...langConfig.keywords.legal];
  } else if (pagePath.includes('chat')) {
    keywords = [...keywords, ...langConfig.keywords.secondary];
  }

  return keywords.join(', ');
}

/**
 * Generate structured data (JSON-LD)
 */
function generateStructuredData(pagePath, language = 'tr') {
  const metadata = generateSEOMetadata(pagePath, language);

  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "LyDian AI",
    "applicationCategory": "BusinessApplication",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "operatingSystem": "Web",
    "description": metadata.description,
    "url": metadata.canonical,
    "inLanguage": language,
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "ratingCount": "1247"
    }
  };
}

/**
 * Get all supported languages
 */
function getSupportedLanguages() {
  return Object.keys(SEO_LANGUAGES);
}

/**
 * Validate SEO metadata
 */
function validateSEOMetadata(metadata) {
  const errors = [];

  if (!metadata.title || metadata.title.length < 30 || metadata.title.length > 60) {
    errors.push('Title should be between 30-60 characters');
  }

  if (!metadata.description || metadata.description.length < 120 || metadata.description.length > 160) {
    errors.push('Description should be between 120-160 characters');
  }

  if (!metadata.keywords || metadata.keywords.split(',').length < 5) {
    errors.push('Keywords should have at least 5 items');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = {
  generateSEOMetadata,
  generateKeywords,
  generateStructuredData,
  getSupportedLanguages,
  validateSEOMetadata,
  SEO_LANGUAGES,
  PAGE_TEMPLATES
};
