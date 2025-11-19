'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
}

interface SearchAutocompleteProps {
  query: string;
  onSelect: (query: string) => void;
}

export default function SearchAutocomplete({ query, onSelect }: SearchAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    // Debounce API calls
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/products/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(Array.isArray(data) ? data.slice(0, 5) : []);
          setIsOpen(true);
          setSelectedIndex(-1);
        }
      } catch (err) {
        console.error('Error fetching suggestions:', err);
        setSuggestions([]);
      }
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          onSelect(suggestions[selectedIndex].name);
          setIsOpen(false);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  const handleSelect = (productName: string) => {
    onSelect(productName);
    setIsOpen(false);
  };

  if (!isOpen || suggestions.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto"
      onKeyDown={handleKeyDown}
      role="listbox"
      aria-label="Suggestions de recherche"
    >
      {suggestions.map((product, index) => (
        <Link
          key={product.id}
          href={`/products/${product.id}`}
          onClick={() => handleSelect(product.name)}
          className={`flex items-center gap-3 p-3 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${
            index === selectedIndex ? 'bg-slate-100 dark:bg-slate-700' : ''
          }`}
          role="option"
          aria-selected={index === selectedIndex}
        >
          {product.imageUrl && (
            <div className="relative w-12 h-12 flex-shrink-0 bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden">
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className="object-contain p-1"
                sizes="48px"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
              {product.name}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              ${product.price.toFixed(2)}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}

