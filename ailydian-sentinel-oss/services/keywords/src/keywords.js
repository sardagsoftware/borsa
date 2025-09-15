// 🌍 40+ Language AI Keyword Clustering & Content Brief Generation
import { createHash } from 'crypto'

// Core AI keywords in 40+ languages - "artificial intelligence" focus
export const AI_KEYWORDS = {
  tr: ['yapay zeka', 'yapay zekâ', 'ai', 'yapay zeka modelleri', 'makine öğrenmesi', 'derin öğrenme'],
  en: ['artificial intelligence', 'ai', 'ai models', 'machine learning', 'deep learning', 'neural networks'],
  de: ['künstliche intelligenz', 'ki', 'ai modelle', 'maschinelles lernen', 'tiefe lernen'],
  fr: ['intelligence artificielle', 'ia', 'modèles ia', 'apprentissage automatique', 'apprentissage profond'],
  es: ['inteligencia artificial', 'ia', 'modelos de ia', 'aprendizaje automático', 'aprendizaje profundo'],
  ru: ['искусственный интеллект', 'ии', 'модели ии', 'машинное обучение', 'глубокое обучение'],
  zh: ['人工智能', 'ai', '人工智能模型', '机器学习', '深度学习', '神经网络'],
  ja: ['人工知能', 'ai', 'aiモデル', '機械学習', 'ディープラーニング', 'ニューラルネットワーク'],
  ko: ['인공지능', 'ai', 'ai 모델', '기계학습', '딥러닝', '신경망'],
  ar: ['الذكاء الاصطناعي', 'ai', 'نماذج الذكاء الاصطناعي', 'التعلم الآلي', 'التعلم العميق'],
  hi: ['कृत्रिम बुद्धिमत्ता', 'ai', 'ai मॉडल', 'मशीन लर्निंग', 'डीप लर्निंग'],
  pt: ['inteligência artificial', 'ia', 'modelos de ia', 'aprendizado de máquina', 'aprendizado profundo'],
  it: ['intelligenza artificiale', 'ia', 'modelli ia', 'apprendimento automatico', 'apprendimento profondo'],
  nl: ['kunstmatige intelligentie', 'ai', 'ai modellen', 'machine learning', 'deep learning'],
  pl: ['sztuczna inteligencja', 'ai', 'modele ai', 'uczenie maszynowe', 'głębokie uczenie'],
  sv: ['artificiell intelligens', 'ai', 'ai modeller', 'maskininlärning', 'djupinlärning'],
  da: ['kunstig intelligens', 'ai', 'ai modeller', 'maskinlæring', 'dyb læring'],
  no: ['kunstig intelligens', 'ai', 'ai modeller', 'maskinlæring', 'dyp læring'],
  fi: ['tekoäly', 'ai', 'ai mallit', 'koneoppiminen', 'syväoppiminen'],
  cs: ['umělá inteligence', 'ai', 'ai modely', 'strojové učení', 'hluboké učení'],
  sk: ['umelá inteligencia', 'ai', 'ai modely', 'strojové učenie', 'hlboké učenie'],
  hu: ['mesterséges intelligencia', 'ai', 'ai modellek', 'gépi tanulás', 'mély tanulás'],
  ro: ['inteligența artificială', 'ai', 'modele ai', 'învățarea automată', 'învățarea profundă'],
  bg: ['изкуствен интелект', 'ai', 'ai модели', 'машинно обучение', 'дълбоко обучение'],
  hr: ['umjetna inteligencija', 'ai', 'ai modeli', 'strojno učenje', 'duboko učenje'],
  sr: ['вештачка интелигенција', 'ai', 'ai модели', 'машинско учење', 'дубоко учење'],
  sl: ['umetna inteligenca', 'ai', 'ai modeli', 'strojno učenje', 'globoko učenje'],
  et: ['tehisintellekt', 'ai', 'ai mudelid', 'masinõpe', 'sügav õpe'],
  lv: ['mākslīgais intelekts', 'ai', 'ai modeļi', 'mašīnmācīšanās', 'dziļā mācīšanās'],
  lt: ['dirbtinis intelektas', 'ai', 'ai modeliai', 'mašininis mokymasis', 'gilumas mokymasis'],
  el: ['τεχνητή νοημοσύνη', 'ai', 'μοντέλα ai', 'μηχανική μάθηση', 'βαθιά μάθηση'],
  he: ['בינה מלאכותית', 'ai', 'מודלים של ai', 'למידת מכונה', 'למידה עמוקה'],
  fa: ['هوش مصنوعی', 'ai', 'مدل‌های ai', 'یادگیری ماشین', 'یادگیری عمیق'],
  th: ['ปัญญาประดิษฐ์', 'ai', 'โมเดล ai', 'การเรียนรู้ของเครื่อง', 'การเรียนรู้เชิงลึก'],
  vi: ['trí tuệ nhân tạo', 'ai', 'mô hình ai', 'học máy', 'học sâu'],
  id: ['kecerdasan buatan', 'ai', 'model ai', 'pembelajaran mesin', 'pembelajaran mendalam'],
  uz: ['sun\'iy intellekt', 'ai', 'ai modellari', 'mashina o\'rganish', 'chuqur o\'rganish'],
  kk: ['жасанды интеллект', 'ai', 'ai үлгілері', 'машиналық оқыту', 'терең оқыту'],
  az: ['süni intellekt', 'ai', 'ai modelləri', 'maşın öyrənməsi', 'dərin öyrənmə'],
  mn: ['хиймэл оюун ухаан', 'ai', 'ai загварууд', 'машин сургалт', 'гүн сургалт'],
  ur: ['مصنوعی ذہانت', 'ai', 'ai ماڈلز', 'مشین لرننگ', 'ڈیپ لرننگ'],
  uk: ['штучний інтелект', 'ai', 'моделі ai', 'машинне навчання', 'глибоке навчання']
}

