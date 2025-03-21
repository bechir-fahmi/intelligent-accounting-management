import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { FinanceDirector } from '../../users/entities/finance-director.entity';

@Injectable()
export class FinanceDirectorGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest();
    return user instanceof FinanceDirector;
  }
} 