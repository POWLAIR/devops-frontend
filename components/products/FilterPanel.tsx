'use client';

import React from 'react';
import { X, RotateCcw, Store } from 'lucide-react';
import { formatPrice, cn } from '@/lib/utils';
import type { Category } from '@/lib/types';

export interface FilterState {
  categoryIds: string[];
  priceMin: number;
  priceMax: number;
  inStockOnly: boolean;
}

interface FilterPanelProps {
  categories: Category[];
  filters: FilterState;
  absoluteMin: number;
  absoluteMax: number;
  onChange: (filters: FilterState) => void;
  onReset: () => void;
  open?: boolean;
  onClose?: () => void;
  /** boutique filter (URL-driven) */
  tenantId?: string | null;
  shopName?: string | null;
  onClearBoutique?: () => void;
}

export function FilterPanel({
  categories,
  filters,
  absoluteMin,
  absoluteMax,
  onChange,
  onReset,
  open,
  onClose,
  tenantId,
  shopName,
  onClearBoutique,
}: FilterPanelProps) {
  const hasActiveFilters =
    !!tenantId ||
    filters.categoryIds.length > 0 ||
    filters.priceMin > absoluteMin ||
    filters.priceMax < absoluteMax ||
    filters.inStockOnly;

  function toggleCategory(id: string) {
    const next = filters.categoryIds.includes(id)
      ? filters.categoryIds.filter((c) => c !== id)
      : [...filters.categoryIds, id];
    onChange({ ...filters, categoryIds: next });
  }

  function handlePriceMin(e: React.ChangeEvent<HTMLInputElement>) {
    const val = Math.min(Number(e.target.value), filters.priceMax - 1);
    onChange({ ...filters, priceMin: val });
  }

  function handlePriceMax(e: React.ChangeEvent<HTMLInputElement>) {
    const val = Math.max(Number(e.target.value), filters.priceMin + 1);
    onChange({ ...filters, priceMax: val });
  }

  const rangePercMin =
    absoluteMax === absoluteMin
      ? 0
      : ((filters.priceMin - absoluteMin) / (absoluteMax - absoluteMin)) * 100;
  const rangePercMax =
    absoluteMax === absoluteMin
      ? 100
      : ((filters.priceMax - absoluteMin) / (absoluteMax - absoluteMin)) * 100;

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Filtres"
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-80 bg-[var(--card-background)] shadow-2xl',
          'flex flex-col transition-transform duration-300 ease-in-out',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-color)] shrink-0">
          <h2 className="text-base font-semibold text-[var(--foreground)]">Filtres</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--neutral-100)] text-[var(--neutral-500)] transition-colors"
            aria-label="Fermer les filtres"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto divide-y divide-[var(--border-color)]">
          {/* Boutique (URL-driven) */}
          {tenantId && (
            <section className="px-5 py-5">
              <h3 className="text-[11px] font-semibold uppercase tracking-widest text-[var(--neutral-500)] mb-3">
                Boutique
              </h3>
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[var(--primary)]/10">
                <div className="flex items-center gap-2 text-sm font-medium text-[var(--primary)]">
                  <Store size={14} aria-hidden />
                  {shopName ?? tenantId}
                </div>
                <button
                  onClick={onClearBoutique}
                  className="p-0.5 rounded hover:bg-[var(--primary)]/20 text-[var(--primary)] transition-colors"
                  aria-label="Retirer le filtre boutique"
                >
                  <X size={14} />
                </button>
              </div>
            </section>
          )}

          {/* Categories */}
          {categories.length > 0 && (
            <section className="px-5 py-5">
              <h3 className="text-[11px] font-semibold uppercase tracking-widest text-[var(--neutral-500)] mb-3">
                Catégorie
              </h3>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => {
                  const selected = filters.categoryIds.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      onClick={() => toggleCategory(cat.id)}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                        selected
                          ? 'bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]'
                          : 'bg-transparent text-[var(--foreground)] border-[var(--border-color)] hover:border-[var(--primary)] hover:text-[var(--primary)]'
                      )}
                    >
                      {cat.name}
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* Price range */}
          {absoluteMax > absoluteMin && (
            <section className="px-5 py-5">
              <h3 className="text-[11px] font-semibold uppercase tracking-widest text-[var(--neutral-500)] mb-4">
                Fourchette de prix
              </h3>
              <div className="flex justify-between text-sm font-medium text-[var(--foreground)] mb-4">
                <span>{formatPrice(filters.priceMin)}</span>
                <span>{formatPrice(filters.priceMax)}</span>
              </div>
              <div className="relative h-5 flex items-center">
                <div className="absolute w-full h-1.5 rounded-full bg-[var(--neutral-200)]" />
                <div
                  className="absolute h-1.5 rounded-full bg-[var(--primary)]"
                  style={{ left: `${rangePercMin}%`, right: `${100 - rangePercMax}%` }}
                />
                <input
                  type="range"
                  min={absoluteMin}
                  max={absoluteMax}
                  value={filters.priceMin}
                  onChange={handlePriceMin}
                  className={cn(
                    'absolute w-full appearance-none bg-transparent pointer-events-none',
                    '[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none',
                    '[&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full',
                    '[&::-webkit-slider-thumb]:bg-[var(--primary)] [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white',
                    '[&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:cursor-pointer',
                    '[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4',
                    '[&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[var(--primary)]',
                    '[&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:cursor-pointer'
                  )}
                />
                <input
                  type="range"
                  min={absoluteMin}
                  max={absoluteMax}
                  value={filters.priceMax}
                  onChange={handlePriceMax}
                  className={cn(
                    'absolute w-full appearance-none bg-transparent pointer-events-none',
                    '[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none',
                    '[&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full',
                    '[&::-webkit-slider-thumb]:bg-[var(--primary)] [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white',
                    '[&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:cursor-pointer',
                    '[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4',
                    '[&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[var(--primary)]',
                    '[&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:cursor-pointer'
                  )}
                />
              </div>
            </section>
          )}

          {/* Availability */}
          <section className="px-5 py-5">
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-[var(--neutral-500)] mb-3">
              Disponibilité
            </h3>
            <label className="flex items-center gap-3 py-1 cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.inStockOnly}
                onChange={(e) => onChange({ ...filters, inStockOnly: e.target.checked })}
                className="w-4 h-4 rounded border-[var(--border-color)] accent-[var(--primary)] cursor-pointer shrink-0"
              />
              <span className="text-sm text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">
                En stock uniquement
              </span>
            </label>
          </section>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[var(--border-color)] shrink-0 flex items-center gap-3">
          {hasActiveFilters && (
            <button
              onClick={onReset}
              className="flex items-center gap-1.5 text-sm text-[var(--neutral-500)] hover:text-[var(--foreground)] transition-colors"
            >
              <RotateCcw size={14} />
              Réinitialiser
            </button>
          )}
          <button
            onClick={onClose}
            className="ml-auto px-4 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Voir les résultats
          </button>
        </div>
      </div>
    </>
  );

}
