import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = request.headers.get("authorization");

  if (!token) {
    return NextResponse.json({ isFavorite: false }, { status: 200 });
  }

  try {
    const { id } = await params;
    // Extraire le tenant_id depuis les headers ou cookies ou utiliser le tenant par défaut
    const defaultTenant = "1574b85d-a3df-400f-9e82-98831aa32934";
    const tenantId =
      request.headers.get("x-tenant-id") ||
      request.cookies.get("x-tenant-id")?.value ||
      defaultTenant;

    const response = await fetch(
      `${process.env.PRODUCT_SERVICE_URL}/products/${id}/is-favorite`,
      {
        headers: {
          Authorization: token,
          "X-Tenant-ID": tenantId,
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json({ isFavorite: false }, { status: 200 });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error checking favorite status:", error);
    return NextResponse.json({ isFavorite: false }, { status: 200 });
  }
}
