'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getToken } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { useCart } from '@/lib/use-cart';
import CartSummary from '@/components/cart/CartSummary';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import StripePaymentForm from '@/components/StripePaymentForm';

// Charger Stripe avec la clé publique
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

export default function CheckoutPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { error: errorToast, warning, success: successToast } = useToast();
  const { cart, clearCart, getSummary } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [clientSecret, setClientSecret] = useState<string>('');
  const [orderId, setOrderId] = useState<string>('');
  const [paymentStep, setPaymentStep] = useState<'order' | 'payment'>('order');

  useEffect(() => {
    if (!isAuthenticated) {
      warning('Veuillez vous connecter pour passer une commande');
      router.push('/login');
      return;
    }

    if (cart.length === 0) {
      warning('Votre panier est vide');
      router.push('/cart');
      return;
    }
  }, [isAuthenticated, cart.length, router, warning]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = getToken();
      // Étape 1: Créer la commande
      const orderItems = cart.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      }));

      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ items: orderItems }),
      });

      if (!orderRes.ok) {
        const data = await orderRes.json();
        throw new Error(data.message || 'Erreur lors de la création de la commande');
      }

      const orderData = await orderRes.json();
      setOrderId(orderData.id);

      // Étape 2: Créer le Payment Intent
      const summary = getSummary();
      const paymentRes = await fetch('/api/payment/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: summary.total,
          currency: 'eur',
          order_id: orderData.id,
        }),
      });

      if (!paymentRes.ok) {
        const data = await paymentRes.json();
        throw new Error(data.message || 'Erreur lors de l\'initialisation du paiement');
      }

      const paymentData = await paymentRes.json();
      setClientSecret(paymentData.client_secret);
      setPaymentStep('payment');
      
      successToast('Commande créée ! Veuillez procéder au paiement.');
    } catch (err: any) {
      setError(err.message);
      errorToast(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    clearCart();
    successToast('Paiement effectué avec succès !');
    router.push('/orders');
  };

  const handlePaymentError = (error: string) => {
    setError(error);
    errorToast(error);
  };

  if (!isAuthenticated || cart.length === 0) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
        {paymentStep === 'order' ? 'Validation de la commande' : 'Paiement'}
      </h1>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {paymentStep === 'order' ? (
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
            
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mt-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Note:</strong> Les prix et la disponibilité seront vérifiés lors de la confirmation. 
                Le montant final pourrait différer légèrement si les prix ont changé.
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
      ) : (
        <div className="max-w-2xl mx-auto">
          {clientSecret && (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <StripePaymentForm
                clientSecret={clientSecret}
                amount={getSummary().total}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            </Elements>
          )}
          
          <button
            onClick={() => {
              setPaymentStep('order');
              setClientSecret('');
            }}
            className="w-full mt-4 text-blue-600 dark:text-blue-400 hover:underline"
          >
            Retour à la commande
          </button>
        </div>
      )}
    </div>
  );
}

