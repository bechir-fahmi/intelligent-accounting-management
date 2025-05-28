import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

export type UserRole = 'admin' | 'accountant' | 'finance' | 'finance_director';

export const USER_ROLES = [
  { label: 'Admin', value: 'admin' },
  { label: 'Accountant', value: 'accountant' },
  { label: 'Finance', value: 'finance' },
  { label: 'Finance Director', value: 'finance_director' }
] as const;

export interface User {
  id: string;
  name: string;
  email: string;
  type: UserRole;
  createdAt: string;
  updatedAt: string;
}

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

export const usersService = {
  getAllUsers: async (): Promise<User[]> => {
    const response = await api.get('/users');
    return response.data;
  },

  getUserById: async (id: string): Promise<User> => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  createUser: async (userData: CreateUserDto): Promise<User> => {
    const response = await api.post('/users', userData);
    return response.data;
  },

  updateUser: async (id: string, userData: UpdateUserDto): Promise<User> => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },

  deleteUser: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
}; 