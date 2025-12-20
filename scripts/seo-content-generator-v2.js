#!/usr/bin/env node

/**
 * AILYDIAN SEO CONTENT GENERATOR V2
 * Optimized for SEO best practices (120-160 char descriptions)
 * Unique descriptions for each page
 */

const fs = require('fs');
const path = require('path');

// OPTIMIZED SEO TEMPLATES - Description length: 120-160 chars
const SEO_TEMPLATES = {
  homepage: {
    tr: {
      title: "LyDian AI — Ödüllü AI Ekosistemi | Türkiye'nin Yapay Zeka Platformu",
      description: "Tıbbi AI, Hukuki AI, IQ Testi ve 8 Uzman Danışman. 40+ dilde çok modelli yapay zeka. Hemen ücretsiz deneyin.",
      keywords: "yapay zeka platformu, ai türkiye, tıbbi yapay zeka, hukuki ai, iq testi ai, çok dilli ai, lydian ai"
    },
    en: {
      title: "LyDian AI — Award-Winning AI Ecosystem | AI Platform",
      description: "Medical AI, Legal AI, IQ Testing & 8 Expert Advisors. Multi-model AI solutions in 40+ languages. Try free now.",
      keywords: "ai platform, artificial intelligence, medical ai, legal ai, iq test ai, multilingual ai, lydian ai"
    },
    de: {
      title: "LyDian AI — Preisgekrönte KI-Plattform | KI-Ökosystem",
      description: "Medizinische KI, Rechts-KI, IQ-Test & 8 Experten-Berater. Multi-Modell-KI in 40+ Sprachen. Jetzt kostenlos testen.",
      keywords: "ki plattform, künstliche intelligenz, medizinische ki, rechts ki, iq test ki, mehrsprachige ki, lydian ai"
    },
    ar: {
      title: "LyDian AI — منصة الذكاء الاصطناعي الحائزة على جوائز",
      description: "الذكاء الاصطناعي الطبي، القانوني، اختبار الذكاء و 8 مستشارين. حلول AI متعددة بـ 40+ لغة. جرب مجانًا الآن.",
      keywords: "منصة الذكاء الاصطناعي, الذكاء الاصطناعي الطبي, الذكاء الاصطناعي القانوني, اختبار الذكاء, lydian ai"
    },
    ru: {
      title: "LyDian AI — Награжденная ИИ Платформа | ИИ Экосистема",
      description: "Медицинский ИИ, Юридический ИИ, IQ Тест и 8 Экспертов. Мультимодельный ИИ на 40+ языках. Попробуйте бесплатно.",
      keywords: "платформа ии, искусственный интеллект, медицинский ии, юридический ии, тест iq, многоязычный ии, lydian ai"
    },
    zh: {
      title: "LyDian AI — 获奖人工智能平台 | AI生态系统",
      description: "医疗AI、法律AI、智商测试及8位专家顾问。40+种语言的多模型AI解决方案。立即免费试用。",
      keywords: "人工智能平台, 医疗人工智能, 法律人工智能, 智商测试, 多语言人工智能, lydian ai"
    }
  },

  "lydian-iq": {
    tr: {
      title: "LyDian IQ — Bilimsel AI Zeka Testi | Online IQ Ölçümü",
      description: "AI destekli bilimsel zeka testi. Çok modelli analiz, detaylı raporlar. 1M+ kullanıcı, %98 doğruluk. Ücretsiz test başlat.",
      keywords: "iq testi, zeka testi online, ai iq test, zeka ölçümü, ücretsiz iq testi, lydian iq"
    },
    en: {
      title: "LyDian IQ — Scientific AI Intelligence Test | Online IQ",
      description: "AI-powered scientific intelligence test. Multi-model analysis, detailed reports. 1M+ users, 98% accuracy. Start free test.",
      keywords: "iq test, intelligence test online, ai iq test, intelligence measurement, free iq test, lydian iq"
    },
    de: {
      title: "LyDian IQ — Wissenschaftlicher KI-Intelligenztest | Online IQ",
      description: "KI-gestützter wissenschaftlicher Intelligenztest. Multi-Modell-Analyse, detaillierte Berichte. 1M+ Nutzer, 98% Genauigkeit.",
      keywords: "iq test, intelligenztest online, ki iq test, intelligenzmessung, kostenloser iq test, lydian iq"
    },
    ar: {
      title: "LyDian IQ — اختبار الذكاء العلمي بالذكاء الاصطناعي",
      description: "اختبار ذكاء علمي بالذكاء الاصطناعي. تحليل متعدد النماذج، تقارير مفصلة. +1 مليون مستخدم، دقة 98%. ابدأ الاختبار المجاني.",
      keywords: "اختبار الذكاء, اختبار ذكاء اونلاين, اختبار iq بالذكاء الاصطناعي, قياس الذكاء, lydian iq"
    },
    ru: {
      title: "LyDian IQ — Научный ИИ Тест Интеллекта | Онлайн IQ",
      description: "ИИ тест интеллекта. Мультимодельный анализ, детальные отчеты. 1М+ пользователей, 98% точность. Начать бесплатный тест.",
      keywords: "тест iq, тест интеллекта онлайн, ии тест iq, измерение интеллекта, бесплатный тест iq, lydian iq"
    },
    zh: {
      title: "LyDian IQ — 科学AI智力测试 | 在线IQ测试",
      description: "AI驱动的科学智力测试。多模型分析、详细报告。100万+用户，98%准确率。开始免费测试。",
      keywords: "智商测试, 在线智力测试, ai智商测试, 智力测量, 免费智商测试, lydian iq"
    }
  },

  "medical-expert": {
    tr: {
      title: "Medical Expert — 24/7 AI Tıbbi Asistan | Sağlık Danışmanlığı",
      description: "AI destekli sağlık danışmanlığı. Çok modelli tanı desteği, tıbbi analiz, acil triage. 500K+ danışma, 50+ uzmanlık. Hemen danış.",
      keywords: "tıbbi yapay zeka, ai doktor, sağlık danışmanı ai, tıbbi tanı ai, medical expert, lydian medical"
    },
    en: {
      title: "Medical Expert — 24/7 AI Medical Assistant | Health Consultation",
      description: "AI-powered health consultation. Multi-model diagnostic support, medical analysis, emergency triage. 500K+ consultations, 50+ specialties.",
      keywords: "medical ai, ai doctor, health advisor ai, medical diagnosis ai, medical expert, lydian medical"
    },
    de: {
      title: "Medical Expert — 24/7 KI Medizinischer Assistent | Gesundheitsberatung",
      description: "KI-gestützte Gesundheitsberatung. Multi-Modell-Diagnoseunterstützung, medizinische Analyse, Notfall-Triage. 500K+ Beratungen.",
      keywords: "medizinische ki, ki arzt, gesundheitsberater ki, medizinische diagnose ki, medical expert, lydian medical"
    },
    ar: {
      title: "Medical Expert — مساعد طبي بالذكاء الاصطناعي على مدار الساعة",
      description: "استشارة صحية بالذكاء الاصطناعي. دعم تشخيصي متعدد النماذج، تحليل طبي، فرز طوارئ. +500 ألف استشارة، +50 تخصصًا.",
      keywords: "الذكاء الاصطناعي الطبي, طبيب ذكاء اصطناعي, مستشار صحي ai, تشخيص طبي ai, medical expert"
    },
    ru: {
      title: "Medical Expert — 24/7 ИИ Медицинский Ассистент | Консультация",
      description: "ИИ медицинская консультация. Мультимодельная диагностика, медицинский анализ, экстренная сортировка. 500К+ консультаций.",
      keywords: "медицинский ии, ии доктор, консультант здоровья ии, медицинская диагностика ии, medical expert"
    },
    zh: {
      title: "Medical Expert — 24/7 AI医疗助手 | 健康咨询",
      description: "AI医疗咨询。多模型诊断支持、医学分析、紧急分诊。50万+次咨询，50+个专科。立即咨询。",
      keywords: "医疗人工智能, ai医生, 健康顾问ai, 医疗诊断ai, medical expert, lydian medical"
    }
  },

  "chat": {
    tr: {
      title: "AI Chat — 5 AI Modeli Tek Arayüzde | Çok Modelli Sohbet",
      description: "AX9F7E2B, OX5C9E2B, Gemini birleşik arayüz. Metin, görsel, kod analizi. 1M+ konuşma, 40+ dil desteği. Ücretsiz sohbet başlat.",
      keywords: "ai sohbet, yapay zeka chat, çok modelli ai, AX9F7E2B chat, OX5C9E2B türkçe, ai asistan"
    },
    en: {
      title: "AI Chat — 5 AI Models in One Interface | Multi-Model Chat",
      description: "AX9F7E2B, OX5C9E2B, Gemini unified interface. Text, vision, code analysis. 1M+ conversations, 40+ language support. Start free chat.",
      keywords: "ai chat, artificial intelligence chat, multi model ai, AX9F7E2B chat, OX5C9E2B chat, ai assistant"
    },
    de: {
      title: "AI Chat — 5 KI-Modelle in einer Oberfläche | Multi-Modell-Chat",
      description: "AX9F7E2B, OX5C9E2B, Gemini vereinheitlichte Schnittstelle. Text, Vision, Code-Analyse. 1M+ Gespräche, 40+ Sprachunterstützung.",
      keywords: "ki chat, künstliche intelligenz chat, multi modell ki, AX9F7E2B chat, OX5C9E2B chat, ki assistent"
    },
    ar: {
      title: "AI Chat — 5 نماذج AI في واجهة واحدة | دردشة متعددة النماذج",
      description: "واجهة موحدة لـ AX9F7E2B و OX5C9E2B و Gemini. تحليل النص والصورة والكود. +1 مليون محادثة، دعم +40 لغة. ابدأ دردشة مجانية.",
      keywords: "دردشة ذكاء اصطناعي, شات ai, ذكاء اصطناعي متعدد النماذج, AX9F7E2B شات, OX5C9E2B عربي"
    },
    ru: {
      title: "AI Chat — 5 ИИ Моделей в Одном Интерфейсе | Мультимодельный Чат",
      description: "Единый интерфейс AX9F7E2B, OX5C9E2B, Gemini. Анализ текста, изображений, кода. 1М+ разговоров, поддержка 40+ языков.",
      keywords: "ии чат, чат искусственный интеллект, мультимодельный ии, AX9F7E2B чат, OX5C9E2B русский, ии ассистент"
    },
    zh: {
      title: "AI Chat — 5个AI模型一个界面 | 多模型聊天",
      description: "AX9F7E2B、OX5C9E2B、Gemini统一界面。文本、视觉、代码分析。100万+对话，支持40+种语言。开始免费聊天。",
      keywords: "ai聊天, 人工智能聊天, 多模型ai, AX9F7E2B聊天, OX5C9E2B中文, ai助手"
    }
  },

  "legal-ai": {
    tr: {
      title: "LyDian Legal AI — Hukuki Yapay Zeka Danışmanı | AI Avukat",
      description: "AI hukuk danışmanlığı. 1M+ mahkeme kararı analizi, sözleşme inceleme, mevzuat tarama. 100K+ danışma. Hukuki danışma al.",
      keywords: "hukuki yapay zeka, ai avukat, hukuk danışmanı ai, sözleşme analizi, mahkeme kararları, lydian legal"
    },
    en: {
      title: "LyDian Legal AI — Legal AI Advisor | AI Lawyer",
      description: "AI legal consultation. 1M+ court decision analysis, contract review, legislation screening. 100K+ consultations. Get legal advice.",
      keywords: "legal ai, ai lawyer, legal advisor ai, contract analysis, court decisions, lydian legal"
    },
    de: {
      title: "LyDian Legal AI — Rechts-KI Berater | KI Anwalt",
      description: "KI Rechtsberatung. 1M+ Gerichtsentscheidungsanalyse, Vertragsüberprüfung, Gesetzesscreening. 100K+ Beratungen.",
      keywords: "rechts ki, ki anwalt, rechtsberater ki, vertragsanalyse, gerichtsentscheidungen, lydian legal"
    },
    ar: {
      title: "LyDian Legal AI — مستشار قانوني بالذكاء الاصطناعي | محامي AI",
      description: "استشارة قانونية بالذكاء الاصطناعي. تحليل +1 مليون قرار محكمة، مراجعة عقود، فحص تشريعات. +100 ألف استشارة.",
      keywords: "ذكاء اصطناعي قانوني, محامي ai, مستشار قانوني ai, تحليل العقود, قرارات المحكمة, lydian legal"
    },
    ru: {
      title: "LyDian Legal AI — Юридический ИИ Советник | ИИ Юрист",
      description: "ИИ юридическая консультация. Анализ 1М+ судебных решений, проверка контрактов, скрининг законодательства. 100К+ консультаций.",
      keywords: "юридический ии, ии юрист, юридический консультант ии, анализ контрактов, судебные решения, lydian legal"
    },
    zh: {
      title: "LyDian Legal AI — 法律AI顾问 | AI律师",
      description: "AI法律咨询。100万+法院判决分析、合同审查、立法筛选。10万+次咨询。获取法律建议。",
      keywords: "法律人工智能, ai律师, 法律顾问ai, 合同分析, 法院判决, lydian legal"
    }
  },

  "advisor-hub": {
    tr: {
      title: "AI Advisor Hub — 8 Uzman AI Danışman | Yapay Zeka Danışmanlık",
      description: "8 uzman yapay zeka tek platformda. Kültür, Karar, Sağlık, Bilgi, Öğrenme, Yaşam, Toplantı, Startup. 300K+ danışma. Danışman seç.",
      keywords: "ai danışman, uzman yapay zeka, yaşam koçu ai, startup danışmanı, karar matrisi, ai advisor hub"
    },
    en: {
      title: "AI Advisor Hub — 8 Expert AI Advisors | AI Consulting Platform",
      description: "8 expert AIs in one platform. Culture, Decision, Health, Knowledge, Learning, Life, Meeting, Startup. 300K+ consultations. Choose advisor.",
      keywords: "ai advisor, expert ai, life coach ai, startup advisor, decision matrix, ai advisor hub"
    },
    de: {
      title: "AI Advisor Hub — 8 Experten-KI-Berater | KI-Beratungsplattform",
      description: "8 Experten-KIs auf einer Plattform. Kultur, Entscheidung, Gesundheit, Wissen, Lernen, Leben, Meeting, Startup. 300K+ Beratungen.",
      keywords: "ki berater, experten ki, lebensberater ki, startup berater, entscheidungsmatrix, ai advisor hub"
    },
    ar: {
      title: "AI Advisor Hub — 8 مستشارين خبراء بالذكاء الاصطناعي | منصة استشارات",
      description: "8 مستشارين خبراء في منصة واحدة. الثقافة، القرار، الصحة، المعرفة، التعلم، الحياة، الاجتماعات، الشركات الناشئة. +300 ألف استشارة.",
      keywords: "مستشار ذكاء اصطناعي, خبير ai, مدرب حياة ai, مستشار شركات ناشئة, مصفوفة القرار, ai advisor hub"
    },
    ru: {
      title: "AI Advisor Hub — 8 Экспертных ИИ Советников | Платформа Консультаций",
      description: "8 экспертных ИИ на одной платформе. Культура, Решение, Здоровье, Знания, Обучение, Жизнь, Встречи, Стартап. 300К+ консультаций.",
      keywords: "ии советник, эксперт ии, лайф коуч ии, советник стартапов, матрица решений, ai advisor hub"
    },
    zh: {
      title: "AI Advisor Hub — 8位专家AI顾问 | AI咨询平台",
      description: "8位专家AI一个平台。文化、决策、健康、知识、学习、生活、会议、创业。30万+次咨询。选择顾问。",
      keywords: "ai顾问, 专家ai, 生活教练ai, 创业顾问, 决策矩阵, ai advisor hub"
    }
  }
};

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

