import { NextResponse } from 'next/server';
import { fetchWithTimeout, TIMEOUT_MS } from '@/lib/fetch-with-timeout';

const PAYMENT_SERVICE_URL =
  process.env.PAYMENT_SERVICE_URL || 'http://localhost:5000';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Non authentifié' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    // Extraire le tenant_id depuis les headers ou cookies ou utiliser le tenant par défaut
    const defaultTenant = '1574b85d-a3df-400f-9e82-98831aa32934';
    const tenantId =
      request.headers.get('x-tenant-id') ||
      (request as any).cookies?.get?.('x-tenant-id')?.value ||
      defaultTenant;
    const { id } = await params;

    const response = await fetchWithTimeout(
      `${PAYMENT_SERVICE_URL}/api/v1/payments/${id}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId,
        },
      },
      TIMEOUT_MS,
      'Timeout lors de la connexion au service de paiement',
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.error || data.message || 'Erreur lors de la récupération du paiement' },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error in payment GET proxy:', error);
    const message = error instanceof Error ? error.message : 'Erreur de connexion au service de paiement';
    return NextResponse.json(
      { message },
      { status: 500 }
    );
  }
}