// Search intent classification
export const SEARCH_INTENTS = {
  INFORMATIONAL: 'info',
  COMMERCIAL: 'comm',
  TRANSACTIONAL: 'trans',
  LOCAL: 'loc'
}

// Generate keyword clusters for a given locale
export function generateKeywordCluster(locale, seedKeywords = [], competitors = []) {
  const baseKeywords = AI_KEYWORDS[locale] || AI_KEYWORDS.en
  const allKeywords = [...baseKeywords, ...seedKeywords]

  // Cluster keywords by topic and intent
  const clusters = {
    primary: {
      keywords: allKeywords.slice(0, 3),
      intent: SEARCH_INTENTS.INFORMATIONAL,
      volume: 'high',
      difficulty: 'medium'
    },
    secondary: {
      keywords: allKeywords.slice(3, 8),
      intent: SEARCH_INTENTS.COMMERCIAL,
      volume: 'medium',
      difficulty: 'low'
    },
    longtail: {
      keywords: generateLongTailVariations(allKeywords, locale),
      intent: SEARCH_INTENTS.TRANSACTIONAL,
      volume: 'low',
      difficulty: 'very-low'
    }
  }

  return {
    locale,
    clusters,
    total_keywords: Object.values(clusters).reduce((acc, cluster) => acc + cluster.keywords.length, 0),
    generated_at: new Date().toISOString(),
    cache_key: createHash('md5').update(`${locale}-${JSON.stringify(seedKeywords)}-${competitors.join(',')}`).digest('hex')
  }
}

// Generate long-tail keyword variations
function generateLongTailVariations(baseKeywords, locale) {
  const modifiers = {
    tr: ['nasıl', 'nedir', 'örnekleri', 'kullanımı', 'avantajları', 'gelecegi'],
    en: ['how to', 'what is', 'examples', 'usage', 'benefits', 'future'],
    de: ['wie', 'was ist', 'beispiele', 'verwendung', 'vorteile', 'zukunft'],
    fr: ['comment', 'qu\'est-ce que', 'exemples', 'utilisation', 'avantages', 'avenir'],
    es: ['cómo', 'qué es', 'ejemplos', 'uso', 'beneficios', 'futuro'],
    default: ['how', 'what', 'examples', 'usage', 'benefits', 'future']
  }

  const localModifiers = modifiers[locale] || modifiers.default
  const variations = []

  baseKeywords.forEach(keyword => {
    localModifiers.forEach(modifier => {
      variations.push(`${modifier} ${keyword}`)
      variations.push(`${keyword} ${modifier}`)
    })
  })

  return variations.slice(0, 15) // Limit to 15 variations
}

