// ========================================
// RESTAURANT SCHEMA
// Unified schema for restaurant/store entities
// ========================================

import { z } from 'zod';

/**
 * Restaurant Status
 */
export const RestaurantStatusSchema = z.enum([
  'active',
  'paused',
  'closed',
  'suspended',
]);

export type RestaurantStatus = z.infer<typeof RestaurantStatusSchema>;

/**
 * Cuisine Type
 */
export const CuisineTypeSchema = z.enum([
  'turkish',
  'italian',
  'chinese',
  'japanese',
  'mexican',
  'indian',
  'american',
  'mediterranean',
  'fastfood',
  'dessert',
  'cafe',
  'grocery',
  'other',
]);

export type CuisineType = z.infer<typeof CuisineTypeSchema>;

/**
 * Operating Hours
 */
export const OperatingHoursSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6), // 0 = Sunday
  openTime: z.string().regex(/^\d{2}:\d{2}$/), // HH:MM
  closeTime: z.string().regex(/^\d{2}:\d{2}$/),
  isOpen: z.boolean().default(true),
});

export type OperatingHours = z.infer<typeof OperatingHoursSchema>;

/**
 * Address Schema
 */
export const AddressSchema = z.object({
  street: z.string().min(1),
  district: z.string().min(1),
  city: z.string().min(1),
  postalCode: z.string().optional(),
  country: z.string().default('TR'),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

export type Address = z.infer<typeof AddressSchema>;

/**
 * Restaurant Schema
 * Unified model for restaurants/stores across delivery platforms
 */
export const RestaurantSchema = z.object({
  id: z.string(),
  vendorId: z.string(), // getir, yemeksepeti, trendyol_yemek
  vendorRestaurantId: z.string(), // External ID from vendor

  // Basic Info
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(100),
  description: z.string().max(2000).optional(),

  // Classification
  cuisineTypes: z.array(CuisineTypeSchema).min(1),
  tags: z.array(z.string()).default([]),

  // Status
  status: RestaurantStatusSchema,
  isActive: z.boolean().default(true),
  acceptsOrders: z.boolean().default(true),

  // Location
  address: AddressSchema,
  deliveryZones: z.array(z.string()).default([]), // Postal codes or district names

  // Operating
  operatingHours: z.array(OperatingHoursSchema),

  // Business
  minOrderAmount: z.number().nonnegative().optional(),
  deliveryFee: z.number().nonnegative().optional(),
  freeDeliveryThreshold: z.number().nonnegative().optional(),
  averagePreparationTime: z.number().int().positive().optional(), // minutes

  // Ratings
  rating: z.number().min(0).max(5).optional(),
  reviewCount: z.number().int().nonnegative().default(0),

  // Media
  logoUrl: z.string().url().optional(),
  coverImageUrl: z.string().url().optional(),
  images: z.array(z.string().url()).default([]),

  // Vendor-specific data
  vendorData: z.record(z.any()).optional(),

  // Metadata
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export type Restaurant = z.infer<typeof RestaurantSchema>;

/**
 * Restaurant Create/Update DTOs
 */
export const RestaurantCreateSchema = RestaurantSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const RestaurantUpdateSchema = RestaurantSchema.partial().required({ id: true });

export type RestaurantCreate = z.infer<typeof RestaurantCreateSchema>;
export type RestaurantUpdate = z.infer<typeof RestaurantUpdateSchema>;
