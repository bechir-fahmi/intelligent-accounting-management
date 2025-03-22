'use client';

import axios from 'axios';

const API_URL = 'http://localhost:3000/api/auth';
const API_BASE_URL = 'http://localhost:3000/api';

export interface User {
  id: string;
  email: string;
  name: string;
  type?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  name: string;
  password: string;
  type: string;
}

// Configure axios to send credentials (cookies)
axios.defaults.withCredentials = true;

export const authService = {
  async login(data: LoginData): Promise<User> {
    const response = await axios.post(`${API_URL}/login`, data);
    const user = response.data.user;
    
    // Store user in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('currentUser', JSON.stringify(user));
    }
    
    return user;
  },

  async register(data: RegisterData): Promise<User> {
    const response = await axios.post(`${API_URL}/register`, data);
    const user = response.data.user;
    
    // Store user in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('currentUser', JSON.stringify(user));
    }
    
    return user;
  },

  async logout(): Promise<void> {
    await axios.post(`${API_URL}/logout`);
    
    // Remove user from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('currentUser');
    }
  },

  async getCurrentUser(): Promise<User | null> {
    // Try to get from localStorage first
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        // We have a user in localStorage, now validate with the API
        try {
          const response = await axios.get(`${API_BASE_URL}/users/profile`);
          const user = response.data;
          
          // Update localStorage with the fresh data
          localStorage.setItem('currentUser', JSON.stringify(user));
          return user;
        } catch (error) {
          // If API call fails (e.g., token expired), clear localStorage
          console.error('Error validating user:', error);
          localStorage.removeItem('currentUser');
          return null;
        }
      }
    }
    
    // If we reach here, there's no user in localStorage
    return null;
  },
  
  // Helper method to get user type without async
  getUserType(): string | null {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        return user.type || null;
      }
    }
    return null;
  }
}; 