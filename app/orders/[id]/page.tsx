'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Home,
  ChevronRight,
  ArrowLeft,
  CreditCard,
  ExternalLink,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton, SkeletonText } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';
import { USER_ROLES, ORDER_STATUSES } from '@/lib/constants';
import { apiFetch, ApiUnauthorizedError } from '@/lib/api-client';
import {
  getOrderStatusDisplay,
  getPaymentStatusDisplay,
  formatPrice,
  formatDateTime,
  truncateId,
} from '@/lib/utils';
import type { Order, OrderItem } from '@/lib/types';
import type { OrderStatus, PaymentStatus } from '@/lib/constants';

// Normalise la réponse camelCase de l'order-service vers le type snake_case du frontend
function normalizeOrder(raw: Record<string, unknown>): Order {
  const rawItems = (raw.items ?? []) as Array<Record<string, unknown>>;
  const items: OrderItem[] = rawItems.map((item) => ({
    id: item.id as string | undefined,
    product_id: (item.product_id ?? item.productId ?? '') as string,
    name: item.name as string | undefined,
    quantity: item.quantity as number,
    price: item.price as number,
  }));
  return {
    id: raw.id as string,
    user_id: (raw.user_id ?? raw.userId) as string | undefined,
    tenant_id: (raw.tenant_id ?? raw.tenantId) as string | undefined,
    items,
    total: raw.total as number,
    status: raw.status as OrderStatus,
    payment_id: (raw.payment_id ?? raw.paymentId) as string | undefined,
    payment_status: (raw.payment_status ?? raw.paymentStatus) as PaymentStatus | undefined,
    created_at: ((raw.created_at ?? raw.createdAt ?? '') as string),
    updated_at: (raw.updated_at ?? raw.updatedAt) as string | undefined,
  };
}

const UPDATABLE_STATUSES: { label: string; value: OrderStatus }[] = [
  { label: 'En attente', value: ORDER_STATUSES.PENDING },
  { label: 'Confirmée', value: ORDER_STATUSES.CONFIRMED },
  { label: 'Expédiée', value: ORDER_STATUSES.SHIPPED },
  { label: 'Livrée', value: ORDER_STATUSES.DELIVERED },
  { label: 'Annulée', value: ORDER_STATUSES.CANCELLED },
];

