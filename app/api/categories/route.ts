import { NextRequest, NextResponse } from 'next/server';

// Fonction simple pour décoder le JWT
function decodeJWT(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      Buffer.from(base64, 'base64')
        .toString()
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Pour les categories, on agrège toutes les catégories de tous les tenants
    // (les customers voient toutes les catégories, les merchants voient leurs catégories)
    const authHeader = request.headers.get('authorization');
    let isCustomer = false;
    const defaultTenant = '1574b85d-a3df-400f-9e82-98831aa32934';
    let tenantId =
      request.headers.get('x-tenant-id') ||
      request.cookies.get('x-tenant-id')?.value ||
      undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = decodeJWT(token);
      
      if (decoded && decoded.role === 'customer') {
        isCustomer = true;
      } else if (decoded && decoded.tenant_id) {
        tenantId = decoded.tenant_id;
      }
    }

    let url: string;
    const headers: Record<string, string> = {};
    
    if (isCustomer) {
      // Customer : endpoint marketplace (toutes les catégories)
      url = `${process.env.PRODUCT_SERVICE_URL}/categories/all`;
    } else {
      // Merchant : endpoint normal avec tenant ID
      if (!tenantId) {
        tenantId = defaultTenant;
      }
      url = `${process.env.PRODUCT_SERVICE_URL}/categories`;
      headers['X-Tenant-ID'] = tenantId;
    }
    
    const response = await fetch(url, { headers });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch categories' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

