'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, SlidersHorizontal, ArrowUpDown, Store, X as XIcon } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProductCard } from '@/components/products/ProductCard';
import { FilterPanel, type FilterState } from '@/components/products/FilterPanel';
import { useAuth } from '@/lib/auth-context';
import { apiFetch, ApiUnauthorizedError } from '@/lib/api-client';
import { formatPrice } from '@/lib/utils';
import type { Product, Category } from '@/lib/types';

const PAGE_SIZE = 20;

const SORT_OPTIONS = [
  { value: 'default', label: 'Pertinence' },
  { value: 'price_asc', label: 'Prix croissant' },
  { value: 'price_desc', label: 'Prix décroissant' },
  { value: 'rating', label: 'Mieux notés' },
  { value: 'popularity', label: 'Popularité' },
] as const;

type SortValue = (typeof SORT_OPTIONS)[number]['value'];

const ABSOLUTE_MIN = 0;
const ABSOLUTE_MAX = 10000;

const DEFAULT_FILTERS: FilterState = {
  categoryIds: [],
  priceMin: ABSOLUTE_MIN,
  priceMax: ABSOLUTE_MAX,
  inStockOnly: false,
};

function getNumericField(p: Product, field: 'price' | 'rating' | 'average_rating' | 'review_count' | 'reviewCount'): number {
  return parseFloat(String((p as any)[field] ?? 0)) || 0;
}

function sortProducts(products: Product[], sortBy: SortValue): Product[] {
  const copy = [...products];
  switch (sortBy) {
    case 'price_asc':
      return copy.sort((a, b) => getNumericField(a, 'price') - getNumericField(b, 'price'));
    case 'price_desc':
      return copy.sort((a, b) => getNumericField(b, 'price') - getNumericField(a, 'price'));
    case 'rating': {
      return copy.sort((a, b) => {
        const ra = getNumericField(a, 'rating') || getNumericField(a, 'average_rating');
        const rb = getNumericField(b, 'rating') || getNumericField(b, 'average_rating');
        return rb - ra;
      });
    }
    case 'popularity': {
      return copy.sort((a, b) => {
        const ca = getNumericField(a, 'reviewCount') || getNumericField(a, 'review_count');
        const cb = getNumericField(b, 'reviewCount') || getNumericField(b, 'review_count');
        return cb - ca;
      });
    }
    default:
      return copy;
  }
}

