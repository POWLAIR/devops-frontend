import { type NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/proxy';
import { TENANT_SERVICE_URL } from '@/lib/constants';

export async function GET(request: NextRequest) {
  return proxyRequest(request, {
    targetUrl: `${TENANT_SERVICE_URL}/plans`,
    body: null,
  });
}
