'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { getToken } from '@/lib/auth';
import { Heart, ShoppingCart, Star, Truck, Shield, ArrowLeft, Check } from 'lucide-react';

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
}

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    fetchProduct();
    if (isAuthenticated) {
      checkIsFavorite();
    }
  }, [resolvedParams.id, isAuthenticated]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/products/${resolvedParams.id}`);
      if (!res.ok) throw new Error('Produit non trouvé');
      const data = await res.json();
      setProduct(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const checkIsFavorite = async () => {
    try {
      const token = getToken();
      const res = await fetch(`/api/products/${resolvedParams.id}/is-favorite`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setIsFavorite(data.isFavorite);
      }
    } catch (err) {
      console.error('Error checking favorite:', err);
    }
  };

  const toggleFavorite = async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    try {
      const token = getToken();
      const method = isFavorite ? 'DELETE' : 'POST';
      const url = isFavorite 
        ? `/api/favorites/${resolvedParams.id}` 
        : '/api/favorites';

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: method === 'POST' ? JSON.stringify({ productId: resolvedParams.id }) : undefined,
      });

      if (res.ok) {
        setIsFavorite(!isFavorite);
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };

  const addToCart = async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    setAddingToCart(true);
    try {
      const token = getToken();
      const res = await fetch('/api/cart/items', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: resolvedParams.id,
          quantity,
        }),
      });

      if (res.ok) {
        // Optionally show success message or redirect to cart
        router.push('/cart');
      }
    } catch (err) {
      console.error('Error adding to cart:', err);
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-12">
        <div className="animate-pulse">
          <div className="h-8 w-32 bg-slate-200 rounded mb-8" />
          <div className="grid md:grid-cols-2 gap-12">
            <div className="aspect-square bg-slate-200 rounded-xl" />
            <div className="space-y-4">
              <div className="h-10 bg-slate-200 rounded" />
              <div className="h-6 bg-slate-200 rounded w-3/4" />
              <div className="h-32 bg-slate-200 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-12">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <p className="text-red-800">{error || 'Produit non trouvé'}</p>
          <Link href="/products" className="text-blue-600 hover:underline mt-4 inline-block">
            Retour au catalogue
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-8 flex items-center space-x-2 text-sm text-slate-600">
        <Link href="/" className="hover:text-blue-600">Accueil</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-blue-600">Produits</Link>
        <span>/</span>
        <Link href={`/products?category=${product.category}`} className="hover:text-blue-600">
          {product.category}
        </Link>
        <span>/</span>
        <span className="text-slate-900">{product.name}</span>
      </nav>

      {/* Product Details */}
      <div className="grid md:grid-cols-2 gap-12">
        {/* Image */}
        <div className="bg-white rounded-xl p-8 border border-slate-200">
          <div className="relative aspect-square">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className="object-contain"
              />
            ) : (
              <div className="w-full h-full bg-slate-100 flex items-center justify-center rounded-lg">
                <span className="text-slate-400">Pas d'image</span>
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                {product.category}
              </span>
              {isAuthenticated && (
                <button
                  onClick={toggleFavorite}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <Heart
                    className={`w-6 h-6 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-slate-400'}`}
                  />
                </button>
              )}
            </div>
            <h1 className="text-4xl font-bold text-slate-900 mb-3">{product.name}</h1>
            
            {/* Rating */}
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < Math.floor(product.rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-slate-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-slate-600">
                {product.rating.toFixed(1)} ({product.reviewCount || 0} avis)
              </span>
            </div>
          </div>

          {/* Price */}
          <div className="border-t border-b border-slate-200 py-6">
            <div className="flex items-baseline space-x-2">
              <span className="text-4xl font-bold text-slate-900">
                {product.price.toFixed(2)}€
              </span>
              <span className="text-slate-500">TTC</span>
            </div>
            <p className="text-sm text-slate-600 mt-2">Livraison gratuite dès 50€</p>
          </div>

          {/* Stock Status */}
          <div>
            {product.stock > 0 ? (
              <div className="flex items-center space-x-2 text-green-600">
                <Check className="w-5 h-5" />
                <span className="font-medium">En stock ({product.stock} disponibles)</span>
              </div>
            ) : (
              <div className="text-red-600 font-medium">Rupture de stock</div>
            )}
          </div>

          {/* Quantity & Actions */}
          {product.stock > 0 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-slate-700">Quantité :</label>
                <div className="flex items-center border border-slate-300 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-2 hover:bg-slate-100 transition-colors"
                  >
                    -
                  </button>
                  <span className="px-6 py-2 border-x border-slate-300">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="px-4 py-2 hover:bg-slate-100 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={addToCart}
                  disabled={addingToCart}
                  className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>{addingToCart ? 'Ajout...' : 'Ajouter au panier'}</span>
                </button>
                <button
                  onClick={() => router.push('/checkout')}
                  className="flex-1 border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-lg hover:bg-blue-50 transition-colors font-semibold"
                >
                  Acheter maintenant
                </button>
              </div>
            </div>
          )}

          {/* Features */}
          <div className="grid grid-cols-2 gap-4 pt-6">
            <div className="flex items-start space-x-3">
              <Truck className="w-6 h-6 text-blue-600 shrink-0 mt-1" />
              <div>
                <p className="font-medium text-slate-900">Livraison rapide</p>
                <p className="text-sm text-slate-600">2-3 jours ouvrés</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Shield className="w-6 h-6 text-blue-600 shrink-0 mt-1" />
              <div>
                <p className="font-medium text-slate-900">Garantie 2 ans</p>
                <p className="text-sm text-slate-600">Protection complète</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="mt-12 bg-white border border-slate-200 rounded-xl p-8">
        <h2 className="text-2xl font-bold mb-4 text-slate-900">Description</h2>
        <p className="text-slate-700 leading-relaxed whitespace-pre-line">
          {product.description}
        </p>
      </div>

      {/* Back Button */}
      <div className="mt-8">
        <Link
          href="/products"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Retour au catalogue
        </Link>
      </div>
    </div>
  );
}
