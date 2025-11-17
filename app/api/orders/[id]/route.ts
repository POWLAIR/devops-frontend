import { NextResponse } from 'next/server';

const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:3000';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Non authentifié' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const { id } = await params;

    const response = await fetch(`${ORDER_SERVICE_URL}/orders/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Erreur lors de la récupération de la commande' },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error in order GET proxy:', error);
    return NextResponse.json(
      { message: 'Erreur de connexion au service de commandes' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Non authentifié' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const { id } = await params;
    const body = await request.json();

    const response = await fetch(`${ORDER_SERVICE_URL}/orders/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Erreur lors de la mise à jour de la commande' },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error in order PUT proxy:', error);
    return NextResponse.json(
      { message: 'Erreur de connexion au service de commandes' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Non authentifié' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const { id } = await params;

    const response = await fetch(`${ORDER_SERVICE_URL}/orders/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const data = await response.json();
      return NextResponse.json(
        { message: data.message || 'Erreur lors de la suppression de la commande' },
        { status: response.status }
      );
    }

    return NextResponse.json({ message: 'Commande supprimée' }, { status: 200 });
  } catch (error) {
    console.error('Error in order DELETE proxy:', error);
    return NextResponse.json(
      { message: 'Erreur de connexion au service de commandes' },
      { status: 500 }
    );
  }
}

