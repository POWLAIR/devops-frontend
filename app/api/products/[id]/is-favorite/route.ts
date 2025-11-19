import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = request.headers.get('authorization');

  if (!token) {
    return NextResponse.json(
      { isFavorite: false },
      { status: 200 }
    );
  }

  try {
    const { id } = await params;

    const response = await fetch(
      `${process.env.PRODUCT_SERVICE_URL}/products/${id}/is-favorite`,
      {
        headers: {
          'Authorization': token,
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { isFavorite: false },
        { status: 200 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error checking favorite status:', error);
    return NextResponse.json(
      { isFavorite: false },
      { status: 200 }
    );
  }
}

