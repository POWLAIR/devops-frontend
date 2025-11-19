'use client';

import { useEffect, useState, useMemo } from 'react';
import ProductGrid from '@/components/products/ProductGrid';
import ProductFilters, { SortOption } from '@/components/products/ProductFilters';
import Skeleton from '@/components/ui/Skeleton';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  category: string;
  rating: number;
  reviewCount?: number;
  stock: number;
  createdAt?: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('default');
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(1000);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Calculate max price from products
  useEffect(() => {
    if (products.length > 0) {
      const max = Math.max(...products.map(p => p.price));
      if (maxPrice === 1000 || maxPrice < max) {
        setMaxPrice(Math.ceil(max));
      }
    }
  }, [products]);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/products');
      if (!res.ok) throw new Error('Erreur lors du chargement des produits');
      const data = await res.json();
      setProducts(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      if (!res.ok) throw new Error('Erreur lors du chargement des catégories');
      const data = await res.json();
      setCategories(data);
    } catch (err: any) {
      console.error('Error fetching categories:', err);
    }
  };

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...products];

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query)
      );
    }

    // Price range filter
    filtered = filtered.filter((p) => p.price >= minPrice && p.price <= maxPrice);

    // Stock filter
    if (inStockOnly) {
      filtered = filtered.filter((p) => p.stock > 0);
    }

    // Sort
    switch (sortOption) {
      case 'price-asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'rating-desc':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'popularity-desc':
        filtered.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
        break;
      case 'newest':
        filtered.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
        break;
      default:
        // Keep original order
        break;
    }

    return filtered;
  }, [products, selectedCategory, searchQuery, sortOption, minPrice, maxPrice, inStockOnly]);

  const handleCategoryChange = (category: string | null) => {
    setSelectedCategory(category);
    setSearchQuery('');
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setSelectedCategory(null);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Skeleton className="h-10 w-64 mb-2" variant="text" />
          <Skeleton className="h-4 w-96" variant="text" />
        </div>
        <div className="mb-6">
          <Skeleton className="h-32 w-full rounded-xl" variant="rectangular" />
        </div>
        <ProductGrid products={[]} loading={true} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
          Catalogue Produits
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Découvrez notre sélection de produits
        </p>
      </div>

      <ProductFilters
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={handleCategoryChange}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        sortOption={sortOption}
        onSortChange={setSortOption}
        minPrice={minPrice}
        maxPrice={maxPrice}
        onPriceRangeChange={(min, max) => {
          setMinPrice(min);
          setMaxPrice(max);
        }}
        inStockOnly={inStockOnly}
        onInStockOnlyChange={setInStockOnly}
      />

      <div className="mb-4 text-sm text-slate-600 dark:text-slate-400">
        {filteredAndSortedProducts.length} produit{filteredAndSortedProducts.length > 1 ? 's' : ''} trouvé{filteredAndSortedProducts.length > 1 ? 's' : ''}
      </div>

      <ProductGrid products={filteredAndSortedProducts} />
    </div>
  );
}

