import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import apiClient from '../api/client';
import type { User, LoginCredentials } from '../types';

interface AuthContextValue {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({ id: payload.sub ?? payload.uuid, email: payload.username ?? payload.email });
      } catch {
        setUser(null);
      }
    } else {
      setUser(null);
    }
  }, [token]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const response = await apiClient.post<{ token: string }>('/api/login', credentials);
    const newToken = response.data.token;
    localStorage.setItem('token', newToken);
    setToken(newToken);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('selectedShopId');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, isAuthenticated: !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
