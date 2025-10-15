// LCI API - JWT Auth Guard
// White-hat: Protect routes with JWT

import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
