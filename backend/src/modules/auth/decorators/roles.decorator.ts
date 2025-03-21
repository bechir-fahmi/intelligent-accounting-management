import { SetMetadata } from '@nestjs/common';
import { UserType } from '../../users/user-type.enum';

export const Roles = (...types: UserType[]) => SetMetadata('roles', types); 