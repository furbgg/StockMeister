import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

export interface User {
  username: string;
  role: string;
  token?: string;
  [key: string]: any;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (username: string, password: string) => Promise<any>;
  verifyTotp: (username: string, code: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('authToken');

      if (storedUser && storedToken) {
        try {
          const parsedUser = JSON.parse(storedUser);
          // Attach token to axios defaults
          axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;

          setUser(parsedUser);
          setIsAuthenticated(true);
        } catch (error) {
          // Invalid stored data, clear and require re-login
          localStorage.clear();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const completeLogin = (token: string, username: string, role: string) => {
    if (role.startsWith('ROLE_')) {
      role = role.replace('ROLE_', '');
    }

    const userData: User = { username, role, token };

    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(userData));
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    setUser(userData);
    setIsAuthenticated(true);

    toast.success('Login successful!');
  };

  const login = async (username: string, password: string) => {
    try {
      const response = await axios.post('/api/auth/login', { username, password });

      if (response.data.twoFactorRequired) {
        return response.data;
      }

      if (!response.data.token) {
        throw new Error("No token received from server");
      }

      completeLogin(response.data.token, username, response.data.role || 'WAITER');
      return response.data;

    } catch (error: any) {
      setIsAuthenticated(false);
      setUser(null);
      const msg = error.response?.data?.message || 'Login failed. Please check your credentials.';
      toast.error(msg);
      throw error;
    }
  };

  const verifyTotp = async (username: string, code: string) => {
    try {
      const response = await axios.post('/api/auth/2fa/verify', {
        username,
        code: parseInt(code)
      });

      if (!response.data.token) {
        throw new Error("No token received from server");
      }

      completeLogin(response.data.token, username, response.data.role || 'ADMIN');

    } catch (error: any) {
      const msg = error.response?.data?.message || '2FA verification failed.';
      toast.error(msg);
      throw error;
    }
  };

  const logout = () => {
    localStorage.clear();
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setIsAuthenticated(false);
    toast.info('Logged out.');

    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, verifyTotp, logout, loading }}>
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