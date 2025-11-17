import { NextResponse } from 'next/server';

const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:3000';

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

    const response = await fetch(`${ORDER_SERVICE_URL}/orders`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Erreur lors de la récupération des commandes' },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error in orders GET proxy:', error);
    return NextResponse.json(
      { message: 'Erreur de connexion au service de commandes' },
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

    const response = await fetch(`${ORDER_SERVICE_URL}/orders`, {
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
        { message: data.message || 'Erreur lors de la création de la commande' },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error in orders POST proxy:', error);
    return NextResponse.json(
      { message: 'Erreur de connexion au service de commandes' },
      { status: 500 }
    );
  }
}

