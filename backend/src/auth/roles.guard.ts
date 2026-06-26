import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import { Role } from '@prisma/client';
import { RequestWithUser } from './interfaces/request-with-user.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true; // No roles defined = public or just requires auth
    }

    const { user } = context.switchToHttp().getRequest<RequestWithUser>();

    if (!user) {
      return false; // Not authenticated
    }

    return requiredRoles.some((role) => user.role === role);
  }
}
