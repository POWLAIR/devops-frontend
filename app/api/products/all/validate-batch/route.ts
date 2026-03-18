import { type NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/proxy';
import { PRODUCT_SERVICE_URL } from '@/lib/constants';

export async function POST(request: NextRequest) {
  return proxyRequest(request, {
    targetUrl: `${PRODUCT_SERVICE_URL}/products/all/validate-batch`,
  });
}
