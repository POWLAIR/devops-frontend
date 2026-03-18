'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Home, ChevronRight, Plus, ShoppingBag, Trash2, ExternalLink, CheckCircle } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Table } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';
import { USER_ROLES, ORDER_STATUSES } from '@/lib/constants';
import {
  getOrderStatusDisplay,
  getPaymentStatusDisplay,
  formatPrice,
  formatDateTime,
  truncateId,
} from '@/lib/utils';
import type { Order, OrderItem } from '@/lib/types';
import type { OrderStatus, PaymentStatus } from '@/lib/constants';
import type { Column } from '@/components/ui/Table';

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

type StatusFilter = 'all' | OrderStatus;

const STATUS_TABS: { label: string; value: StatusFilter }[] = [
  { label: 'Toutes', value: 'all' },
  { label: 'En attente', value: ORDER_STATUSES.PENDING },
  { label: 'Confirmées', value: ORDER_STATUSES.CONFIRMED },
  { label: 'Expédiées', value: ORDER_STATUSES.SHIPPED },
  { label: 'Livrées', value: ORDER_STATUSES.DELIVERED },
  { label: 'Annulées', value: ORDER_STATUSES.CANCELLED },
];

interface OrderFormItem {
  product_id: string;
  quantity: string;
  price: string;
}

