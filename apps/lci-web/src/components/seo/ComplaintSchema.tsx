// LCI Web - Complaint Schema.org Structured Data
// White-hat: Improves SEO visibility for complaint pages

import Script from 'next/script';

export interface ComplaintSchemaProps {
  complaintId: string;
  title: string;
  body: string; // First 200 chars for description
  brandName: string;
  brandSlug: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  state: 'DRAFT' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'ESCALATED' | 'REJECTED';
  publishedAt: string | null; // ISO timestamp
  createdAt: string; // ISO timestamp
  productName?: string | null;
  responseCount?: number;
}

/**
 * ComplaintSchema Component
 *
 * Generates Schema.org structured data for complaint pages using:
 * - Review schema (complaint as a negative review)
 * - Product/Service schema (brand's product/service being reviewed)
 * - AggregateRating schema (for brand pages with multiple complaints)
 *
 * Benefits:
 * - Rich snippets in Google search results
 * - Improved click-through rates
 * - Better visibility for brand reputation
 * - KVKK-compliant (no PII in structured data)
 */
export function ComplaintSchema(props: ComplaintSchemaProps) {
  const {
    complaintId,
    title,
    body,
    brandName,
    brandSlug,
    severity,
    state,
    publishedAt,
    createdAt,
    productName,
    responseCount = 0,
  } = props;

  // Map severity to star rating (for SEO purposes)
  // CRITICAL = 1 star, HIGH = 2 stars, MEDIUM = 3 stars, LOW = 4 stars
  const ratingMap: Record<string, number> = {
    CRITICAL: 1,
    HIGH: 2,
    MEDIUM: 3,
    LOW: 4,
  };
  const rating = ratingMap[severity] || 3;

  // Map state to status
  const reviewStatus = state === 'RESOLVED' ? 'completed' : 'active';

  // Truncate body to 200 chars for description (SEO best practice)
  const description = body.length > 200 ? `${body.substring(0, 197)}...` : body;

  // Schema.org Review structure
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Review',
    '@id': `https://lci.lydian.ai/complaints/${complaintId}`,
    itemReviewed: {
      '@type': productName ? 'Product' : 'Service',
      name: productName || `${brandName} Service`,
      brand: {
        '@type': 'Brand',
        name: brandName,
        url: `https://lci.lydian.ai/brands/${brandSlug}`,
      },
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: rating,
      bestRating: 5,
      worstRating: 1,
    },
    name: title,
    reviewBody: description,
    datePublished: publishedAt || createdAt,
    author: {
      '@type': 'Person',
      name: 'LCI User', // Anonymized for KVKK compliance
    },
    publisher: {
      '@type': 'Organization',
      name: 'Lydian Complaint Intelligence',
      url: 'https://lci.lydian.ai',
      logo: {
        '@type': 'ImageObject',
        url: 'https://lci.lydian.ai/logo.png',
      },
    },
    reviewAspect: severity,
    ...(responseCount > 0 && {
      interactionStatistic: {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/CommentAction',
        userInteractionCount: responseCount,
      },
    }),
  };

  return (
    <Script
      id={`complaint-schema-${complaintId}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      strategy="afterInteractive"
    />
  );
}
