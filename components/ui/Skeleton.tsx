import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  lines?: 1 | 2 | 3 | 4 | 5;
  rounded?: boolean;
}

export function Skeleton({ className, rounded = false }: { className?: string; rounded?: boolean }) {
  return (
    <div
      className={cn(
        'animate-pulse bg-[var(--neutral-200)]',
        rounded ? 'rounded-full' : 'rounded-md',
        className
      )}
    />
  );
}

export function SkeletonText({ lines = 3, className }: SkeletonProps) {
  const widths = ['w-full', 'w-4/5', 'w-3/4', 'w-5/6', 'w-2/3'];
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn('h-4', widths[i % widths.length])} />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-[var(--border-color)] bg-[var(--card-background)] p-5 space-y-3',
        className
      )}
    >
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="flex justify-between pt-1">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-6 w-16" />
      </div>
    </div>
  );
}
