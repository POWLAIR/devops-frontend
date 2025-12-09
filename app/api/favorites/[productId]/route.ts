import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const token = request.headers.get('authorization');

  if (!token) {
    return NextResponse.json(
      { message: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { productId } = await params;
    // Extraire le tenant_id depuis les headers ou cookies ou utiliser le tenant par défaut
    const defaultTenant = '1574b85d-a3df-400f-9e82-98831aa32934';
    const tenantId =
      request.headers.get('x-tenant-id') ||
      request.cookies.get('x-tenant-id')?.value ||
      defaultTenant;

    const response = await fetch(
      `${process.env.PRODUCT_SERVICE_URL}/products/${productId}/favorite`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': token,
          'X-Tenant-ID': tenantId,
        },
      }
    );

    if (!response.ok) {
      const data = await response.json();
      return NextResponse.json(
        { message: data.message || 'Failed to remove favorite' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error removing favorite:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

