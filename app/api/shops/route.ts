import { NextResponse } from 'next/server';
import { PRODUCT_SERVICE_URL, AUTH_SERVICE_URL } from '@/lib/constants';
import type { Product } from '@/lib/types';

const MAX_SHOPS = 4;
const MAX_PRODUCTS_PER_SHOP = 4;

interface TenantPublic {
  id: string;
  name?: string | null;
  slug?: string | null;
  description?: string | null;
}

function normalizeProductList(data: unknown): Product[] {
  const d = data as Product[] | { data?: Product[]; items?: Product[] };
  if (Array.isArray(d)) return d;
  return d?.data ?? d?.items ?? [];
}

export interface ShopPreview {
  tenant_id: string;
  name: string;
  slug?: string | null;
  description?: string | null;
  product_count: number;
  products: Product[];
}

export async function GET() {
  try {
    // Fetch products and public tenant info in parallel
    const [productsRes, tenantsRes] = await Promise.all([
      fetch(`${PRODUCT_SERVICE_URL}/products/all`, {
        headers: { 'Content-Type': 'application/json' },
        next: { revalidate: 60 },
      }),
      fetch(`${AUTH_SERVICE_URL}/tenants/public`, {
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      }),
    ]);

    if (!productsRes.ok) {
      return NextResponse.json({ shops: [] }, { status: 200 });
    }

    const productsData: unknown = await productsRes.json();
    const products = normalizeProductList(productsData);

    // Build tenant name lookup (fall back gracefully if endpoint fails)
    const tenantMap = new Map<string, TenantPublic>();
    if (tenantsRes.ok) {
      const tenantsData: unknown = await tenantsRes.json();
      if (Array.isArray(tenantsData)) {
        for (const t of tenantsData as TenantPublic[]) {
          if (t.id) tenantMap.set(t.id, t);
        }
      }
    }

    const grouped = new Map<string, Product[]>();
    for (const product of products) {
      const tenantId = (product as Product & { tenantId?: string }).tenantId ?? product.tenant_id;
      if (!tenantId) continue;
      if (!grouped.has(tenantId)) grouped.set(tenantId, []);
      grouped.get(tenantId)!.push(product);
    }

    let idx = 1;
    const shops: ShopPreview[] = Array.from(grouped.entries())
      .slice(0, MAX_SHOPS)
      .map(([tenant_id, shopProducts]) => {
        const tenant = tenantMap.get(tenant_id);
        const name = tenant?.name ?? tenant?.slug ?? `Boutique ${idx++}`;
        return {
          tenant_id,
          name,
          slug: tenant?.slug ?? null,
          description: tenant?.description ?? null,
          product_count: shopProducts.length,
          products: shopProducts.slice(0, MAX_PRODUCTS_PER_SHOP),
        };
      });

    return NextResponse.json({ shops });
  } catch {
    return NextResponse.json({ shops: [] }, { status: 200 });
  }
}
