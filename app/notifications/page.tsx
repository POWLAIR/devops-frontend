'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, Home, ChevronRight, Mail, MessageSquare } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Badge } from '@/components/ui/Badge';
import { Table } from '@/components/ui/Table';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { useAuth } from '@/lib/auth-context';
import { getNotificationStatusDisplay, formatDateTime, truncate } from '@/lib/utils';
import { NOTIFICATION_STATUSES, DEFAULT_PAGE_SIZE } from '@/lib/constants';
import type { Notification, NotificationStats } from '@/lib/types';
import type { Column } from '@/components/ui/Table';

// ─── Normalisation camelCase (backend) → snake_case (frontend types) ──────────

function normalizeNotification(raw: Record<string, unknown>): Notification {
  return {
    id: raw.id as string,
    type: (raw.type as 'email' | 'sms') ?? 'email',
    recipient: (raw.recipient as string) ?? '',
    subject: raw.subject as string | undefined,
    status: raw.status as string,
    tenant_id: (raw.tenant_id ?? raw.tenantId) as string | undefined,
    user_id: (raw.user_id ?? raw.userId) as string | undefined,
    template: raw.template as string | undefined,
    sent_at: ((raw.sent_at ?? raw.sentAt) as string | undefined),
    created_at: ((raw.created_at ?? raw.createdAt) as string | undefined),
  };
}

// ─── KPI card (même composant que payments/page.tsx) ─────────────────────────

function KpiCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-background)] p-6">
      <p className="text-sm font-medium text-[var(--neutral-500)]">{label}</p>
      <p className="mt-2 text-3xl font-bold text-[var(--foreground)]">{value}</p>
      <p className="mt-1 text-xs text-[var(--neutral-400)]">{sub}</p>
    </div>
  );
}

// ─── Constantes de filtres ────────────────────────────────────────────────────

type TypeFilter = 'all' | 'email' | 'sms';
type StatusFilter = 'all' | 'sent' | 'failed' | 'queued';

const TYPE_TABS: { label: string; value: TypeFilter }[] = [
  { label: 'Tous', value: 'all' },
  { label: 'Email', value: 'email' },
  { label: 'SMS', value: 'sms' },
];

const STATUS_TABS: { label: string; value: StatusFilter }[] = [
  { label: 'Tous', value: 'all' },
  { label: 'Envoyé', value: NOTIFICATION_STATUSES.SENT },
  { label: 'Échoué', value: NOTIFICATION_STATUSES.FAILED },
  { label: 'En attente', value: NOTIFICATION_STATUSES.QUEUED },
];

const STATUS_VARIANT: Record<string, 'success' | 'error' | 'warning' | 'neutral'> = {
  sent: 'success',
  failed: 'error',
  queued: 'warning',
  pending: 'warning',
};

const PAGE_SIZE = DEFAULT_PAGE_SIZE;

// ─── Contenu principal ────────────────────────────────────────────────────────

