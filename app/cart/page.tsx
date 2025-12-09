'use client';

import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/use-cart';
import CartItem from '@/components/cart/CartItem';
import CartSummary from '@/components/cart/CartSummary';

export default function CartPage() {
  const router = useRouter();
  const { cart, isLoaded, updateQuantity, removeItem, clearCart, getSummary } = useCart();

  const handleCheckout = () => {
    router.push('/checkout');
  };

  if (!isLoaded) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
          Mon Panier
        </h1>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-12 text-center">
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Votre panier est vide.
          </p>
          <button
            onClick={() => router.push('/products')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Continuer mes achats
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
        Mon Panier
      </h1>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {cart.map((item) => (
            <CartItem
              key={item.productId}
              item={item}
              onUpdateQuantity={updateQuantity}
              onRemove={removeItem}
            />
          ))}

          <button
            onClick={clearCart}
            className="text-red-600 dark:text-red-400 hover:underline text-sm mt-4"
          >
            Vider le panier
          </button>
        </div>

        <div className="lg:col-span-1">
          <CartSummary
            summary={getSummary()}
            onCheckout={handleCheckout}
            checkoutLabel="Passer la commande"
          />
          <button
            onClick={() => router.push('/products')}
            className="w-full mt-3 text-blue-600 dark:text-blue-400 hover:underline"
          >
            Continuer mes achats
          </button>
        </div>
      </div>
    </div>
  );
}

