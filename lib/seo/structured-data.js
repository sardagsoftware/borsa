/**
 * 📊 JSON-LD Structured Data Generators
 *
 * Features:
 * - Organization schema
 * - WebSite + SearchAction
 * - SoftwareApplication/Product
 * - FAQPage
 * - NewsArticle
 * - BreadcrumbList
 * - Schema.org compliant
 */

const PRIMARY_DOMAIN = process.env.SEO_PRIMARY_DOMAIN || 'ailydian.com';
const PROTOCOL = process.env.SEO_PROTOCOL || 'https';

/**
 * Generate Organization schema
 */
function generateOrganization() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Ailydian',
    alternateName: 'Ailydian AI',
    url: `${PROTOCOL}://www.${PRIMARY_DOMAIN}`,
    logo: `${PROTOCOL}://cdn.${PRIMARY_DOMAIN}/brand/logo.png`,
    description: 'Enterprise AI Platform - Multi-Model AI Integration, RAG, Voice, Video & Advanced Analytics',
    foundingDate: '2024',
    sameAs: [
      'https://x.com/ailydian',
      'https://www.linkedin.com/company/ailydian',
      'https://github.com/ailydian',
      'https://www.youtube.com/@ailydian'
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+90-212-xxx-xxxx',
      contactType: 'customer service',
      email: 'support@ailydian.com',
      areaServed: 'Worldwide',
      availableLanguage: ['Turkish', 'English', 'German', 'French', 'Spanish']
    },
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'TR',
      addressRegion: 'Istanbul',
      addressLocality: 'Istanbul'
    }
  };
}

/**
 * Generate WebSite schema with SearchAction
 */
function generateWebSite(subdomain = 'www') {
  const baseUrl = `${PROTOCOL}://${subdomain === 'www' ? PRIMARY_DOMAIN : `${subdomain}.${PRIMARY_DOMAIN}`}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Ailydian AI Platform',
    url: baseUrl,
    description: 'Multi-Model AI Platform with GPT-5, Claude 3.5, Gemini 2.0, RAG, Voice & Video AI',
    inLanguage: ['tr-TR', 'en-US', 'de-DE', 'fr-FR', 'es-ES'],
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/search?q={query}`
      },
      'query-input': 'required name=query'
    },
    publisher: generateOrganization()
  };
}

/**
 * Generate SoftwareApplication schema
 */
function generateSoftwareApplication() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Ailydian AI Hub',
    applicationCategory: 'BusinessApplication',
    applicationSubCategory: 'Artificial Intelligence Platform',
    operatingSystem: 'Web, Windows, macOS, Linux',
    description: 'Enterprise AI Platform with multi-model support, RAG, voice, video and advanced analytics',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      priceValidUntil: '2026-12-31'
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      reviewCount: '247',
      bestRating: '5',
      worstRating: '1'
    },
    featureList: [
      'GPT-5 Integration',
      'Claude 3.5 Sonnet',
      'Gemini 2.0 Flash',
      'RAG (Retrieval-Augmented Generation)',
      'Voice AI (Speech-to-Text, Text-to-Speech)',
      'Video AI Analysis',
      'Web Search Integration',
      'Code Generation',
      'Multi-Language Support (32 locales)',
      'Real-time Analytics'
    ],
    screenshot: `${PROTOCOL}://cdn.${PRIMARY_DOMAIN}/screenshots/dashboard.png`,
    softwareVersion: '2.5.0',
    releaseNotes: 'Latest features: Enhanced RAG, Video AI, Multi-model integration',
    author: generateOrganization()
  };
}

/**
 * Generate FAQPage schema
 */
function generateFAQPage(faqs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  };
}

/**
 * Generate NewsArticle schema
 */
function generateNewsArticle(article) {
  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.description,
    image: article.image || `${PROTOCOL}://cdn.${PRIMARY_DOMAIN}/images/default-article.jpg`,
    datePublished: article.publishedDate,
    dateModified: article.modifiedDate || article.publishedDate,
    author: {
      '@type': 'Person',
      name: article.author || 'Ailydian Editorial Team'
    },
    publisher: generateOrganization(),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': article.url
    },
    articleSection: article.category || 'Technology',
    keywords: article.keywords || ['AI', 'Artificial Intelligence', 'Technology']
  };
}

