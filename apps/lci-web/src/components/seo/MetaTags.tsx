// LCI Web - Dynamic Meta Tags Component
// White-hat: SEO + Open Graph + Twitter Cards

import Head from 'next/head';

export interface MetaTagsProps {
  title: string;
  description: string;
  canonical?: string;
  keywords?: string;
  robots?: string;

  // Open Graph
  ogType?: 'website' | 'article';
  ogTitle?: string;
  ogDescription?: string;
  ogUrl?: string;
  ogImage?: string;
  ogSiteName?: string;
  ogLocale?: string;

  // Article-specific OG
  articlePublishedTime?: string;
  articleModifiedTime?: string;
  articleAuthor?: string;
  articleSection?: string;
  articleTags?: string[];

  // Twitter Card
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  twitterSite?: string;
  twitterCreator?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
}

/**
 * MetaTags Component
 *
 * Generates comprehensive meta tags for SEO, Open Graph, and Twitter Cards
 * Usage: <MetaTags title="..." description="..." ... />
 */
export function MetaTags(props: MetaTagsProps) {
  const {
    title,
    description,
    canonical,
    keywords,
    robots = 'index, follow',

    ogType = 'website',
    ogTitle,
    ogDescription,
    ogUrl,
    ogImage = 'https://lci.lydian.ai/og-image.png',
    ogSiteName = 'Lydian Complaint Intelligence',
    ogLocale = 'tr_TR',

    articlePublishedTime,
    articleModifiedTime,
    articleAuthor,
    articleSection,
    articleTags,

    twitterCard = 'summary',
    twitterSite = '@LydianAI',
    twitterCreator,
    twitterTitle,
    twitterDescription,
    twitterImage,
  } = props;

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="robots" content={robots} />
      {canonical && <link rel="canonical" href={canonical} />}

      {/* Viewport & Mobile */}
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      <meta name="theme-color" content="#0F172A" />

      {/* Open Graph */}
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={ogTitle || title} />
      <meta property="og:description" content={ogDescription || description} />
      {ogUrl && <meta property="og:url" content={ogUrl} />}
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content={ogSiteName} />
      <meta property="og:locale" content={ogLocale} />

      {/* Article-specific Open Graph */}
      {ogType === 'article' && (
        <>
          {articlePublishedTime && (
            <meta property="article:published_time" content={articlePublishedTime} />
          )}
          {articleModifiedTime && (
            <meta property="article:modified_time" content={articleModifiedTime} />
          )}
          {articleAuthor && (
            <meta property="article:author" content={articleAuthor} />
          )}
          {articleSection && (
            <meta property="article:section" content={articleSection} />
          )}
          {articleTags?.map((tag, index) => (
            <meta key={index} property="article:tag" content={tag} />
          ))}
        </>
      )}

      {/* Twitter Card */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:site" content={twitterSite} />
      {twitterCreator && <meta name="twitter:creator" content={twitterCreator} />}
      <meta name="twitter:title" content={twitterTitle || title} />
      <meta name="twitter:description" content={twitterDescription || description} />
      <meta name="twitter:image" content={twitterImage || ogImage} />

      {/* Additional SEO */}
      <meta name="author" content="Lydian Complaint Intelligence" />
      <meta name="language" content="Turkish" />
      <meta name="revisit-after" content="7 days" />

      {/* Prevent email/phone harvesting */}
      <meta name="format-detection" content="telephone=no" />
      <meta name="format-detection" content="email=no" />

      {/* Security */}
      <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
      <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
    </Head>
  );
}

/**
 * Default Meta Tags for LCI
 * Used on pages without specific meta data
 */
export function DefaultMetaTags() {
  return (
    <MetaTags
      title="LCI - Lydian Complaint Intelligence | Şikayet Yönetim Platformu"
      description="KVKK ve GDPR uyumlu şikayet yönetim platformu. Şikayetlerinizi güvenle paylaşın, markalardan yanıt alın, sorunlarınızı çözün."
      canonical="https://lci.lydian.ai"
      keywords="şikayet, müşteri hizmetleri, tüketici hakları, marka iletişim, sorun çözme, KVKK"
      robots="index, follow"
      ogType="website"
      ogUrl="https://lci.lydian.ai"
    />
  );
}
