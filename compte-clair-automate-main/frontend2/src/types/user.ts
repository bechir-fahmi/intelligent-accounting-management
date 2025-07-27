import { UserRole } from '@/services/users.service';

export interface User {
  id: string;
  email: string;
  name: string;
  type: UserRole;
  profileImage?: string;
  createdAt?: string;
  updatedAt?: string;
} 