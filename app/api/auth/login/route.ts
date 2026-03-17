import { type NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/proxy';
import { AUTH_SERVICE_URL, DEFAULT_TENANT_ID } from '@/lib/constants';

export async function POST(request: NextRequest) {
  return proxyRequest(request, {
    targetUrl: `${AUTH_SERVICE_URL}/auth/login`,
    // Injecte le tenant par défaut si aucun cookie x-tenant-id n'est présent
    ...(DEFAULT_TENANT_ID ? { extraHeaders: { 'X-Tenant-ID': DEFAULT_TENANT_ID } } : {}),
  });
}
