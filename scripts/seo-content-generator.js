#!/usr/bin/env node

/**
 * AILYDIAN INTELLIGENT SEO CONTENT GENERATOR
 * White-hat SEO content generation with cultural adaptation
 *
 * Features:
 * - Content-aware SEO title/description generation
 * - Multi-language support with cultural adaptation
 * - GEO targeting optimization
 * - Keyword research integration
 * - White-hat compliance
 */

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

// SEO Templates by product category
const SEO_TEMPLATES = {
  homepage: {
    tr: {
      titleTemplate: "LyDian AI — {focus} | Türkiye'nin Yapay Zeka Platformu",
      descriptionTemplate: "{focus} ile yapay zeka gücünü keşfedin. Tıbbi AI, Hukuki AI, IQ Testi ve 8 Uzman Danışman. 40+ dilde çok modelli AI çözümleri. {cta}",
      keywords: ["yapay zeka platformu", "ai türkiye", "tıbbi yapay zeka", "hukuki ai", "iq testi ai", "çok dilli ai", "lydian ai"],
      focus: "2025 Ödüllü AI Ekosistemi",
      cta: "Hemen ücretsiz deneyin."
    },
    en: {
      titleTemplate: "LyDian AI — {focus} | Award-Winning AI Platform",
      descriptionTemplate: "Discover AI power with {focus}. Medical AI, Legal AI, IQ Testing & 8 Expert Advisors. Multi-model AI solutions in 40+ languages. {cta}",
      keywords: ["ai platform", "artificial intelligence", "medical ai", "legal ai", "iq test ai", "multilingual ai", "lydian ai"],
      focus: "2025 Award-Winning AI Ecosystem",
      cta: "Try free now."
    },
    de: {
      titleTemplate: "LyDian AI — {focus} | Preisgekrönte KI-Plattform",
      descriptionTemplate: "Entdecken Sie KI-Power mit {focus}. Medizinische KI, Rechts-KI, IQ-Test & 8 Experten-Berater. Multi-Modell-KI-Lösungen in 40+ Sprachen. {cta}",
      keywords: ["ki plattform", "künstliche intelligenz", "medizinische ki", "rechts ki", "iq test ki", "mehrsprachige ki", "lydian ai"],
      focus: "2025 Preisgekrönte KI-Ökosystem",
      cta: "Jetzt kostenlos testen."
    },
    ar: {
      titleTemplate: "LyDian AI — {focus} | منصة الذكاء الاصطناعي الحائزة على جوائز",
      descriptionTemplate: "اكتشف قوة الذكاء الاصطناعي مع {focus}. الذكاء الاصطناعي الطبي، القانوني، اختبار الذكاء و 8 مستشارين خبراء. حلول AI متعددة النماذج بـ 40+ لغة. {cta}",
      keywords: ["منصة الذكاء الاصطناعي", "الذكاء الاصطناعي الطبي", "الذكاء الاصطناعي القانوني", "اختبار الذكاء", "lydian ai"],
      focus: "نظام الذكاء الاصطناعي الحائز على جوائز 2025",
      cta: "جرب مجانًا الآن."
    },
    ru: {
      titleTemplate: "LyDian AI — {focus} | Награжденная ИИ Платформа",
      descriptionTemplate: "Откройте для себя силу ИИ с {focus}. Медицинский ИИ, Юридический ИИ, IQ Тест и 8 Экспертных Советников. Мультимодельные ИИ решения на 40+ языках. {cta}",
      keywords: ["платформа ии", "искусственный интеллект", "медицинский ии", "юридический ии", "тест iq", "многоязычный ии", "lydian ai"],
      focus: "Награжденная ИИ Экосистема 2025",
      cta: "Попробуйте бесплатно."
    },
    zh: {
      titleTemplate: "LyDian AI — {focus} | 获奖人工智能平台",
      descriptionTemplate: "通过{focus}探索AI力量。医疗AI、法律AI、智商测试及8位专家顾问。40+种语言的多模型AI解决方案。{cta}",
      keywords: ["人工智能平台", "医疗人工智能", "法律人工智能", "智商测试", "多语言人工智能", "lydian ai"],
      focus: "2025年获奖AI生态系统",
      cta: "立即免费试用。"
    }
  },

  "lydian-iq": {
    tr: {
      titleTemplate: "LyDian IQ — {focus} | AI Destekli Zeka Testi",
      descriptionTemplate: "{focus} ile zeka seviyenizi ölçün. Çok modelli yapay zeka analizi, detaylı raporlar, bilimsel metodoloji. {stats} {cta}",
      keywords: ["iq testi", "zeka testi online", "ai iq test", "zeka ölçümü", "ücretsiz iq testi", "lydian iq"],
      focus: "Bilimsel AI Zeka Ölçümü",
      stats: "1M+ kullanıcı, %98 doğruluk.",
      cta: "Ücretsiz test başlat."
    },
    en: {
      titleTemplate: "LyDian IQ — {focus} | AI-Powered Intelligence Test",
      descriptionTemplate: "Measure your intelligence with {focus}. Multi-model AI analysis, detailed reports, scientific methodology. {stats} {cta}",
      keywords: ["iq test", "intelligence test online", "ai iq test", "intelligence measurement", "free iq test", "lydian iq"],
      focus: "Scientific AI Intelligence Measurement",
      stats: "1M+ users, 98% accuracy.",
      cta: "Start free test."
    },
    de: {
      titleTemplate: "LyDian IQ — {focus} | KI-gestützter Intelligenztest",
      descriptionTemplate: "Messen Sie Ihre Intelligenz mit {focus}. Multi-Modell-KI-Analyse, detaillierte Berichte, wissenschaftliche Methodik. {stats} {cta}",
      keywords: ["iq test", "intelligenztest online", "ki iq test", "intelligenzmessung", "kostenloser iq test", "lydian iq"],
      focus: "Wissenschaftliche KI-Intelligenzmessung",
      stats: "1M+ Nutzer, 98% Genauigkeit.",
      cta: "Kostenlosen Test starten."
    },
    ar: {
      titleTemplate: "LyDian IQ — {focus} | اختبار الذكاء بالذكاء الاصطناعي",
      descriptionTemplate: "قس ذكاءك مع {focus}. تحليل الذكاء الاصطناعي متعدد النماذج، تقارير مفصلة، منهجية علمية. {stats} {cta}",
      keywords: ["اختبار الذكاء", "اختبار ذكاء اونلاين", "اختبار iq بالذكاء الاصطناعي", "قياس الذكاء", "lydian iq"],
      focus: "قياس الذكاء العلمي بالذكاء الاصطناعي",
      stats: "+1 مليون مستخدم، دقة 98%.",
      cta: "ابدأ الاختبار المجاني."
    },
    ru: {
      titleTemplate: "LyDian IQ — {focus} | ИИ Тест Интеллекта",
      descriptionTemplate: "Измерьте свой интеллект с {focus}. Мультимодельный ИИ анализ, детальные отчеты, научная методология. {stats} {cta}",
      keywords: ["тест iq", "тест интеллекта онлайн", "ии тест iq", "измерение интеллекта", "бесплатный тест iq", "lydian iq"],
      focus: "Научное ИИ Измерение Интеллекта",
      stats: "1М+ пользователей, 98% точность.",
      cta: "Начать бесплатный тест."
    },
    zh: {
      titleTemplate: "LyDian IQ — {focus} | AI智能测试",
      descriptionTemplate: "通过{focus}测量您的智力。多模型AI分析、详细报告、科学方法。{stats} {cta}",
      keywords: ["智商测试", "在线智力测试", "ai智商测试", "智力测量", "免费智商测试", "lydian iq"],
      focus: "科学AI智力测量",
      stats: "100万+用户，98%准确率。",
      cta: "开始免费测试。"
    }
  },

  "medical-expert": {
    tr: {
      titleTemplate: "Medical Expert — {focus} | AI Tıbbi Asistan",
      descriptionTemplate: "{focus} ile sağlık sorularınıza anında yanıt. Çok modelli AI tanı desteği, tıbbi literatür analizi, acil triage. {stats} {cta}",
      keywords: ["tıbbi yapay zeka", "ai doktor", "sağlık danışmanı ai", "tıbbi tanı ai", "medical expert", "lydian medical"],
      focus: "24/7 AI Destekli Sağlık Danışmanlığı",
      stats: "500K+ danışma, 50+ uzmanlık alanı.",
      cta: "Hemen danış."
    },
    en: {
      titleTemplate: "Medical Expert — {focus} | AI Medical Assistant",
      descriptionTemplate: "Instant answers to your health questions with {focus}. Multi-model AI diagnostic support, medical literature analysis, emergency triage. {stats} {cta}",
      keywords: ["medical ai", "ai doctor", "health advisor ai", "medical diagnosis ai", "medical expert", "lydian medical"],
      focus: "24/7 AI-Powered Health Consultation",
      stats: "500K+ consultations, 50+ specialties.",
      cta: "Consult now."
    },
    de: {
      titleTemplate: "Medical Expert — {focus} | KI Medizinischer Assistent",
      descriptionTemplate: "Sofortige Antworten auf Ihre Gesundheitsfragen mit {focus}. Multi-Modell-KI-Diagnoseunterstützung, medizinische Literaturanalyse, Notfall-Triage. {stats} {cta}",
      keywords: ["medizinische ki", "ki arzt", "gesundheitsberater ki", "medizinische diagnose ki", "medical expert", "lydian medical"],
      focus: "24/7 KI-gestützte Gesundheitsberatung",
      stats: "500K+ Beratungen, 50+ Fachgebiete.",
      cta: "Jetzt konsultieren."
    },
    ar: {
      titleTemplate: "Medical Expert — {focus} | مساعد طبي بالذكاء الاصطناعي",
      descriptionTemplate: "إجابات فورية على أسئلتك الصحية مع {focus}. دعم التشخيص بالذكاء الاصطناعي متعدد النماذج، تحليل الأدبيات الطبية، فرز الطوارئ. {stats} {cta}",
      keywords: ["الذكاء الاصطناعي الطبي", "طبيب ذكاء اصطناعي", "مستشار صحي ai", "تشخيص طبي ai", "medical expert"],
      focus: "استشارة صحية مدعومة بالذكاء الاصطناعي على مدار الساعة",
      stats: "+500 ألف استشارة، أكثر من 50 تخصصًا.",
      cta: "استشر الآن."
    },
    ru: {
      titleTemplate: "Medical Expert — {focus} | ИИ Медицинский Ассистент",
      descriptionTemplate: "Мгновенные ответы на ваши вопросы о здоровье с {focus}. Мультимодельная ИИ диагностическая поддержка, анализ медицинской литературы, экстренная сортировка. {stats} {cta}",
      keywords: ["медицинский ии", "ии доктор", "консультант здоровья ии", "медицинская диагностика ии", "medical expert"],
      focus: "24/7 ИИ Медицинская Консультация",
      stats: "500К+ консультаций, 50+ специальностей.",
      cta: "Консультация сейчас."
    },
    zh: {
      titleTemplate: "Medical Expert — {focus} | AI医疗助手",
      descriptionTemplate: "通过{focus}即时回答您的健康问题。多模型AI诊断支持、医学文献分析、紧急分诊。{stats} {cta}",
      keywords: ["医疗人工智能", "ai医生", "健康顾问ai", "医疗诊断ai", "medical expert", "lydian medical"],
      focus: "24/7 AI医疗咨询",
      stats: "50万+次咨询，50+个专科。",
      cta: "立即咨询。"
    }
  },

  "chat": {
    tr: {
      titleTemplate: "AI Chat — {focus} | Çok Modelli Yapay Zeka Sohbet",
      descriptionTemplate: "{focus} ile akıllı sohbet deneyimi. AX9F7E2B, OX5C9E2B, Gemini birleşik arayüz. Metin, görsel, kod analizi. {stats} {cta}",
      keywords: ["ai sohbet", "yapay zeka chat", "çok modelli ai", "AX9F7E2B chat", "OX5C9E2B türkçe", "ai asistan"],
      focus: "5 AI Modeli Tek Arayüzde",
      stats: "1M+ konuşma, 40+ dil desteği.",
      cta: "Ücretsiz sohbet başlat."
    },
    en: {
      titleTemplate: "AI Chat — {focus} | Multi-Model AI Chat Platform",
      descriptionTemplate: "Smart chat experience with {focus}. AX9F7E2B, OX5C9E2B, Gemini unified interface. Text, vision, code analysis. {stats} {cta}",
      keywords: ["ai chat", "artificial intelligence chat", "multi model ai", "AX9F7E2B chat", "OX5C9E2B chat", "ai assistant"],
      focus: "5 AI Models in One Interface",
      stats: "1M+ conversations, 40+ language support.",
      cta: "Start free chat."
    },
    de: {
      titleTemplate: "AI Chat — {focus} | Multi-Modell KI Chat Plattform",
      descriptionTemplate: "Intelligente Chat-Erfahrung mit {focus}. AX9F7E2B, OX5C9E2B, Gemini vereinheitlichte Schnittstelle. Text, Vision, Code-Analyse. {stats} {cta}",
      keywords: ["ki chat", "künstliche intelligenz chat", "multi modell ki", "AX9F7E2B chat", "OX5C9E2B chat", "ki assistent"],
      focus: "5 KI-Modelle in einer Oberfläche",
      stats: "1M+ Gespräche, 40+ Sprachunterstützung.",
      cta: "Kostenlosen Chat starten."
    },
    ar: {
      titleTemplate: "AI Chat — {focus} | منصة دردشة الذكاء الاصطناعي متعددة النماذج",
      descriptionTemplate: "تجربة دردشة ذكية مع {focus}. واجهة موحدة لـ AX9F7E2B و OX5C9E2B و Gemini. تحليل النص والصورة والكود. {stats} {cta}",
      keywords: ["دردشة ذكاء اصطناعي", "شات ai", "ذكاء اصطناعي متعدد النماذج", "AX9F7E2B شات", "OX5C9E2B عربي"],
      focus: "5 نماذج AI في واجهة واحدة",
      stats: "+1 مليون محادثة، دعم +40 لغة.",
      cta: "ابدأ دردشة مجانية."
    },
    ru: {
      titleTemplate: "AI Chat — {focus} | Мультимодельная ИИ Чат Платформа",
      descriptionTemplate: "Умный чат с {focus}. Единый интерфейс AX9F7E2B, OX5C9E2B, Gemini. Анализ текста, изображений, кода. {stats} {cta}",
      keywords: ["ии чат", "чат искусственный интеллект", "мультимодельный ии", "AX9F7E2B чат", "OX5C9E2B русский", "ии ассистент"],
      focus: "5 ИИ Моделей в Одном Интерфейсе",
      stats: "1М+ разговоров, поддержка 40+ языков.",
      cta: "Начать бесплатный чат."
    },
    zh: {
      titleTemplate: "AI Chat — {focus} | 多模型AI聊天平台",
      descriptionTemplate: "通过{focus}获得智能聊天体验。AX9F7E2B、OX5C9E2B、Gemini统一界面。文本、视觉、代码分析。{stats} {cta}",
      keywords: ["ai聊天", "人工智能聊天", "多模型ai", "AX9F7E2B聊天", "OX5C9E2B中文", "ai助手"],
      focus: "5个AI模型一个界面",
      stats: "100万+对话，支持40+种语言。",
      cta: "开始免费聊天。"
    }
  },

  "legal-ai": {
    tr: {
      titleTemplate: "LyDian Legal AI — {focus} | Hukuki Yapay Zeka Danışmanı",
      descriptionTemplate: "{focus} ile hukuki sorularınıza profesyonel yanıtlar. 1M+ mahkeme kararı analizi, sözleşme inceleme, mevzuat tarama. {stats} {cta}",
      keywords: ["hukuki yapay zeka", "ai avukat", "hukuk danışmanı ai", "sözleşme analizi", "mahkeme kararları", "lydian legal"],
      focus: "AI Destekli Hukuk Danışmanlığı",
      stats: "100K+ danışma, Türk ve Uluslararası Hukuk.",
      cta: "Hukuki danışma al."
    },
    en: {
      titleTemplate: "LyDian Legal AI — {focus} | Legal AI Advisor",
      descriptionTemplate: "Professional answers to your legal questions with {focus}. 1M+ court decision analysis, contract review, legislation screening. {stats} {cta}",
      keywords: ["legal ai", "ai lawyer", "legal advisor ai", "contract analysis", "court decisions", "lydian legal"],
      focus: "AI-Powered Legal Consultation",
      stats: "100K+ consultations, Turkish & International Law.",
      cta: "Get legal advice."
    },
    de: {
      titleTemplate: "LyDian Legal AI — {focus} | Rechts-KI Berater",
      descriptionTemplate: "Professionelle Antworten auf Ihre Rechtsfragen mit {focus}. 1M+ Gerichtsentscheidungsanalyse, Vertragsüberprüfung, Gesetzesscreening. {stats} {cta}",
      keywords: ["rechts ki", "ki anwalt", "rechtsberater ki", "vertragsanalyse", "gerichtsentscheidungen", "lydian legal"],
      focus: "KI-gestützte Rechtsberatung",
      stats: "100K+ Beratungen, Türkisches & Internationales Recht.",
      cta: "Rechtsberatung erhalten."
    },
    ar: {
      titleTemplate: "LyDian Legal AI — {focus} | مستشار قانوني بالذكاء الاصطناعي",
      descriptionTemplate: "إجابات احترافية على أسئلتك القانونية مع {focus}. تحليل +1 مليون قرار محكمة، مراجعة العقود، فحص التشريعات. {stats} {cta}",
      keywords: ["ذكاء اصطناعي قانوني", "محامي ai", "مستشار قانوني ai", "تحليل العقود", "قرارات المحكمة", "lydian legal"],
      focus: "استشارة قانونية مدعومة بالذكاء الاصطناعي",
      stats: "+100 ألف استشارة، القانون التركي والدولي.",
      cta: "احصل على استشارة قانونية."
    },
    ru: {
      titleTemplate: "LyDian Legal AI — {focus} | Юридический ИИ Советник",
      descriptionTemplate: "Профессиональные ответы на ваши юридические вопросы с {focus}. Анализ 1М+ судебных решений, проверка контрактов, скрининг законодательства. {stats} {cta}",
      keywords: ["юридический ии", "ии юрист", "юридический консультант ии", "анализ контрактов", "судебные решения", "lydian legal"],
      focus: "ИИ Юридическая Консультация",
      stats: "100К+ консультаций, Турецкое и Международное Право.",
      cta: "Получить юридическую консультацию."
    },
    zh: {
      titleTemplate: "LyDian Legal AI — {focus} | 法律AI顾问",
      descriptionTemplate: "通过{focus}获得法律问题的专业答案。100万+法院判决分析、合同审查、立法筛选。{stats} {cta}",
      keywords: ["法律人工智能", "ai律师", "法律顾问ai", "合同分析", "法院判决", "lydian legal"],
      focus: "AI法律咨询",
      stats: "10万+次咨询，土耳其和国际法。",
      cta: "获取法律建议。"
    }
  },

  "advisor-hub": {
    tr: {
      titleTemplate: "AI Advisor Hub — {focus} | 8 Uzman AI Danışman",
      descriptionTemplate: "{focus} ile her konuda uzman danışmanlık. Kültür, Karar, Sağlık, Bilgi, Öğrenme, Yaşam, Toplantı, Startup. {stats} {cta}",
      keywords: ["ai danışman", "uzman yapay zeka", "yaşam koçu ai", "startup danışmanı", "karar matrisi", "ai advisor hub"],
      focus: "8 Uzman Yapay Zeka Tek Platformda",
      stats: "300K+ danışma, 8 uzmanlık alanı.",
      cta: "Danışman seç."
    },
    en: {
      titleTemplate: "AI Advisor Hub — {focus} | 8 Expert AI Advisors",
      descriptionTemplate: "Expert consulting on every topic with {focus}. Culture, Decision, Health, Knowledge, Learning, Life, Meeting, Startup. {stats} {cta}",
      keywords: ["ai advisor", "expert ai", "life coach ai", "startup advisor", "decision matrix", "ai advisor hub"],
      focus: "8 Expert AIs in One Platform",
      stats: "300K+ consultations, 8 expertise areas.",
      cta: "Choose advisor."
    },
    de: {
      titleTemplate: "AI Advisor Hub — {focus} | 8 Experten-KI-Berater",
      descriptionTemplate: "Expertenberatung zu jedem Thema mit {focus}. Kultur, Entscheidung, Gesundheit, Wissen, Lernen, Leben, Meeting, Startup. {stats} {cta}",
      keywords: ["ki berater", "experten ki", "lebensberater ki", "startup berater", "entscheidungsmatrix", "ai advisor hub"],
      focus: "8 Experten-KIs auf einer Plattform",
      stats: "300K+ Beratungen, 8 Fachgebiete.",
      cta: "Berater wählen."
    },
    ar: {
      titleTemplate: "AI Advisor Hub — {focus} | 8 مستشارين خبراء بالذكاء الاصطناعي",
      descriptionTemplate: "استشارة الخبراء في كل موضوع مع {focus}. الثقافة، القرار، الصحة، المعرفة، التعلم، الحياة، الاجتماعات، الشركات الناشئة. {stats} {cta}",
      keywords: ["مستشار ذكاء اصطناعي", "خبير ai", "مدرب حياة ai", "مستشار شركات ناشئة", "مصفوفة القرار", "ai advisor hub"],
      focus: "8 مستشارين خبراء في منصة واحدة",
      stats: "+300 ألف استشارة، 8 مجالات خبرة.",
      cta: "اختر مستشارًا."
    },
    ru: {
      titleTemplate: "AI Advisor Hub — {focus} | 8 Экспертных ИИ Советников",
      descriptionTemplate: "Экспертные консультации по любой теме с {focus}. Культура, Решение, Здоровье, Знания, Обучение, Жизнь, Встречи, Стартап. {stats} {cta}",
      keywords: ["ии советник", "эксперт ии", "лайф коуч ии", "советник стартапов", "матрица решений", "ai advisor hub"],
      focus: "8 Экспертных ИИ на Одной Платформе",
      stats: "300К+ консультаций, 8 областей экспертизы.",
      cta: "Выбрать советника."
    },
    zh: {
      titleTemplate: "AI Advisor Hub — {focus} | 8位专家AI顾问",
      descriptionTemplate: "通过{focus}获得各个主题的专家咨询。文化、决策、健康、知识、学习、生活、会议、创业。{stats} {cta}",
      keywords: ["ai顾问", "专家ai", "生活教练ai", "创业顾问", "决策矩阵", "ai advisor hub"],
      focus: "8位专家AI一个平台",
      stats: "30万+次咨询，8个专业领域。",
      cta: "选择顾问。"
    }
  }
};

