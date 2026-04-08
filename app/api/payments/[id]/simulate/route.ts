import { type NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/proxy';
import { PAYMENT_SERVICE_URL } from '@/lib/constants';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyRequest(request, {
    targetUrl: `${PAYMENT_SERVICE_URL}/api/v1/payments/${id}/simulate-success`,
    body: null,
  });
}