function OrderDetailContent() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const orderId = params.id;
  const { user } = useAuth();
  const { addToast } = useToast();

  const isMerchantOrAdmin =
    user?.role === USER_ROLES.MERCHANT_OWNER ||
    user?.role === USER_ROLES.MERCHANT_STAFF ||
    user?.role === USER_ROLES.PLATFORM_ADMIN;

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusSuccess, setStatusSuccess] = useState(false);

  const fetchOrder = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setNotFound(false);
    try {
      const res = await apiFetch(`/api/orders/${orderId}`);
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      if (!res.ok) {
        const data = (await res.json()) as { message?: string; detail?: string };
        setError(data.message ?? data.detail ?? 'Impossible de charger la commande.');
        return;
      }
      const data = (await res.json()) as Record<string, unknown>;
      setOrder(normalizeOrder(data));
    } catch (e) {
      if (e instanceof ApiUnauthorizedError) return;
      setError('Erreur réseau. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (!order || newStatus === order.status) return;
    setIsUpdatingStatus(true);
    setStatusSuccess(false);
    try {
      const res = await apiFetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = (await res.json()) as Record<string, unknown> & { message?: string; detail?: string };
      if (!res.ok) {
        addToast(data.message ?? data.detail ?? 'Impossible de mettre à jour le statut.', 'error');
        return;
      }
      setOrder(normalizeOrder(data));
      setStatusSuccess(true);
      addToast('Statut mis à jour avec succès.', 'success');
      setTimeout(() => setStatusSuccess(false), 3000);
    } catch (e) {
      if (e instanceof ApiUnauthorizedError) return;
      addToast('Erreur réseau. Veuillez réessayer.', 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const orderStatusVariant = (status: OrderStatus): 'warning' | 'primary' | 'secondary' | 'success' | 'error' | 'neutral' => {
    const map: Record<string, 'warning' | 'primary' | 'secondary' | 'success' | 'error' | 'neutral'> = {
      pending: 'warning',
      confirmed: 'primary',
      shipped: 'secondary',
      delivered: 'success',
      cancelled: 'error',
    };
    return map[status] ?? 'neutral';
  };

  const paymentStatusVariant = (status: string): 'neutral' | 'success' | 'error' => {
    const map: Record<string, 'neutral' | 'success' | 'error'> = {
      pending: 'neutral',
      unpaid: 'neutral',
      succeeded: 'success',
      paid: 'success',
      failed: 'error',
    };
    return map[status] ?? 'neutral';
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav aria-label="Fil d'Ariane" className="flex items-center gap-1.5 text-sm text-[var(--neutral-500)] mb-6">
          <Link href="/" className="hover:text-[var(--foreground)] transition-colors flex items-center gap-1">
            <Home size={14} />
            Accueil
          </Link>
          <ChevronRight size={14} />
          <Link href="/orders" className="hover:text-[var(--foreground)] transition-colors">
            Mes commandes
          </Link>
          <ChevronRight size={14} />
          <span className="text-[var(--foreground)] font-medium">
            {order ? `#${truncateId(order.id, 8)}` : '…'}
          </span>
        </nav>

        {/* Bouton retour */}
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<ArrowLeft size={16} />}
          onClick={() => router.push('/orders')}
          className="mb-6"
        >
          Retour aux commandes
        </Button>

        {/* Erreur réseau */}
        {error && !isLoading && (
          <div
            role="alert"
            aria-live="polite"
            className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--error-light)] text-[var(--error)] text-sm"
          >
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {/* 404 */}
        {notFound && !isLoading && (
          <EmptyState
            title="Commande introuvable"
            description="Cette commande n'existe pas ou vous n'y avez pas accès."
            action={
              <Button variant="outline" onClick={() => router.push('/orders')}>
                Retour aux commandes
              </Button>
            }
          />
        )}

        {/* Skeleton */}
        {isLoading && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-background)] p-6 space-y-4">
              <Skeleton className="h-7 w-48 rounded-lg" />
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-xl" />
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-background)] p-6 space-y-3">
              <Skeleton className="h-6 w-36 rounded-lg" />
              <SkeletonText lines={3} />
            </div>
          </div>
        )}

        {/* Contenu principal */}
        {!isLoading && !notFound && order && (
          <div className="space-y-6">
            {/* Carte résumé */}
            <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-background)] p-6">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-xl font-bold text-[var(--foreground)] font-mono">
                    Commande #{truncateId(order.id, 12)}
                  </h1>
                  <p className="text-sm text-[var(--neutral-500)] mt-1">
                    Passée le {formatDateTime(order.created_at)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={orderStatusVariant(order.status)}>
                    {getOrderStatusDisplay(order.status).label}
                  </Badge>
                  {order.payment_status && (
                    <Badge variant={paymentStatusVariant(order.payment_status)}>
                      {getPaymentStatusDisplay(order.payment_status).label}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Infos détaillées */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-xl bg-[var(--neutral-50)] p-3">
                  <p className="text-xs text-[var(--neutral-500)] mb-1">ID complet</p>
                  <p className="text-xs font-mono text-[var(--foreground)] break-all">{order.id}</p>
                </div>
                <div className="rounded-xl bg-[var(--neutral-50)] p-3">
                  <p className="text-xs text-[var(--neutral-500)] mb-1">Total</p>
                  <p className="text-base font-bold text-[var(--foreground)]">
                    {formatPrice(order.total)}
                  </p>
                </div>
                <div className="rounded-xl bg-[var(--neutral-50)] p-3">
                  <p className="text-xs text-[var(--neutral-500)] mb-1">Articles</p>
                  <p className="text-base font-bold text-[var(--foreground)]">
                    {order.items.length}
                  </p>
                </div>
                <div className="rounded-xl bg-[var(--neutral-50)] p-3">
                  <p className="text-xs text-[var(--neutral-500)] mb-1">Paiement</p>
                  <p className="text-sm font-medium text-[var(--foreground)]">
                    {order.payment_status
                      ? getPaymentStatusDisplay(order.payment_status).label
                      : '—'}
                  </p>
                </div>
              </div>

              {/* Lien paiement */}
              {order.payment_id && (
                <div className="mt-4 pt-4 border-t border-[var(--border-color)]">
                  <Link
                    href={`/payments/${order.payment_id}`}
                    className="inline-flex items-center gap-2 text-sm text-[var(--primary)] hover:underline"
                  >
                    <CreditCard size={14} />
                    Voir le paiement associé
                    <ExternalLink size={12} />
                  </Link>
                </div>
              )}
            </div>

            {/* Modification du statut (marchands/admins) */}
            {isMerchantOrAdmin && (
              <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-background)] p-6">
                <h2 className="text-base font-semibold text-[var(--foreground)] mb-4">
                  Modifier le statut
                </h2>
                <div className="flex items-center gap-3 flex-wrap">
                  <label htmlFor="status-select" className="text-sm text-[var(--neutral-600)]">
                    Nouveau statut :
                  </label>
                  <div className="flex items-center gap-2">
                    <select
                      id="status-select"
                      value={order.status}
                      onChange={(e) => handleStatusChange(e.target.value as OrderStatus)}
                      disabled={isUpdatingStatus}
                      className="h-9 px-3 rounded-lg border border-[var(--border-color)] bg-[var(--card-background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] disabled:opacity-50"
                    >
                      {UPDATABLE_STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                    {isUpdatingStatus && <Spinner size="sm" />}
                    {statusSuccess && !isUpdatingStatus && (
                      <span
                        role="status"
                        aria-live="polite"
                        className="flex items-center gap-1 text-sm text-[var(--success)]"
                      >
                        <CheckCircle size={16} />
                        Mis à jour
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tableau des articles */}
            <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-background)] p-6">
              <h2 className="text-base font-semibold text-[var(--foreground)] mb-4">Articles</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border-color)]">
                      <th className="pb-3 text-left font-semibold text-[var(--neutral-600)]">
                        Produit
                      </th>
                      <th className="pb-3 text-center font-semibold text-[var(--neutral-600)]">
                        Qté
                      </th>
                      <th className="pb-3 text-right font-semibold text-[var(--neutral-600)]">
                        Prix unitaire
                      </th>
                      <th className="pb-3 text-right font-semibold text-[var(--neutral-600)]">
                        Total ligne
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item, index) => (
                      <tr
                        key={item.id ?? index}
                        className="border-b border-[var(--border-color)] last:border-0"
                      >
                        <td className="py-3 text-[var(--foreground)]">
                          {item.name ? (
                            <span className="font-medium">{item.name}</span>
                          ) : (
                            <span className="font-mono text-xs text-[var(--neutral-500)]">
                              {truncateId(item.product_id, 12)}
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-center text-[var(--foreground)]">
                          {item.quantity}
                        </td>
                        <td className="py-3 text-right text-[var(--neutral-600)]">
                          {formatPrice(item.price)}
                        </td>
                        <td className="py-3 text-right font-medium text-[var(--foreground)]">
                          {formatPrice(item.price * item.quantity)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td
                        colSpan={3}
                        className="pt-4 text-right font-semibold text-[var(--neutral-600)]"
                      >
                        Total commande
                      </td>
                      <td className="pt-4 text-right font-bold text-lg text-[var(--foreground)]">
                        {formatPrice(order.total)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OrderDetailPage() {
  return (
    <ProtectedRoute>
      <OrderDetailContent />
    </ProtectedRoute>
  );
}
