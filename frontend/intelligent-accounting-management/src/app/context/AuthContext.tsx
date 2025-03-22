'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { authService, User } from '../services/auth.service';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string, type: string) => Promise<User>;
  logout: () => Promise<void>;
  getUserType: () => string | null;
}

// Create a default context that's safe to use during SSR
const defaultContext: AuthContextType = {
  user: null,
  loading: true,
  login: async () => { throw new Error('Not implemented') },
  register: async () => { throw new Error('Not implemented') },
  logout: async () => { throw new Error('Not implemented') },
  getUserType: () => null,
};

const AuthContext = createContext<AuthContextType>(defaultContext);

export function AuthProvider({ 
  children,
  isSSR = false
}: { 
  children: ReactNode;
  isSSR?: boolean;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Skip auth check during SSR to avoid hydration issues
    if (isSSR) {
      setLoading(false);
      return;
    }

    // Check if the user is logged in
    const checkAuthStatus = async () => {
      try {
        // First check if we have a user in localStorage
        if (typeof window !== 'undefined') {
          const storedUser = localStorage.getItem('currentUser');
          if (storedUser) {
            // If we have a user in localStorage, only then try to validate with the API
            const currentUser = await authService.getCurrentUser();
            setUser(currentUser);
          } else {
            // If no user in localStorage, we know we're not logged in
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        // In case of an error, clear the user state
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, [isSSR]);

  // If we're in SSR mode, return a minimal context that won't trigger API calls
  if (isSSR) {
    return (
      <AuthContext.Provider value={defaultContext}>
        {children}
      </AuthContext.Provider>
    );
  }

  const login = async (email: string, password: string): Promise<User> => {
    const user = await authService.login({ email, password });
    setUser(user);
    return user;
  };

  const register = async (name: string, email: string, password: string, type: string): Promise<User> => {
    const user = await authService.register({ name, email, password, type });
    setUser(user);
    return user;
  };

  const logout = async (): Promise<void> => {
    await authService.logout();
    setUser(null);
    router.push('/auth/login');
  };

  const getUserType = (): string | null => {
    // Return type from user if available, otherwise try from auth service
    return user?.type || authService.getUserType();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        getUserType,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 