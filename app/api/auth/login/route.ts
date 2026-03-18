import { type NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/proxy';
import { AUTH_SERVICE_URL } from '@/lib/constants';

// Le login est un endpoint portail-unique : aucun X-Tenant-ID requis.
// L'auth-service résout le tenant à partir de l'email de l'utilisateur.
export async function POST(request: NextRequest) {
  return proxyRequest(request, {
    targetUrl: `${AUTH_SERVICE_URL}/auth/login`,
  });
}
