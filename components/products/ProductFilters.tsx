'use client';

import { useState } from 'react';

export type SortOption =
  | 'default'
  | 'price-asc'
  | 'price-desc'
  | 'rating-desc'
  | 'popularity-desc'
  | 'newest';

interface ProductFiltersProps {
  categories: string[];
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  sortOption: SortOption;
  onSortChange: (sort: SortOption) => void;
  minPrice: number;
  maxPrice: number;
  onPriceRangeChange: (min: number, max: number) => void;
  inStockOnly: boolean;
  onInStockOnlyChange: (inStock: boolean) => void;
}

export default function ProductFilters({
  categories,
  selectedCategory,
  onCategoryChange,
  sortOption,
  onSortChange,
  minPrice,
  maxPrice,
  onPriceRangeChange,
  inStockOnly,
  onInStockOnlyChange,
}: ProductFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'default', label: 'Par défaut' },
    { value: 'price-asc', label: 'Prix : croissant' },
    { value: 'price-desc', label: 'Prix : décroissant' },
    { value: 'rating-desc', label: 'Meilleure note' },
    { value: 'popularity-desc', label: 'Plus populaires' },
    { value: 'newest', label: 'Plus récents' },
  ];

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 mb-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <label htmlFor="sort-select" className="text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
              Trier par:
            </label>
            <select
              id="sort-select"
              value={sortOption}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100"
              aria-label="Trier les produits"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Filters Toggle Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Afficher les filtres avancés"
            aria-expanded={showFilters}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            Filtres
          </button>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onCategoryChange(null)}
            className={`px-4 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${selectedCategory === null
              ? 'bg-blue-600 text-white'
              : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            aria-label="Afficher tous les produits"
            aria-pressed={selectedCategory === null}
          >
            Tous
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => onCategoryChange(category)}
              className={`px-4 py-2 rounded-lg transition-colors capitalize focus:outline-none focus:ring-2 focus:ring-blue-500 ${selectedCategory === category
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              aria-label={`Filtrer par catégorie ${category}`}
              aria-pressed={selectedCategory === category}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-4">
            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Fourchette de prix: ${minPrice} - ${maxPrice}
              </label>
              <div className="flex gap-4">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={minPrice}
                  onChange={(e) => onPriceRangeChange(parseFloat(e.target.value) || 0, maxPrice)}
                  placeholder="Min"
                  className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100"
                  aria-label="Prix minimum"
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={maxPrice}
                  onChange={(e) => onPriceRangeChange(minPrice, parseFloat(e.target.value) || 1000)}
                  placeholder="Max"
                  className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100"
                  aria-label="Prix maximum"
                />
              </div>
            </div>

            {/* In Stock Only */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="in-stock-only"
                checked={inStockOnly}
                onChange={(e) => onInStockOnlyChange(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600"
                aria-label="Afficher uniquement les produits en stock"
              />
              <label htmlFor="in-stock-only" className="text-sm text-slate-700 dark:text-slate-300">
                Afficher uniquement les produits en stock
              </label>
            </div>
          </div>
        )}
      </div>

      {selectedCategory && (
        <div className="mt-4 flex items-center gap-2">
          <span className="text-sm text-slate-600 dark:text-slate-400">
            Filtre actif:
          </span>
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm">
            {selectedCategory}
            <button
              onClick={() => onCategoryChange(null)}
              className="hover:text-blue-600 dark:hover:text-blue-400"
            >
              ×
            </button>
          </span>
        </div>
      )}
    </div>
  );
}

