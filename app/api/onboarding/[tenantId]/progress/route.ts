import { NextRequest, NextResponse } from 'next/server';

const TENANT_SERVICE_URL =
  process.env.TENANT_SERVICE_URL || 'http://localhost:8004';

export async function GET(
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

    const { tenantId } = await params;

    const response = await fetch(
      `${TENANT_SERVICE_URL}/api/v1/onboarding/${tenantId}/progress`,
      {
        method: 'GET',
        headers: {
          Authorization: token,
          'Content-Type': 'application/json',
        },
      }
    );

    // Si le service n'est pas disponible, retourner un état par défaut
    if (!response.ok) {
      return NextResponse.json({
        currentStep: 1,
        completedSteps: [],
        isComplete: false,
      });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching onboarding progress:', error);
    // Retourner un état par défaut en cas d'erreur
    return NextResponse.json({
      currentStep: 1,
      completedSteps: [],
      isComplete: false,
    });
  }
}