function NotificationsContent() {
  const router = useRouter();
  const { logout } = useAuth();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [resNotif, resStats] = await Promise.all([
        fetch('/api/notifications'),
        fetch('/api/notifications/stats'),
      ]);

      if (resNotif.status === 401) {
        await logout();
        router.replace('/login?redirect=/notifications');
        return;
      }
      if (!resNotif.ok) {
        const data = (await resNotif.json()) as { message?: string; detail?: string };
        setError(data.message ?? data.detail ?? 'Impossible de charger les notifications.');
        return;
      }

      const rawNotif = (await resNotif.json()) as
        | Record<string, unknown>[]
        | { notifications?: Record<string, unknown>[]; history?: Record<string, unknown>[] };
      const list = Array.isArray(rawNotif)
        ? rawNotif
        : (rawNotif.notifications ?? rawNotif.history ?? []);
      setNotifications(list.map(normalizeNotification));

      if (resStats.ok) {
        const rawStats = (await resStats.json()) as NotificationStats;
        setStats(rawStats);
      }
    } catch {
      setError('Erreur réseau. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  }, [logout, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset page when filters change
  const handleTypeFilter = (v: TypeFilter) => { setTypeFilter(v); setPage(1); };
  const handleStatusFilter = (v: StatusFilter) => { setStatusFilter(v); setPage(1); };

  // Filtered list
  const filtered = notifications.filter((n) => {
    if (typeFilter !== 'all' && n.type !== typeFilter) return false;
    if (statusFilter !== 'all' && n.status !== statusFilter) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns: Column<Notification>[] = [
    {
      key: 'type',
      header: 'Type',
      render: (row) => (
        <Badge variant={row.type === 'sms' ? 'secondary' : 'primary'}>
          {row.type === 'sms' ? (
            <span className="flex items-center gap-1"><MessageSquare size={11} />SMS</span>
          ) : (
            <span className="flex items-center gap-1"><Mail size={11} />Email</span>
          )}
        </Badge>
      ),
    },
    {
      key: 'recipient',
      header: 'Destinataire',
      render: (row) => (
        <span className="text-sm text-[var(--foreground)]">{truncate(row.recipient, 40)}</span>
      ),
    },
    {
      key: 'subject',
      header: 'Sujet',
      render: (row) => (
        <span className="text-sm text-[var(--neutral-600)]">
          {row.subject ? truncate(row.subject, 50) : '—'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Statut',
      render: (row) => {
        const display = getNotificationStatusDisplay(row.status);
        return (
          <Badge variant={STATUS_VARIANT[row.status] ?? 'neutral'}>{display.label}</Badge>
        );
      },
    },
    {
      key: 'sent_at',
      header: "Date d'envoi",
      render: (row) => (
        <span className="text-sm text-[var(--neutral-500)] whitespace-nowrap">
          {formatDateTime(row.sent_at ?? row.created_at ?? '')}
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
          <span className="text-[var(--foreground)] font-medium">Notifications</span>
        </nav>

        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-6">Notifications</h1>

        {/* KPI cards */}
        {stats && !isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <KpiCard label="Total" value={String(stats.total)} sub="toutes notifications" />
            <KpiCard label="Envoyées" value={String(stats.sent)} sub="notifications délivrées" />
            <KpiCard label="Échouées" value={String(stats.failed)} sub="notifications en erreur" />
          </div>
        )}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
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

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-4">
          {/* Type filter */}
          <div
            role="tablist"
            aria-label="Filtrer par type"
            className="flex gap-1"
          >
            {TYPE_TABS.map((tab) => (
              <button
                key={tab.value}
                role="tab"
                aria-selected={typeFilter === tab.value}
                onClick={() => handleTypeFilter(tab.value)}
                className={
                  'px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ' +
                  (typeFilter === tab.value
                    ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                    : 'bg-[var(--neutral-100)] text-[var(--neutral-600)] hover:bg-[var(--neutral-200)]')
                }
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <div
            role="tablist"
            aria-label="Filtrer par statut"
            className="flex gap-1"
          >
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                role="tab"
                aria-selected={statusFilter === tab.value}
                onClick={() => handleStatusFilter(tab.value)}
                className={
                  'px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ' +
                  (statusFilter === tab.value
                    ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                    : 'bg-[var(--neutral-100)] text-[var(--neutral-600)] hover:bg-[var(--neutral-200)]')
                }
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Count */}
        {!isLoading && (
          <p className="text-sm text-[var(--neutral-500)] mb-4">
            {filtered.length} notification{filtered.length !== 1 ? 's' : ''}
          </p>
        )}

        {/* Loading skeleton */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Bell size={28} />}
            title="Aucune notification"
            description={
              typeFilter !== 'all' || statusFilter !== 'all'
                ? 'Aucune notification ne correspond aux filtres sélectionnés.'
                : "Vous n'avez pas encore reçu de notification."
            }
            action={
              typeFilter !== 'all' || statusFilter !== 'all' ? (
                <button
                  onClick={() => { setTypeFilter('all'); setStatusFilter('all'); setPage(1); }}
                  className="text-sm text-[var(--primary)] hover:underline"
                >
                  Réinitialiser les filtres
                </button>
              ) : undefined
            }
          />
        ) : (
          <>
            <Table<Notification>
              columns={columns}
              data={paginated}
              keyExtractor={(row) => row.id}
              emptyMessage="Aucune notification trouvée."
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

export default function NotificationsPage() {
  return (
    <ProtectedRoute>
      <NotificationsContent />
    </ProtectedRoute>
  );
}
