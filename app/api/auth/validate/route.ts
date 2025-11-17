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

    const response = await fetchWithTimeout(`${AUTH_SERVICE_URL}/auth/validate`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

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

