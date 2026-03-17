import { type NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/proxy';
import { TENANT_SERVICE_URL } from '@/lib/constants';

export async function POST(request: NextRequest, { params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
  return proxyRequest(request, {
    targetUrl: `${TENANT_SERVICE_URL}/onboarding/${tenantId}/complete-step`,
  });
}
