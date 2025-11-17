import { NextResponse } from 'next/server';

const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:3000';
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
      throw new Error('Timeout: Le service de commandes ne répond pas');
    }
    throw error;
  }
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Non authentifié' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    const response = await fetchWithTimeout(`${ORDER_SERVICE_URL}/orders`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || data.detail || 'Erreur lors de la récupération des commandes' },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error in orders GET proxy:', error);
    const message = error instanceof Error ? error.message : 'Erreur de connexion au service de commandes';
    return NextResponse.json(
      { message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Non authentifié' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const body = await request.json();

    const response = await fetchWithTimeout(`${ORDER_SERVICE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || data.detail || 'Erreur lors de la création de la commande' },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error in orders POST proxy:', error);
    const message = error instanceof Error ? error.message : 'Erreur de connexion au service de commandes';
    return NextResponse.json(
      { message },
      { status: 500 }
    );
  }
}

