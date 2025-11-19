import { NextResponse } from 'next/server';

const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:4000';
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
      throw new Error('Timeout: Le service de produits ne répond pas');
    }
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const response = await fetchWithTimeout(`${PRODUCT_SERVICE_URL}/products/validate-batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Erreur lors de la validation des produits' },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error in products/validate-batch proxy:', error);
    const message = error instanceof Error ? error.message : 'Erreur de connexion au service de produits';
    return NextResponse.json(
      { message },
      { status: 500 }
    );
  }
}

