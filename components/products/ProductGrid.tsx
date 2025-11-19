'use client';

import ProductCard from './ProductCard';
import Skeleton from '@/components/ui/Skeleton';

interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  category: string;
  rating: number;
  stock: number;
}

interface ProductGridProps {
  products: Product[];
  loading?: boolean;
}

export default function ProductGrid({ products, loading }: ProductGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4"
          >
            <Skeleton className="w-full h-48 mb-4" variant="rectangular" />
            <Skeleton className="h-4 w-3/4 mb-2" variant="text" />
            <Skeleton className="h-6 w-1/2 mb-2" variant="text" />
            <Skeleton className="h-4 w-2/3" variant="text" />
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600 dark:text-slate-400 text-lg">
          Aucun produit trouvé
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

