'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Home, ChevronRight, Download, CreditCard } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Table } from '@/components/ui/Table';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Pagination } from '@/components/ui/Pagination';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { USER_ROLES, DEFAULT_PAGE_SIZE, PLATFORM_COMMISSION_RATE } from '@/lib/constants';
import {
  getPaymentStatusDisplay,
  formatPrice,
  formatDateTime,
  truncateId,
  calculateCommission,
} from '@/lib/utils';
import type { Payment } from '@/lib/types';
import type { PaymentStatus } from '@/lib/constants';
import type { Column } from '@/components/ui/Table';

function normalizePayment(raw: Record<string, unknown>): Payment {
  return {
    id: raw.id as string,
    order_id: ((raw.order_id ?? raw.orderId ?? '') as string),
    tenant_id: (raw.tenant_id ?? raw.tenantId) as string | undefined,
    user_id: (raw.user_id ?? raw.userId) as string | undefined,
    amount: raw.amount as number,
    commission: raw.commission as number | undefined,
    net_amount: (raw.net_amount ?? raw.netAmount) as number | undefined,
    currency: raw.currency as string | undefined,
    status: raw.status as PaymentStatus,
    provider: raw.provider as string | undefined,
    client_secret: (raw.client_secret ?? raw.clientSecret) as string | undefined,
    stripe_payment_intent_id: (raw.stripe_payment_intent_id ?? raw.stripePaymentIntentId) as string | undefined,
    created_at: ((raw.created_at ?? raw.createdAt ?? '') as string),
    updated_at: (raw.updated_at ?? raw.updatedAt) as string | undefined,
  };
}

function exportToCsv(payments: Payment[]) {
  const headers = ['ID', 'Commande', 'Montant (€)', 'Commission (€)', 'Net marchand (€)', 'Statut', 'Date'];
  const rows = payments.map((p) => {
    const commission = p.commission ?? calculateCommission(p.amount, PLATFORM_COMMISSION_RATE);
    const net = p.net_amount ?? (p.amount - commission);
    return [p.id, p.order_id, p.amount.toFixed(2), commission.toFixed(2), net.toFixed(2), p.status, p.created_at]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(',');
  });
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `paiements-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

const PAGE_SIZE = DEFAULT_PAGE_SIZE;

const PAYMENT_STATUS_VARIANT: Record<string, 'success' | 'warning' | 'error' | 'neutral'> = {
  succeeded: 'success',
  pending: 'warning',
  failed: 'error',
  refunded: 'neutral',
};

function KpiCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-background)] p-6">
      <p className="text-sm font-medium text-[var(--neutral-500)]">{label}</p>
      <p className="mt-2 text-3xl font-bold text-[var(--foreground)]">{value}</p>
      <p className="mt-1 text-xs text-[var(--neutral-400)]">{sub}</p>
    </div>
  );
}

function PaymentsContent() {
  const router = useRouter();
  const { logout } = useAuth();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const fetchPayments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/payments');
      if (res.status === 401) {
        await logout();
        router.replace('/login?redirect=/payments');
        return;
      }
      if (!res.ok) {
        const data = (await res.json()) as { message?: string; detail?: string };
        setError(data.message ?? data.detail ?? 'Impossible de charger les paiements.');
        return;
      }
      const data = (await res.json()) as Record<string, unknown>[] | { payments?: Record<string, unknown>[] };
      const raw = Array.isArray(data) ? data : (data.payments ?? []);
      setPayments(raw.map(normalizePayment));
    } catch {
      setError('Erreur réseau. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  }, [logout, router]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const succeededPayments = payments.filter((p) => p.status === 'succeeded');
  const totalRevenue = succeededPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalCommission = succeededPayments.reduce(
    (sum, p) => sum + (p.commission ?? calculateCommission(p.amount, PLATFORM_COMMISSION_RATE)),
    0
  );
  const totalNet = totalRevenue - totalCommission;

  const totalPages = Math.ceil(payments.length / PAGE_SIZE);
  const paginatedPayments = payments.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns: Column<Payment>[] = [
    {
      key: 'id',
      header: 'Paiement',
      render: (row) => (
        <span className="font-mono text-xs text-[var(--neutral-600)]">#{truncateId(row.id, 8)}</span>
      ),
    },
    {
      key: 'order_id',
      header: 'Commande',
      render: (row) => (
        <Link
          href={`/orders/${row.order_id}`}
          className="font-mono text-xs text-[var(--primary)] hover:underline"
        >
          #{truncateId(row.order_id, 8)}
        </Link>
      ),
    },
    {
      key: 'amount',
      header: 'Montant',
      render: (row) => (
        <span className="font-medium text-[var(--foreground)]">{formatPrice(row.amount)}</span>
      ),
    },
    {
      key: 'commission',
      header: 'Commission (5%)',
      render: (row) => {
        const commission = row.commission ?? calculateCommission(row.amount, PLATFORM_COMMISSION_RATE);
        return <span className="text-sm text-[var(--neutral-500)]">{formatPrice(commission)}</span>;
      },
    },
    {
      key: 'net',
      header: 'Net marchand',
      render: (row) => {
        const commission = row.commission ?? calculateCommission(row.amount, PLATFORM_COMMISSION_RATE);
        const net = row.net_amount ?? (row.amount - commission);
        return <span className="text-sm font-medium text-[var(--success)]">{formatPrice(net)}</span>;
      },
    },
    {
      key: 'status',
      header: 'Statut',
      render: (row) => {
        const display = getPaymentStatusDisplay(row.status);
        return (
          <Badge variant={PAYMENT_STATUS_VARIANT[row.status] ?? 'neutral'}>{display.label}</Badge>
        );
      },
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
  ];

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
          <span className="text-[var(--foreground)] font-medium">Paiements</span>
        </nav>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">Historique des paiements</h1>
            {!isLoading && (
              <p className="text-sm text-[var(--neutral-500)] mt-1">
                {payments.length} paiement{payments.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          {payments.length > 0 && (
            <Button
              variant="outline"
              leftIcon={<Download size={16} />}
              onClick={() => exportToCsv(payments)}
            >
              Exporter CSV
            </Button>
          )}
        </div>

        {/* KPI cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <KpiCard
              label="Total encaissé"
              value={formatPrice(totalRevenue)}
              sub={`${succeededPayments.length} paiement${succeededPayments.length !== 1 ? 's' : ''} réussi${succeededPayments.length !== 1 ? 's' : ''}`}
            />
            <KpiCard
              label="Commission plateforme (5%)"
              value={formatPrice(totalCommission)}
              sub="Sur les paiements réussis"
            />
            <KpiCard
              label="Net marchand"
              value={formatPrice(totalNet)}
              sub="Après déduction de la commission"
            />
          </div>
        )}

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

        {/* Table */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        ) : payments.length === 0 ? (
          <EmptyState
            icon={<CreditCard size={28} />}
            title="Aucun paiement"
            description="Aucun paiement n'a encore été enregistré."
          />
        ) : (
          <>
            <Table<Payment>
              columns={columns}
              data={paginatedPayments}
              keyExtractor={(row) => row.id}
              emptyMessage="Aucun paiement trouvé."
            />
            <div className="mt-6">
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function PaymentsPage() {
  return (
    <ProtectedRoute
      allowedRoles={[
        USER_ROLES.MERCHANT_OWNER,
        USER_ROLES.MERCHANT_STAFF,
        USER_ROLES.PLATFORM_ADMIN,
      ]}
    >
      <PaymentsContent />
    </ProtectedRoute>
  );
}
