import { Expose } from 'class-transformer';
import { UserType } from '../user-type.enum';

export class ProfileResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  email: string;

  @Expose()
  type: UserType;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
} 