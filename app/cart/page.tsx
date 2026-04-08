'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Minus, Plus, Trash2, ShoppingCart, AlertTriangle, Home, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { formatPrice } from '@/lib/utils';
import { SHIPPING_FREE_THRESHOLD, SHIPPING_FEE } from '@/lib/constants';
import { apiFetch } from '@/lib/api-client';

interface StockValidationResult {
  productId: string;
  available: boolean;
  stock: number;
}

export default function CartPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { items, updateQuantity, removeItem, clearCart, total } = useCart();

  const [clearModalOpen, setClearModalOpen] = useState(false);
  const [stockIssues, setStockIssues] = useState<Record<string, string>>({});
  const [isValidating, setIsValidating] = useState(false);

  const shipping = total > SHIPPING_FREE_THRESHOLD ? 0 : items.length > 0 ? SHIPPING_FEE : 0;
  const grandTotal = total + shipping;
  const hasStockIssue = Object.keys(stockIssues).length > 0;

  const validateStock = useCallback(async () => {
    if (items.length === 0) return;
    setIsValidating(true);
    try {
      // Utilise l'endpoint "all" (cross-tenant) pour rester cohérent avec
      // l'affichage public des produits et éviter les faux "rupture de stock"
      const res = await apiFetch('/api/products/all/validate-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        }),
        skipUnauthorizedHandling: true,
        skipErrorToast: true,
      });
      if (!res.ok) return;
      const data = await res.json() as {
        valid: boolean;
        products: StockValidationResult[];
      };
      const issues: Record<string, string> = {};
      for (const p of data.products ?? []) {
        if (!p.available) {
          const item = items.find((i) => i.productId === p.productId);
          const name = item?.name ?? p.productId;
          const stock = parseInt(String(p.stock ?? 0), 10);
          issues[p.productId] =
            stock === 0
              ? `"${name}" est en rupture de stock.`
              : `"${name}" : seulement ${stock} disponible(s).`;
        }
      }
      setStockIssues(issues);
    } catch {
      // Validation dégradée
    } finally {
      setIsValidating(false);
    }
  }, [items]);

  useEffect(() => {
    validateStock();
    // Relancer uniquement au montage ou changement du contenu du panier
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

  const handleCheckout = () => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/checkout');
      return;
    }
    router.push('/checkout');
  };

  const handleClearConfirm = () => {
    clearCart();
    setClearModalOpen(false);
    setStockIssues({});
  };

  if (items.length === 0) {
    return (
      <div className="max-w-screen-lg mx-auto px-4 sm:px-6 py-12">
        <EmptyState
          icon={<ShoppingCart size={32} />}
          title="Votre panier est vide"
          description="Explorez notre catalogue et ajoutez des articles à votre panier."
          action={
            <Link
              href="/products"
              className="inline-flex items-center justify-center rounded-lg border font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)] border-transparent h-10 px-4 text-sm"
            >
              Découvrir les produits
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="max-w-screen-lg mx-auto px-4 sm:px-6 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-[var(--neutral-500)] mb-8 flex-wrap">
        <Link href="/" className="flex items-center gap-1 hover:text-[var(--foreground)] transition-colors">
          <Home size={14} />
          <span>Accueil</span>
        </Link>
        <ChevronRight size={14} className="shrink-0" />
        <span className="text-[var(--foreground)] font-medium">Panier</span>
      </nav>

      <h1 className="text-2xl font-bold text-[var(--foreground)] mb-8">
        Mon panier{' '}
        <span className="text-base font-normal text-[var(--neutral-500)]">
          ({items.reduce((s, i) => s + i.quantity, 0)} article{items.reduce((s, i) => s + i.quantity, 0) > 1 ? 's' : ''})
        </span>
      </h1>

      {/* Alerte stock global */}
      {hasStockIssue && (
        <div className="flex items-start gap-3 mb-6 px-4 py-3 rounded-xl bg-[var(--warning-light,color-mix(in_srgb,var(--warning)_10%,transparent))] border border-[var(--warning)]">
          <AlertTriangle size={18} className="text-[var(--warning)] mt-0.5 shrink-0" />
          <div className="text-sm text-[var(--foreground)]">
            <p className="font-semibold mb-1">Certains articles ne sont plus disponibles en quantité souhaitée :</p>
            <ul className="list-disc list-inside space-y-0.5">
              {Object.values(stockIssues).map((msg, i) => (
                <li key={i}>{msg}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Liste des articles */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            const hasIssue = Boolean(stockIssues[item.productId]);
            return (
              <div
                key={item.productId}
                className={`flex gap-4 p-4 rounded-xl border transition-colors ${
                  hasIssue
                    ? 'border-[var(--warning)] bg-[var(--warning-light,color-mix(in_srgb,var(--warning)_5%,transparent))]'
                    : 'border-[var(--border-color)] bg-[var(--card-background)]'
                }`}
              >
                {/* Image */}
                <Link
                  href={`/products/${item.productId}`}
                  className="relative w-20 h-20 rounded-lg bg-[var(--neutral-100)] overflow-hidden flex-shrink-0 hover:opacity-80 transition-opacity"
                >
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      sizes="80px"
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[var(--neutral-400)]">
                      <ShoppingCart size={20} />
                    </div>
                  )}
                </Link>

                {/* Infos */}
                <div className="flex-1 min-w-0 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/products/${item.productId}`}
                      className="text-sm font-semibold text-[var(--foreground)] hover:text-[var(--primary)] transition-colors line-clamp-2"
                    >
                      {item.name}
                    </Link>
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="p-1.5 rounded-lg text-[var(--neutral-400)] hover:text-[var(--error)] hover:bg-[var(--error-light,color-mix(in_srgb,var(--error)_10%,transparent))] transition-colors flex-shrink-0"
                      aria-label={`Supprimer ${item.name}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <p className="text-sm text-[var(--neutral-500)]">
                    Prix unitaire : <span className="font-medium text-[var(--foreground)]">{formatPrice(item.price)}</span>
                  </p>

                  {hasIssue && (
                    <p className="text-xs text-[var(--warning)] font-medium flex items-center gap-1">
                      <AlertTriangle size={12} />
                      {stockIssues[item.productId]}
                    </p>
                  )}

                  <div className="flex items-center justify-between gap-3 mt-auto">
                    {/* Sélecteur quantité */}
                    <div className="flex items-center border border-[var(--border-color)] rounded-lg overflow-hidden">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="px-2.5 h-8 text-[var(--foreground)] hover:bg-[var(--neutral-100)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        aria-label="Diminuer"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="px-3 h-8 flex items-center justify-center text-sm font-medium text-[var(--foreground)] min-w-[2.5rem] text-center border-x border-[var(--border-color)]">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="px-2.5 h-8 text-[var(--foreground)] hover:bg-[var(--neutral-100)] transition-colors"
                        aria-label="Augmenter"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    {/* Total ligne */}
                    <span className="text-base font-bold text-[var(--primary)]">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Vider le panier */}
          <div className="flex justify-end pt-2">
            <button
              onClick={() => setClearModalOpen(true)}
              className="text-sm text-[var(--neutral-500)] hover:text-[var(--error)] transition-colors flex items-center gap-1.5"
            >
              <Trash2 size={14} />
              Vider le panier
            </button>
          </div>
        </div>

        {/* Résumé */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-xl border border-[var(--border-color)] bg-[var(--card-background)] p-6 space-y-4">
            <h2 className="text-base font-semibold text-[var(--foreground)]">Résumé de la commande</h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--neutral-600)]">Sous-total</span>
                <span className="font-medium text-[var(--foreground)]">{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--neutral-600)]">Frais de livraison</span>
                {shipping === 0 ? (
                  <span className="font-medium text-[var(--success)]">Gratuit</span>
                ) : (
                  <span className="font-medium text-[var(--foreground)]">{formatPrice(shipping)}</span>
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

            <div className="space-y-2 pt-2">
              <Button
                variant="primary"
                size="md"
                className="w-full"
                disabled={hasStockIssue || isValidating}
                onClick={handleCheckout}
              >
                {isValidating ? 'Vérification…' : 'Passer la commande'}
              </Button>
              <Link
                href="/products"
                className="inline-flex items-center justify-center w-full rounded-lg border font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 bg-transparent text-[var(--foreground)] border-[var(--border-color)] hover:bg-[var(--neutral-100)] h-10 px-4 text-sm"
              >
                Continuer les achats
              </Link>
            </div>

            {hasStockIssue && (
              <p className="text-xs text-[var(--warning)] text-center">
                Corrigez les articles indisponibles avant de commander.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Modal de confirmation — Vider le panier */}
      <Modal
        open={clearModalOpen}
        onClose={() => setClearModalOpen(false)}
        title="Vider le panier"
        size="sm"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setClearModalOpen(false)}>
              Annuler
            </Button>
            <Button variant="primary" size="sm" onClick={handleClearConfirm}>
              Vider le panier
            </Button>
          </>
        }
      >
        <p className="text-sm text-[var(--neutral-600)]">
          Êtes-vous sûr de vouloir supprimer tous les articles de votre panier ? Cette action est irréversible.
        </p>
      </Modal>
    </div>
  );
}
