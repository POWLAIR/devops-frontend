'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, Home, ChevronRight } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProductCard } from '@/components/products/ProductCard';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';
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

function FavoritesContent() {
  const router = useRouter();
  const { logout } = useAuth();
  const { addToast } = useToast();

  const [favorites, setFavorites] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<Set<string>>(new Set());

  const fetchFavorites = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/favorites');
      if (res.status === 401) {
        await logout();
        router.replace('/login?redirect=/favorites');
        return;
      }
      if (!res.ok) {
        const data = (await res.json()) as { message?: string; detail?: string };
        setError(data.message ?? data.detail ?? 'Impossible de charger les favoris.');
        return;
      }
      const data = (await res.json()) as
        | Record<string, unknown>[]
        | { favorites?: Record<string, unknown>[] };
      const raw = Array.isArray(data) ? data : (data.favorites ?? []);
      setFavorites(raw.map(normalizeProduct));
    } catch {
      setError('Erreur réseau. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  }, [logout, router]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const handleRemove = async (productId: string) => {
    const previous = favorites;
    // Optimistic update
    setFavorites((prev) => prev.filter((p) => p.id !== productId));
    setRemoving((prev) => new Set(prev).add(productId));
    try {
      const res = await fetch(`/api/favorites/${productId}`, { method: 'DELETE' });
      if (!res.ok) {
        setFavorites(previous);
        addToast('Impossible de retirer le favori.', 'error');
      }
    } catch {
      setFavorites(previous);
      addToast('Impossible de retirer le favori.', 'error');
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
        {error && (
          <div
            role="alert"
            aria-live="polite"
            className="mb-6 px-4 py-3 rounded-xl bg-[var(--error-light)] text-[var(--error)] text-sm"
          >
            {error}
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
              <Button variant="primary" size="sm" onClick={() => router.push('/products')}>
                Découvrir les produits
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {favorites.map((product) => (
              <div key={product.id} className="relative">
                <ProductCard product={product} />
                <button
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