// Generate content brief for keywords
export function generateContentBrief(keywordCluster, locale) {
  const titles = generateTitleVariations(keywordCluster.clusters.primary.keywords, locale)
  const outline = generateContentOutline(keywordCluster, locale)
  const faqs = generateFAQs(keywordCluster.clusters.primary.keywords, locale)

  return {
    locale,
    titles,
    outline,
    faqs,
    meta: {
      title_template: titles[0],
      description_template: generateMetaDescription(keywordCluster.clusters.primary.keywords[0], locale),
      slug_suggestion: generateSlug(keywordCluster.clusters.primary.keywords[0], locale)
    },
    jsonld_suggestions: [
      'Organization',
      'WebSite',
      'Article',
      'FAQPage',
      'BreadcrumbList'
    ],
    internal_link_opportunities: keywordCluster.clusters.secondary.keywords.slice(0, 5),
    generated_at: new Date().toISOString()
  }
}

// Generate title variations
function generateTitleVariations(primaryKeywords, locale) {
  const templates = {
    tr: [
      `${primaryKeywords[0]} Nedir? Kapsamlı Rehber 2024`,
      `${primaryKeywords[0]} ile Geleceği Şekillendirin`,
      `${primaryKeywords[0]} Örnekleri ve Kullanım Alanları`,
      `${primaryKeywords[0]} Hakkında Bilmeniz Gerekenler`
    ],
    en: [
      `What is ${primaryKeywords[0]}? Complete Guide 2024`,
      `Shape the Future with ${primaryKeywords[0]}`,
      `${primaryKeywords[0]} Examples and Use Cases`,
      `Everything You Need to Know About ${primaryKeywords[0]}`
    ],
    default: [
      `Complete Guide to ${primaryKeywords[0]}`,
      `${primaryKeywords[0]} in 2024`,
      `Understanding ${primaryKeywords[0]}`,
      `${primaryKeywords[0]} Explained`
    ]
  }

  return templates[locale] || templates.default
}

// Generate content outline
function generateContentOutline(keywordCluster, locale) {
  const outlines = {
    tr: [
      `${keywordCluster.clusters.primary.keywords[0]} Nedir?`,
      `${keywordCluster.clusters.primary.keywords[0]} Nasıl Çalışır?`,
      'Kullanım Alanları ve Örnekler',
      'Avantajları ve Dezavantajları',
      'Gelecek Trendleri',
      'Sıkça Sorulan Sorular'
    ],
    en: [
      `What is ${keywordCluster.clusters.primary.keywords[0]}?`,
      `How Does ${keywordCluster.clusters.primary.keywords[0]} Work?`,
      'Use Cases and Examples',
      'Benefits and Limitations',
      'Future Trends',
      'Frequently Asked Questions'
    ],
    default: [
      'Introduction',
      'How it Works',
      'Examples',
      'Benefits',
      'Future',
      'FAQ'
    ]
  }

  return outlines[locale] || outlines.default
}

// Generate FAQs
function generateFAQs(primaryKeywords, locale) {
  const faqTemplates = {
    tr: [
      {
        question: `${primaryKeywords[0]} nedir ve nasıl çalışır?`,
        answer: `${primaryKeywords[0]} hakkında detaylı açıklama...`
      },
      {
        question: `${primaryKeywords[0]} hangi alanlarda kullanılır?`,
        answer: `${primaryKeywords[0]} kullanım alanları...`
      },
      {
        question: `${primaryKeywords[0]} avantajları nelerdir?`,
        answer: `${primaryKeywords[0]} başlıca avantajları...`
      }
    ],
    en: [
      {
        question: `What is ${primaryKeywords[0]} and how does it work?`,
        answer: `Detailed explanation about ${primaryKeywords[0]}...`
      },
      {
        question: `What are the applications of ${primaryKeywords[0]}?`,
        answer: `Applications of ${primaryKeywords[0]}...`
      },
      {
        question: `What are the benefits of ${primaryKeywords[0]}?`,
        answer: `Key benefits of ${primaryKeywords[0]}...`
      }
    ],
    default: [
      {
        question: `What is ${primaryKeywords[0]}?`,
        answer: `Information about ${primaryKeywords[0]}...`
      }
    ]
  }

  return faqTemplates[locale] || faqTemplates.default
}

// Generate meta description
function generateMetaDescription(primaryKeyword, locale) {
  const templates = {
    tr: `${primaryKeyword} hakkında kapsamlı rehber. Örnekler, kullanım alanları ve gelecek trendleri. Uzman görüşleri ve detaylı analizler.`,
    en: `Comprehensive guide to ${primaryKeyword}. Examples, use cases, and future trends. Expert insights and detailed analysis.`,
    default: `Learn about ${primaryKeyword} with examples and expert insights.`
  }

  return templates[locale] || templates.default
}

// Generate SEO-friendly slug
function generateSlug(keyword, locale) {
  return keyword
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}