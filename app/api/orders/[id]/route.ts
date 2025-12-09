import { NextRequest, NextResponse } from 'next/server';
import { fetchWithTimeout, TIMEOUT_MS } from '@/lib/fetch-with-timeout';

const ORDER_SERVICE_URL =
  process.env.ORDER_SERVICE_URL || 'http://localhost:3000';

// Transformer les données du backend (productId) vers le frontend (name)
function transformOrderFromBackend(order: any) {
  if (!order) return order;
  
  // Si items est une string JSON, la parser
  let items = order.items;
  if (typeof items === 'string') {
    try {
      items = JSON.parse(items);
    } catch {
      items = [];
    }
  }
  
  // Transformer productId en name
  const transformedItems = Array.isArray(items) ? items.map((item: any, index: number) => ({
    id: item.id || `item-${index}`,
    name: item.productId || item.name || '',
    quantity: item.quantity || 0,
    price: item.price || 0,
  })) : [];
  
  return {
    ...order,
    items: transformedItems,
  };
}

export async function GET(
  request: NextRequest,
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
    // Extraire le tenant_id depuis les headers ou cookies ou utiliser le tenant par défaut
    const defaultTenant = '1574b85d-a3df-400f-9e82-98831aa32934';
    const tenantId =
      request.headers.get('x-tenant-id') ||
      request.cookies.get('x-tenant-id')?.value ||
      defaultTenant;

    const response = await fetchWithTimeout(
      `${ORDER_SERVICE_URL}/orders/${id}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId,
        },
      },
      TIMEOUT_MS,
      'Timeout: Le service de commandes ne répond pas',
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || data.detail || 'Erreur lors de la récupération de la commande' },
        { status: response.status }
      );
    }

    // Transformer les données du backend vers le format frontend
    const transformedData = transformOrderFromBackend(data);

    return NextResponse.json(transformedData, { status: response.status });
  } catch (error) {
    console.error('Error in order GET proxy:', error);
    const message = error instanceof Error ? error.message : 'Erreur de connexion au service de commandes';
    return NextResponse.json(
      { message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
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
    // Extraire le tenant_id depuis les headers ou utiliser le tenant par défaut
    const tenantId = request.headers.get('x-tenant-id') || '1574b85d-a3df-400f-9e82-98831aa32934';

    const response = await fetchWithTimeout(
      `${ORDER_SERVICE_URL}/orders/${id}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId,
        },
        body: JSON.stringify(body),
      },
      TIMEOUT_MS,
      'Timeout: Le service de commandes ne répond pas',
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || data.detail || 'Erreur lors de la mise à jour de la commande' },
        { status: response.status }
      );
    }

    // Transformer les données du backend vers le format frontend
    const transformedData = transformOrderFromBackend(data);

    return NextResponse.json(transformedData, { status: response.status });
  } catch (error) {
    console.error('Error in order PUT proxy:', error);
    const message = error instanceof Error ? error.message : 'Erreur de connexion au service de commandes';
    return NextResponse.json(
      { message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
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
    // Extraire le tenant_id depuis les headers ou utiliser le tenant par défaut
    const tenantId = request.headers.get('x-tenant-id') || '1574b85d-a3df-400f-9e82-98831aa32934';

    const response = await fetchWithTimeout(
      `${ORDER_SERVICE_URL}/orders/${id}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId,
        },
      },
      TIMEOUT_MS,
      'Timeout: Le service de commandes ne répond pas',
    );

    if (!response.ok) {
      const data = await response.json();
      return NextResponse.json(
        { message: data.message || data.detail || 'Erreur lors de la suppression de la commande' },
        { status: response.status }
      );
    }

    return NextResponse.json({ message: 'Commande supprimée' }, { status: 200 });
  } catch (error) {
    console.error('Error in order DELETE proxy:', error);
    const message = error instanceof Error ? error.message : 'Erreur de connexion au service de commandes';
    return NextResponse.json(
      { message },
      { status: 500 }
    );
  }
}

