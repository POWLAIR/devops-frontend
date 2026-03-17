import { type NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/proxy';
import { AUTH_SERVICE_URL } from '@/lib/constants';

export async function PATCH(request: NextRequest) {
  return proxyRequest(request, {
    targetUrl: `${AUTH_SERVICE_URL}/api/v1/users/me/password`,
  });
}
