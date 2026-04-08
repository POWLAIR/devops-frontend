'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Heart, Home, ChevronRight } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProductCard } from '@/components/products/ProductCard';
import { useToast } from '@/lib/toast-context';
import { apiFetch, ApiUnauthorizedError } from '@/lib/api-client';
import type { Product } from '@/lib/types';

function normalizeProduct(raw: Record<string, unknown>): Product {
  return {
    ...(raw as unknown as Product),
    image_url: (raw.imageUrl as string | undefined) ?? (raw.image_url as string | undefined),
    average_rating: parseFloat(String(raw.rating ?? raw.average_rating ?? 0)) || 0,
    review_count: parseInt(String(raw.reviewCount ?? raw.review_count ?? 0), 10) || 0,
    tenant_id: (raw.tenantId as string | undefined) ?? (raw.tenant_id as string | undefined),
    is_active: (raw.isActive as boolean | undefined) ?? (raw.is_active as boolean | undefined),
    price: parseFloat(String(raw.price ?? 0)),
    stock: parseInt(String(raw.stock ?? 0), 10),
    category: raw.category as string | undefined,
  };
}

async function fetchFavoritesList(): Promise<Product[]> {
  const res = await apiFetch('/api/favorites');
  if (!res.ok) {
    const data = (await res.json()) as { message?: string; detail?: string };
    throw new Error(data.message ?? data.detail ?? 'Impossible de charger les favoris.');
  }
  const body = (await res.json()) as
    | Record<string, unknown>[]
    | { favorites?: Record<string, unknown>[] };
  const raw = Array.isArray(body) ? body : (body.favorites ?? []);
  return raw.map(normalizeProduct);
}

function FavoritesContent() {
  const { addToast } = useToast();
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchFavorites = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const list = await fetchFavoritesList();
      setFavorites(list);
    } catch (e) {
      if (e instanceof ApiUnauthorizedError) {
        setFavorites([]);
        return;
      }
      setLoadError(e instanceof Error ? e.message : 'Impossible de charger les favoris.');
      setFavorites([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchFavorites();
  }, [fetchFavorites]);

  const displayError = loadError;

  const [removing, setRemoving] = useState<Set<string>>(new Set());

  const handleRemove = async (productId: string) => {
    const snapshot = favorites;
    setFavorites((prev) => prev.filter((p) => p.id !== productId));
    setRemoving((prev) => new Set(prev).add(productId));
    try {
      const res = await apiFetch(`/api/favorites/${productId}`, { method: 'DELETE' });
      if (!res.ok) {
        setFavorites(snapshot);
        addToast('Impossible de retirer le favori.', 'error');
        return;
      }
    } catch (e) {
      if (!(e instanceof ApiUnauthorizedError)) {
        setFavorites(snapshot);
        addToast('Impossible de retirer le favori.', 'error');
      }
    } finally {
      setRemoving((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav
          aria-label="Fil d'Ariane"
          className="flex items-center gap-1.5 text-sm text-[var(--neutral-500)] mb-6"
        >
          <Link
            href="/"
            className="hover:text-[var(--foreground)] transition-colors flex items-center gap-1"
          >
            <Home size={14} />
            Accueil
          </Link>
          <ChevronRight size={14} />
          <span className="text-[var(--foreground)] font-medium">Mes favoris</span>
        </nav>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">Mes favoris</h1>
            {!isLoading && (
              <p className="text-sm text-[var(--neutral-500)] mt-1">
                {favorites.length} produit{favorites.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>

        {/* Error */}
        {displayError && (
          <div
            role="alert"
            aria-live="polite"
            className="mb-6 px-4 py-3 rounded-xl bg-[var(--error-light)] text-[var(--error)] text-sm"
          >
            {displayError}
          </div>
        )}

        {/* Loading skeleton */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        ) : favorites.length === 0 ? (
          <EmptyState
            icon={<Heart size={28} />}
            title="Aucun favori"
            description="Vous n'avez pas encore ajouté de produit en favori."
            action={
              <Link
                href="/products"
                className={cn(
                  'inline-flex items-center justify-center rounded-lg border font-medium transition-colors',
                  'h-8 px-3 text-xs gap-1.5',
                  'bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)] border-transparent'
                )}
              >
                Découvrir les produits
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {favorites.map((product) => (
              <div key={product.id} className="relative">
                <ProductCard product={product} />
                <button
                  type="button"
                  aria-label={`Retirer ${product.name} des favoris`}
                  disabled={removing.has(product.id)}
                  onClick={() => handleRemove(product.id)}
                  className={
                    'absolute top-2 right-2 z-10 flex items-center justify-center w-8 h-8 rounded-full ' +
                    'bg-white/90 backdrop-blur-sm shadow-sm border border-[var(--border-color)] ' +
                    'text-[var(--error)] hover:bg-[var(--error)] hover:text-white hover:border-[var(--error)] ' +
                    'transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed'
                  }
                >
                  <Heart size={15} className="fill-current" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function FavoritesPage() {
  return (
    <ProtectedRoute>
      <FavoritesContent />
    </ProtectedRoute>
  );
}
