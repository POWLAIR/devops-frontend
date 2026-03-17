import { type NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/proxy';
import { NOTIFICATION_SERVICE_URL } from '@/lib/constants';

export async function GET(request: NextRequest) {
  return proxyRequest(request, {
    targetUrl: `${NOTIFICATION_SERVICE_URL}/api/v1/notifications/stats`,
    body: null,
  });
}
