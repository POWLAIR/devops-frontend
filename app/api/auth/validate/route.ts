import { NextResponse } from 'next/server';

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

    const response = await fetch(`${AUTH_SERVICE_URL}/validate`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { valid: false, message: data.message || 'Token invalide' },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error in validate proxy:', error);
    return NextResponse.json(
      { valid: false, message: 'Erreur de connexion au service d\'authentification' },
      { status: 500 }
    );
  }
}

