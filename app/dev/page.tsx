'use client';

import React, { useState } from 'react';
import { Search, Mail, Lock, Star, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { Skeleton, SkeletonText, SkeletonCard } from '@/components/ui/Skeleton';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { Table, type Column } from '@/components/ui/Table';
import { useToast } from '@/lib/toast-context';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold text-[var(--foreground)] pb-2 border-b border-[var(--border-color)]">
        {title}
      </h2>
      {children}
    </section>
  );
}

interface SampleRow {
  id: string;
  name: string;
  role: string;
  status: string;
}

const sampleData: SampleRow[] = [
  { id: '1', name: 'Alice Martin', role: 'Admin', status: 'active' },
  { id: '2', name: 'Bob Dupont', role: 'Merchant', status: 'suspended' },
  { id: '3', name: 'Claire Bernard', role: 'Customer', status: 'active' },
];

const columns: Column<SampleRow>[] = [
  { key: 'name', header: 'Nom', render: (r) => r.name, sortable: true },
  { key: 'role', header: 'Rôle', render: (r) => r.role, sortable: true },
  {
    key: 'status',
    header: 'Statut',
    render: (r) => (
      <Badge variant={r.status === 'active' ? 'success' : 'error'}>
        {r.status === 'active' ? 'Actif' : 'Suspendu'}
      </Badge>
    ),
  },
  {
    key: 'actions',
    header: '',
    render: () => (
      <Button variant="ghost" size="sm" leftIcon={<Trash2 size={14} />}>
        Supprimer
      </Button>
    ),
  },
];

export default function DevPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<string>('name');
  const { addToast } = useToast();

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-12">
      <div>
        <h1 className="text-3xl font-bold text-[var(--foreground)]">Composants UI — Démo</h1>
        <p className="text-[var(--neutral-500)] mt-1">
          Page de démonstration des composants de base (à supprimer en fin de projet).
        </p>
      </div>

      {/* ── Buttons ─────────────────────────────────────────────────────────── */}
      <Section title="Button">
        <div className="flex flex-wrap gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
          <Button loading>Chargement</Button>
          <Button disabled>Désactivé</Button>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button leftIcon={<Search size={14} />}>Avec icône gauche</Button>
          <Button rightIcon={<Star size={14} />} variant="outline">Avec icône droite</Button>
        </div>
      </Section>

      {/* ── Input ───────────────────────────────────────────────────────────── */}
      <Section title="Input">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
          <Input label="Email" type="email" />
          <Input label="Mot de passe" type="password" leftIcon={<Lock size={16} />} />
          <Input label="Recherche" leftIcon={<Search size={16} />} placeholder="Rechercher…" />
          <Input label="Email invalide" type="email" error="Email invalide" />
          <Input label="Avec indice" hint="Format: prénom.nom@domaine.fr" leftIcon={<Mail size={16} />} />
        </div>
      </Section>

      {/* ── Badge ───────────────────────────────────────────────────────────── */}
      <Section title="Badge">
        <div className="flex flex-wrap gap-2">
          <Badge>Default</Badge>
          <Badge variant="primary">Primary</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="success">Actif</Badge>
          <Badge variant="warning">En attente</Badge>
          <Badge variant="error">Erreur</Badge>
          <Badge variant="neutral">Annulé</Badge>
        </div>
      </Section>

      {/* ── Card ────────────────────────────────────────────────────────────── */}
      <Section title="Card">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <h3 className="font-semibold">Titre de la carte</h3>
            </CardHeader>
            <CardBody>
              <p className="text-sm text-[var(--neutral-500)]">Contenu de la carte avec header, body et footer.</p>
            </CardBody>
            <CardFooter>
              <Button size="sm">Action</Button>
            </CardFooter>
          </Card>
          <Card padding="lg">
            <p className="text-sm text-[var(--neutral-500)]">Carte avec padding large.</p>
          </Card>
        </div>
      </Section>

      {/* ── Spinner ─────────────────────────────────────────────────────────── */}
      <Section title="Spinner">
        <div className="flex items-center gap-6">
          <Spinner size="xs" />
          <Spinner size="sm" />
          <Spinner size="md" />
          <Spinner size="lg" />
        </div>
      </Section>

      {/* ── Skeleton ────────────────────────────────────────────────────────── */}
      <Section title="Skeleton">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-3">
            <SkeletonText lines={3} />
          </div>
          <SkeletonCard />
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-6 w-1/2" rounded />
          </div>
        </div>
      </Section>

      {/* ── Modal ───────────────────────────────────────────────────────────── */}
      <Section title="Modal">
        <Button onClick={() => setModalOpen(true)}>Ouvrir la modal</Button>
        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Exemple de modal"
          footer={
            <>
              <Button variant="outline" onClick={() => setModalOpen(false)}>Annuler</Button>
              <Button onClick={() => setModalOpen(false)}>Confirmer</Button>
            </>
          }
        >
          <p className="text-sm text-[var(--neutral-500)]">
            Ceci est le contenu de la modal. Elle se ferme avec Échap ou en cliquant sur le backdrop.
          </p>
        </Modal>
      </Section>

      {/* ── Toast ───────────────────────────────────────────────────────────── */}
      <Section title="Toast">
        <div className="flex flex-wrap gap-3">
          <Button variant="primary" onClick={() => addToast('Opération réussie !', 'success')}>
            Success
          </Button>
          <Button variant="danger" onClick={() => addToast('Une erreur est survenue.', 'error')}>
            Error
          </Button>
          <Button variant="outline" onClick={() => addToast('Mise à jour disponible.', 'info')}>
            Info
          </Button>
          <Button variant="secondary" onClick={() => addToast('Stock faible pour ce produit.', 'warning')}>
            Warning
          </Button>
        </div>
      </Section>

      {/* ── Pagination ──────────────────────────────────────────────────────── */}
      <Section title="Pagination">
        <Pagination page={page} totalPages={10} onPageChange={setPage} />
        <p className="text-sm text-[var(--neutral-500)]">Page courante : {page}</p>
      </Section>

      {/* ── EmptyState ──────────────────────────────────────────────────────── */}
      <Section title="EmptyState">
        <EmptyState
          title="Aucun produit trouvé"
          description="Essayez de modifier vos filtres ou votre recherche."
          action={<Button variant="outline">Réinitialiser les filtres</Button>}
        />
      </Section>

      {/* ── ErrorBoundary ───────────────────────────────────────────────────── */}
      <Section title="ErrorBoundary">
        <ErrorBoundary>
          <Card>
            <p className="text-sm text-[var(--neutral-500)]">
              Ce composant est protégé par un ErrorBoundary. Si une erreur survient, un message de repli s&apos;affiche.
            </p>
          </Card>
        </ErrorBoundary>
      </Section>

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      <Section title="Table">
        <Table
          columns={columns}
          data={sampleData}
          keyExtractor={(r) => r.id}
          selectable
          selectedKeys={selectedKeys}
          onSelectChange={setSelectedKeys}
          sortKey={sortKey}
          sortDirection="asc"
          onSort={setSortKey}
        />
        {selectedKeys.size > 0 && (
          <p className="text-sm text-[var(--neutral-500)]">
            {selectedKeys.size} ligne(s) sélectionnée(s)
          </p>
        )}
        <Table columns={columns} data={[]} keyExtractor={(r) => r.id} emptyMessage="Aucun utilisateur" />
      </Section>
    </div>
  );
}
