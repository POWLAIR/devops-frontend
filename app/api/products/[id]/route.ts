import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Extraire le tenant_id depuis les headers/cookies ou utiliser le tenant par défaut
    const defaultTenant = "1574b85d-a3df-400f-9e82-98831aa32934";
    const tenantId =
      request.headers.get("x-tenant-id") ||
      request.cookies.get("x-tenant-id")?.value ||
      defaultTenant;

    const response = await fetch(
      `${process.env.PRODUCT_SERVICE_URL}/products/${id}`,
      {
        headers: {
          "X-Tenant-ID": tenantId,
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Convertir les valeurs decimal de PostgreSQL (strings) en nombres
    const normalizedData = {
      ...data,
      price:
        typeof data.price === "string" ? parseFloat(data.price) : data.price,
      rating:
        typeof data.rating === "string" ? parseFloat(data.rating) : data.rating,
    };

    return NextResponse.json(normalizedData);
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
