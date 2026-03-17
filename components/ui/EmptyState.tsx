import React from 'react';
import { PackageSearch } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title = 'Aucun résultat',
  description,
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4 py-16 px-4 text-center',
        className
      )}
    >
      <div className="w-16 h-16 rounded-full bg-[var(--neutral-100)] flex items-center justify-center text-[var(--neutral-400)]">
        {icon ?? <PackageSearch size={28} />}
      </div>
      <div className="space-y-1">
        <p className="text-base font-semibold text-[var(--foreground)]">{title}</p>
        {description && (
          <p className="text-sm text-[var(--neutral-500)] max-w-xs">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
