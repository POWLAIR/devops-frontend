import type { User } from './types';
import { TOKEN_STORAGE_KEY, USER_STORAGE_KEY, AUTH_COOKIE, TENANT_COOKIE } from './constants';

/**
 * Sauvegarde le token JWT et l'utilisateur dans localStorage et dans les cookies.
 */
export function saveSession(token: string, user: User): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  // Cookies accessibles par les Server Components (httpOnly=false pour lecture JS)
  const maxAge = 60 * 60 * 24 * 7; // 7 jours
  document.cookie = `${AUTH_COOKIE}=${token}; path=/; max-age=${maxAge}; SameSite=Lax`;
  document.cookie = `${TENANT_COOKIE}=${user.tenant_id}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

/**
 * Retourne la session courante depuis localStorage, ou null si absente.
 */
export function getSession(): { token: string; user: User } | null {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  const userStr = localStorage.getItem(USER_STORAGE_KEY);
  if (!token || !userStr) return null;
  try {
    const user = JSON.parse(userStr) as User;
    return { token, user };
  } catch {
    return null;
  }
}

/**
 * Supprime la session (localStorage + cookies).
 */
export function clearSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
  document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0`;
  document.cookie = `${TENANT_COOKIE}=; path=/; max-age=0`;
}

/**
 * Retourne le JWT courant ou null.
 */
export function getToken(): string | null {
  return getSession()?.token ?? null;
}

/**
 * Retourne le tenant_id de l'utilisateur connecté ou null.
 */
export function getTenantId(): string | null {
  return getSession()?.user?.tenant_id ?? null;
}
