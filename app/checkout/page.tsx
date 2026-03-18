'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ShoppingBag,
  CheckCircle,
  AlertCircle,
  Home,
  ChevronRight,
  CreditCard,
  AlertTriangle,
} from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { formatPrice } from '@/lib/utils';
import { SHIPPING_FREE_THRESHOLD, SHIPPING_FEE } from '@/lib/constants';
import type { Order, CreatePaymentIntentResponse } from '@/lib/types';

type Step = 1 | 2;

function CheckoutContent() {
  const router = useRouter();
  const { items, total, clearCart } = useCart();
  const { logout } = useAuth();

  const shipping = total > SHIPPING_FREE_THRESHOLD ? 0 : items.length > 0 ? SHIPPING_FEE : 0;
  const grandTotal = total + shipping;

  const [step, setStep] = useState<Step>(1);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [paymentIntent, setPaymentIntent] = useState<CreatePaymentIntentResponse | null>(null);

  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    if (items.length === 0 && step === 1) {
      router.replace('/cart');
    }
  }, [items.length, step, router]);

  const handleSessionExpired = useCallback(async () => {
    await logout();
    router.replace('/login?redirect=/checkout');
  }, [logout, router]);

  const createPaymentIntent = useCallback(
    async (currentOrderId: string, amount: number) => {
      setIsCreatingPayment(true);
      setPaymentError(null);
      try {
        const res = await fetch('/api/payments/create-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount, order_id: currentOrderId }),
        });
        if (res.status === 401) {
          await handleSessionExpired();
          return;
        }
        const data = (await res.json()) as CreatePaymentIntentResponse & {
          message?: string;
          detail?: string;
        };
        if (!res.ok) {
          setPaymentError(data.message ?? data.detail ?? 'Impossible de créer le paiement.');
          return;
        }
        setPaymentIntent(data);
      } catch {
        setPaymentError('Impossible de contacter le service de paiement.');
      } finally {
        setIsCreatingPayment(false);
      }
    },
    [handleSessionExpired],
  );

  const handleConfirmOrder = async () => {
    setIsCreatingOrder(true);
    setOrderError(null);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            price: i.price,
          })),
          status: 'pending',
        }),
      });
      if (res.status === 401) {
        await handleSessionExpired();
        return;
      }
      const data = (await res.json()) as Order & { message?: string; detail?: string };
      if (!res.ok) {
        setOrderError(data.message ?? data.detail ?? 'Impossible de créer la commande.');
        return;
      }
      setOrderId(data.id);
      setStep(2);
      await createPaymentIntent(data.id, grandTotal);
    } catch {
      setOrderError('Impossible de contacter le service de commande.');
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const handleSimulatePayment = async () => {
    if (!orderId) return;
    setIsSimulating(true);
    try {
      await fetch('/api/products/decrement-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        }),
      });
    } catch {
      // Dégradé gracieux : on continue même si le décrément échoue
    }
    clearCart();
    router.push('/orders?success=true');
  };

  return (
    <div className="max-w-screen-lg mx-auto px-4 sm:px-6 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-[var(--neutral-500)] mb-8 flex-wrap">
        <Link
          href="/"
          className="flex items-center gap-1 hover:text-[var(--foreground)] transition-colors"
        >
          <Home size={14} />
          <span>Accueil</span>
        </Link>
        <ChevronRight size={14} className="shrink-0" />
        <Link href="/cart" className="hover:text-[var(--foreground)] transition-colors">
          Panier
        </Link>
        <ChevronRight size={14} className="shrink-0" />
        <span className="text-[var(--foreground)] font-medium">Paiement</span>
      </nav>

      <h1 className="text-2xl font-bold text-[var(--foreground)] mb-8">Finaliser la commande</h1>

      {/* Stepper */}
      <div className="flex items-center gap-3 mb-10">
        <div
          className={`flex items-center gap-2 text-sm font-medium ${step >= 1 ? 'text-[var(--primary)]' : 'text-[var(--neutral-400)]'}`}
        >
          <span
            className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold border-2 ${
              step > 1
                ? 'bg-[var(--primary)] border-[var(--primary)] text-[var(--primary-foreground)]'
                : step === 1
                  ? 'border-[var(--primary)] text-[var(--primary)]'
                  : 'border-[var(--neutral-300)] text-[var(--neutral-400)]'
            }`}
          >
            {step > 1 ? <CheckCircle size={14} /> : '1'}
          </span>
          Récapitulatif
        </div>
        <div className="flex-1 h-px bg-[var(--border-color)]" />
        <div
          className={`flex items-center gap-2 text-sm font-medium ${step >= 2 ? 'text-[var(--primary)]' : 'text-[var(--neutral-400)]'}`}
        >
          <span
            className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold border-2 ${
              step === 2
                ? 'border-[var(--primary)] text-[var(--primary)]'
                : 'border-[var(--neutral-300)] text-[var(--neutral-400)]'
            }`}
          >
            2
          </span>
          Paiement
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-[var(--foreground)]">
                Articles de votre commande
              </h2>

              {items.map((item) => (
                <div
                  key={item.productId}
                  className="flex gap-4 p-4 rounded-xl border border-[var(--border-color)] bg-[var(--card-background)]"
                >
                  <div className="relative w-16 h-16 rounded-lg bg-[var(--neutral-100)] overflow-hidden flex-shrink-0">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[var(--neutral-400)]">
                        <ShoppingBag size={18} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--foreground)] line-clamp-1">
                      {item.name}
                    </p>
                    <p className="text-xs text-[var(--neutral-500)] mt-0.5">
                      Qté : {item.quantity}
                    </p>
                    <p className="text-xs text-[var(--neutral-500)]">
                      Prix unitaire :{' '}
                      <span className="font-medium text-[var(--foreground)]">
                        {formatPrice(item.price)}
                      </span>
                    </p>
                  </div>
                  <span className="text-sm font-bold text-[var(--primary)] shrink-0">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}

              {orderError && (
                <div
                  className="flex items-start gap-3 px-4 py-3 rounded-xl bg-[color-mix(in_srgb,var(--error)_10%,transparent)] border border-[var(--error)]"
                  role="alert"
                  aria-live="polite"
                >
                  <AlertCircle size={16} className="text-[var(--error)] mt-0.5 shrink-0" />
                  <p className="text-sm text-[var(--error)]">{orderError}</p>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-base font-semibold text-[var(--foreground)]">Paiement</h2>

              {isCreatingPayment && (
                <div className="flex items-center justify-center py-12">
                  <Spinner size="lg" className="text-[var(--primary)]" />
                </div>
              )}

              {!isCreatingPayment && paymentError && (
                <div className="space-y-4">
                  <div
                    className="flex items-start gap-3 px-4 py-3 rounded-xl bg-[color-mix(in_srgb,var(--error)_10%,transparent)] border border-[var(--error)]"
                    role="alert"
                    aria-live="polite"
                  >
                    <AlertCircle size={16} className="text-[var(--error)] mt-0.5 shrink-0" />
                    <p className="text-sm text-[var(--error)]">{paymentError}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => orderId && createPaymentIntent(orderId, grandTotal)}
                  >
                    Réessayer
                  </Button>
                </div>
              )}

              {!isCreatingPayment && paymentIntent && (
                <div className="space-y-4">
                  <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-[color-mix(in_srgb,var(--warning)_12%,transparent)] border border-[var(--warning)]">
                    <AlertTriangle
                      size={16}
                      className="text-[var(--warning)] mt-0.5 shrink-0"
                    />
                    <div className="text-sm">
                      <p className="font-semibold text-[var(--foreground)]">
                        Mode test — aucun paiement réel
                      </p>
                      <p className="text-[var(--neutral-500)] mt-0.5">
                        Ce paiement est simulé. Aucune transaction bancaire réelle ne sera
                        effectuée.
                      </p>
                    </div>
                  </div>

                  <div className="p-5 rounded-xl border border-[var(--border-color)] bg-[var(--card-background)] space-y-3">
                    <div className="flex items-center gap-2 text-sm text-[var(--neutral-500)]">
                      <CreditCard size={16} className="shrink-0" />
                      <span>
                        Référence :{' '}
                        <span className="font-mono text-[var(--foreground)]">
                          {paymentIntent.payment_id}
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[var(--neutral-500)]">Montant à régler</span>
                      <span className="font-bold text-[var(--foreground)] text-base">
                        {formatPrice(paymentIntent.amount)}
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full"
                    loading={isSimulating}
                    onClick={handleSimulatePayment}
                    leftIcon={<CheckCircle size={18} />}
                  >
                    Simuler le paiement réussi
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Résumé commande */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-xl border border-[var(--border-color)] bg-[var(--card-background)] p-6 space-y-4">
            <h2 className="text-base font-semibold text-[var(--foreground)]">Résumé</h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--neutral-600)]">Sous-total</span>
                <span className="font-medium text-[var(--foreground)]">{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--neutral-600)]">Livraison</span>
                {shipping === 0 ? (
                  <span className="font-medium text-[var(--success)]">Gratuit</span>
                ) : (
                  <span className="font-medium text-[var(--foreground)]">
                    {formatPrice(shipping)}
                  </span>
                )}
              </div>
              {shipping > 0 && (
                <p className="text-xs text-[var(--neutral-500)]">
                  Livraison gratuite dès {formatPrice(SHIPPING_FREE_THRESHOLD)} d&apos;achat
                </p>
              )}
              <div className="border-t border-[var(--border-color)] pt-3 flex justify-between font-semibold text-base">
                <span className="text-[var(--foreground)]">Total TTC</span>
                <span className="text-[var(--primary)]">{formatPrice(grandTotal)}</span>
              </div>
            </div>

            {step === 1 && (
              <Button
                variant="primary"
                size="md"
                className="w-full"
                loading={isCreatingOrder}
                onClick={handleConfirmOrder}
              >
                Confirmer et payer
              </Button>
            )}

            {step === 2 && orderId && (
              <p className="text-xs text-[var(--neutral-500)] text-center break-all">
                Commande #{orderId.slice(0, 8)}&hellip;
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <ProtectedRoute>
      <CheckoutContent />
    </ProtectedRoute>
  );
}
