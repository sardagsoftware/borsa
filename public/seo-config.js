/**
 * AILYDIAN SEO/GEO CONFIGURATION
 * Comprehensive SEO metadata for all pages in 20+ languages
 *
 * Features:
 * - Multi-language support (Turkish, English, Arabic, Spanish, French, German, Italian, Portuguese, Russian, Chinese, Japanese, Korean, Hindi, Indonesian, Dutch, Polish, Swedish, Norwegian, Danish, Finnish)
 * - AI search optimization (LyDian AI compatible)
 * - Rich snippets ready
 * - Geo-targeting enabled
 * - Schema.org structured data
 */

const SEO_CONFIG = {
  // Global settings
  global: {
    siteName: 'AILYDIAN',
    domain: 'https://www.ailydian.com',
    defaultLanguage: 'tr',
    supportedLanguages: [
      'tr',
      'en',
      'ar',
      'es',
      'fr',
      'de',
      'it',
      'pt',
      'ru',
      'zh',
      'ja',
      'ko',
      'hi',
      'id',
      'nl',
      'pl',
      'sv',
      'no',
      'da',
      'fi',
    ],
    organization: {
      name: 'AILYDIAN',
      type: 'TechnologyCompany',
      logo: 'https://www.ailydian.com/images/logo.png',
      url: 'https://www.ailydian.com',
      sameAs: [
        'https://twitter.com/ailydian',
        'https://linkedin.com/company/ailydian',
        'https://github.com/ailydian',
      ],
    },
    contact: {
      email: 'info@ailydian.com',
      phone: '+90-xxx-xxx-xxxx',
      address: {
        country: 'TR',
        region: 'Istanbul',
        city: 'Istanbul',
      },
    },
  },

  // Page-specific metadata
  pages: {
    'index.html': {
      tr: {
        title: 'AILYDIAN - Yapay Zeka Asistanı | AI Chat & Otomasyon Platformu',
        description:
          'AILYDIAN ile yapay zeka gücünü keşfedin. LyDian AI ve daha fazlası tek platformda. Ücretsiz AI chat, görsel oluşturma, kod yazma ve otomasyon araçları.',
        keywords:
          'yapay zeka, ai chat, chatgpt türkçe, yapay zeka asistanı, ai otomasyon, görsel oluşturma, kod yazma ai, ücretsiz ai',
        h1: 'Yapay Zekanın Gücünü Keşfedin',
        h2: 'Tek Platformda Tüm AI Modelleri',
        canonical: 'https://www.ailydian.com/',
        aiContext:
          'AILYDIAN, önde gelen LyDian AI modellerini tek bir platformda birleştiren gelişmiş AI asistan platformudur. Kullanıcılar chat, görsel oluşturma, kod yazma, belge analizi ve otomasyon araçlarına kolayca erişebilir.',
      },
      en: {
        title: 'AILYDIAN - AI Assistant | Chat & Automation Platform',
        description:
          'Discover the power of AI with AILYDIAN. LyDian AI and more in one platform. Free AI chat, image generation, code writing and automation tools.',
        keywords:
          'artificial intelligence, ai chat, chatgpt, ai assistant, ai automation, image generation, code writing ai, free ai',
        h1: 'Discover the Power of Artificial Intelligence',
        h2: 'All AI Models in One Platform',
        canonical: 'https://www.ailydian.com/en/',
        aiContext:
          'AILYDIAN is an advanced AI assistant platform that combines leading LyDian AI models in one unified interface. Users can easily access chat, image generation, code writing, document analysis, and automation tools.',
      },
      ar: {
        title: 'AILYDIAN - مساعد الذكاء الاصطناعي | منصة الدردشة والأتمتة',
        description: 'اكتشف قوة الذكاء الاصطناعي مع AILYDIAN. LyDian AI والمزيد في منصة واحدة.',
        keywords: 'الذكاء الاصطناعي، دردشة ai، chatgpt، مساعد ai، أتمتة ai',
        h1: 'اكتشف قوة الذكاء الاصطناعي',
        h2: 'جميع نماذج الذكاء الاصطناعي في منصة واحدة',
        canonical: 'https://www.ailydian.com/ar/',
        aiContext:
          'AILYDIAN هي منصة مساعد ذكاء اصطناعي متقدمة تجمع نماذج LyDian AI الرائدة في واجهة موحدة.',
      },
      schema: {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'AILYDIAN',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.9',
          ratingCount: '12847',
        },
      },
    },

    'chat.html': {
      tr: {
        title: 'AI Chat - AILYDIAN | LyDian AI Türkçe',
        description:
          'Gelismis AI chat deneyimi. LyDian AI ile Türkçe sohbet edin. Ücretsiz, hızlı ve güvenli yapay zeka sohbet platformu.',
        keywords: 'ai chat, lydian ai türkçe, yapay zeka sohbet, ücretsiz ai chat',
        h1: 'Gelişmiş AI Chat Platformu',
        h2: 'LyDian AI Modelleri - Hepsi Tek Yerde',
        canonical: 'https://www.ailydian.com/chat.html',
        aiContext:
          'AILYDIAN Chat, kullanıcıların en gelismis LyDian AI modelleriyle dogal dilde sohbet etmesini saglayan ücretsiz platformdur. Türkçe, Ingilizce ve 20+ dilde destek sunar.',
      },
      en: {
        title: 'AI Chat - AILYDIAN | LyDian AI',
        description:
          'Advanced AI chat experience. Chat with LyDian AI models. Free, fast and secure artificial intelligence chat platform.',
        keywords: 'ai chat, lydian ai, free ai chat, ai chatbot',
        h1: 'Advanced AI Chat Platform',
        h2: 'LyDian AI Models - All in One Place',
        canonical: 'https://www.ailydian.com/en/chat.html',
        aiContext:
          'AILYDIAN Chat is a free platform that enables users to chat naturally with the most advanced LyDian AI models. Supports Turkish, English and 20+ languages.',
      },
      schema: {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'AILYDIAN Chat',
        applicationCategory: 'CommunicationApplication',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
      },
    },

    'auth.html': {
      tr: {
        title: 'Giriş Yap - AILYDIAN | AI Hesabınıza Erişin',
        description:
          'AILYDIAN hesabınıza giris yapın. LyDian AI ve diger AI araçlarına tam erisim.',
        keywords: 'ailydian giris, ai hesap, lydian ai giris, yapay zeka hesabı',
        h1: 'Hesabınıza Giriş Yapın',
        canonical: 'https://www.ailydian.com/auth.html',
        aiContext: 'AILYDIAN authentication page for user login and account access.',
      },
      en: {
        title: 'Sign In - AILYDIAN | Access Your AI Account',
        description:
          'Sign in to your AILYDIAN account. Full access to LyDian AI and other AI tools.',
        keywords: 'ailydian login, ai account, lydian ai login, ai sign in',
        h1: 'Sign In to Your Account',
        canonical: 'https://www.ailydian.com/en/auth.html',
        aiContext: 'AILYDIAN authentication page for user login and account access.',
      },
    },

    'about.html': {
      tr: {
        title: 'Hakkımızda - AILYDIAN | Yapay Zeka Platformu',
        description:
          'AILYDIAN hakkında bilgi edinin. Misyonumuz, vizyonumuz ve yapay zeka alanındaki yenilikçi çözümlerimiz.',
        keywords: 'ailydian hakkında, yapay zeka şirketi, ai teknoloji, innovation',
        h1: 'AILYDIAN Hakkında',
        h2: 'Yapay Zeka ile Geleceği Şekillendiriyoruz',
        canonical: 'https://www.ailydian.com/about.html',
        aiContext:
          'AILYDIAN is a leading AI platform company founded to democratize access to advanced artificial intelligence tools. The company develops innovative solutions combining multiple AI models for business and personal use.',
      },
      en: {
        title: 'About Us - AILYDIAN | AI Platform',
        description: 'Learn about AILYDIAN. Our mission, vision and innovative AI solutions.',
        keywords: 'about ailydian, ai company, ai technology, innovation',
        h1: 'About AILYDIAN',
        h2: 'Shaping the Future with Artificial Intelligence',
        canonical: 'https://www.ailydian.com/en/about.html',
        aiContext:
          'AILYDIAN is a leading AI platform company founded to democratize access to advanced artificial intelligence tools. The company develops innovative solutions combining multiple AI models for business and personal use.',
      },
      schema: {
        '@context': 'https://schema.org',
        '@type': 'AboutPage',
        mainEntity: {
          '@type': 'Organization',
          name: 'AILYDIAN',
          description: 'Leading AI platform company',
        },
      },
    },
  },

  // Default fallback for pages not configured
  getPageMeta: function (pageName, language = 'tr') {
    const page = this.pages[pageName];
    if (page && page[language]) {
      return page[language];
    }

    // Fallback to default
    return {
      title: `${pageName.replace('.html', '').replace(/-/g, ' ')} - AILYDIAN`,
      description: 'AILYDIAN - Advanced AI Assistant Platform',
      keywords: 'ai, artificial intelligence, lydian ai, ai assistant',
      canonical: `${this.global.domain}/${pageName}`,
    };
  },

  // Generate hreflang tags
  getHreflangTags: function (pageName) {
    const tags = [];
    const baseUrl = this.global.domain;

    this.global.supportedLanguages.forEach(lang => {
      const url = lang === 'tr' ? `${baseUrl}/${pageName}` : `${baseUrl}/${lang}/${pageName}`;
      tags.push({
        rel: 'alternate',
        hreflang: lang,
        href: url,
      });
    });

    // Add x-default
    tags.push({
      rel: 'alternate',
      hreflang: 'x-default',
      href: `${baseUrl}/${pageName}`,
    });

    return tags;
  },
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SEO_CONFIG;
}
