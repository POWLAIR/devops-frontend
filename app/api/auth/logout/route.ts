import { type NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/proxy';
import { AUTH_SERVICE_URL } from '@/lib/constants';

export async function POST(request: NextRequest) {
  return proxyRequest(request, {
    targetUrl: `${AUTH_SERVICE_URL}/auth/logout`,
  });
}