/**
 * Generate SEO content for a page
 */
function generateSEOContent(pageId, language) {
  const template = SEO_TEMPLATES[pageId]?.[language];

  if (!template) {
    console.error(`No template found for ${pageId} in ${language}`);
    return null;
  }

  const title = template.titleTemplate
    .replace('{focus}', template.focus)
    .replace('{stats}', template.stats || '')
    .replace('{cta}', template.cta || '');

  const description = template.descriptionTemplate
    .replace('{focus}', template.focus)
    .replace('{stats}', template.stats || '')
    .replace('{cta}', template.cta || '');

  return {
    title,
    description,
    keywords: template.keywords.join(', '),
    og: {
      title,
      description,
      image: `/og-images/${pageId}-${language}.jpg`,
      type: 'website',
      locale: getOGLocale(language)
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      image: `/og-images/${pageId}-${language}.jpg`
    }
  };
}

/**
 * Get Open Graph locale code
 */
function getOGLocale(lang) {
  const locales = {
    tr: 'tr_TR',
    en: 'en_US',
    de: 'de_DE',
    ar: 'ar_SA',
    ru: 'ru_RU',
    zh: 'zh_CN'
  };
  return locales[lang] || 'en_US';
}

/**
 * Generate GEO targeting meta tags
 */
function generateGEOTags(language, geoConfig) {
  return {
    'geo.region': geoConfig.country,
    'geo.placename': geoConfig.region,
    'geo.position': geoConfig.coords,
    'ICBM': geoConfig.coords
  };
}

