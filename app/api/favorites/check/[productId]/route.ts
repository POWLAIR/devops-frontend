import { type NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/proxy';
import { PRODUCT_SERVICE_URL } from '@/lib/constants';

export async function GET(request: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  return proxyRequest(request, {
    targetUrl: `${PRODUCT_SERVICE_URL}/favorites/check/${productId}`,
    body: null,
  });
}
