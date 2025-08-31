import { api } from '@/lib/api';
import { User } from '@/types/user';

export type UserRole = 'admin' | 'accountant' | 'finance' | 'finance_director';

export const USER_ROLES = [
  { label: 'Admin', value: 'admin' },
  { label: 'Accountant', value: 'accountant' },
  { label: 'Finance', value: 'finance' },
  { label: 'Finance Director', value: 'finance_director' }
] as const;

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  type: UserRole;
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  type?: UserRole;
}

export interface UpdateProfileDto {
  name: string;
  email: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

class UsersService {
  async getAllUsers(): Promise<User[]> {
    const response = await api.get('/users');
    return response.data;
  }

  async getUserById(id: string): Promise<User> {
    const response = await api.get(`/users/${id}`);
    return response.data;
  }

  async createUser(userData: CreateUserDto): Promise<User> {
    const response = await api.post('/users', userData);
    return response.data;
  }

  async updateUser(id: string, userData: UpdateUserDto): Promise<User> {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  }

  async deleteUser(id: string): Promise<void> {
    await api.delete(`/users/${id}`);
  }

  async updateProfile(data: UpdateProfileDto): Promise<User> {
    const response = await api.put('/users/profile', data);
    return response.data;
  }

  async changePassword(data: ChangePasswordDto): Promise<void> {
    await api.put('/users/change-password', data);
  }

  async forgotPassword(email: string): Promise<void> {
    await api.post('/users/forgot-password', { email });
  }

  async validateResetToken(token: string): Promise<{ valid: boolean }> {
    const response = await api.get(`/users/validate-reset-token/${token}`);
    return response.data;
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await api.post('/users/reset-password', { token, newPassword });
  }
}

export const usersService = new UsersService(); 