import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { UserType } from '../../users/user-type.enum';

@Injectable()
export class AccountantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest();
    return user?.type === UserType.ACCOUNTANT;
  }
} 