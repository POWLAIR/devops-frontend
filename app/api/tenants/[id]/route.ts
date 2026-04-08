import { type NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/proxy';
import { TENANT_SERVICE_URL, AUTH_SERVICE_URL } from '@/lib/constants';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyRequest(request, {
    targetUrl: `${TENANT_SERVICE_URL}/tenants/${id}`,
    body: null,
  });
}

// Le PATCH est routé vers l'auth-service qui supporte la mise à jour du statut,
// du plan et des champs de base (name, email, subdomain).
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyRequest(request, {
    targetUrl: `${AUTH_SERVICE_URL}/tenants/${id}`,
  });
}
