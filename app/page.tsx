'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Store } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { USER_ROLES } from '@/lib/constants';
import { apiFetch } from '@/lib/api-client';
import { ProductCard } from '@/components/products/ProductCard';
import { SkeletonCard } from '@/components/ui/Skeleton';
import type { Product } from '@/lib/types';
import type { ShopPreview } from '@/app/api/shops/route';
import { cn } from '@/lib/utils';

const FEATURED_COUNT = 8;

function isDashboardRole(role: string | undefined): boolean {
  return (
    role === USER_ROLES.PLATFORM_ADMIN ||
    role === USER_ROLES.MERCHANT_OWNER ||
    role === USER_ROLES.MERCHANT_STAFF
  );
}

function normalizeProductList(data: unknown): Product[] {
  const d = data as Product[] | { data?: Product[]; items?: Product[] };
  if (Array.isArray(d)) return d;
  return d?.data ?? d?.items ?? [];
}

const linkBase = cn(
  'inline-flex items-center justify-center rounded-lg border font-medium transition-colors',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2'
);

export default function HomePage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // Products for connected customers
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productError, setProductError] = useState<string | null>(null);

  // Shops for guests
  const [shops, setShops] = useState<ShopPreview[]>([]);
  const [loadingShops, setLoadingShops] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (isDashboardRole(user?.role)) {
      router.replace('/dashboard');
    }
  }, [authLoading, user?.role, router]);

  // Fetch products (for customers)
  useEffect(() => {
    if (authLoading) return;
    if (isDashboardRole(user?.role)) return;
    if (user?.role !== USER_ROLES.CUSTOMER) return;

    let cancelled = false;
    setLoadingProducts(true);
    setProductError(null);

    (async () => {
      try {
        const res = await apiFetch('/api/products/all', { skipErrorToast: true });
        if (!res.ok) {
          if (!cancelled) setProductError('Impossible de charger les produits.');
          return;
        }
        const data = await res.json();
        const list = normalizeProductList(data).slice(0, FEATURED_COUNT);
        if (!cancelled) setProducts(list);
      } catch {
        if (!cancelled) setProductError('Impossible de charger les produits.');
      } finally {
        if (!cancelled) setLoadingProducts(false);
      }
    })();

    return () => { cancelled = true; };
  }, [authLoading, user?.role]);

  // Fetch shops (for guests / non-connected)
  useEffect(() => {
    if (authLoading) return;
    if (isDashboardRole(user?.role)) return;
    if (user?.role === USER_ROLES.CUSTOMER) return;

    let cancelled = false;
    setLoadingShops(true);

    (async () => {
      try {
        const res = await apiFetch('/api/shops', { skipErrorToast: true });
        if (res.ok) {
          const data = await res.json() as { shops: ShopPreview[] };
          if (!cancelled) setShops(data.shops ?? []);
        }
      } catch {
        // silent — page still usable without shops
      } finally {
        if (!cancelled) setLoadingShops(false);
      }
    })();

    return () => { cancelled = true; };
  }, [authLoading, user?.role]);

  if (authLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-10">
        <div className="space-y-4">
          <div className="h-10 w-2/3 max-w-md rounded-md bg-[var(--neutral-200)] animate-pulse" />
          <div className="h-6 w-full max-w-lg rounded-md bg-[var(--neutral-200)] animate-pulse" />
          <div className="h-12 w-48 rounded-md bg-[var(--neutral-200)] animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (isDashboardRole(user?.role)) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 flex justify-center">
        <p className="text-sm text-[var(--neutral-500)]">Redirection…</p>
      </div>
    );
  }

  const isCustomer = user?.role === USER_ROLES.CUSTOMER;
  const isGuest = !user;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-14">
      {/* ── Hero ── */}
      <section className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-background)] px-6 py-12 sm:px-10 sm:py-16 text-center sm:text-left">
        <h1 className="text-3xl sm:text-4xl font-bold text-[var(--foreground)] tracking-tight">
          {isCustomer
            ? `Bon retour${user?.full_name ? `, ${user.full_name.split(/\s+/)[0]}` : ''} !`
            : 'Bienvenue sur DevOps Shop'}
        </h1>
        <p className="mt-4 text-lg text-[var(--neutral-600)] max-w-xl mx-auto sm:mx-0">
          {isCustomer
            ? 'Découvrez nos produits et suivez vos commandes depuis votre espace.'
            : 'La marketplace multi-tenant pour découvrir des produits de qualité et gérer votre commerce en ligne.'}
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center sm:justify-start">
          <Link
            href="/products"
            className={cn(linkBase, 'h-12 px-6 text-base gap-2.5', 'bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)] border-transparent')}
          >
            Parcourir les produits
          </Link>
          {isCustomer ? (
            <Link
              href="/orders"
              className={cn(linkBase, 'h-12 px-6 text-base gap-2.5', 'bg-transparent text-[var(--foreground)] border-[var(--border-color)] hover:bg-[var(--neutral-100)]')}
            >
              Mes commandes
            </Link>
          ) : (
            <Link
              href="/register"
              className={cn(linkBase, 'h-12 px-6 text-base gap-2.5', 'bg-transparent text-[var(--foreground)] border-[var(--border-color)] hover:bg-[var(--neutral-100)]')}
            >
              S&apos;inscrire
            </Link>
          )}
        </div>
      </section>

      {/* ── Boutiques partenaires (invités uniquement) ── */}
      {isGuest && (
        <section aria-labelledby="shops-heading">
          <div className="flex items-center justify-between mb-6">
            <h2 id="shops-heading" className="text-xl font-semibold text-[var(--foreground)]">
              Nos boutiques partenaires
            </h2>
            <Link
              href="/products"
              className="text-sm text-[var(--primary)] hover:underline font-medium"
            >
              Voir tout →
            </Link>
          </div>

          {loadingShops ? (
            <div className="space-y-10">
              {Array.from({ length: 2 }).map((_, si) => (
                <div key={si} className="space-y-4">
                  <div className="h-6 w-40 rounded-md bg-[var(--neutral-200)] animate-pulse" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
                  </div>
                </div>
              ))}
            </div>
          ) : shops.length === 0 ? (
            <p className="text-sm text-[var(--neutral-500)]">Aucune boutique disponible pour le moment.</p>
          ) : (
            <div className="space-y-12">
              {shops.map((shop) => (
                <div key={shop.tenant_id}>
                  <div className="flex items-start justify-between mb-4 gap-4">
                    <div className="flex items-start gap-2 min-w-0">
                      <Store size={18} className="text-[var(--primary)] mt-0.5 shrink-0" aria-hidden="true" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-semibold text-[var(--foreground)]">
                            {shop.name}
                          </h3>
                          <span className="text-xs text-[var(--neutral-500)]">
                            {shop.product_count} produit{shop.product_count > 1 ? 's' : ''}
                          </span>
                        </div>
                        {shop.description && (
                          <p className="text-sm text-[var(--neutral-500)] mt-0.5 line-clamp-1">
                            {shop.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <Link
                      href={`/products?tenant=${shop.tenant_id}&shop=${encodeURIComponent(shop.name)}`}
                      className="text-sm text-[var(--primary)] hover:underline font-medium shrink-0"
                    >
                      Voir la boutique →
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {shop.products.map((p, index) => (
                      <ProductCard key={p.id} product={p} imagePriority={index === 0 && shop === shops[0]} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── Produits populaires (clients connectés) ── */}
      {isCustomer && (
        <section aria-labelledby="featured-heading">
          <h2 id="featured-heading" className="text-xl font-semibold text-[var(--foreground)] mb-6">
            Produits populaires
          </h2>
          {loadingProducts ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : productError ? (
            <p className="text-sm text-[var(--error)]" role="alert">
              {productError}
            </p>
          ) : products.length === 0 ? (
            <p className="text-sm text-[var(--neutral-500)]">Aucun produit pour le moment.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((p, index) => (
                <ProductCard key={p.id} product={p} imagePriority={index === 0} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── CTA marchand (invités uniquement) ── */}
      {isGuest && (
        <section
          className="rounded-2xl bg-[var(--primary-light)] border border-[var(--primary)]/20 px-6 py-8 text-center"
          aria-labelledby="merchant-cta"
        >
          <h2 id="merchant-cta" className="text-lg font-semibold text-[var(--foreground)]">
            Vous êtes marchand ?
          </h2>
          <p className="mt-2 text-sm text-[var(--neutral-600)] max-w-md mx-auto">
            Créez votre compte pour ouvrir votre boutique et vendre sur la plateforme.
          </p>
          <div className="mt-4">
            <Link
              href="/register"
              className={cn(linkBase, 'h-10 px-4 text-sm gap-2', 'bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:bg-[var(--secondary-hover)] border-transparent')}
            >
              Créer un compte marchand
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
