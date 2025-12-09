import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { fetchWithTimeout, TIMEOUT_MS } from '@/lib/fetch-with-timeout';

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:8000';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Extraire le tenant_id depuis les cookies ou headers
    const cookieStore = await cookies();
    const tenantFromCookie = cookieStore.get('x-tenant-id')?.value;
    const tenantFromHeader = request.headers.get('x-tenant-id');
    
    // Default tenant si aucun n'est spécifié
    const defaultTenant = '1574b85d-a3df-400f-9e82-98831aa32934';
    const tenantId = tenantFromHeader || tenantFromCookie || defaultTenant;
    
    console.log('[LOGIN API] Tenant ID from cookie:', tenantFromCookie);
    console.log('[LOGIN API] Tenant ID from header:', tenantFromHeader);
    console.log('[LOGIN API] Final Tenant ID used:', tenantId);
    console.log('[LOGIN API] Login attempt for email:', body.email);

    const response = await fetchWithTimeout(
      `${AUTH_SERVICE_URL}/auth/login`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId,
        },
        body: JSON.stringify(body),
      },
      TIMEOUT_MS,
      "Timeout: Le service d'authentification ne répond pas",
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('[LOGIN API] Auth service error:', data);
      return NextResponse.json(
        { message: data.message || data.detail || 'Erreur lors de la connexion' },
        { status: response.status }
      );
    }

    console.log('[LOGIN API] Login successful for:', body.email);
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[LOGIN API] Error in login proxy:', error);
    const message = error instanceof Error ? error.message : 'Erreur de connexion au service d\'authentification';
    return NextResponse.json(
      { message },
      { status: 500 }
    );
  }
}

