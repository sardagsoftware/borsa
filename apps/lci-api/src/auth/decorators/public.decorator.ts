// LCI API - Public Decorator
// White-hat: Marks endpoints that don't require authentication

import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
