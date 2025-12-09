import { NextResponse } from 'next/server';
import { fetchWithTimeout, TIMEOUT_MS } from '@/lib/fetch-with-timeout';

const NOTIFICATION_SERVICE_URL =
  process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:6000';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization') || undefined;
    const body = await request.json();

    if (!body?.phone_number || !body?.message) {
      return NextResponse.json(
        { message: 'phone_number et message sont requis' },
        { status: 400 },
      );
    }

    const response = await fetchWithTimeout(
      `${NOTIFICATION_SERVICE_URL}/notifications/sms`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        body: JSON.stringify({
          phone_number: body.phone_number,
          message: body.message,
        }),
      },
      TIMEOUT_MS,
      'Timeout lors de la connexion au service de notifications',
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          message:
            data?.message ||
            data?.detail ||
            'Erreur lors de l’envoi de la notification SMS',
        },
        { status: response.status },
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Erreur de connexion au service de notifications';

    return NextResponse.json({ message }, { status: 500 });
  }
}

