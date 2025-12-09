import { NextRequest, NextResponse } from 'next/server';

const NOTIFICATION_SERVICE_URL =
  process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:8002';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization');

    if (!token) {
      return NextResponse.json(
        { error: 'Token manquant' },
        { status: 401 }
      );
    }

    const response = await fetch(
      `${NOTIFICATION_SERVICE_URL}/api/v1/notifications/unread-count`,
      {
        method: 'GET',
        headers: {
          Authorization: token,
          'Content-Type': 'application/json',
        },
      }
    );

    // Si le service n'est pas disponible, retourner 0
    if (!response.ok) {
      return NextResponse.json({ count: 0 });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching unread count:', error);
    // En cas d'erreur, retourner 0 pour ne pas bloquer l'UI
    return NextResponse.json({ count: 0 });
  }
}

