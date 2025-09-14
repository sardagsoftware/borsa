/**
 * 🔍 AILYDIAN SEO - Advanced Search Engine Optimization
 * Comprehensive metadata, structured data, and international SEO
 * © Emrah Şardağ. All rights reserved.
 */

import { Metadata } from 'next'
import Script from 'next/script'

// Base SEO configuration
export const baseSEOConfig = {
  siteName: 'AILYDIAN',
  siteDescription: 'Premium futures trading platform with AI-powered analytics and professional tools for cryptocurrency derivatives trading.',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://ailydian.com',
  twitterHandle: '@ailydian',
  defaultImage: '/images/og/default.jpg',
  defaultImageAlt: 'AILYDIAN - Premium Futures Trading Platform',
}

// Dynamic metadata generator
export function generateMetadata({
  title,
  description,
  keywords,
  image,
  imageAlt,
  path = '',
  noIndex = false,
  locale = 'en',
  alternateLocales = ['tr', 'es', 'zh'],
  publishedTime,
  modifiedTime,
  type = 'website'
}: {
  title?: string
  description?: string
  keywords?: string[]
  image?: string
  imageAlt?: string
  path?: string
  noIndex?: boolean
  locale?: string
  alternateLocales?: string[]
  publishedTime?: string
  modifiedTime?: string
  type?: 'website' | 'article' | 'profile'
}): Metadata {
  const fullTitle = title ? `${title} | ${baseSEOConfig.siteName}` : `${baseSEOConfig.siteName} - Premium Futures Trading`
  const fullDescription = description || baseSEOConfig.siteDescription
  const fullImage = image || baseSEOConfig.defaultImage
  const fullImageAlt = imageAlt || baseSEOConfig.defaultImageAlt
  const fullUrl = `${baseSEOConfig.siteUrl}${path}`

  return {
    title: fullTitle,
    description: fullDescription,
    keywords: keywords?.join(', ') || 'futures trading, cryptocurrency, derivatives, AI trading, premium platform, AILYDIAN',
    
    // Robots
    robots: {
      index: !noIndex,
      follow: !noIndex,
      googleBot: {
        index: !noIndex,
        follow: !noIndex,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },

    // Open Graph
    openGraph: {
      type: type,
      locale: locale,
      url: fullUrl,
      title: fullTitle,
      description: fullDescription,
      siteName: baseSEOConfig.siteName,
      images: [
        {
          url: fullImage,
          width: 1200,
          height: 630,
          alt: fullImageAlt,
        },
      ],
      ...(type === 'article' && publishedTime && {
        publishedTime,
        modifiedTime,
        authors: ['AILYDIAN Team'],
        section: 'Trading',
      }),
    },

    // Twitter Card
    twitter: {
      card: 'summary_large_image',
      site: baseSEOConfig.twitterHandle,
      creator: baseSEOConfig.twitterHandle,
      title: fullTitle,
      description: fullDescription,
      images: [fullImage],
    },

    // Alternate languages
    alternates: {
      canonical: fullUrl,
      languages: Object.fromEntries(
        alternateLocales.map(loc => [loc, `${baseSEOConfig.siteUrl}/${loc}${path}`])
      ),
    },

    // Additional metadata
    metadataBase: new URL(baseSEOConfig.siteUrl),
    
    // Verification
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION,
      yandex: process.env.YANDEX_VERIFICATION,
      yahoo: process.env.YAHOO_VERIFICATION,
    },

    // App metadata
    appleWebApp: {
      capable: true,
      title: baseSEOConfig.siteName,
      statusBarStyle: 'black-translucent',
    },

    // Manifest
    manifest: '/manifest.json',

    // Icons
    icons: {
      icon: [
        { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
        { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
        { url: '/favicon.ico' },
      ],
      apple: [
        { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      ],
      other: [
        { rel: 'mask-icon', url: '/safari-pinned-tab.svg', color: '#6CE7DA' },
      ],
    },

    // Other
    other: {
      'msapplication-TileColor': '#0B1013',
      'theme-color': '#0B1013',
    },
  }
}

// JSON-LD structured data generators
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: baseSEOConfig.siteName,
    description: baseSEOConfig.siteDescription,
    url: baseSEOConfig.siteUrl,
    logo: `${baseSEOConfig.siteUrl}/images/logo.png`,
    sameAs: [
      'https://twitter.com/ailydian',
      'https://linkedin.com/company/ailydian',
      'https://github.com/ailydian',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+1-555-AILYDIAN',
      contactType: 'Customer Service',
      availableLanguage: ['English', 'Turkish', 'Spanish', 'Chinese'],
    },
  }
}

export function generateWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: baseSEOConfig.siteName,
    description: baseSEOConfig.siteDescription,
    url: baseSEOConfig.siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${baseSEOConfig.siteUrl}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }
}

export function generateSoftwareApplicationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: baseSEOConfig.siteName,
    description: baseSEOConfig.siteDescription,
    url: baseSEOConfig.siteUrl,
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '1250',
    },
  }
}

export function generateFinancialServiceSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FinancialService',
    name: baseSEOConfig.siteName,
    description: baseSEOConfig.siteDescription,
    url: baseSEOConfig.siteUrl,
    serviceType: 'Futures Trading Platform',
    provider: {
      '@type': 'Organization',
      name: baseSEOConfig.siteName,
    },
    areaServed: 'Worldwide',
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Trading Services',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Cryptocurrency Futures Trading',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'AI-Powered Trading Analytics',
          },
        },
      ],
    },
  }
}

// Breadcrumb schema generator
export function generateBreadcrumbSchema(items: Array<{name: string, url: string}>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

// FAQ schema generator
export function generateFAQSchema(faqs: Array<{question: string, answer: string}>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
}

// Article schema generator
export function generateArticleSchema({
  headline,
  description,
  image,
  publishedTime,
  modifiedTime,
  url,
}: {
  headline: string
  description: string
  image: string
  publishedTime: string
  modifiedTime?: string
  url: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline,
    description,
    image,
    datePublished: publishedTime,
    dateModified: modifiedTime || publishedTime,
    author: {
      '@type': 'Organization',
      name: baseSEOConfig.siteName,
    },
    publisher: {
      '@type': 'Organization',
      name: baseSEOConfig.siteName,
      logo: {
        '@type': 'ImageObject',
        url: `${baseSEOConfig.siteUrl}/images/logo.png`,
      },
    },
    url,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
  }
}

// SEO Script components
interface SEOScriptsProps {
  schemas?: object[]
  googleAnalyticsId?: string
  googleTagManagerId?: string
}

export function SEOScripts({ 
  schemas = [], 
  googleAnalyticsId, 
  googleTagManagerId 
}: SEOScriptsProps) {
  const allSchemas = [
    generateOrganizationSchema(),
    generateWebsiteSchema(),
    generateSoftwareApplicationSchema(),
    generateFinancialServiceSchema(),
    ...schemas,
  ]

  return (
    <>
      {/* Structured Data */}
      <Script id="structured-data" type="application/ld+json">
        {JSON.stringify(allSchemas)}
      </Script>

      {/* Google Analytics */}
      {googleAnalyticsId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${googleAnalyticsId}');
            `}
          </Script>
        </>
      )}

      {/* Google Tag Manager */}
      {googleTagManagerId && (
        <>
          <Script id="google-tag-manager" strategy="afterInteractive">
            {`
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${googleTagManagerId}');
            `}
          </Script>
          <noscript
            dangerouslySetInnerHTML={{
              __html: `<iframe src="https://www.googletagmanager.com/ns.html?id=${googleTagManagerId}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`,
            }}
          />
        </>
      )}
    </>
  )
}
