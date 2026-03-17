import { type NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/proxy';
import { AUTH_SERVICE_URL } from '@/lib/constants';

export async function GET(request: NextRequest) {
  return proxyRequest(request, {
    targetUrl: `${AUTH_SERVICE_URL}/auth/validate`,
    body: null,
  });
}
