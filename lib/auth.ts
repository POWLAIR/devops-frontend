import type { User } from './types';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

/**
 * Stocke le token d'authentification dans localStorage
 */
export function setToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

/**
 * Récupère le token d'authentification depuis localStorage
 */
export function getToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(TOKEN_KEY);
  }
  return null;
}

/**
 * Supprime le token d'authentification
 */
export function removeToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
}

/**
 * Stocke les informations de l'utilisateur dans localStorage
 */
export function setUser(user: User): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
}

/**
 * Récupère les informations de l'utilisateur depuis localStorage
 */
export function getUser(): User | null {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem(USER_KEY);
    if (userStr) {
      try {
        return JSON.parse(userStr) as User;
      } catch {
        return null;
      }
    }
  }
  return null;
}

/**
 * Vérifie si un token est présent
 */
export function hasToken(): boolean {
  return getToken() !== null;
}

/**
 * Vérifie si l'utilisateur est authentifié
 */
export function isAuthenticated(): boolean {
  return hasToken() && getUser() !== null;
}

