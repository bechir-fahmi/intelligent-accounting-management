import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Finance } from '../../users/entities/finance.entity';

@Injectable()
export class FinanceGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest();
    return user instanceof Finance;
  }
} 