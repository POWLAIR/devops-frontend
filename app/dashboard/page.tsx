'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Home, ChevronRight, ShoppingBag, Package, CreditCard, ExternalLink } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Table } from '@/components/ui/Table';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuth } from '@/lib/auth-context';
import {
  formatPrice,
  formatDateTime,
  truncateId,
  calculateCommission,
  getOrderStatusDisplay,
} from '@/lib/utils';
import { USER_ROLES, PLATFORM_COMMISSION_RATE } from '@/lib/constants';
import type { Order, OrderItem, Product } from '@/lib/types';
import type { OrderStatus, PaymentStatus } from '@/lib/constants';
import type { Column } from '@/components/ui/Table';

// ─── Normalisation ────────────────────────────────────────────────────────────

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
    total: parseFloat(raw.total as string) || 0,
    status: raw.status as OrderStatus,
    payment_id: (raw.payment_id ?? raw.paymentId) as string | undefined,
    payment_status: (raw.payment_status ?? raw.paymentStatus) as PaymentStatus | undefined,
    created_at: ((raw.created_at ?? raw.createdAt ?? '') as string),
    updated_at: (raw.updated_at ?? raw.updatedAt) as string | undefined,
  };
}

// ─── KPI card ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-background)] p-6">
      <p className="text-sm font-medium text-[var(--neutral-500)]">{label}</p>
      <p className="mt-2 text-3xl font-bold text-[var(--foreground)]">{value}</p>
      <p className="mt-1 text-xs text-[var(--neutral-400)]">{sub}</p>
    </div>
  );
}

const ORDER_STATUS_BADGE: Record<string, 'warning' | 'primary' | 'secondary' | 'success' | 'error' | 'neutral'> = {
  pending: 'warning',
  confirmed: 'primary',
  shipped: 'secondary',
  delivered: 'success',
  cancelled: 'error',
};

// ─── Contenu principal ────────────────────────────────────────────────────────

