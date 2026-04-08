'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Building2 } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Table } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/lib/toast-context';
import { USER_ROLES, TENANT_STATUSES } from '@/lib/constants';
import { apiFetch } from '@/lib/api-client';
import { formatDate, truncateId } from '@/lib/utils';
import type { Column } from '@/components/ui/Table';
import type { BadgeVariant } from '@/components/ui/Badge';

// Réponse de l'auth-service (snake_case)
interface AuthTenant {
  id: string;
  name?: string;
  slug?: string;
  email?: string;
  subdomain?: string;
  plan?: string;
  plan_id?: string;
  status?: string;
  created_at?: string;
}

const TENANT_STATUS_BADGE: Record<string, BadgeVariant> = {
  active: 'success',
  suspended: 'error',
  pending: 'warning',
};

const PLAN_LABELS: Record<string, string> = {
  free: 'Free',
  starter: 'Starter',
  pro: 'Pro',
  enterprise: 'Enterprise',
};

const PLAN_OPTIONS = ['free', 'starter', 'pro', 'enterprise'];

interface EditForm {
  name: string;
  email: string;
  subdomain: string;
  status: string;
  plan: string;
}

interface CreateForm {
  name: string;
  slug: string;
  email: string;
  subdomain: string;
  plan: string;
}

const DEFAULT_EDIT_FORM: EditForm = { name: '', email: '', subdomain: '', status: 'active', plan: 'free' };
const DEFAULT_CREATE_FORM: CreateForm = { name: '', slug: '', email: '', subdomain: '', plan: 'free' };

function TenantStatusBadge({ status }: { status?: string }) {
  const s = status ?? 'pending';
  const variant: BadgeVariant = TENANT_STATUS_BADGE[s] ?? 'neutral';
  const labels: Record<string, string> = { active: 'Actif', suspended: 'Suspendu', pending: 'En attente' };
  return <Badge variant={variant}>{labels[s] ?? s}</Badge>;
}

