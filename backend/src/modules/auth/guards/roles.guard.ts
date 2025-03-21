import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserType } from '../../users/user-type.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredTypes = this.reflector.getAllAndOverride<UserType[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredTypes) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    return requiredTypes.some((type) => user.type === type);
  }
} 