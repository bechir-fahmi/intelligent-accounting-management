import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types/user';
import { api } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isComptable: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Add response interceptor for error handling
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        setUser(null);
        setIsAuthenticated(false);
      }
      return Promise.reject(error);
    }
  );

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      try {
        console.log('Checking authentication...');
        const response = await api.get('/auth/me');
        console.log('Auth check response:', response.data);
        
        if (response.data && response.data.id) {
          console.log('Setting authenticated user:', response.data);
          setUser(response.data);
          setIsAuthenticated(true);
        } else {
          console.log('No valid user data in response');
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsInitialized(true);
      }
    };

    checkAuth();
  }, []);

  // Don't render children until auth check is complete
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      console.log('Login response:', response.data);
      
      if (response.data && response.data.user) {
        setUser(response.data.user);
        setIsAuthenticated(true);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw new Error('Login failed');
    }
  };

  const logout = async () => {
    try {
      console.log('Starting logout process...');
      
      // Clear user state first to prevent any UI issues
      setUser(null);
      setIsAuthenticated(false);
      
      // Clear any stored tokens or session data
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      
      // Call logout API (don't wait for it to complete)
      api.post('/auth/logout').catch(error => {
        console.error('Logout API call failed:', error);
      });
      
      console.log('Logout completed, redirecting...');
      
      // Redirect to login page
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout process failed:', error);
      // Force redirect even if something goes wrong
      window.location.href = '/login';
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const isAdmin = user?.type === 'admin';
  const isComptable = user?.type === 'comptable';

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, isAuthenticated, isAdmin, isComptable }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
