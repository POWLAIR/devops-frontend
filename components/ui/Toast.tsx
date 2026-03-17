'use client';

import React from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Toast as ToastType } from '@/lib/toast-context';

interface ToastProps {
  toast: ToastType;
  onRemove: (id: string) => void;
}

const typeConfig = {
  success: {
    icon: <CheckCircle size={16} />,
    classes: 'bg-[var(--success-light)] text-[var(--success)] border-[var(--success)]',
    iconClass: 'text-[var(--success)]',
  },
  error: {
    icon: <AlertCircle size={16} />,
    classes: 'bg-[var(--error-light)] text-[var(--error)] border-[var(--error)]',
    iconClass: 'text-[var(--error)]',
  },
  warning: {
    icon: <AlertTriangle size={16} />,
    classes: 'bg-[var(--warning-light)] text-[var(--warning)] border-[var(--warning)]',
    iconClass: 'text-[var(--warning)]',
  },
  info: {
    icon: <Info size={16} />,
    classes: 'bg-[var(--primary-light)] text-[var(--primary)] border-[var(--primary)]',
    iconClass: 'text-[var(--primary)]',
  },
};

export function Toast({ toast, onRemove }: ToastProps) {
  const config = typeConfig[toast.type];

  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-3 w-full max-w-sm rounded-xl border px-4 py-3 shadow-[var(--shadow-lg)]',
        'animate-in slide-in-from-right-5 fade-in duration-300',
        config.classes
      )}
    >
      <span className={cn('flex-shrink-0 mt-0.5', config.iconClass)}>{config.icon}</span>
      <p className="flex-1 text-sm font-medium leading-snug">{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        className="flex-shrink-0 p-0.5 rounded hover:opacity-70 transition-opacity"
        aria-label="Fermer la notification"
      >
        <X size={14} />
      </button>
    </div>
  );
}
