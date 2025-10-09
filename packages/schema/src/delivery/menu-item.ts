// ========================================
// MENU ITEM SCHEMA
// Unified schema for menu items across delivery platforms
// ========================================

import { z } from 'zod';

/**
 * Menu Item Status
 */
export const MenuItemStatusSchema = z.enum([
  'available',
  'out_of_stock',
  'discontinued',
  'hidden',
]);

export type MenuItemStatus = z.infer<typeof MenuItemStatusSchema>;

/**
 * Dietary Tag
 */
export const DietaryTagSchema = z.enum([
  'vegetarian',
  'vegan',
  'gluten_free',
  'halal',
  'kosher',
  'lactose_free',
  'nut_free',
  'spicy',
  'organic',
]);

export type DietaryTag = z.infer<typeof DietaryTagSchema>;

/**
 * Option Group (e.g., "Size", "Extras")
 */
export const OptionGroupSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  required: z.boolean().default(false),
  minSelections: z.number().int().nonnegative().default(0),
  maxSelections: z.number().int().positive().optional(),
  options: z.array(
    z.object({
      id: z.string(),
      name: z.string().min(1).max(100),
      priceModifier: z.number().default(0), // Can be negative for discounts
      isDefault: z.boolean().default(false),
      available: z.boolean().default(true),
    })
  ),
});

export type OptionGroup = z.infer<typeof OptionGroupSchema>;

/**
 * Nutritional Information
 */
export const NutritionalInfoSchema = z.object({
  calories: z.number().nonnegative().optional(),
  protein: z.number().nonnegative().optional(), // grams
  carbohydrates: z.number().nonnegative().optional(),
  fat: z.number().nonnegative().optional(),
  fiber: z.number().nonnegative().optional(),
  sodium: z.number().nonnegative().optional(), // mg
}).optional();

export type NutritionalInfo = z.infer<typeof NutritionalInfoSchema>;

/**
 * Menu Item Schema
 * Unified model for menu items across delivery platforms
 */
export const MenuItemSchema = z.object({
  id: z.string(),
  vendorId: z.string(), // getir, yemeksepeti, trendyol_yemek
  vendorItemId: z.string(), // External ID from vendor
  restaurantId: z.string(),

  // Basic Info
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  category: z.string().min(1).max(100),
  subcategory: z.string().max(100).optional(),

  // Pricing
  basePrice: z.number().positive(),
  discountedPrice: z.number().positive().optional(),
  currency: z.string().length(3).default('TRY'),

  // Status
  status: MenuItemStatusSchema,
  isAvailable: z.boolean().default(true),

  // Classification
  dietaryTags: z.array(DietaryTagSchema).default([]),
  allergens: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]), // popular, new, recommended

  // Options
  optionGroups: z.array(OptionGroupSchema).default([]),

  // Media
  imageUrl: z.string().url().optional(),
  images: z.array(z.string().url()).default([]),

  // Details
  preparationTime: z.number().int().positive().optional(), // minutes
  servingSize: z.string().optional(), // "1 person", "300g"
  nutritionalInfo: NutritionalInfoSchema,

  // Inventory
  stock: z.number().int().nonnegative().optional(),
  unlimitedStock: z.boolean().default(true),

  // Display
  displayOrder: z.number().int().nonnegative().default(0),
  isFeatured: z.boolean().default(false),
  isPopular: z.boolean().default(false),

  // Vendor-specific data
  vendorData: z.record(z.any()).optional(),

  // Metadata
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export type MenuItem = z.infer<typeof MenuItemSchema>;

/**
 * Menu Item Create/Update DTOs
 */
export const MenuItemCreateSchema = MenuItemSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const MenuItemUpdateSchema = MenuItemSchema.partial().required({ id: true });

export type MenuItemCreate = z.infer<typeof MenuItemCreateSchema>;
export type MenuItemUpdate = z.infer<typeof MenuItemUpdateSchema>;

/**
 * Menu Item Bulk Sync Schema
 */
export const MenuItemBulkSyncSchema = z.object({
  restaurantId: z.string(),
  items: z.array(MenuItemCreateSchema),
  deleteNotInList: z.boolean().default(false), // Delete items not in this list
});

export type MenuItemBulkSync = z.infer<typeof MenuItemBulkSyncSchema>;
