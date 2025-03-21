import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Accountant } from '../../users/entities/accountant.entity';

@Injectable()
export class AccountantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest();
    return user instanceof Accountant;
  }
} 