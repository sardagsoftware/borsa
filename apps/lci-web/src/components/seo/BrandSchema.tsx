// LCI Web - Brand Schema.org Structured Data
// White-hat: Improves SEO visibility for brand pages

import Script from 'next/script';

export interface BrandSchemaProps {
  brandId: string;
  brandName: string;
  brandSlug: string;
  description?: string;
  logoUrl?: string;
  websiteUrl?: string;
  totalComplaints: number;
  resolvedComplaints: number;
  averageRating?: number; // Calculated from complaints (1-5)
}

/**
 * BrandSchema Component
 *
 * Generates Schema.org structured data for brand pages using:
 * - Organization schema (brand information)
 * - AggregateRating schema (overall complaint statistics)
 *
 * Benefits:
 * - Brand appears in knowledge panels
 * - Rich snippets with star ratings
 * - Improved brand reputation visibility
 * - Transparency in complaint resolution
 */
export function BrandSchema(props: BrandSchemaProps) {
  const {
    brandId,
    brandName,
    brandSlug,
    description,
    logoUrl,
    websiteUrl,
    totalComplaints,
    resolvedComplaints,
    averageRating,
  } = props;

  // Calculate resolution rate percentage
  const resolutionRate =
    totalComplaints > 0
      ? Math.round((resolvedComplaints / totalComplaints) * 100)
      : 0;

  // Schema.org Organization with AggregateRating
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `https://lci.lydian.ai/brands/${brandSlug}`,
    name: brandName,
    url: websiteUrl || `https://lci.lydian.ai/brands/${brandSlug}`,
    ...(logoUrl && {
      logo: {
        '@type': 'ImageObject',
        url: logoUrl,
      },
    }),
    ...(description && { description }),
    // Aggregate rating from all complaints
    ...(totalComplaints > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: averageRating || 3, // Default to 3 if not calculated
        bestRating: 5,
        worstRating: 1,
        ratingCount: totalComplaints,
        reviewCount: totalComplaints,
      },
    }),
    // Additional brand metrics
    ...(totalComplaints > 0 && {
      review: {
        '@type': 'Review',
        reviewRating: {
          '@type': 'Rating',
          ratingValue: averageRating || 3,
        },
        author: {
          '@type': 'Organization',
          name: 'Lydian Complaint Intelligence',
        },
      },
    }),
    // Custom extension for resolution metrics
    additionalProperty: [
      {
        '@type': 'PropertyValue',
        name: 'Total Complaints',
        value: totalComplaints,
      },
      {
        '@type': 'PropertyValue',
        name: 'Resolved Complaints',
        value: resolvedComplaints,
      },
      {
        '@type': 'PropertyValue',
        name: 'Resolution Rate',
        value: `${resolutionRate}%`,
      },
    ],
  };

  return (
    <Script
      id={`brand-schema-${brandId}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      strategy="afterInteractive"
    />
  );
}
