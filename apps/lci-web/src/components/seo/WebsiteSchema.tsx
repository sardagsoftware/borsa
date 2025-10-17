// LCI Web - Website Schema.org Structured Data
// White-hat: Improves SEO visibility for the main site

import Script from 'next/script';

export interface WebsiteSchemaProps {
  /**
   * The name of the website
   * @default "Lydian Complaint Intelligence"
   */
  name?: string;

  /**
   * The alternate name (acronym)
   * @default "LCI"
   */
  alternateName?: string;

  /**
   * Website description
   */
  description?: string;

  /**
   * Website URL
   * @default "https://lci.lydian.ai"
   */
  url?: string;

  /**
   * Logo URL
   */
  logoUrl?: string;

  /**
   * Search action enabled
   * @default true
   */
  enableSearchAction?: boolean;
}

/**
 * WebsiteSchema Component
 *
 * Generates Schema.org structured data for the main website using:
 * - WebSite schema (site information)
 * - SearchAction schema (sitelinks search box)
 *
 * Benefits:
 * - Sitelinks search box in Google results
 * - Knowledge panel for the organization
 * - Better brand recognition
 * - Enhanced search visibility
 */
export function WebsiteSchema({
  name = 'Lydian Complaint Intelligence',
  alternateName = 'LCI',
  description = 'Transparent complaint management platform for Turkish consumers. Track, manage, and resolve complaints with KVKK/GDPR compliance.',
  url = 'https://lci.lydian.ai',
  logoUrl = 'https://lci.lydian.ai/logo.png',
  enableSearchAction = true,
}: WebsiteSchemaProps) {
  // Schema.org WebSite structure with SearchAction
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name,
    alternateName,
    description,
    url,
    ...(logoUrl && {
      image: {
        '@type': 'ImageObject',
        url: logoUrl,
      },
    }),
    publisher: {
      '@type': 'Organization',
      name: 'Lydian Technologies',
      url: 'https://lydian.ai',
      logo: {
        '@type': 'ImageObject',
        url: 'https://lydian.ai/logo.png',
      },
    },
    ...(enableSearchAction && {
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${url}/search?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    }),
    inLanguage: ['tr', 'en'], // Turkish and English
    audience: {
      '@type': 'Audience',
      audienceType: 'Turkish Consumers',
      geographicArea: {
        '@type': 'Country',
        name: 'Turkey',
      },
    },
  };

  return (
    <Script
      id="website-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      strategy="afterInteractive"
    />
  );
}

/**
 * OrganizationSchema Component
 *
 * Generates Schema.org structured data for Lydian organization.
 * Should be placed on the homepage.
 */
export function OrganizationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Lydian Technologies',
    alternateName: 'Lydian',
    url: 'https://lydian.ai',
    logo: {
      '@type': 'ImageObject',
      url: 'https://lydian.ai/logo.png',
    },
    description:
      'Advanced AI and technology solutions for enterprises and consumers.',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      availableLanguage: ['Turkish', 'English'],
      email: 'support@lydian.ai',
    },
    sameAs: [
      'https://twitter.com/lydian',
      'https://linkedin.com/company/lydian',
      'https://github.com/lydian',
    ],
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'TR',
    },
    foundingDate: '2024',
    areaServed: {
      '@type': 'Country',
      name: 'Turkey',
    },
  };

  return (
    <Script
      id="organization-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      strategy="afterInteractive"
    />
  );
}
