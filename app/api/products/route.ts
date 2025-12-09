import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const category = searchParams.get('category');
  const search = searchParams.get('search');
  const popular = searchParams.get('popular');
  const recent = searchParams.get('recent');

  try {
    // Fonction simple pour décoder le JWT (sans vérification de signature pour le frontend)
    const decodeJWT = (token: string): any => {
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
    };

    // Vérifier si l'utilisateur est authentifié et son rôle
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
        // Customer : utiliser l'endpoint marketplace pour voir tous les produits
        isCustomer = true;
      } else if (decoded && decoded.tenant_id) {
        // Merchant : utiliser son tenant ID
        tenantId = decoded.tenant_id;
      }
    }

    // Si pas de tenant ID et pas customer, utiliser le tenant par défaut
    if (!tenantId && !isCustomer) {
      tenantId = defaultTenant;
    }
    
    let url: string;
    
    if (isCustomer) {
      // Customer : endpoint marketplace (tous les produits)
      if (search) {
        // Utiliser l'endpoint de recherche marketplace
        url = `${process.env.PRODUCT_SERVICE_URL}/products/all/search?q=${encodeURIComponent(search)}`;
      } else {
        // Utiliser l'endpoint marketplace avec filtres
        url = `${process.env.PRODUCT_SERVICE_URL}/products/all`;
        const params = new URLSearchParams();
        if (category) {
          params.append('category', category);
        }
        if (params.toString()) {
          url += `?${params.toString()}`;
        }
      }
    } else {
      // Merchant : endpoint normal avec tenant ID
      if (search) {
        url = `${process.env.PRODUCT_SERVICE_URL}/products/search?q=${search}`;
      } else if (category) {
        url = `${process.env.PRODUCT_SERVICE_URL}/products/category/${category}`;
      } else {
        url = `${process.env.PRODUCT_SERVICE_URL}/products`;
      }
    }

    const headers: Record<string, string> = {};
    
    // Ajouter le tenant ID seulement si ce n'est pas un customer
    if (!isCustomer && tenantId) {
      headers['X-Tenant-ID'] = tenantId;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch products' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Convertir les valeurs decimal de PostgreSQL (strings) en nombres
    const normalizedData = Array.isArray(data)
      ? data.map((product: any) => ({
          ...product,
          price: typeof product.price === 'string' ? parseFloat(product.price) : product.price,
          rating: typeof product.rating === 'string' ? parseFloat(product.rating) : product.rating,
        }))
      : {
          ...data,
          price: typeof data.price === 'string' ? parseFloat(data.price) : data.price,
          rating: typeof data.rating === 'string' ? parseFloat(data.rating) : data.rating,
        };
    
    return NextResponse.json(normalizedData);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

