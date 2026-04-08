'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';
import { apiClientConfig } from '@/lib/api-client';

/**
 * Configure les callbacks du client API (toast / 401) de façon synchrone au rendu
 * pour éviter une course avec les effets des pages enfants.
 */
export function ApiClientBridge({ children }: { children: React.ReactNode }) {
  const { logout } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();

  apiClientConfig.onUnauthorized = () => {
    void (async () => {
      await logout();
      router.push('/login');
    })();
  };
  apiClientConfig.onNetworkError = (msg: string) => {
    addToast(msg, 'error');
  };

  return <>{children}</>;
}
