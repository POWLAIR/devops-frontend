'use client';

import { useEffect, useState } from 'react';
import ProductGrid from './ProductGrid';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  category: string;
  rating: number;
  stock: number;
}

interface SimilarProductsProps {
  productId: string;
  category: string;
  limit?: number;
}

export default function SimilarProducts({ productId, category, limit = 6 }: SimilarProductsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSimilarProducts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, category]);

  const fetchSimilarProducts = async () => {
    try {
      setLoading(true);
      const encodedCategory = encodeURIComponent(category);
      const res = await fetch(`/api/products?category=${encodedCategory}`);
      
      if (!res.ok) throw new Error('Erreur lors du chargement');
      
      const data = await res.json();
      
      // Normaliser les valeurs decimal (convertir strings en nombres) et filtrer
      const filtered = Array.isArray(data)
        ? data
            .map((product: any) => ({
              ...product,
              price: typeof product.price === 'string' ? parseFloat(product.price) : product.price,
              rating: typeof product.rating === 'string' ? parseFloat(product.rating) : product.rating,
            }))
            .filter((p: Product) => p.id !== productId)
            .slice(0, limit)
        : [];
      
      setProducts(filtered);
    } catch (err) {
      console.error('Error fetching similar products:', err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">
          Produits similaires
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 h-64 animate-pulse"
            >
              <div className="w-full h-32 bg-slate-200 dark:bg-slate-700 rounded-lg mb-4" />
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2" />
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">
        Produits similaires
      </h2>
      <ProductGrid products={products} />
    </div>
  );
}

