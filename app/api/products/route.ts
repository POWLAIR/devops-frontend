import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const category = searchParams.get('category');
  const search = searchParams.get('search');
  const popular = searchParams.get('popular');
  const recent = searchParams.get('recent');

  try {
    let url = `${process.env.PRODUCT_SERVICE_URL}/products`;

    if (search) {
      url = `${process.env.PRODUCT_SERVICE_URL}/products/search?q=${search}`;
    } else if (category) {
      url = `${process.env.PRODUCT_SERVICE_URL}/products/category/${category}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch products' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

