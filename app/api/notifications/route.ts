import { type NextRequest } from 'next/server';
import { proxyRequest, buildUrl } from '@/lib/proxy';
import { NOTIFICATION_SERVICE_URL } from '@/lib/constants';

export async function GET(request: NextRequest) {
  const targetUrl = buildUrl(`${NOTIFICATION_SERVICE_URL}/api/v1/notifications/history`, request);
  return proxyRequest(request, { targetUrl, body: null });
}
