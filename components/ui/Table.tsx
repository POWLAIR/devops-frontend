'use client';

import React from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SortDirection = 'asc' | 'desc' | null;

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  render: (row: T, index: number) => React.ReactNode;
  sortable?: boolean;
  className?: string;
  headerClassName?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T, index: number) => string;
  sortKey?: string;
  sortDirection?: SortDirection;
  onSort?: (key: string) => void;
  selectable?: boolean;
  selectedKeys?: Set<string>;
  onSelectChange?: (keys: Set<string>) => void;
  emptyMessage?: string;
  className?: string;
  loading?: boolean;
}

function SortIcon({ direction }: { direction: SortDirection }) {
  if (direction === 'asc') return <ChevronUp size={14} className="text-[var(--primary)]" />;
  if (direction === 'desc') return <ChevronDown size={14} className="text-[var(--primary)]" />;
  return <ChevronsUpDown size={14} className="text-[var(--neutral-300)]" />;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  sortKey,
  sortDirection = null,
  onSort,
  selectable = false,
  selectedKeys = new Set(),
  onSelectChange,
  emptyMessage = 'Aucune donnée',
  className,
  loading = false,
}: TableProps<T>) {
  const allKeys = data.map(keyExtractor);
  const allSelected = allKeys.length > 0 && allKeys.every((k) => selectedKeys.has(k));
  const someSelected = !allSelected && allKeys.some((k) => selectedKeys.has(k));

  const toggleAll = () => {
    if (!onSelectChange) return;
    onSelectChange(allSelected ? new Set() : new Set(allKeys));
  };

  const toggleRow = (key: string) => {
    if (!onSelectChange) return;
    const next = new Set(selectedKeys);
    next.has(key) ? next.delete(key) : next.add(key);
    onSelectChange(next);
  };

  return (
    <div className={cn('w-full overflow-x-auto rounded-xl border border-[var(--border-color)]', className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border-color)] bg-[var(--neutral-50)]">
            {selectable && (
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected;
                  }}
                  onChange={toggleAll}
                  className="rounded border-[var(--border-color)] accent-[var(--primary)]"
                  aria-label="Tout sélectionner"
                />
              </th>
            )}
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'px-4 py-3 text-left font-semibold text-[var(--neutral-600)] whitespace-nowrap',
                  col.sortable && 'cursor-pointer select-none hover:text-[var(--foreground)]',
                  col.headerClassName
                )}
                onClick={col.sortable && onSort ? () => onSort(col.key) : undefined}
              >
                <span className="inline-flex items-center gap-1">
                  {col.header}
                  {col.sortable && (
                    <SortIcon direction={sortKey === col.key ? sortDirection : null} />
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td
                colSpan={columns.length + (selectable ? 1 : 0)}
                className="px-4 py-10 text-center text-[var(--neutral-400)]"
              >
                <span className="inline-block w-6 h-6 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin" />
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (selectable ? 1 : 0)}
                className="px-4 py-10 text-center text-[var(--neutral-400)]"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, i) => {
              const key = keyExtractor(row, i);
              const isSelected = selectedKeys.has(key);
              return (
                <tr
                  key={key}
                  className={cn(
                    'border-b border-[var(--border-color)] last:border-0 transition-colors',
                    isSelected
                      ? 'bg-[var(--primary-light)]'
                      : 'bg-[var(--card-background)] hover:bg-[var(--neutral-50)]'
                  )}
                >
                  {selectable && (
                    <td className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleRow(key)}
                        className="rounded border-[var(--border-color)] accent-[var(--primary)]"
                        aria-label={`Sélectionner la ligne ${i + 1}`}
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn('px-4 py-3 text-[var(--foreground)]', col.className)}
                    >
                      {col.render(row, i)}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
