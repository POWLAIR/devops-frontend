import { type NextRequest } from 'next/server';
import { proxyRequest, buildUrl } from '@/lib/proxy';
import { PRODUCT_SERVICE_URL } from '@/lib/constants';

export async function GET(request: NextRequest) {
  const targetUrl = buildUrl(`${PRODUCT_SERVICE_URL}/products/search`, request);
  return proxyRequest(request, { targetUrl, body: null });
}
