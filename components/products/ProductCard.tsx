'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { formatPrice, getRatingStars } from '@/lib/utils';
import type { Product } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
}

function StarRating({ rating, count }: { rating: number; count?: number }) {
  const { full, half, empty } = getRatingStars(rating);

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {Array.from({ length: full }).map((_, i) => (
          <Star
            key={`full-${i}`}
            size={13}
            className="fill-[var(--warning)] text-[var(--warning)]"
          />
        ))}
        {half && (
          <span className="relative inline-block" style={{ width: 13, height: 13 }}>
            <Star size={13} className="text-[var(--neutral-300)] fill-[var(--neutral-300)]" />
            <span className="absolute inset-0 overflow-hidden w-1/2">
              <Star size={13} className="fill-[var(--warning)] text-[var(--warning)]" />
            </span>
          </span>
        )}
        {Array.from({ length: empty }).map((_, i) => (
          <Star
            key={`empty-${i}`}
            size={13}
            className="fill-[var(--neutral-300)] text-[var(--neutral-300)]"
          />
        ))}
      </div>
      {count !== undefined && count > 0 && (
        <span className="text-xs text-[var(--neutral-500)]">({count})</span>
      )}
    </div>
  );
}

function StockBadge({ stock }: { stock: number }) {
  const qty = parseInt(String(stock ?? 0), 10);
  if (qty === 0) return <Badge variant="error">Rupture</Badge>;
  if (qty <= 5) return <Badge variant="warning">{qty} restant{qty > 1 ? 's' : ''}</Badge>;
  if (qty <= 20) return <Badge variant="success">{qty} en stock</Badge>;
  return <Badge variant="success">En stock</Badge>;
}

export function ProductCard({ product }: ProductCardProps) {
  // NestJS returns camelCase; the shared type uses snake_case — support both
  const p = product as Product & {
    imageUrl?: string;
    rating?: number;
    reviewCount?: number;
  };
  const imageUrl = p.imageUrl ?? p.image_url;
  const rating = p.rating ?? p.average_rating ?? 0;
  const reviewCount = p.reviewCount ?? p.review_count ?? 0;

  return (
    <Link
      href={`/products/${product.id}`}
      className={cn(
        'group flex flex-col rounded-xl border border-[var(--border-color)]',
        'bg-[var(--card-background)] overflow-hidden',
        'transition-all duration-200 hover:shadow-[var(--shadow-md)] hover:border-[var(--primary)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]'
      )}
    >
      {/* Image */}
      <div className="relative h-44 bg-[var(--neutral-100)] overflow-hidden">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[var(--neutral-400)]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 gap-2">
        {product.category && (
          <Badge variant="primary" className="self-start">
            {product.category}
          </Badge>
        )}

        <h3 className="text-sm font-semibold text-[var(--foreground)] leading-snug line-clamp-2 group-hover:text-[var(--primary)] transition-colors">
          {product.name}
        </h3>

        {rating > 0 && (
          <StarRating rating={rating} count={reviewCount} />
        )}

        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-base font-bold text-[var(--primary)]">
            {formatPrice(product.price)}
          </span>
          <StockBadge stock={product.stock} />
        </div>
      </div>
    </Link>
  );
}
