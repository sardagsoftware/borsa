// ========================================
// COMMERCE.PRODUCT - UNIFIED PRODUCT SCHEMA
// Harmonizes product data across Trendyol, Hepsiburada, etc.
// ========================================

import { z } from 'zod';

/**
 * Product Status
 */
export const ProductStatusSchema = z.enum([
  'draft',       // Taslak
  'active',      // Satışta
  'inactive',    // Pasif
  'out_of_stock',// Stokta yok
  'discontinued',// Üretimi durduruldu
]);

export type ProductStatus = z.infer<typeof ProductStatusSchema>;

/**
 * Product Image
 */
export const ProductImageSchema = z.object({
  url: z.string().url(),
  alt: z.string().optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  isPrimary: z.boolean().default(false),
  order: z.number().int().nonnegative().default(0),
});

export type ProductImage = z.infer<typeof ProductImageSchema>;

/**
 * Product Variant
 */
export const ProductVariantSchema = z.object({
  id: z.string(),
  sku: z.string(),
  barcode: z.string().optional(),

  // Attributes
  attributes: z.record(z.string()).optional(), // e.g., { size: "XL", color: "Red" }

  // Pricing
  price: z.number().positive(),
  compareAtPrice: z.number().positive().optional(), // İndirimli fiyat için
  currency: z.string().length(3).default('TRY'),

  // Inventory
  stock: z.number().int().nonnegative(),
  availableStock: z.number().int().nonnegative().optional(),

  // Dimensions
  weight: z.number().positive().optional(),       // kg
  weightUnit: z.string().default('kg'),
  dimensions: z.object({
    length: z.number().positive(),
    width: z.number().positive(),
    height: z.number().positive(),
    unit: z.string().default('cm'),
  }).optional(),

  // Images
  images: z.array(ProductImageSchema).optional(),
});

export type ProductVariant = z.infer<typeof ProductVariantSchema>;

/**
 * Product Category
 */
export const ProductCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  path: z.string().optional(), // e.g., "Electronics > Phones > Smartphones"
  level: z.number().int().nonnegative().optional(),
});

export type ProductCategory = z.infer<typeof ProductCategorySchema>;

/**
 * Product (Unified Schema)
 */
export const ProductSchema = z.object({
  // Identity
  id: z.string(),                          // Internal ID
  externalId: z.string().optional(),       // Vendor-specific ID
  sku: z.string(),
  barcode: z.string().optional(),

  // Basic Info
  title: z.string().min(3).max(500),
  description: z.string().optional(),
  shortDescription: z.string().max(200).optional(),
  brand: z.string().optional(),

  // Category
  category: ProductCategorySchema,
  categories: z.array(ProductCategorySchema).optional(), // Multi-category support

  // Status
  status: ProductStatusSchema,

  // Pricing (for single-variant products)
  price: z.number().positive().optional(),
  compareAtPrice: z.number().positive().optional(),
  currency: z.string().length(3).default('TRY'),

  // Inventory (for single-variant products)
  stock: z.number().int().nonnegative().optional(),

  // Variants (for multi-variant products)
  hasVariants: z.boolean().default(false),
  variants: z.array(ProductVariantSchema).optional(),

  // Media
  images: z.array(ProductImageSchema),
  videos: z.array(z.object({
    url: z.string().url(),
    thumbnail: z.string().url().optional(),
    duration: z.number().positive().optional(),
  })).optional(),

  // SEO
  slug: z.string().optional(),
  seoTitle: z.string().max(60).optional(),
  seoDescription: z.string().max(160).optional(),
  keywords: z.array(z.string()).optional(),

  // Attributes
  attributes: z.record(z.string()).optional(),   // Custom attributes
  tags: z.array(z.string()).optional(),

  // Vendor-specific
  vendorId: z.string(),                          // e.g., "trendyol", "hepsiburada"
  vendorData: z.record(z.any()).optional(),      // Vendor-specific fields

  // Timestamps
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
  publishedAt: z.string().datetime().optional(),
});

export type Product = z.infer<typeof ProductSchema>;

/**
 * Product Create Input
 */
export const ProductCreateInputSchema = ProductSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial({
  externalId: true,
  status: true,
});

export type ProductCreateInput = z.infer<typeof ProductCreateInputSchema>;

/**
 * Product Update Input
 */
export const ProductUpdateInputSchema = ProductSchema.partial().required({ id: true });

export type ProductUpdateInput = z.infer<typeof ProductUpdateInputSchema>;

/**
 * Product List Filters
 */
export const ProductListFiltersSchema = z.object({
  status: ProductStatusSchema.optional(),
  categoryId: z.string().optional(),
  brand: z.string().optional(),
  minPrice: z.number().positive().optional(),
  maxPrice: z.number().positive().optional(),
  inStock: z.boolean().optional(),
  search: z.string().optional(),
  tags: z.array(z.string()).optional(),
  vendorId: z.string().optional(),

  // Pagination
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  sortBy: z.enum(['createdAt', 'updatedAt', 'price', 'title', 'stock']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type ProductListFilters = z.infer<typeof ProductListFiltersSchema>;

/**
 * Product List Response
 */
export const ProductListResponseSchema = z.object({
  items: z.array(ProductSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  hasMore: z.boolean(),
});

export type ProductListResponse = z.infer<typeof ProductListResponseSchema>;
