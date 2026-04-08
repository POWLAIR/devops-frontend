'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Home, ChevronRight, Plus, Pencil, Trash2, Package } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Table } from '@/components/ui/Table';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { useToast } from '@/lib/toast-context';
import { USER_ROLES, DEFAULT_PAGE_SIZE } from '@/lib/constants';
import { formatPrice } from '@/lib/utils';
import type { Product, Category } from '@/lib/types';
import type { Column } from '@/components/ui/Table';

const PAGE_SIZE = DEFAULT_PAGE_SIZE;

// ─── Normalisation ────────────────────────────────────────────────────────────

function normalizeProduct(raw: Record<string, unknown>): Product {
  return {
    id: raw.id as string,
    name: raw.name as string,
    description: (raw.description ?? '') as string,
    price: parseFloat(String(raw.price ?? 0)),
    stock: parseInt(String(raw.stock ?? 0), 10),
    category: (raw.category ?? raw.categoryName) as string | undefined,
    category_id: (raw.category_id ?? raw.categoryId) as string | undefined,
    image_url: (raw.image_url ?? raw.imageUrl) as string | undefined,
    tenant_id: (raw.tenant_id ?? raw.tenantId) as string | undefined,
    is_active: (raw.is_active ?? raw.isActive ?? true) as boolean,
    average_rating: parseFloat(String(raw.average_rating ?? raw.averageRating ?? 0)) || undefined,
    review_count: parseInt(String(raw.review_count ?? raw.reviewCount ?? 0), 10) || undefined,
    created_at: (raw.created_at ?? raw.createdAt ?? '') as string,
    updated_at: (raw.updated_at ?? raw.updatedAt) as string | undefined,
  };
}

// ─── ProductForm ──────────────────────────────────────────────────────────────

interface ProductFormData {
  name: string;
  description: string;
  price: string;
  stock: string;
  category_id: string;
  image_url: string;
}

const EMPTY_FORM: ProductFormData = {
  name: '',
  description: '',
  price: '',
  stock: '',
  category_id: '',
  image_url: '',
};

interface ProductFormProps {
  data: ProductFormData;
  onChange: (field: keyof ProductFormData, value: string) => void;
  categories: Category[];
  errors: Partial<Record<keyof ProductFormData, string>>;
}

function ProductForm({ data, onChange, categories, errors }: ProductFormProps) {
  return (
    <div className="space-y-4">
      <Input
        label="Nom du produit"
        value={data.name}
        onChange={(e) => onChange('name', e.target.value)}
        error={errors.name}
      />

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-[var(--neutral-500)]">Description</label>
        <textarea
          value={data.description}
          onChange={(e) => onChange('description', e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--card-background)] text-sm text-[var(--foreground)] px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent placeholder:text-[var(--neutral-400)]"
          placeholder="Description du produit (optionnel)..."
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Prix (€)"
          type="number"
          min="0"
          step="0.01"
          value={data.price}
          onChange={(e) => onChange('price', e.target.value)}
          error={errors.price}
        />
        <Input
          label="Stock"
          type="number"
          min="0"
          value={data.stock}
          onChange={(e) => onChange('stock', e.target.value)}
          error={errors.stock}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-[var(--neutral-500)]">Catégorie</label>
        <select
          value={data.category_id}
          onChange={(e) => onChange('category_id', e.target.value)}
          className="w-full h-10 rounded-lg border border-[var(--border-color)] bg-[var(--card-background)] text-sm text-[var(--foreground)] px-3 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
        >
          <option value="">Sans catégorie</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      <Input
        label="URL de l'image"
        type="url"
        value={data.image_url}
        onChange={(e) => onChange('image_url', e.target.value)}
        error={errors.image_url}
      />
    </div>
  );
}

// ─── Contenu principal ────────────────────────────────────────────────────────

