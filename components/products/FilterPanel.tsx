'use client';

import React from 'react';
import { X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatPrice } from '@/lib/utils';
import { cn } from '@/lib/utils';
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
  /** mobile: panel is shown as overlay drawer */
  open?: boolean;
  onClose?: () => void;
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
}: FilterPanelProps) {
  const hasActiveFilters =
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

  const panelContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold text-[var(--foreground)]">Filtres</h2>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={onReset}
              className="flex items-center gap-1 text-xs text-[var(--primary)] hover:underline"
            >
              <RotateCcw size={12} />
              Réinitialiser
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-[var(--neutral-100)] text-[var(--neutral-500)] lg:hidden"
              aria-label="Fermer les filtres"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-6 overflow-y-auto flex-1 pr-1">
        {/* Categories */}
        {categories.length > 0 && (
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--neutral-500)] mb-3">
              Catégorie
            </h3>
            <ul className="flex flex-col gap-2">
              {categories.map((cat) => (
                <li key={cat.id}>
                  <label className="flex items-center gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={filters.categoryIds.includes(cat.id)}
                      onChange={() => toggleCategory(cat.id)}
                      className="w-4 h-4 rounded border-[var(--border-color)] accent-[var(--primary)] cursor-pointer"
                    />
                    <span className="text-sm text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">
                      {cat.name}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Price range */}
        {absoluteMax > absoluteMin && (
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--neutral-500)] mb-3">
              Fourchette de prix
            </h3>
            <div className="flex justify-between text-xs text-[var(--neutral-600)] mb-3 font-medium">
              <span>{formatPrice(filters.priceMin)}</span>
              <span>{formatPrice(filters.priceMax)}</span>
            </div>
            {/* Double range slider */}
            <div className="relative h-5 flex items-center">
              {/* Track */}
              <div className="absolute w-full h-1.5 rounded-full bg-[var(--neutral-200)]" />
              {/* Active track */}
              <div
                className="absolute h-1.5 rounded-full bg-[var(--primary)]"
                style={{ left: `${rangePercMin}%`, right: `${100 - rangePercMax}%` }}
              />
              {/* Min thumb */}
              <input
                type="range"
                min={absoluteMin}
                max={absoluteMax}
                value={filters.priceMin}
                onChange={handlePriceMin}
                className={cn(
                  'absolute w-full appearance-none bg-transparent pointer-events-none',
                  '[&::-webkit-slider-thumb]:pointer-events-auto',
                  '[&::-webkit-slider-thumb]:appearance-none',
                  '[&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4',
                  '[&::-webkit-slider-thumb]:rounded-full',
                  '[&::-webkit-slider-thumb]:bg-[var(--primary)]',
                  '[&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white',
                  '[&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:cursor-pointer',
                  '[&::-moz-range-thumb]:pointer-events-auto',
                  '[&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4',
                  '[&::-moz-range-thumb]:rounded-full',
                  '[&::-moz-range-thumb]:bg-[var(--primary)]',
                  '[&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white',
                  '[&::-moz-range-thumb]:cursor-pointer'
                )}
              />
              {/* Max thumb */}
              <input
                type="range"
                min={absoluteMin}
                max={absoluteMax}
                value={filters.priceMax}
                onChange={handlePriceMax}
                className={cn(
                  'absolute w-full appearance-none bg-transparent pointer-events-none',
                  '[&::-webkit-slider-thumb]:pointer-events-auto',
                  '[&::-webkit-slider-thumb]:appearance-none',
                  '[&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4',
                  '[&::-webkit-slider-thumb]:rounded-full',
                  '[&::-webkit-slider-thumb]:bg-[var(--primary)]',
                  '[&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white',
                  '[&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:cursor-pointer',
                  '[&::-moz-range-thumb]:pointer-events-auto',
                  '[&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4',
                  '[&::-moz-range-thumb]:rounded-full',
                  '[&::-moz-range-thumb]:bg-[var(--primary)]',
                  '[&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white',
                  '[&::-moz-range-thumb]:cursor-pointer'
                )}
              />
            </div>
          </section>
        )}

        {/* In stock only */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--neutral-500)] mb-3">
            Disponibilité
          </h3>
          <label className="flex items-center gap-2.5 cursor-pointer group">
            <input
              type="checkbox"
              checked={filters.inStockOnly}
              onChange={(e) => onChange({ ...filters, inStockOnly: e.target.checked })}
              className="w-4 h-4 rounded border-[var(--border-color)] accent-[var(--primary)] cursor-pointer"
            />
            <span className="text-sm text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">
              En stock uniquement
            </span>
          </label>
        </section>
      </div>
    </div>
  );

  // Desktop: static sidebar
  const desktopPanel = (
    <aside className="hidden lg:block w-56 shrink-0">
      <div className="sticky top-6 rounded-xl border border-[var(--border-color)] bg-[var(--card-background)] p-5">
        {panelContent}
      </div>
    </aside>
  );

  // Mobile: overlay drawer
  const mobileDrawer = (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/40 transition-opacity lg:hidden',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Drawer */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 bg-[var(--card-background)] shadow-xl p-5',
          'transition-transform duration-300 lg:hidden',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {panelContent}
      </div>
    </>
  );

  return (
    <>
      {desktopPanel}
      {mobileDrawer}
    </>
  );
}
