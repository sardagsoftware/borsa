// LCI API - Roles Decorator
// White-hat: Type-safe role checking

import { SetMetadata } from '@nestjs/common';

export type Actor = 'USER' | 'BRAND_AGENT' | 'MODERATOR' | 'ADMIN' | 'SYSTEM';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Actor[]) => SetMetadata(ROLES_KEY, roles);
