import { type NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/proxy';
import { PRODUCT_SERVICE_URL } from '@/lib/constants';

export async function POST(request: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  return proxyRequest(request, {
    targetUrl: `${PRODUCT_SERVICE_URL}/products/${productId}/favorite`,
    body: null,
  });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  return proxyRequest(request, {
    targetUrl: `${PRODUCT_SERVICE_URL}/products/${productId}/favorite`,
    body: null,
  });
}