/**
 * Generate BreadcrumbList schema
 */
function generateBreadcrumbList(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };
}

/**
 * Generate Product schema (for marketplace)
 */
function generateProduct(product) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.image,
    brand: {
      '@type': 'Brand',
      name: product.brand || 'Ailydian'
    },
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: product.currency || 'USD',
      availability: product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: product.url
    },
    aggregateRating: product.rating ? {
      '@type': 'AggregateRating',
      ratingValue: product.rating.value,
      reviewCount: product.rating.count,
      bestRating: '5',
      worstRating: '1'
    } : undefined
  };
}

/**
 * Generate TravelAction schema (for travel subdomain)
 */
function generateTravelAction(travel) {
  return {
    '@context': 'https://schema.org',
    '@type': 'TravelAction',
    name: travel.name,
    description: travel.description,
    url: travel.url,
    fromLocation: {
      '@type': 'Place',
      name: travel.from,
      address: {
        '@type': 'PostalAddress',
        addressLocality: travel.from
      }
    },
    toLocation: {
      '@type': 'Place',
      name: travel.to,
      address: {
        '@type': 'PostalAddress',
        addressLocality: travel.to
      }
    },
    provider: generateOrganization()
  };
}

/**
 * Generate default FAQs for Ailydian platform
 */
function getDefaultFAQs() {
  return [
    {
      question: 'Ailydian nedir?',
      answer: 'Ailydian, GPT-5, Claude 3.5 Sonnet, Gemini 2.0 Flash gibi en gelişmiş AI modellerini tek bir platformda birleştiren kurumsal yapay zeka çözümüdür. RAG, ses, video ve kod üretimi gibi gelişmiş özellikler sunar.'
    },
    {
      question: 'Hangi AI modelleri destekleniyor?',
      answer: 'GPT-4 Turbo, GPT-4o, GPT-5, Claude 3.5 Sonnet, Google Gemini 2.0 Flash, Groq Mixtral, Azure OpenAI ve daha fazlası. Toplam 15+ farklı AI modeli desteklenmektedir.'
    },
    {
      question: 'RAG (Retrieval-Augmented Generation) nedir?',
      answer: 'RAG, kendi belgelerinizi yükleyerek AI modellerinin daha doğru ve özelleştirilmiş yanıtlar vermesini sağlayan gelişmiş bir teknolojidir. Belge analizi, semantik arama ve bağlam tabanlı yanıtlar sunar.'
    },
    {
      question: 'Kaç dil destekleniyor?',
      answer: 'Ailydian platformu 32 farklı dili desteklemektedir: Türkçe, İngilizce, Almanca, Fransızca, İspanyolca, Portekizce, İtalyanca, Rusça, Arapça, Çince, Japonca ve daha fazlası.'
    },
    {
      question: 'Fiyatlandırma nasıl?',
      answer: 'Temel özellikler ücretsizdir. Premium planlar aylık $29\'dan başlar ve gelişmiş AI modelleri, sınırsız token, öncelikli destek ve kurumsal özellikler içerir.'
    },
    {
      question: 'API erişimi var mı?',
      answer: 'Evet, RESTful API ve WebSocket desteği ile tam entegrasyon sağlanır. Detaylı API dokümantasyonu ve kod örnekleri mevcuttur.'
    }
  ];
}

/**
 * Combine multiple schemas
 */
function generateCombinedSchema(...schemas) {
  return {
    '@context': 'https://schema.org',
    '@graph': schemas
  };
}

/**
 * Convert schema to JSON-LD script tag
 */
function toScriptTag(schema) {
  return `<script type="application/ld+json">${JSON.stringify(schema, null, 2)}</script>`;
}

module.exports = {
  generateOrganization,
  generateWebSite,
  generateSoftwareApplication,
  generateFAQPage,
  generateNewsArticle,
  generateBreadcrumbList,
  generateProduct,
  generateTravelAction,
  generateCombinedSchema,
  getDefaultFAQs,
  toScriptTag
};
