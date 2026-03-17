import { type NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/proxy';
import { AUTH_SERVICE_URL } from '@/lib/constants';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyRequest(request, {
    targetUrl: `${AUTH_SERVICE_URL}/tenants/${id}`,
    body: null,
  });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyRequest(request, {
    targetUrl: `${AUTH_SERVICE_URL}/tenants/${id}`,
  });
}
