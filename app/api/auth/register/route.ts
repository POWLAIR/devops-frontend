import { NextResponse } from 'next/server';

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:8000';
const TIMEOUT_MS = 10000; // 10 secondes

async function fetchWithTimeout(url: string, options: RequestInit, timeout: number = TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Timeout: Le service d\'authentification ne répond pas');
    }
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Extraire le tenant_id depuis les headers ou utiliser "default"
    const tenantId = request.headers.get('x-tenant-id') || 'default';

    const response = await fetchWithTimeout(`${AUTH_SERVICE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': tenantId,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || data.detail || 'Erreur lors de l\'inscription' },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error in register proxy:', error);
    const message = error instanceof Error ? error.message : 'Erreur de connexion au service d\'authentification';
    return NextResponse.json(
      { message },
      { status: 500 }
    );
  }
}

