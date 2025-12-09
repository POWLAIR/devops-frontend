import { NextRequest, NextResponse } from 'next/server';
import { fetchWithTimeout, TIMEOUT_MS } from '@/lib/fetch-with-timeout';

const TENANT_SERVICE_URL =
  process.env.TENANT_SERVICE_URL || 'http://localhost:7000';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Non authentifié' },
        { status: 401 },
      );
    }

    const response = await fetchWithTimeout(
      `${TENANT_SERVICE_URL}/tenants`,
      {
        method: 'GET',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
        },
      },
      TIMEOUT_MS,
      'Timeout lors de la connexion au service de tenants',
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          message:
            data?.message ||
            data?.detail ||
            'Erreur lors de la récupération des tenants',
        },
        { status: response.status },
      );
    }

    const tenants = Array.isArray(data)
      ? data
          .map((tenant: any) => ({
            id: tenant?.id,
            name: tenant?.name,
          }))
          .filter((tenant) => tenant.id && tenant.name)
      : [];

    return NextResponse.json(tenants, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Erreur de connexion au service de tenants';

    return NextResponse.json({ message }, { status: 500 });
  }
}