function ManageProductsContent() {
  const { addToast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  // Modals
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Form
  const [formData, setFormData] = useState<ProductFormData>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof ProductFormData, string>>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Inline stock editing
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [stockValue, setStockValue] = useState('');
  const [isSavingStock, setIsSavingStock] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [resProducts, resCategories] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/categories'),
      ]);

      if (resProducts.ok) {
        const raw = (await resProducts.json()) as
          | Record<string, unknown>[]
          | { products?: Record<string, unknown>[] };
        const list = Array.isArray(raw) ? raw : (raw.products ?? []);
        setProducts(list.map(normalizeProduct));
      } else {
        setError('Impossible de charger les produits.');
      }

      if (resCategories.ok) {
        const rawCats = (await resCategories.json()) as Category[] | { data?: Category[] };
        const catList = Array.isArray(rawCats) ? rawCats : (rawCats.data ?? []);
        setCategories(catList);
      }
    } catch {
      setError('Erreur réseau. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getCategoryName = (product: Product): string => {
    if (product.category) return product.category;
    if (product.category_id) {
      const cat = categories.find((c) => c.id === product.category_id);
      return cat?.name ?? '—';
    }
    return '—';
  };

  function validateForm(data: ProductFormData): Partial<Record<keyof ProductFormData, string>> {
    const errs: Partial<Record<keyof ProductFormData, string>> = {};
    if (!data.name.trim()) errs.name = 'Le nom est requis';
    if (!data.price || parseFloat(data.price) < 0) errs.price = 'Prix invalide';
    if (data.stock === '' || parseInt(data.stock, 10) < 0) errs.stock = 'Stock invalide';
    return errs;
  }

  // ── Create ──────────────────────────────────────────────────────────────────

  function openCreate() {
    setFormData(EMPTY_FORM);
    setFormErrors({});
    setCreateOpen(true);
  }

  async function handleCreate() {
    const errs = validateForm(formData);
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }
    setIsSaving(true);
    try {
      const body = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock, 10),
        category_id: formData.category_id || undefined,
        image_url: formData.image_url.trim() || undefined,
      };
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = (await res.json()) as { message?: string };
        addToast(data.message ?? 'Erreur lors de la création', 'error');
        return;
      }
      const created = (await res.json()) as Record<string, unknown>;
      setProducts((prev) => [normalizeProduct(created), ...prev]);
      setCreateOpen(false);
      addToast('Produit créé avec succès', 'success');
    } catch {
      addToast('Erreur réseau', 'error');
    } finally {
      setIsSaving(false);
    }
  }

  // ── Edit ────────────────────────────────────────────────────────────────────

  function openEdit(product: Product) {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      description: product.description ?? '',
      price: String(product.price),
      stock: String(product.stock),
      category_id: product.category_id ?? '',
      image_url: product.image_url ?? '',
    });
    setFormErrors({});
    setEditOpen(true);
  }

  async function handleEdit() {
    if (!selectedProduct) return;
    const errs = validateForm(formData);
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }
    setIsSaving(true);
    try {
      const body = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock, 10),
        category_id: formData.category_id || undefined,
        image_url: formData.image_url.trim() || undefined,
      };
      const res = await fetch(`/api/products/${selectedProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = (await res.json()) as { message?: string };
        addToast(data.message ?? 'Erreur lors de la modification', 'error');
        return;
      }
      const updated = (await res.json()) as Record<string, unknown>;
      setProducts((prev) =>
        prev.map((p) => (p.id === selectedProduct.id ? normalizeProduct(updated) : p))
      );
      setEditOpen(false);
      addToast('Produit modifié avec succès', 'success');
    } catch {
      addToast('Erreur réseau', 'error');
    } finally {
      setIsSaving(false);
    }
  }

  // ── Delete ──────────────────────────────────────────────────────────────────

  function openDelete(product: Product) {
    setSelectedProduct(product);
    setDeleteOpen(true);
  }

  async function handleDelete() {
    if (!selectedProduct) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/products/${selectedProduct.id}`, { method: 'DELETE' });
      if (!res.ok) {
        addToast('Erreur lors de la suppression', 'error');
        return;
      }
      setProducts((prev) => prev.filter((p) => p.id !== selectedProduct.id));
      setDeleteOpen(false);
      addToast('Produit supprimé', 'success');
    } catch {
      addToast('Erreur réseau', 'error');
    } finally {
      setIsSaving(false);
    }
  }

  // ── Inline stock ────────────────────────────────────────────────────────────

  function startEditStock(product: Product) {
    setEditingStockId(product.id);
    setStockValue(String(product.stock));
  }

  async function saveStock(product: Product) {
    const newStock = parseInt(stockValue, 10);
    if (isNaN(newStock) || newStock < 0 || newStock === product.stock) {
      setEditingStockId(null);
      return;
    }
    setIsSavingStock(true);
    try {
      const res = await fetch(`/api/products/${product.id}/stock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: newStock }),
      });
      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) => (p.id === product.id ? { ...p, stock: newStock } : p))
        );
        addToast('Stock mis à jour', 'success');
      } else {
        addToast('Erreur lors de la mise à jour du stock', 'error');
      }
    } catch {
      addToast('Erreur réseau', 'error');
    } finally {
      setIsSavingStock(false);
      setEditingStockId(null);
    }
  }

  // ── Pagination & columns ────────────────────────────────────────────────────

  const totalPages = Math.ceil(products.length / PAGE_SIZE);
  const paginated = products.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns: Column<Product>[] = [
    {
      key: 'image_url',
      header: 'Image',
      render: (row) =>
        row.image_url ? (
          <img
            src={row.image_url}
            alt={row.name}
            className="w-10 h-10 rounded-lg object-cover border border-[var(--border-color)]"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-[var(--neutral-100)] flex items-center justify-center">
            <Package size={16} className="text-[var(--neutral-400)]" />
          </div>
        ),
    },
    {
      key: 'name',
      header: 'Nom',
      render: (row) => (
        <span className="font-medium text-[var(--foreground)]">{row.name}</span>
      ),
    },
    {
      key: 'category',
      header: 'Catégorie',
      render: (row) => (
        <span className="text-sm text-[var(--neutral-500)]">{getCategoryName(row)}</span>
      ),
    },
    {
      key: 'price',
      header: 'Prix',
      render: (row) => (
        <span className="font-medium text-[var(--foreground)]">{formatPrice(row.price)}</span>
      ),
    },
    {
      key: 'stock',
      header: 'Stock',
      render: (row) =>
        editingStockId === row.id ? (
          <input
            type="number"
            min="0"
            value={stockValue}
            autoFocus
            onChange={(e) => setStockValue(e.target.value)}
            onBlur={() => saveStock(row)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveStock(row);
              if (e.key === 'Escape') setEditingStockId(null);
            }}
            disabled={isSavingStock}
            className="w-20 h-8 rounded border border-[var(--primary)] bg-[var(--card-background)] text-sm text-[var(--foreground)] px-2 text-center focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
          />
        ) : (
          <button
            onClick={() => startEditStock(row)}
            className="text-sm font-mono text-[var(--neutral-600)] hover:text-[var(--primary)] hover:underline transition-colors"
            title="Cliquer pour modifier"
          >
            {row.stock}
          </button>
        ),
    },
    {
      key: 'is_active',
      header: 'Actif',
      render: (row) => (
        <Badge variant={row.is_active !== false ? 'success' : 'neutral'}>
          {row.is_active !== false ? 'Actif' : 'Inactif'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Pencil size={14} />}
            onClick={() => openEdit(row)}
          >
            Éditer
          </Button>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Trash2 size={14} />}
            onClick={() => openDelete(row)}
            className="text-[var(--error)] hover:text-[var(--error)] hover:bg-[var(--error-light)]"
          >
            Supprimer
          </Button>
        </div>
      ),
    },
  ];

  // ── Render ──────────────────────────────────────────────────────────────────

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
          <Link href="/products" className="hover:text-[var(--foreground)] transition-colors">
            Produits
          </Link>
          <ChevronRight size={14} />
          <span className="text-[var(--foreground)] font-medium">Gestion</span>
        </nav>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">Gestion des produits</h1>
            {!isLoading && (
              <p className="text-sm text-[var(--neutral-500)] mt-1">
                {products.length} produit{products.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <Button leftIcon={<Plus size={16} />} onClick={openCreate}>
            Ajouter un produit
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

        {/* Table */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            icon={<Package size={28} />}
            title="Aucun produit"
            description="Commencez par ajouter votre premier produit."
            action={
              <Button leftIcon={<Plus size={16} />} onClick={openCreate}>
                Ajouter un produit
              </Button>
            }
          />
        ) : (
          <>
            <Table<Product>
              columns={columns}
              data={paginated}
              keyExtractor={(row) => row.id}
              emptyMessage="Aucun produit trouvé."
            />
            {totalPages > 1 && (
              <div className="mt-6">
                <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Ajouter un produit"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={isSaving}>
              Annuler
            </Button>
            <Button onClick={handleCreate} loading={isSaving}>
              Créer le produit
            </Button>
          </>
        }
      >
        <ProductForm
          data={formData}
          onChange={(field, value) => {
            setFormData((prev) => ({ ...prev, [field]: value }));
            setFormErrors((prev) => ({ ...prev, [field]: undefined }));
          }}
          categories={categories}
          errors={formErrors}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={`Modifier « ${selectedProduct?.name ?? ''} »`}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={isSaving}>
              Annuler
            </Button>
            <Button onClick={handleEdit} loading={isSaving}>
              Enregistrer
            </Button>
          </>
        }
      >
        <ProductForm
          data={formData}
          onChange={(field, value) => {
            setFormData((prev) => ({ ...prev, [field]: value }));
            setFormErrors((prev) => ({ ...prev, [field]: undefined }));
          }}
          categories={categories}
          errors={formErrors}
        />
      </Modal>

      {/* Delete Modal */}
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Supprimer le produit"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={isSaving}>
              Annuler
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={isSaving}>
              Supprimer
            </Button>
          </>
        }
      >
        <p className="text-sm text-[var(--neutral-600)]">
          Êtes-vous sûr de vouloir supprimer{' '}
          <span className="font-semibold text-[var(--foreground)]">
            « {selectedProduct?.name} »
          </span>{' '}
          ? Cette action est irréversible.
        </p>
      </Modal>
    </div>
  );
}

export default function ManageProductsPage() {
  return (
    <ProtectedRoute
      allowedRoles={[
        USER_ROLES.MERCHANT_OWNER,
        USER_ROLES.MERCHANT_STAFF,
        USER_ROLES.PLATFORM_ADMIN,
      ]}
    >
      <ManageProductsContent />
    </ProtectedRoute>
  );
}