function OrderForm({
  onSuccess,
  onClose,
}: {
  onSuccess: () => void;
  onClose: () => void;
}) {
  const { addToast } = useToast();
  const [items, setItems] = useState<OrderFormItem[]>([
    { product_id: '', quantity: '1', price: '' },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addItem = () =>
    setItems((prev) => [...prev, { product_id: '', quantity: '1', price: '' }]);

  const removeItem = (index: number) =>
    setItems((prev) => prev.filter((_, i) => i !== index));

  const updateItem = (index: number, field: keyof OrderFormItem, value: string) =>
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedItems = items
      .filter((item) => item.product_id.trim())
      .map((item) => ({
        product_id: item.product_id.trim(),
        quantity: parseInt(item.quantity, 10) || 1,
        price: parseFloat(item.price) || 0,
      }));

    if (parsedItems.length === 0) {
      setError('Ajoutez au moins un article avec un ID produit.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: parsedItems, status: ORDER_STATUSES.PENDING }),
      });
      const data = (await res.json()) as { message?: string; detail?: string };
      if (!res.ok) {
        setError(data.message ?? data.detail ?? 'Impossible de créer la commande.');
        return;
      }
      addToast('Commande créée avec succès.', 'success');
      onSuccess();
    } catch {
      setError('Erreur réseau. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={index}
            className="grid grid-cols-[1fr_80px_100px_auto] gap-2 items-end"
          >
            <div>
              {index === 0 && (
                <label className="block text-xs font-medium text-[var(--neutral-600)] mb-1">
                  ID Produit
                </label>
              )}
              <input
                type="text"
                placeholder="uuid du produit"
                value={item.product_id}
                onChange={(e) => updateItem(index, 'product_id', e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-[var(--border-color)] bg-[var(--card-background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                required
              />
            </div>
            <div>
              {index === 0 && (
                <label className="block text-xs font-medium text-[var(--neutral-600)] mb-1">
                  Qté
                </label>
              )}
              <input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-[var(--border-color)] bg-[var(--card-background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                required
              />
            </div>
            <div>
              {index === 0 && (
                <label className="block text-xs font-medium text-[var(--neutral-600)] mb-1">
                  Prix (€)
                </label>
              )}
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={item.price}
                onChange={(e) => updateItem(index, 'price', e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-[var(--border-color)] bg-[var(--card-background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                required
              />
            </div>
            <div className={index === 0 ? 'mt-5' : ''}>
              <button
                type="button"
                onClick={() => removeItem(index)}
                disabled={items.length === 1}
                className="h-9 w-9 flex items-center justify-center rounded-lg text-[var(--neutral-400)] hover:text-[var(--error)] hover:bg-[var(--error-light)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Supprimer cet article"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Button type="button" variant="ghost" size="sm" onClick={addItem} leftIcon={<Plus size={14} />}>
        Ajouter un article
      </Button>

      {error && (
        <p role="alert" className="text-sm text-[var(--error)]">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-3 pt-2 border-t border-[var(--border-color)]">
        <Button type="button" variant="outline" onClick={onClose}>
          Annuler
        </Button>
        <Button type="submit" loading={isSubmitting}>
          Créer la commande
        </Button>
      </div>
    </form>
  );
}

function OrdersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, logout } = useAuth();

  const showSuccess = searchParams.get('success') === 'true';
  const isMerchantOrAdmin =
    user?.role === USER_ROLES.MERCHANT_OWNER ||
    user?.role === USER_ROLES.MERCHANT_STAFF ||
    user?.role === USER_ROLES.PLATFORM_ADMIN;

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showOrderForm, setShowOrderForm] = useState(false);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/orders');
      if (res.status === 401) {
        await logout();
        router.replace('/login?redirect=/orders');
        return;
      }
      if (!res.ok) {
        const data = (await res.json()) as { message?: string; detail?: string };
        setError(data.message ?? data.detail ?? 'Impossible de charger les commandes.');
        return;
      }
      const data = (await res.json()) as Record<string, unknown>[] | { orders?: Record<string, unknown>[] };
      const raw = Array.isArray(data) ? data : (data.orders ?? []);
      setOrders(raw.map(normalizeOrder));
    } catch {
      setError('Erreur réseau. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  }, [logout, router]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filteredOrders =
    statusFilter === 'all' ? orders : orders.filter((o) => o.status === statusFilter);

  const columns: Column<Order>[] = [
    {
      key: 'id',
      header: 'Commande',
      render: (row) => (
        <span className="font-mono text-xs text-[var(--neutral-600)]">
          #{truncateId(row.id, 8)}
        </span>
      ),
    },
    {
      key: 'created_at',
      header: 'Date',
      render: (row) => (
        <span className="text-sm text-[var(--neutral-600)] whitespace-nowrap">
          {formatDateTime(row.created_at)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Statut commande',
      render: (row) => {
        const display = getOrderStatusDisplay(row.status);
        const variantMap: Record<string, 'warning' | 'primary' | 'secondary' | 'success' | 'error' | 'neutral'> = {
          pending: 'warning',
          confirmed: 'primary',
          shipped: 'secondary',
          delivered: 'success',
          cancelled: 'error',
        };
        return (
          <Badge variant={variantMap[row.status] ?? 'neutral'}>{display.label}</Badge>
        );
      },
    },
    {
      key: 'payment_status',
      header: 'Paiement',
      render: (row) => {
        const status = row.payment_status ?? 'unpaid';
        const display = getPaymentStatusDisplay(status);
        const variantMap: Record<string, 'neutral' | 'success' | 'error'> = {
          pending: 'neutral',
          unpaid: 'neutral',
          succeeded: 'success',
          paid: 'success',
          failed: 'error',
        };
        return (
          <Badge variant={variantMap[status] ?? 'neutral'}>{display.label}</Badge>
        );
      },
    },
    {
      key: 'total',
      header: 'Total',
      render: (row) => (
        <span className="font-medium text-[var(--foreground)]">{formatPrice(row.total)}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <Button
          variant="ghost"
          size="sm"
          rightIcon={<ExternalLink size={14} />}
          onClick={() => router.push(`/orders/${row.id}`)}
        >
          Détail
        </Button>
      ),
      className: 'text-right',
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav aria-label="Fil d'Ariane" className="flex items-center gap-1.5 text-sm text-[var(--neutral-500)] mb-6">
          <Link href="/" className="hover:text-[var(--foreground)] transition-colors flex items-center gap-1">
            <Home size={14} />
            Accueil
          </Link>
          <ChevronRight size={14} />
          <span className="text-[var(--foreground)] font-medium">Mes commandes</span>
        </nav>

        {/* Success banner */}
        {showSuccess && (
          <div
            role="status"
            aria-live="polite"
            className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--success-light)] text-[var(--success)] text-sm font-medium"
          >
            <CheckCircle size={18} />
            Votre commande a été passée avec succès. Retrouvez-la ci-dessous.
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">Mes commandes</h1>
            {!isLoading && (
              <p className="text-sm text-[var(--neutral-500)] mt-1">
                {filteredOrders.length} commande{filteredOrders.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          {isMerchantOrAdmin && (
            <Button
              variant="primary"
              leftIcon={<Plus size={16} />}
              onClick={() => setShowOrderForm(true)}
            >
              Nouvelle commande
            </Button>
          )}
        </div>

        {/* Status tabs */}
        <div
          role="tablist"
          aria-label="Filtrer par statut"
          className="flex gap-1 mb-6 overflow-x-auto pb-1"
        >
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              role="tab"
              aria-selected={statusFilter === tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={
                'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ' +
                (statusFilter === tab.value
                  ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                  : 'bg-[var(--neutral-100)] text-[var(--neutral-600)] hover:bg-[var(--neutral-200)]')
              }
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div
            role="alert"
            aria-live="polite"
            className="mb-6 px-4 py-3 rounded-xl bg-[var(--error-light)] text-[var(--error)] text-sm"
          >
            {error}
          </div>
        )}

        {/* Loading skeleton */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <EmptyState
            icon={<ShoppingBag size={28} />}
            title="Aucune commande"
            description={
              statusFilter === 'all'
                ? 'Vous n\'avez pas encore passé de commande.'
                : `Aucune commande avec le statut "${STATUS_TABS.find((t) => t.value === statusFilter)?.label}".`
            }
            action={
              statusFilter !== 'all' ? (
                <Button variant="outline" size="sm" onClick={() => setStatusFilter('all')}>
                  Voir toutes les commandes
                </Button>
              ) : (
                <Button variant="primary" size="sm" onClick={() => router.push('/products')}>
                  Découvrir les produits
                </Button>
              )
            }
          />
        ) : (
          <Table<Order>
            columns={columns}
            data={filteredOrders}
            keyExtractor={(row) => row.id}
            emptyMessage="Aucune commande trouvée."
          />
        )}
      </div>

      {/* Modal OrderForm (marchands/admins) */}
      <Modal
        open={showOrderForm}
        onClose={() => setShowOrderForm(false)}
        title="Nouvelle commande"
        size="lg"
        closeOnBackdrop={false}
      >
        <OrderForm
          onSuccess={() => {
            setShowOrderForm(false);
            fetchOrders();
          }}
          onClose={() => setShowOrderForm(false)}
        />
      </Modal>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <ProtectedRoute>
      <OrdersContent />
    </ProtectedRoute>
  );
}
