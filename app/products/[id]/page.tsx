'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, ShoppingCart, Minus, Plus, ChevronRight, Home } from 'lucide-react';
import { Star } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { ReviewSection } from '@/components/products/ReviewSection';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import { formatPrice, getRatingStars } from '@/lib/utils';
import type { Product } from '@/lib/types';
import { cn } from '@/lib/utils';
import { apiFetch } from '@/lib/api-client';

// ─── Normalisation camelCase (NestJS) → snake_case (frontend types) ──────────

function normalizeProduct(raw: Record<string, unknown>): Product {
  return {
    ...(raw as unknown as Product),
    image_url: (raw.imageUrl as string | undefined) ?? (raw.image_url as string | undefined),
    average_rating:
      parseFloat(String(raw.rating ?? raw.average_rating ?? 0)) || 0,
    review_count:
      parseInt(String(raw.reviewCount ?? raw.review_count ?? 0), 10) || 0,
    tenant_id: (raw.tenantId as string | undefined) ?? (raw.tenant_id as string | undefined),
    is_active: (raw.isActive as boolean | undefined) ?? (raw.is_active as boolean | undefined),
    price: parseFloat(String(raw.price ?? 0)),
    stock: parseInt(String(raw.stock ?? 0), 10),
    category: (raw.category as string | undefined),
  };
}

async function loadProduct(base: string, pid: string): Promise<Product> {
  const res = await apiFetch(`${base}/${pid}`, { skipErrorToast: true });
  if (!res.ok) throw new Error('Produit introuvable.');
  return normalizeProduct((await res.json()) as Record<string, unknown>);
}

async function loadFavoriteState(pid: string): Promise<boolean> {
  const res = await apiFetch(`/api/favorites/check/${pid}`, {
    skipErrorToast: true,
    skipUnauthorizedHandling: true,
  });
  if (!res.ok) return false;
  const data = (await res.json()) as { isFavorite?: boolean };
  return data.isFavorite ?? false;
}

// ─── Star rating (display) ────────────────────────────────────────────────────

function StarRating({ rating, count, size = 16 }: { rating: number; count?: number; size?: number }) {
  const { full, half, empty } = getRatingStars(rating);
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center">
        {Array.from({ length: full }).map((_, i) => (
          <Star key={`f${i}`} size={size} className="fill-[var(--warning)] text-[var(--warning)]" />
        ))}
        {half && (
          <span className="relative inline-block" style={{ width: size, height: size }}>
            <Star size={size} className="text-[var(--neutral-300)] fill-[var(--neutral-300)]" />
            <span className="absolute inset-0 overflow-hidden w-1/2">
              <Star size={size} className="fill-[var(--warning)] text-[var(--warning)]" />
            </span>
          </span>
        )}
        {Array.from({ length: empty }).map((_, i) => (
          <Star key={`e${i}`} size={size} className="fill-[var(--neutral-300)] text-[var(--neutral-300)]" />
        ))}
      </div>
      {count !== undefined && count > 0 && (
        <span className="text-sm text-[var(--neutral-500)]">
          {rating.toFixed(1)} ({count} avis)
        </span>
      )}
    </div>
  );
}

// ─── Stock badge ──────────────────────────────────────────────────────────────

function StockBadge({ stock }: { stock: number }) {
  const qty = parseInt(String(stock ?? 0), 10);
  if (qty === 0) return <Badge variant="error">Rupture de stock</Badge>;
  if (qty <= 5) return <Badge variant="warning">{qty} restant{qty > 1 ? 's' : ''}</Badge>;
  if (qty <= 20) return <Badge variant="success">{qty} en stock</Badge>;
  return <Badge variant="success">En stock</Badge>;
}

// ─── Skeleton layout ──────────────────────────────────────────────────────────

