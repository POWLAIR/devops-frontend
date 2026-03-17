import { type NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/proxy';
import { PRODUCT_SERVICE_URL } from '@/lib/constants';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyRequest(request, {
    targetUrl: `${PRODUCT_SERVICE_URL}/products/${id}/stock`,
  });
}
