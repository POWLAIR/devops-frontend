import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { OrderStatus, PaymentStatus } from './constants';

// ─── Tailwind merge helper ────────────────────────────────────────────────────

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// ─── Formatage ────────────────────────────────────────────────────────────────

export function formatPrice(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateStr: string | Date | undefined | null, options?: Intl.DateTimeFormatOptions): string {
  if (!dateStr) return '—';
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  if (isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...options,
  }).format(date);
}

export function formatDateTime(dateStr: string | Date): string {
  return formatDate(dateStr, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffH = Math.floor(diffMs / 3_600_000);
  const diffD = Math.floor(diffMs / 86_400_000);

  if (diffMin < 1) return "à l'instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  if (diffH < 24) return `il y a ${diffH}h`;
  if (diffD < 7) return `il y a ${diffD}j`;
  return formatDate(dateStr);
}

// ─── Statuts commandes ────────────────────────────────────────────────────────

export interface StatusDisplay {
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
}

export function getOrderStatusDisplay(status: OrderStatus): StatusDisplay {
  const map: Record<string, StatusDisplay> = {
    pending: {
      label: 'En attente',
      color: 'yellow',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-800',
    },
    confirmed: {
      label: 'Confirmée',
      color: 'blue',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-800',
    },
    shipped: {
      label: 'Expédiée',
      color: 'purple',
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-800',
    },
    delivered: {
      label: 'Livrée',
      color: 'green',
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
    },
    cancelled: {
      label: 'Annulée',
      color: 'red',
      bgColor: 'bg-red-100',
      textColor: 'text-red-800',
    },
  };
  return map[status] ?? { label: status, color: 'gray', bgColor: 'bg-gray-100', textColor: 'text-gray-800' };
}

// ─── Statuts paiements ────────────────────────────────────────────────────────

export function getPaymentStatusDisplay(status: PaymentStatus | string): StatusDisplay {
  const map: Record<string, StatusDisplay> = {
    pending: {
      label: 'En attente',
      color: 'gray',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-700',
    },
    succeeded: {
      label: 'Payé',
      color: 'green',
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
    },
    paid: {
      label: 'Payé',
      color: 'green',
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
    },
    failed: {
      label: 'Échoué',
      color: 'red',
      bgColor: 'bg-red-100',
      textColor: 'text-red-800',
    },
    refunded: {
      label: 'Remboursé',
      color: 'purple',
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-800',
    },
    unpaid: {
      label: 'Non payé',
      color: 'gray',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-700',
    },
  };
  return map[status] ?? { label: status, color: 'gray', bgColor: 'bg-gray-100', textColor: 'text-gray-700' };
}

// ─── Statuts notifications ────────────────────────────────────────────────────

export function getNotificationStatusDisplay(status: string): StatusDisplay {
  const map: Record<string, StatusDisplay> = {
    sent: { label: 'Envoyé', color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-800' },
    failed: { label: 'Échoué', color: 'red', bgColor: 'bg-red-100', textColor: 'text-red-800' },
    queued: { label: 'En file', color: 'yellow', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' },
    pending: { label: 'En attente', color: 'yellow', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' },
  };
  return map[status] ?? { label: status, color: 'gray', bgColor: 'bg-gray-100', textColor: 'text-gray-700' };
}

// ─── Misc ─────────────────────────────────────────────────────────────────────

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 1) + '…';
}

export function truncateId(id: string | undefined | null, length = 8): string {
  if (!id) return '—';
  return id.slice(0, length) + '…';
}

export function getRatingStars(rating: number): { full: number; half: boolean; empty: number } {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return { full, half, empty };
}

export function calculateShipping(subtotal: number): number {
  return subtotal >= 50 ? 0 : 5;
}

export function calculateCommission(amount: number, rate = 0.05): number {
  return Math.round(amount * rate * 100) / 100;
}
