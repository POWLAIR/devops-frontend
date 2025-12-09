import { NextResponse } from 'next/server';
import { fetchWithTimeout, TIMEOUT_MS } from '@/lib/fetch-with-timeout';

const PRODUCT_SERVICE_URL =
  process.env.PRODUCT_SERVICE_URL || 'http://localhost:4000';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Extraire le tenant_id depuis les headers ou utiliser le tenant par défaut
    const tenantId = request.headers.get('x-tenant-id') || '1574b85d-a3df-400f-9e82-98831aa32934';

    const response = await fetchWithTimeout(
      `${PRODUCT_SERVICE_URL}/products/decrement-stock`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId,
        },
        body: JSON.stringify(body),
      },
      TIMEOUT_MS,
      'Timeout: Le service de produits ne répond pas',
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Erreur lors de la décrémentation du stock' },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error in products/decrement-stock proxy:', error);
    const message = error instanceof Error ? error.message : 'Erreur de connexion au service de produits';
    return NextResponse.json(
      { message },
      { status: 500 }
    );
  }
}