function ProductDetailSkeleton() {
  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb skeleton */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <React.Fragment key={i}>
            <Skeleton className="h-4 w-16" />
            {i < 4 && <Skeleton className="h-3 w-3" />}
          </React.Fragment>
        ))}
      </div>
      {/* Two-column skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <Skeleton className="h-96 w-full rounded-2xl" />
        <div className="space-y-4">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-20 w-full" />
          <div className="flex gap-3 pt-4">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-10" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ProductDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { addItem } = useCart();

  const isMerchantOrAdmin = user && (
    user.role === 'merchant_owner' ||
    user.role === 'merchant_staff' ||
    user.role === 'platform_admin'
  );
  const productBaseUrl = isMerchantOrAdmin ? '/api/products' : '/api/products/all';

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  const [quantity, setQuantity] = useState(1);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [cartError, setCartError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    loadProduct(productBaseUrl, id)
      .then((p) => {
        if (!cancelled) setProduct(p);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, productBaseUrl]);

  useEffect(() => {
    if (!isAuthenticated || !id) {
      setIsFavorite(false);
      return;
    }
    let cancelled = false;
    loadFavoriteState(id)
      .then((fav) => {
        if (!cancelled) setIsFavorite(fav);
      })
      .catch(() => {
        if (!cancelled) setIsFavorite(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, id]);

  const stock = product?.stock ?? 0;

  const decreaseQty = useCallback(() => {
    setQuantity((q) => Math.max(1, q - 1));
  }, []);

  const increaseQty = useCallback(() => {
    setQuantity((q) => Math.min(stock, q + 1));
  }, [stock]);

  const handleAddToCart = useCallback(async () => {
    if (!product || stock === 0) return;
    setCartError(null);
    const result = await addItem(product, quantity);
    if (result.success) {
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
    } else {
      setCartError(result.error ?? 'Impossible d\'ajouter au panier.');
      setTimeout(() => setCartError(null), 4000);
    }
  }, [product, quantity, stock, addItem]);

  const handleToggleFavorite = useCallback(async () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/products/${id}`);
      return;
    }
    setFavoriteLoading(true);
    try {
      const method = isFavorite ? 'DELETE' : 'POST';
      await apiFetch(`/api/favorites/${id}`, { method });
      setIsFavorite((prev) => !prev);
    } catch {
      // silencieux
    } finally {
      setFavoriteLoading(false);
    }
  }, [isAuthenticated, isFavorite, id, router]);

  if (isLoading) return <ProductDetailSkeleton />;

  if (error || !product) {
    return (
      <div className="max-w-screen-xl mx-auto px-4 py-16 text-center">
        <p className="text-[var(--error)] font-medium mb-4">
          {error ?? 'Produit introuvable.'}
        </p>
        <Button variant="outline" onClick={() => router.back()}>
          Retour
        </Button>
      </div>
    );
  }

  const rating = product.average_rating ?? 0;
  const reviewCount = product.review_count ?? 0;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-[var(--neutral-500)] mb-8 flex-wrap">
          <Link href="/" className="flex items-center gap-1 hover:text-[var(--foreground)] transition-colors">
            <Home size={14} />
            <span>Accueil</span>
          </Link>
          <ChevronRight size={14} className="shrink-0" />
          <Link href="/products" className="hover:text-[var(--foreground)] transition-colors">
            Produits
          </Link>
          {product.category && (
            <>
              <ChevronRight size={14} className="shrink-0" />
              <Link
                href={`/products?category=${encodeURIComponent(product.category)}`}
                className="hover:text-[var(--foreground)] transition-colors"
              >
                {product.category}
              </Link>
            </>
          )}
          <ChevronRight size={14} className="shrink-0" />
          <span className="text-[var(--foreground)] font-medium truncate max-w-[200px]">
            {product.name}
          </span>
        </nav>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">

          {/* Left: image */}
          <div className="relative aspect-square bg-[var(--neutral-100)] rounded-2xl overflow-hidden">
            {product.image_url ? (
              <Image
                src={product.image_url}
                alt={product.name}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
                unoptimized
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center text-[var(--neutral-400)]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="80"
                  height="80"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </div>
            )}
          </div>

          {/* Right: info + actions */}
          <div className="flex flex-col gap-5">
            {/* Category */}
            {product.category && (
              <Badge variant="primary" className="self-start">
                {product.category}
              </Badge>
            )}

            {/* Name */}
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] leading-tight">
              {product.name}
            </h1>

            {/* Rating */}
            {rating > 0 && (
              <StarRating rating={rating} count={reviewCount} size={18} />
            )}

            {/* Price */}
            <p className="text-3xl font-bold text-[var(--primary)]">
              {formatPrice(product.price)}
            </p>

            {/* Stock */}
            <StockBadge stock={stock} />

            {/* Description */}
            {product.description && (
              <p className="text-sm text-[var(--neutral-600)] leading-relaxed">
                {product.description}
              </p>
            )}

            {/* Quantity + actions */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {/* Quantity selector */}
              <div className="flex items-center border border-[var(--border-color)] rounded-lg overflow-hidden">
                <button
                  onClick={decreaseQty}
                  disabled={quantity <= 1}
                  className="px-3 h-10 text-[var(--foreground)] hover:bg-[var(--neutral-100)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="Diminuer la quantité"
                >
                  <Minus size={16} />
                </button>
                <span className="px-4 h-10 flex items-center justify-center text-sm font-medium text-[var(--foreground)] min-w-[3rem] text-center border-x border-[var(--border-color)]">
                  {quantity}
                </span>
                <button
                  onClick={increaseQty}
                  disabled={quantity >= stock || stock === 0}
                  className="px-3 h-10 text-[var(--foreground)] hover:bg-[var(--neutral-100)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="Augmenter la quantité"
                >
                  <Plus size={16} />
                </button>
              </div>

              {/* Add to cart */}
              <Button
                variant="primary"
                size="md"
                leftIcon={<ShoppingCart size={16} />}
                disabled={stock === 0}
                onClick={handleAddToCart}
                className={cn('flex-1 sm:flex-none', addedToCart && 'bg-[var(--success)]')}
              >
                {addedToCart ? 'Ajouté !' : 'Ajouter au panier'}
              </Button>

              {/* Favorite */}
              <button
                onClick={handleToggleFavorite}
                disabled={favoriteLoading}
                aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                className={cn(
                  'h-10 w-10 flex items-center justify-center rounded-lg border transition-colors',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  isFavorite
                    ? 'border-[var(--error)] text-[var(--error)] bg-[var(--error-light,color-mix(in_srgb,var(--error)_10%,transparent))]'
                    : 'border-[var(--border-color)] text-[var(--neutral-500)] hover:border-[var(--error)] hover:text-[var(--error)]'
                )}
              >
                <Heart
                  size={18}
                  className={isFavorite ? 'fill-current' : ''}
                />
              </button>
            </div>

            {/* Cart error */}
            {cartError && (
              <p className="text-sm text-[var(--error)] bg-[var(--error-light,color-mix(in_srgb,var(--error)_10%,transparent))] px-3 py-2 rounded-lg">
                {cartError}
              </p>
            )}

            {/* Auth hint for favorite */}
            {!isAuthenticated && (
              <p className="text-xs text-[var(--neutral-500)]">
                <Link href={`/login?redirect=/products/${id}`} className="text-[var(--primary)] hover:underline">
                  Connectez-vous
                </Link>{' '}
                pour ajouter aux favoris.
              </p>
            )}
          </div>
        </div>

        {/* Reviews section */}
        <ReviewSection productId={id} isAuthenticated={isAuthenticated} reviewsBaseUrl={`${productBaseUrl}/${id}/reviews`} />
      </div>
    </div>
  );
}
