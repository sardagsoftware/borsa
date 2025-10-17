// LCI Web - Breadcrumb Schema.org Structured Data
// White-hat: Improves SEO visibility and navigation

import Script from 'next/script';

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface BreadcrumbSchemaProps {
  items: BreadcrumbItem[];
}

/**
 * BreadcrumbSchema Component
 *
 * Generates Schema.org structured data for breadcrumb navigation using:
 * - BreadcrumbList schema
 *
 * Benefits:
 * - Breadcrumb rich snippets in Google search results
 * - Improved user navigation understanding
 * - Better site hierarchy representation
 * - Enhanced mobile search UX
 *
 * Example breadcrumb for complaint page:
 * Home > Brands > Brand Name > Complaints > Complaint Title
 */
export function BreadcrumbSchema({ items }: BreadcrumbSchemaProps) {
  // Schema.org BreadcrumbList structure
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <Script
      id="breadcrumb-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      strategy="afterInteractive"
    />
  );
}

/**
 * Helper: Generate breadcrumbs for complaint page
 */
export function generateComplaintBreadcrumbs(
  brandName: string,
  brandSlug: string,
  complaintTitle: string,
  complaintId: string,
): BreadcrumbItem[] {
  return [
    { name: 'Home', url: 'https://lci.lydian.ai' },
    { name: 'Brands', url: 'https://lci.lydian.ai/brands' },
    {
      name: brandName,
      url: `https://lci.lydian.ai/brands/${brandSlug}`,
    },
    {
      name: 'Complaints',
      url: `https://lci.lydian.ai/brands/${brandSlug}/complaints`,
    },
    {
      name: complaintTitle,
      url: `https://lci.lydian.ai/complaints/${complaintId}`,
    },
  ];
}

/**
 * Helper: Generate breadcrumbs for brand page
 */
export function generateBrandBreadcrumbs(
  brandName: string,
  brandSlug: string,
): BreadcrumbItem[] {
  return [
    { name: 'Home', url: 'https://lci.lydian.ai' },
    { name: 'Brands', url: 'https://lci.lydian.ai/brands' },
    {
      name: brandName,
      url: `https://lci.lydian.ai/brands/${brandSlug}`,
    },
  ];
}

/**
 * Helper: Generate breadcrumbs for dashboard pages
 */
export function generateDashboardBreadcrumbs(
  pageName: string,
): BreadcrumbItem[] {
  return [
    { name: 'Home', url: 'https://lci.lydian.ai' },
    { name: 'Dashboard', url: 'https://lci.lydian.ai/dashboard' },
    { name: pageName, url: window.location.href },
  ];
}
