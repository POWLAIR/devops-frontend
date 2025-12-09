import { NextResponse } from 'next/server';
import { fetchWithTimeout, TIMEOUT_MS } from '@/lib/fetch-with-timeout';

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:8000';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { valid: false, message: 'Token manquant' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    // Extraire le tenant_id depuis les headers ou utiliser le tenant par défaut
    const defaultTenant = '1574b85d-a3df-400f-9e82-98831aa32934';
    const tenantId =
      request.headers.get('x-tenant-id') ||
      (request as any).cookies?.get?.('x-tenant-id')?.value ||
      defaultTenant;

    const response = await fetchWithTimeout(
      `${AUTH_SERVICE_URL}/auth/validate`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Tenant-ID': tenantId,
        },
      },
      TIMEOUT_MS,
      "Timeout: Le service d'authentification ne répond pas",
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { valid: false, message: data.message || data.detail || 'Token invalide' },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error in validate proxy:', error);
    const message = error instanceof Error ? error.message : 'Erreur de connexion au service d\'authentification';
    return NextResponse.json(
      { valid: false, message },
      { status: 500 }
    );
  }
}

