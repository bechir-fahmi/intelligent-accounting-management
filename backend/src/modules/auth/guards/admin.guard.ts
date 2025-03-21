import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Admin } from '../../users/entities/admin.entity';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest();
    return user instanceof Admin;
  }
} 