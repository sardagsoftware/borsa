import Script from 'next/script';

interface StructuredDataProps {
  type?: 'website' | 'organization' | 'financial-service' | 'software-application';
  locale?: string;
}

export default function StructuredData({ type = 'website', locale = 'tr' }: StructuredDataProps) {
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://borsa.ailydian.com' 
    : 'http://localhost:3000';

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "AILYDIAN",
    "alternateName": "AI Lens Trader",
    "url": baseUrl,
    "description": "Gelişmiş AI destekli kripto para trading platformu. Gerçek zamanlı analiz, otomatik stratejiler, güvenli portföy yönetimi.",
    "inLanguage": locale === 'tr' ? 'tr-TR' : locale === 'en' ? 'en-US' : locale,
    "author": {
      "@type": "Organization",
      "name": "Sardağ Software",
      "founder": {
        "@type": "Person",
        "name": "Emrah Şardağ",
        "url": "https://ailydian.com"
      }
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${baseUrl}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string"
    },
    "sameAs": [
      "https://twitter.com/AILydianPro",
      "https://github.com/ailydian",
      "https://linkedin.com/company/ailydian"
    ]
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "AILYDIAN",
    "legalName": "Sardağ Software",
    "url": baseUrl,
    "logo": `${baseUrl}/images/logo.png`,
    "description": "Professional AI-powered cryptocurrency trading platform",
    "foundingDate": "2024",
    "founder": {
      "@type": "Person",
      "name": "Emrah Şardağ"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "email": "support@ailydian.com",
      "availableLanguage": ["Turkish", "English", "Arabic", "Persian"]
    },
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "TR"
    },
    "sameAs": [
      "https://twitter.com/AILydianPro",
      "https://github.com/ailydian"
    ]
  };

  const financialServiceSchema = {
    "@context": "https://schema.org",
    "@type": "FinancialService",
    "name": "AILYDIAN Crypto Trading",
    "url": baseUrl,
    "description": "AI-powered cryptocurrency trading platform with real-time market analysis and automated trading strategies",
    "serviceType": "Cryptocurrency Trading Platform",
    "provider": {
      "@type": "Organization",
      "name": "AILYDIAN"
    },
    "areaServed": {
      "@type": "Country",
      "name": "Worldwide"
    },
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Trading Services",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "AI Trading Bot",
            "description": "Automated cryptocurrency trading with AI analysis"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Portfolio Management",
            "description": "Professional crypto portfolio management tools"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Real-time Analytics",
            "description": "Live cryptocurrency market data and analysis"
          }
        }
      ]
    }
  };

  const softwareAppSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "AILYDIAN - AI Lens Trader",
    "operatingSystem": "Web Browser",
    "applicationCategory": "FinanceApplication",
    "description": "Professional AI-powered cryptocurrency trading platform",
    "url": baseUrl,
    "downloadUrl": baseUrl,
    "featureList": [
      "AI-powered trading analysis",
      "Real-time cryptocurrency data",
      "Automated trading strategies",
      "Portfolio management",
      "Risk management tools",
      "Multi-exchange support"
    ],
    "softwareVersion": "2.0.0",
    "author": {
      "@type": "Organization",
      "name": "AILYDIAN"
    },
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock"
    }
  };

  const getSchema = () => {
    switch (type) {
      case 'organization':
        return organizationSchema;
      case 'financial-service':
        return financialServiceSchema;
      case 'software-application':
        return softwareAppSchema;
      default:
        return websiteSchema;
    }
  };

  return (
    <Script
      id={`structured-data-${type}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(getSchema())
      }}
    />
  );
}
