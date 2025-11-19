'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ProductGrid from '@/components/products/ProductGrid';

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

interface ProductSectionProps {
  title: string;
  apiUrl: string;
  limit?: number;
}

export default function ProductSection({ title, apiUrl, limit = 8 }: ProductSectionProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, [apiUrl]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error('Erreur lors du chargement');
      let data = await res.json();
      
      if (Array.isArray(data)) {
        // Sort by popularity (rating * reviewCount) or newest if needed
        if (apiUrl.includes('popular')) {
          data = data.sort((a: Product, b: Product) => {
            const scoreA = (a.rating || 0) * (a.reviewCount || 0);
            const scoreB = (b.rating || 0) * (b.reviewCount || 0);
            return scoreB - scoreA;
          });
        } else if (apiUrl.includes('recent')) {
          data = data.sort((a: Product, b: Product) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
          });
        }
        
        setProducts(data.slice(0, limit));
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="mb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
            {title}
          </h2>
        </div>
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
      </section>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="mb-16">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
          {title}
        </h2>
        <Link
          href="/products"
          className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
        >
          Voir tout →
        </Link>
      </div>
      <ProductGrid products={products} />
    </section>
  );
}

