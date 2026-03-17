import { type NextRequest } from 'next/server';
import { proxyRequest, buildUrl } from '@/lib/proxy';
import { ORDER_SERVICE_URL } from '@/lib/constants';

export async function GET(request: NextRequest) {
  const targetUrl = buildUrl(`${ORDER_SERVICE_URL}/orders`, request);
  return proxyRequest(request, { targetUrl, body: null });
}

export async function POST(request: NextRequest) {
  return proxyRequest(request, {
    targetUrl: `${ORDER_SERVICE_URL}/orders`,
  });
}