function DashboardContent() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [activeProductCount, setActiveProductCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [resOrders, resProducts] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/products'),
      ]);

      // Handle 401 on any response
      if (resOrders.status === 401 || resProducts.status === 401) {
        await logout();
        router.replace('/login?redirect=/dashboard');
        return;
      }

      if (!resOrders.ok || !resProducts.ok) {
        setError('Impossible de charger les données du tableau de bord.');
        return;
      }

      // Orders
      const rawOrders = (await resOrders.json()) as
        | Record<string, unknown>[]
        | { orders?: Record<string, unknown>[] };
      const ordersList = Array.isArray(rawOrders) ? rawOrders : (rawOrders.orders ?? []);
      setOrders(ordersList.map(normalizeOrder));

      // Products — count active ones
      const rawProducts = (await resProducts.json()) as
        | Record<string, unknown>[]
        | { products?: Record<string, unknown>[] };
      const productsList = Array.isArray(rawProducts)
        ? rawProducts
        : ((rawProducts.products ?? []) as Record<string, unknown>[]);
      const active = (productsList as unknown as Array<Product & { isActive?: boolean }>).filter(
        (p) => p.is_active !== false && (p as unknown as Record<string, unknown>).isActive !== false
      );
      setActiveProductCount(active.length);
    } catch {
      setError('Erreur réseau. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  }, [logout, router]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ── Derived KPIs ────────────────────────────────────────────────────────────

  // CA = somme des totaux des commandes payées (source de vérité fiable quelle que
  // soit la présence de records dans le payment-service).
  // L'order-service retourne 'paid' (valeur hors type PaymentStatus front), d'où le cast string.
  const paidOrders = orders.filter((o) => {
    const ps = o.payment_status as string | undefined;
    return ps === 'paid' || ps === 'succeeded';
  });
  const revenue = paidOrders.reduce((sum, o) => sum + (o.total ?? 0), 0);
  const commission = calculateCommission(revenue, PLATFORM_COMMISSION_RATE);
  const netAmount = revenue - commission;
  const avgBasket = orders.length > 0 ? revenue / orders.length : 0;

  // ── Last 5 orders ────────────────────────────────────────────────────────────

  const lastOrders = [...orders]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const orderColumns: Column<Order>[] = [
    {
      key: 'id',
      header: 'Commande',
      render: (row) => (
        <span className="font-mono text-xs text-[var(--neutral-600)]">#{truncateId(row.id, 8)}</span>
      ),
    },
    {
      key: 'created_at',
      header: 'Date',
      render: (row) => (
        <span className="text-sm text-[var(--neutral-500)] whitespace-nowrap">
          {formatDateTime(row.created_at)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Statut',
      render: (row) => {
        const display = getOrderStatusDisplay(row.status);
        return (
          <Badge variant={ORDER_STATUS_BADGE[row.status] ?? 'neutral'}>{display.label}</Badge>
        );
      },
    },
    {
      key: 'total',
      header: 'Total',
      render: (row) => (
        <span className="font-medium text-[var(--foreground)]">{formatPrice(row.total)}</span>
      ),
      className: 'text-right',
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
          Voir
        </Button>
      ),
      className: 'text-right',
    },
  ];

  const isMerchant =
    user?.role === USER_ROLES.MERCHANT_OWNER || user?.role === USER_ROLES.MERCHANT_STAFF;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav
          aria-label="Fil d'Ariane"
          className="flex items-center gap-1.5 text-sm text-[var(--neutral-500)] mb-6"
        >
          <Link
            href="/"
            className="hover:text-[var(--foreground)] transition-colors flex items-center gap-1"
          >
            <Home size={14} />
            Accueil
          </Link>
          <ChevronRight size={14} />
          <span className="text-[var(--foreground)] font-medium">Tableau de bord</span>
        </nav>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">Tableau de bord</h1>
            {user && (
              <p className="text-sm text-[var(--neutral-500)] mt-1">
                Bienvenue, {user.full_name || user.email}
              </p>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={fetchAll} loading={isLoading}>
            Actualiser
          </Button>
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

        {/* KPIs principaux */}
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <KpiCard
              label="Chiffre d'affaires"
              value={formatPrice(revenue)}
              sub="commandes payées"
            />
            <KpiCard
              label="Commandes"
              value={String(orders.length)}
              sub="commandes au total"
            />
            <KpiCard
              label="Panier moyen"
              value={formatPrice(avgBasket)}
              sub="par commande"
            />
            <KpiCard
              label="Produits actifs"
              value={String(activeProductCount)}
              sub="en catalogue"
            />
          </div>
        )}

        {/* Commission + Net */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 mb-8">
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 mb-8">
            <KpiCard
              label="Commission plateforme (5%)"
              value={formatPrice(commission)}
              sub="reversée à la plateforme"
            />
            <KpiCard
              label="Net marchand"
              value={formatPrice(netAmount)}
              sub="après commission"
            />
          </div>
        )}

        {/* Dernières commandes */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              Dernières commandes
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/orders')}
            >
              Voir tout
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
              ))}
            </div>
          ) : lastOrders.length === 0 ? (
            <EmptyState
              icon={<ShoppingBag size={24} />}
              title="Aucune commande"
              description="Les commandes de votre boutique apparaîtront ici."
            />
          ) : (
            <Table<Order>
              columns={orderColumns}
              data={lastOrders}
              keyExtractor={(row) => row.id}
              emptyMessage="Aucune commande."
            />
          )}
        </section>

        {/* Accès rapides */}
        <section>
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Accès rapides</h2>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              leftIcon={<ShoppingBag size={16} />}
              onClick={() => router.push('/orders')}
            >
              Voir les commandes
            </Button>
            {isMerchant && (
              <Button
                variant="outline"
                leftIcon={<Package size={16} />}
                onClick={() => router.push('/products/manage')}
              >
                Gérer les produits
              </Button>
            )}
            <Button
              variant="outline"
              leftIcon={<CreditCard size={16} />}
              onClick={() => router.push('/payments')}
            >
              Voir les paiements
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute
      allowedRoles={[
        USER_ROLES.MERCHANT_OWNER,
        USER_ROLES.MERCHANT_STAFF,
        USER_ROLES.PLATFORM_ADMIN,
      ]}
    >
      <DashboardContent />
    </ProtectedRoute>
  );
}
