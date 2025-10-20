import { z } from 'zod';

/**
 * White-Hat: Zod schema for wallet creation
 * - No PII allowed (name, email, etc)
 * - ownerID is external reference only
 * - Region enforcement for data residency
 */
export const CreateWalletSchema = z.object({
  ownerType: z.enum(['individual', 'organization', 'city'], {
    errorMap: () => ({ message: 'ownerType must be individual, organization, or city' }),
  }),
  ownerId: z
    .string()
    .min(1, 'ownerId is required')
    .max(255, 'ownerId too long')
    .regex(/^[a-zA-Z0-9_-]+$/, 'ownerId must be alphanumeric with dashes/underscores only'),
  region: z.enum(['EU', 'TR', 'US'], {
    errorMap: () => ({ message: 'region must be EU, TR, or US' }),
  }),
  // Optional initial balances (default 0)
  balanceCO2: z.number().min(0).optional(),
  balanceH2O: z.number().min(0).optional(),
  balanceKWh: z.number().min(0).optional(),
  balanceWaste: z.number().min(0).optional(),
  // Optional initial ethics scores (default 0)
  ethicsScore: z.number().min(0).max(100).optional(),
  impactScore: z.number().min(0).max(100).optional(),
});

export type CreateWalletDto = z.infer<typeof CreateWalletSchema>;

/**
 * White-Hat: Runtime validation function
 * Throws ZodError if validation fails (caught by global exception filter)
 */
export function validateCreateWallet(data: unknown): CreateWalletDto {
  return CreateWalletSchema.parse(data);
}