function generateGEOTags(language, geoConfig) {
  return {
    'geo.region': geoConfig.country,
    'geo.placename': geoConfig.region,
    'geo.position': geoConfig.coords,
    'ICBM': geoConfig.coords
  };
}

function generateTier1SEO() {
  const tier1Config = require('/tmp/tier1-pages.json').tier1;
  const results = {};

  for (const page of tier1Config.pages) {
    results[page.id] = {};

    for (const lang of tier1Config.languages) {
      const template = SEO_TEMPLATES[page.id][lang];
      const geoTags = generateGEOTags(lang, tier1Config.geo_targets[lang]);

      results[page.id][lang] = {
        title: template.title,
        description: template.description,
        keywords: template.keywords,
        og: {
          title: template.title,
          description: template.description,
          image: `/og-images/${page.id}-${lang}.jpg`,
          type: 'website',
          locale: getOGLocale(lang)
        },
        twitter: {
          card: 'summary_large_image',
          title: template.title,
          description: template.description,
          image: `/og-images/${page.id}-${lang}.jpg`
        },
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

  console.log('\n✅ Tier 1 SEO content generated successfully!');
  console.log(`📄 Output: ${outputPath}`);
  console.log(`📊 Generated: ${Object.keys(results).length} pages x ${tier1Config.languages.length} languages`);

  // Validate lengths
  console.log('\n📏 Description Length Validation:');
  for (const pageId in results) {
    for (const lang in results[pageId]) {
      const desc = results[pageId][lang].description;
      const len = desc.length;
      const status = (len >= 120 && len <= 160) ? '✅' : '⚠️ ';
      console.log(`   ${status} ${pageId} (${lang}): ${len} chars`);
    }
  }

  return results;
}

if (require.main === module) {
  try {
    generateTier1SEO();
  } catch (error) {
    console.error('❌ SEO generation failed:', error.message);
    process.exit(1);
  }
}

module.exports = { generateTier1SEO };
