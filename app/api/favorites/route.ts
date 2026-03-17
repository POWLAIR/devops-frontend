import { type NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/proxy';
import { PRODUCT_SERVICE_URL } from '@/lib/constants';

export async function GET(request: NextRequest) {
  return proxyRequest(request, {
    targetUrl: `${PRODUCT_SERVICE_URL}/favorites`,
    body: null,
  });
}