/**
 * Generate complete SEO package for all Tier 1 pages
 */
function generateTier1SEO() {
  const tier1Config = require('/tmp/tier1-pages.json').tier1;
  const results = {};

  for (const page of tier1Config.pages) {
    results[page.id] = {};

    for (const lang of tier1Config.languages) {
      const seoContent = generateSEOContent(page.id, lang);
      const geoTags = generateGEOTags(lang, tier1Config.geo_targets[lang]);

      results[page.id][lang] = {
        ...seoContent,
        geo: geoTags,
        canonical: `https://www.ailydian.com${page.url}`,
        hreflang: tier1Config.languages.map(l => ({
          lang: l,
          url: `https://www.ailydian.com${page.url}?lang=${l}`
        }))
      };
    }
  }

  // Save to file
  const outputPath = path.join(__dirname, '../ops/reports/tier1-seo-content.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));

  console.log('✅ Tier 1 SEO content generated successfully!');
  console.log(`📄 Output: ${outputPath}`);
  console.log(`📊 Generated: ${Object.keys(results).length} pages x ${tier1Config.languages.length} languages`);

  return results;
}

// Run generator
if (require.main === module) {
  try {
    generateTier1SEO();
  } catch (error) {
    console.error('❌ SEO generation failed:', error.message);
    process.exit(1);
  }
}

module.exports = { generateSEOContent, generateGEOTags, generateTier1SEO };
