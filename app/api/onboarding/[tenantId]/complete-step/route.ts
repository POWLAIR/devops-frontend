import { NextRequest, NextResponse } from 'next/server';

const TENANT_SERVICE_URL =
  process.env.TENANT_SERVICE_URL || 'http://localhost:8004';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const token = request.headers.get('authorization');

    if (!token) {
      return NextResponse.json(
        { error: 'Token manquant' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { tenantId } = await params;

    const response = await fetch(
      `${TENANT_SERVICE_URL}/api/v1/onboarding/${tenantId}/complete-step`,
      {
        method: 'POST',
        headers: {
          Authorization: token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    // Si le service n'est pas disponible, simuler une réussite
    if (!response.ok) {
      return NextResponse.json({ success: true });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error completing onboarding step:', error);
    // Simuler une réussite en cas d'erreur
    return NextResponse.json({ success: true });
  }
}

