import { NextResponse } from 'next/server';

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:8000';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const response = await fetch(`${AUTH_SERVICE_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Erreur lors de l\'inscription' },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error in register proxy:', error);
    return NextResponse.json(
      { message: 'Erreur de connexion au service d\'authentification' },
      { status: 500 }
    );
  }
}

