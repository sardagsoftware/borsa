// LCI Web - SEO Components Index
// White-hat: Centralized exports for Schema.org structured data components

export { ComplaintSchema } from './ComplaintSchema';
export type { ComplaintSchemaProps } from './ComplaintSchema';

export { BrandSchema } from './BrandSchema';
export type { BrandSchemaProps } from './BrandSchema';

export {
  BreadcrumbSchema,
  generateComplaintBreadcrumbs,
  generateBrandBreadcrumbs,
  generateDashboardBreadcrumbs,
} from './BreadcrumbSchema';
export type { BreadcrumbSchemaProps, BreadcrumbItem } from './BreadcrumbSchema';

export { WebsiteSchema, OrganizationSchema } from './WebsiteSchema';
export type { WebsiteSchemaProps } from './WebsiteSchema';

export { FAQSchema, LCI_FAQS, BRAND_FAQS } from './FAQSchema';
export type { FAQSchemaProps, FAQItem } from './FAQSchema';

export { MetaTags, DefaultMetaTags } from './MetaTags';
export type { MetaTagsProps } from './MetaTags';
