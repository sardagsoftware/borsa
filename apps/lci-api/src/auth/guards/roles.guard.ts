// LCI API - Roles Guard
// White-hat: RBAC enforcement

import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, Actor } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Get required roles from metadata
    const requiredRoles = this.reflector.getAllAndOverride<Actor[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no roles are required, allow access
    if (!requiredRoles) {
      return true;
    }

    // Get user from request
    const { user } = context.switchToHttp().getRequest();

    // White-hat: Deny if no user (should be caught by JwtAuthGuard first)
    if (!user) {
      return false;
    }

    // White-hat: Check if user has any of the required roles
    return requiredRoles.some((role) => user.role === role);
  }
}
