'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { apiClient } from './api-client';
import { getToken, setToken, removeToken, getUser, setUser } from './auth';
import type { User, AuthResponse } from './types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    const token = getToken();
    const storedUser = getUser();

    if (token && storedUser) {
      try {
        const response = await apiClient.validateToken();
        if (response.valid && response.user) {
          setUserState(response.user);
          setUser(response.user);
        } else {
          removeToken();
          setUserState(null);
        }
      } catch {
        removeToken();
        setUserState(null);
      }
    } else {
      setUserState(null);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = useCallback(async (email: string, password: string) => {
    const response: AuthResponse = await apiClient.login({ email, password });
    setToken(response.token);
    setUser(response.user);
    setUserState(response.user);
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    const response: AuthResponse = await apiClient.register({ email, password });
    setToken(response.token);
    setUser(response.user);
    setUserState(response.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiClient.logout();
    } catch {
      // Ignorer les erreurs lors de la déconnexion
    } finally {
      removeToken();
      setUserState(null);
    }
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: user !== null,
    isLoading,
    login,
    register,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

