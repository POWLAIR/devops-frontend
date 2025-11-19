'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface CategoryGridProps {
  limit?: number;
}

const categoryIcons: Record<string, string> = {
  electronics: '📱',
  jewelery: '💍',
  "men's clothing": '👔',
  "women's clothing": '👗',
  default: '🛍️',
};

export default function CategoryGrid({ limit = 8 }: CategoryGridProps) {
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/categories');
      if (!res.ok) throw new Error('Erreur lors du chargement');
      const data = await res.json();
      setCategories(Array.isArray(data) ? data.slice(0, limit) : []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="mb-16">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-6">
          Catégories
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 h-32 animate-pulse"
            >
              <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-lg mb-3" />
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (categories.length === 0) {
    return null;
  }

  return (
    <section className="mb-16">
      <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-6">
        Parcourir par catégorie
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {categories.map((category) => (
          <Link
            key={category}
            href={`/products?category=${encodeURIComponent(category)}`}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 text-center group"
          >
            <div className="text-5xl mb-3 transform group-hover:scale-110 transition-transform">
              {categoryIcons[category.toLowerCase()] || categoryIcons.default}
            </div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 capitalize">
              {category}
            </h3>
          </Link>
        ))}
      </div>
    </section>
  );
}

