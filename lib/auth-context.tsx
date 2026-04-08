'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { saveSession, clearSession, getSession } from './auth';
import { apiFetch, ApiUnauthorizedError } from './api-client';
import type { User } from './types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialise la session depuis localStorage au montage
  useEffect(() => {
    const session = getSession();
    if (session) {
      setUser(session.user);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((token: string, user: User) => {
    saveSession(token, user);
    setUser(user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignorer les erreurs réseau lors de la déconnexion
    } finally {
      clearSession();
      setUser(null);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const response = await apiFetch('/api/users/me', { skipErrorToast: true });
      if (response.ok) {
        const updatedUser: User = await response.json();
        const session = getSession();
        if (session) {
          saveSession(session.token, updatedUser);
          setUser(updatedUser);
        }
      }
    } catch (e) {
      if (e instanceof ApiUnauthorizedError) return;
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
}
