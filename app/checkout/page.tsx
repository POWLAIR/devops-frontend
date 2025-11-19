'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getToken } from '@/lib/auth';
import { useCart } from '@/lib/use-cart';
import CartSummary from '@/components/cart/CartSummary';

export default function CheckoutPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { cart, clearCart, getSummary } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      alert('Veuillez vous connecter pour passer une commande');
      router.push('/login');
      return;
    }

    if (cart.length === 0) {
      alert('Votre panier est vide');
      router.push('/cart');
      return;
    }
  }, [isAuthenticated, cart.length, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = getToken();
      const orderItems = cart.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
      }));

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ items: orderItems }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Erreur lors de la création de la commande');
      }

      // Clear cart
      clearCart();
      
      alert('Commande créée avec succès !');
      router.push('/orders');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated || cart.length === 0) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
        Validation de la commande
      </h1>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">
              Récapitulatif de la commande
            </h2>

            <div className="space-y-3">
              {cart.map((item) => (
                <div
                  key={item.productId}
                  className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3 last:border-0"
                >
                  <div>
                    <p className="font-medium text-slate-800 dark:text-slate-100">
                      {item.name}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Quantité: {item.quantity} × ${item.price.toFixed(2)}
                    </p>
                  </div>
                  <p className="font-bold text-slate-800 dark:text-slate-100">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">
              Informations de livraison
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Les informations de livraison seront configurées dans une version future.
              <br />
              Pour le moment, la commande sera enregistrée avec vos informations de compte.
            </p>
          </div>
        </div>

        <div className="lg:col-span-1">
          <CartSummary
            summary={getSummary()}
            showCheckoutButton={false}
          />
          
          <form onSubmit={handleSubmit} className="mt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? 'Traitement...' : 'Confirmer la commande'}
            </button>
          </form>

          <button
            onClick={() => router.back()}
            className="w-full mt-3 text-blue-600 dark:text-blue-400 hover:underline"
          >
            Retour au panier
          </button>
        </div>
      </div>
    </div>
  );
}