export default function ProductsPage() {
  const { user } = useAuth();

  // Tenant filter from URL
  const searchParams = useSearchParams();
  const router = useRouter();
  const tenantId = searchParams.get('tenant');
  const shopName = searchParams.get('shop');

  // Search
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Filters & sort
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [sortBy, setSortBy] = useState<SortValue>('default');
  const [filterOpen, setFilterOpen] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);

  // Data
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debounce search query
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(1);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [filters, sortBy, tenantId]);

  // Fetch categories — merchant/admin see tenant-scoped, customer/guest see marketplace
  const isMerchantOrAdmin = user && (
    user.role === 'merchant_owner' ||
    user.role === 'merchant_staff' ||
    user.role === 'platform_admin'
  );

  useEffect(() => {
    const endpoint = isMerchantOrAdmin ? '/api/categories' : '/api/categories/all';
    apiFetch(endpoint, { skipErrorToast: true, skipUnauthorizedHandling: true })
      .then((res) => res.json())
      .then((data: unknown) => {
        const raw: unknown[] = Array.isArray(data)
          ? data
          : Array.isArray((data as any)?.data)
          ? (data as any).data
          : [];
        const list: Category[] = raw.map((item) =>
          typeof item === 'string'
            ? { id: item, name: item }
            : (item as Category)
        );
        setCategories(list);
      })
      .catch(() => {/* silently ignore */});
  }, [isMerchantOrAdmin]);

  // Fetch products
  // merchant_owner / merchant_staff / platform_admin → tenant-scoped (/api/products)
  // customer / guest → marketplace (/api/products/all)
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      let url: string;
      const params = new URLSearchParams();

      if (debouncedQuery.trim()) {
        params.set('q', debouncedQuery.trim());
        if (filters.categoryIds.length === 1) params.set('category_id', filters.categoryIds[0]);
        url = isMerchantOrAdmin
          ? `/api/products/search?${params}`
          : `/api/products/all/search?${params}`;
      } else {
        if (filters.categoryIds.length === 1) params.set('category_id', filters.categoryIds[0]);
        if (filters.priceMin > ABSOLUTE_MIN) params.set('min_price', String(filters.priceMin));
        if (filters.priceMax < ABSOLUTE_MAX) params.set('max_price', String(filters.priceMax));
        if (filters.inStockOnly) params.set('in_stock', 'true');
        url = isMerchantOrAdmin
          ? `/api/products?${params}`
          : `/api/products/all?${params}`;
      }

      const res = await apiFetch(url, { skipErrorToast: true });
      if (!res.ok) throw new Error('Erreur lors du chargement des produits.');
      const data: Product[] | { data?: Product[]; items?: Product[] } = await res.json();
      const list: Product[] = Array.isArray(data)
        ? data
        : (data?.data ?? data?.items ?? []);
      setAllProducts(list);
    } catch (err) {
      if (err instanceof ApiUnauthorizedError) {
        setAllProducts([]);
        return;
      }
      setError(err instanceof Error ? err.message : 'Erreur inconnue.');
      setAllProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedQuery, filters, isMerchantOrAdmin]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Client-side filtering (tenant, multi-category, price range, in-stock)
  // NestJS may return numeric fields as strings; normalise with parseFloat/parseInt
  const filteredProducts = React.useMemo(() => {
    let result = allProducts;

    // Tenant pre-filter (URL-driven context)
    // Backend returns camelCase (tenantId) from TypeORM; snake_case is a fallback
    if (tenantId) {
      result = result.filter((p) => {
        const pTenantId = (p as any).tenantId ?? p.tenant_id;
        return pTenantId === tenantId;
      });
    }

    if (filters.categoryIds.length > 0) {
      result = result.filter((p) => {
        const catId = (p as any).category_id as string | undefined;
        const catName = (p as any).category as string | undefined;
        return catId
          ? filters.categoryIds.includes(catId)
          : catName
          ? filters.categoryIds.includes(catName)
          : false;
      });
    }
    if (filters.priceMin > ABSOLUTE_MIN) {
      result = result.filter((p) => parseFloat(String(p.price)) >= filters.priceMin);
    }
    if (filters.priceMax < ABSOLUTE_MAX) {
      result = result.filter((p) => parseFloat(String(p.price)) <= filters.priceMax);
    }
    if (filters.inStockOnly) {
      result = result.filter((p) => parseInt(String(p.stock), 10) > 0);
    }

    return sortProducts(result, sortBy);
  }, [allProducts, filters, sortBy, tenantId]);

  // Pagination slice
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const paginatedProducts = filteredProducts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function resetFilters() {
    setFilters(DEFAULT_FILTERS);
    setQuery('');
    setDebouncedQuery('');
    setSortBy('default');
    setPage(1);
  }

  // Compute active non-default filter chips
  const hasActiveFilters =
    filters.categoryIds.length > 0 ||
    filters.priceMin > ABSOLUTE_MIN ||
    filters.priceMax < ABSOLUTE_MAX ||
    filters.inStockOnly;
  const hasAnyChip = !!tenantId || hasActiveFilters;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Catalogue</h1>
          <p className="text-sm text-[var(--neutral-500)] mt-1">
            Découvrez notre sélection de produits
          </p>
        </div>

        {/* Search + Sort + Filter button */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          {/* Filter toggle (all screen sizes) */}
          <Button
            variant="outline"
            size="md"
            leftIcon={<SlidersHorizontal size={16} />}
            onClick={() => setFilterOpen(true)}
            className="shrink-0"
          >
            Filtres
            {hasActiveFilters && (
              <span className="ml-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] text-[10px] font-bold leading-none">
                {filters.categoryIds.length + (filters.inStockOnly ? 1 : 0) + (filters.priceMin > ABSOLUTE_MIN || filters.priceMax < ABSOLUTE_MAX ? 1 : 0)}
              </span>
            )}
          </Button>

          {/* Search */}
          <div className="flex-1">
            <Input
              type="search"
              placeholder="Rechercher un produit…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              leftIcon={<Search size={16} className="text-[var(--neutral-400)]" />}
              aria-label="Rechercher un produit"
            />
          </div>

          {/* Sort */}
          <div className="relative shrink-0">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-[var(--neutral-400)]">
              <ArrowUpDown size={15} />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortValue)}
              className="h-10 pl-9 pr-4 rounded-lg border border-[var(--border-color)] bg-[var(--card-background)] text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] cursor-pointer appearance-none"
              aria-label="Trier les produits"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active filter chips */}
        {hasAnyChip && (
          <div className="flex flex-wrap items-center gap-2 mb-5">
            {/* Boutique chip */}
            {tenantId && (
              <span className="inline-flex items-center gap-1.5 h-7 pl-2.5 pr-1.5 rounded-full border border-[var(--primary)]/40 bg-[var(--primary-light)] text-xs font-medium text-[var(--primary)]">
                <Store size={12} aria-hidden />
                {shopName ?? tenantId}
                <button
                  onClick={() => router.push('/products')}
                  className="ml-0.5 p-0.5 rounded-full hover:bg-[var(--primary)]/20 transition-colors"
                  aria-label="Retirer le filtre boutique"
                >
                  <XIcon size={11} />
                </button>
              </span>
            )}

            {/* Category chips */}
            {filters.categoryIds.map((id) => {
              const label = categories.find((c) => c.id === id)?.name ?? id;
              return (
                <span key={id} className="inline-flex items-center gap-1.5 h-7 pl-2.5 pr-1.5 rounded-full border border-[var(--border-color)] bg-[var(--card-background)] text-xs font-medium text-[var(--foreground)]">
                  {label}
                  <button
                    onClick={() => setFilters({ ...filters, categoryIds: filters.categoryIds.filter((c) => c !== id) })}
                    className="ml-0.5 p-0.5 rounded-full hover:bg-[var(--neutral-200)] transition-colors"
                    aria-label={`Retirer la catégorie ${label}`}
                  >
                    <XIcon size={11} />
                  </button>
                </span>
              );
            })}

            {/* Price chip */}
            {(filters.priceMin > ABSOLUTE_MIN || filters.priceMax < ABSOLUTE_MAX) && (
              <span className="inline-flex items-center gap-1.5 h-7 pl-2.5 pr-1.5 rounded-full border border-[var(--border-color)] bg-[var(--card-background)] text-xs font-medium text-[var(--foreground)]">
                {formatPrice(filters.priceMin)} – {formatPrice(filters.priceMax)}
                <button
                  onClick={() => setFilters({ ...filters, priceMin: ABSOLUTE_MIN, priceMax: ABSOLUTE_MAX })}
                  className="ml-0.5 p-0.5 rounded-full hover:bg-[var(--neutral-200)] transition-colors"
                  aria-label="Retirer le filtre de prix"
                >
                  <XIcon size={11} />
                </button>
              </span>
            )}

            {/* Stock chip */}
            {filters.inStockOnly && (
              <span className="inline-flex items-center gap-1.5 h-7 pl-2.5 pr-1.5 rounded-full border border-[var(--border-color)] bg-[var(--card-background)] text-xs font-medium text-[var(--foreground)]">
                En stock
                <button
                  onClick={() => setFilters({ ...filters, inStockOnly: false })}
                  className="ml-0.5 p-0.5 rounded-full hover:bg-[var(--neutral-200)] transition-colors"
                  aria-label="Retirer le filtre de stock"
                >
                  <XIcon size={11} />
                </button>
              </span>
            )}

            {/* Clear all filters (not boutique) */}
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="text-xs text-[var(--neutral-500)] hover:text-[var(--foreground)] underline underline-offset-2 transition-colors ml-1"
              >
                Tout effacer
              </button>
            )}
          </div>
        )}

        {/* Filter drawer (all screen sizes) */}
        <FilterPanel
          categories={categories}
          filters={filters}
          absoluteMin={ABSOLUTE_MIN}
          absoluteMax={ABSOLUTE_MAX}
          onChange={setFilters}
          onReset={resetFilters}
          open={filterOpen}
          onClose={() => setFilterOpen(false)}
          tenantId={tenantId}
          shopName={shopName}
          onClearBoutique={() => router.push('/products')}
        />

        {/* Result count */}
        {!isLoading && (
          <p className="text-sm text-[var(--neutral-500)] mb-4">
            {filteredProducts.length === 0
              ? 'Aucun produit trouvé'
              : `${filteredProducts.length} produit${filteredProducts.length > 1 ? 's' : ''} trouvé${filteredProducts.length > 1 ? 's' : ''}`}
          </p>
        )}

        {/* Product grid */}
        <div>
          {error && (
            <div className="rounded-lg border border-[var(--error)] bg-[var(--error-light,color-mix(in_srgb,var(--error)_10%,transparent))] text-[var(--error)] text-sm px-4 py-3 mb-4">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : paginatedProducts.length === 0 ? (
            <EmptyState
              title="Aucun produit trouvé"
              description="Essayez de modifier vos filtres ou votre recherche."
              action={
                <Button variant="outline" size="sm" onClick={resetFilters}>
                  Réinitialiser les filtres
                </Button>
              }
            />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {paginatedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {totalPages > 1 && (
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                  className="mt-8"
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