function PageContent() {
  const { addToast } = useToast();
  const [tenants, setTenants] = useState<AuthTenant[]>([]);
  const [loading, setLoading] = useState(true);

  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AuthTenant | null>(null);
  const [editForm, setEditForm] = useState<EditForm>(DEFAULT_EDIT_FORM);
  const [editSaving, setEditSaving] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateForm>(DEFAULT_CREATE_FORM);
  const [createSaving, setCreateSaving] = useState(false);

  const fetchTenants = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/tenants');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setTenants(Array.isArray(data) ? data : []);
    } catch {
      addToast('Impossible de charger les tenants.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  // ── Modifier ──────────────────────────────────────────────────────────────

  const openEdit = (tenant: AuthTenant) => {
    setEditTarget(tenant);
    setEditForm({
      name: tenant.name ?? '',
      email: tenant.email ?? '',
      subdomain: tenant.subdomain ?? '',
      status: tenant.status ?? 'active',
      plan: tenant.plan ?? 'free',
    });
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!editTarget) return;
    setEditSaving(true);
    try {
      const res = await apiFetch(`/api/tenants/${editTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name || undefined,
          email: editForm.email || undefined,
          subdomain: editForm.subdomain || undefined,
          status: editForm.status,
          plan: editForm.plan,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { detail?: string }).detail ?? `HTTP ${res.status}`);
      }
      const updated: AuthTenant = await res.json();
      setTenants((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setEditOpen(false);
      addToast('Tenant mis à jour.', 'success');
    } catch (err) {
      addToast((err as Error).message || 'Erreur lors de la mise à jour.', 'error');
    } finally {
      setEditSaving(false);
    }
  };

  // ── Créer ─────────────────────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!createForm.name.trim() || !createForm.slug.trim()) {
      addToast('Le nom et le slug sont obligatoires.', 'warning');
      return;
    }
    setCreateSaving(true);
    try {
      const res = await apiFetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: createForm.name,
          slug: createForm.slug,
          subdomain: createForm.subdomain || undefined,
          plan: createForm.plan,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { detail?: string }).detail ?? `HTTP ${res.status}`);
      }
      const created: AuthTenant = await res.json();
      setTenants((prev) => [created, ...prev]);
      setCreateOpen(false);
      setCreateForm(DEFAULT_CREATE_FORM);
      addToast('Tenant créé avec succès.', 'success');
    } catch (err) {
      addToast((err as Error).message || 'Erreur lors de la création.', 'error');
    } finally {
      setCreateSaving(false);
    }
  };

  // ── Colonnes ──────────────────────────────────────────────────────────────

  const columns: Column<AuthTenant>[] = [
    {
      key: 'name',
      header: 'Nom',
      render: (t) => (
        <span className="font-medium text-[var(--foreground)]">{t.name ?? '—'}</span>
      ),
    },
    {
      key: 'slug',
      header: 'Slug',
      render: (t) => (
        <code className="text-xs bg-[var(--neutral-100)] px-1.5 py-0.5 rounded text-[var(--neutral-600)]">
          {t.slug ?? t.subdomain ?? truncateId(t.id)}
        </code>
      ),
    },
    {
      key: 'plan',
      header: 'Plan',
      render: (t) => (
        <Badge variant="primary">{PLAN_LABELS[t.plan ?? 'free'] ?? t.plan ?? 'Free'}</Badge>
      ),
    },
    {
      key: 'status',
      header: 'Statut',
      render: (t) => <TenantStatusBadge status={t.status} />,
    },
    {
      key: 'created_at',
      header: 'Créé le',
      render: (t) => (
        <span className="text-sm text-[var(--neutral-500)]">{formatDate(t.created_at)}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (t) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => openEdit(t)}
          aria-label={`Modifier ${t.name ?? t.id}`}
        >
          <Pencil size={14} className="mr-1" /> Modifier
        </Button>
      ),
    },
  ];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Gestion des tenants</h1>
          <p className="text-sm text-[var(--neutral-500)] mt-1">
            {loading ? '…' : `${tenants.length} tenant${tenants.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Button variant="primary" size="md" onClick={() => setCreateOpen(true)}>
          <Plus size={16} className="mr-2" /> Nouveau tenant
        </Button>
      </div>

      {/* Tableau */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      ) : tenants.length === 0 ? (
        <EmptyState
          title="Aucun tenant"
          description="Créez votre premier tenant pour commencer."
          action={
            <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
              <Plus size={14} className="mr-1" /> Créer un tenant
            </Button>
          }
        />
      ) : (
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <Table
            columns={columns}
            data={tenants}
            keyExtractor={(t) => t.id}
            emptyMessage="Aucun tenant"
          />
        </div>
      )}

      {/* Modale Modifier */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={`Modifier — ${editTarget?.name ?? truncateId(editTarget?.id)}`}
        size="md"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setEditOpen(false)} disabled={editSaving}>
              Annuler
            </Button>
            <Button variant="primary" size="sm" onClick={handleEdit} loading={editSaving}>
              Enregistrer
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Nom"
            value={editForm.name}
            onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Nom du tenant"
          />
          <Input
            label="Email de contact"
            type="email"
            value={editForm.email}
            onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="contact@exemple.com"
          />
          <Input
            label="Sous-domaine"
            value={editForm.subdomain}
            onChange={(e) => setEditForm((f) => ({ ...f, subdomain: e.target.value }))}
            placeholder="mon-tenant"
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-[var(--foreground)]">Plan</label>
            <select
              value={editForm.plan}
              onChange={(e) => setEditForm((f) => ({ ...f, plan: e.target.value }))}
              className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--card-background)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            >
              {PLAN_OPTIONS.map((p) => (
                <option key={p} value={p}>{PLAN_LABELS[p]}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-[var(--foreground)]">Statut</label>
            <select
              value={editForm.status}
              onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
              className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--card-background)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            >
              {Object.entries(TENANT_STATUSES).map(([, v]) => (
                <option key={v} value={v}>
                  {v === 'active' ? 'Actif' : v === 'suspended' ? 'Suspendu' : 'En attente'}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Modal>

      {/* Modale Créer */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Nouveau tenant"
        size="md"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setCreateOpen(false)} disabled={createSaving}>
              Annuler
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreate} loading={createSaving}>
              Créer
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Nom *"
            value={createForm.name}
            onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Mon entreprise"
          />
          <Input
            label="Slug *"
            value={createForm.slug}
            onChange={(e) => setCreateForm((f) => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '') }))}
            placeholder="mon-entreprise"
            hint="Identifiant unique, lettres minuscules, chiffres et tirets uniquement."
          />
          <Input
            label="Email de contact"
            type="email"
            value={createForm.email}
            onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="contact@exemple.com"
          />
          <Input
            label="Sous-domaine"
            value={createForm.subdomain}
            onChange={(e) => setCreateForm((f) => ({ ...f, subdomain: e.target.value }))}
            placeholder="mon-entreprise (laissez vide pour utiliser le slug)"
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-[var(--foreground)]">Plan</label>
            <select
              value={createForm.plan}
              onChange={(e) => setCreateForm((f) => ({ ...f, plan: e.target.value }))}
              className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--card-background)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            >
              {PLAN_OPTIONS.map((p) => (
                <option key={p} value={p}>{PLAN_LABELS[p]}</option>
              ))}
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function AdminTenantsPage() {
  return (
    <ProtectedRoute allowedRoles={[USER_ROLES.PLATFORM_ADMIN]}>
      <PageContent />
    </ProtectedRoute>
  );
}
