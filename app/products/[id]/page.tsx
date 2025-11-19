'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast';
import ReviewStars from '@/components/reviews/ReviewStars';
import ReviewList from '@/components/reviews/ReviewList';
import ReviewForm from '@/components/reviews/ReviewForm';
import FavoriteButton from '@/components/favorites/FavoriteButton';
import SimilarProducts from '@/components/products/SimilarProducts';
import Skeleton from '@/components/ui/Skeleton';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  category: string;
  rating: number;
  reviewCount: number;
  stock: number;
}

interface Review {
  id: number;
  userId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { success } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    fetchProduct();
    fetchReviews();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/products/${params.id}`);
      if (!res.ok) throw new Error('Produit non trouvé');
      const data = await res.json();
      setProduct(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const res = await fetch(`/api/products/${params.id}/reviews`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data);
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
    }
  };

  const handleAddToCart = () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingItem = cart.find((item: any) => item.productId === product?.id);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.push({
        productId: product?.id,
        name: product?.name,
        price: product?.price,
        quantity,
        imageUrl: product?.imageUrl,
      });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Dispatch event for CartButton
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('cartUpdated'));
    }
    
    success('Produit ajouté au panier !');
  };

  const handleReviewSuccess = () => {
    fetchReviews();
    fetchProduct(); // Refresh to update rating
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <Skeleton className="h-8 w-48 mb-6" variant="text" />
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <Skeleton className="w-full h-96 rounded-xl" variant="rectangular" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-24" variant="text" />
            <Skeleton className="h-10 w-full" variant="text" />
            <Skeleton className="h-6 w-32" variant="text" />
            <Skeleton className="h-20 w-full" variant="text" />
            <Skeleton className="h-12 w-32" variant="text" />
            <Skeleton className="h-12 w-full" variant="rectangular" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
          <p className="text-red-800 dark:text-red-200">{error || 'Produit non trouvé'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <button
        onClick={() => router.back()}
        className="mb-6 text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-2"
      >
        ← Retour aux produits
      </button>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {/* Image */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-8 border border-slate-200 dark:border-slate-700">
          <div className="relative w-full h-96">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 50vw"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400">
                No Image
              </div>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-8 border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400 uppercase mb-2">
            {product.category}
          </p>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-4">
            {product.name}
          </h1>

          <div className="flex items-center gap-2 mb-4">
            <ReviewStars rating={product.rating} size="lg" showValue />
            <span className="text-slate-600 dark:text-slate-400">
              - {product.reviewCount} avis
            </span>
          </div>

          <p className="text-slate-600 dark:text-slate-300 mb-6">
            {product.description}
          </p>

          <div className="mb-6">
            <span className="text-4xl font-bold text-blue-600 dark:text-blue-400">
              ${product.price.toFixed(2)}
            </span>
          </div>

          <div className="mb-6">
            {product.stock > 0 ? (
              <span className="text-emerald-600 dark:text-emerald-400">
                ✓ En stock ({product.stock} disponibles)
              </span>
            ) : (
              <span className="text-red-600 dark:text-red-400">
                ✗ Rupture de stock
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 mb-6">
            <label htmlFor="quantity-input" className="text-slate-700 dark:text-slate-300">Quantité:</label>
            <input
              id="quantity-input"
              type="number"
              min="1"
              max={product.stock}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              className="w-20 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Quantité"
            />
          </div>

          <div className="flex gap-4 items-center">
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-blue-300"
              aria-label="Ajouter au panier"
            >
              Ajouter au panier
            </button>
            <div className="px-4 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-lg">
              <FavoriteButton productId={product.id} size="lg" showLabel />
            </div>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-8 border border-slate-200 dark:border-slate-700">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">
          Avis clients ({reviews.length})
        </h2>
        
        <ReviewList 
          reviews={reviews} 
          emptyMessage="Aucun avis pour le moment. Soyez le premier à laisser un avis !"
        />

        {isAuthenticated && (
          <ReviewForm 
            productId={product.id} 
            onSuccess={handleReviewSuccess}
          />
        )}
      </div>

      {/* Similar Products */}
      <SimilarProducts productId={product.id} category={product.category} />
    </div>
  );
}

