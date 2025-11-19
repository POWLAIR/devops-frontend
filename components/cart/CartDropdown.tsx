'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/lib/use-cart';
import { useRouter } from 'next/navigation';

interface CartDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDropdown({ isOpen, onClose }: CartDropdownProps) {
  const { cart, removeItem, getSummary } = useCart();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const summary = getSummary();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dropdown */}
      <div
        ref={dropdownRef}
        className="absolute right-0 mt-2 w-96 max-h-[80vh] bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 z-50 flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-label="Panier"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            Panier ({summary.itemCount})
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Fermer le panier"
          >
            <svg
              className="w-5 h-5 text-slate-600 dark:text-slate-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="text-center py-8 text-slate-600 dark:text-slate-400">
              <p>Votre panier est vide</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div
                  key={item.productId}
                  className="flex gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
                >
                  {item.imageUrl && (
                    <div className="relative w-16 h-16 flex-shrink-0 bg-white dark:bg-slate-800 rounded-lg overflow-hidden">
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        className="object-contain p-1"
                        sizes="64px"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Quantité: {item.quantity}
                    </p>
                    <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mt-1">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                  <button
                    onClick={() => removeItem(item.productId)}
                    className="flex-shrink-0 p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                    aria-label={`Retirer ${item.name} du panier`}
                  >
                    <svg
                      className="w-5 h-5 text-red-600 dark:text-red-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="border-t border-slate-200 dark:border-slate-700 p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">
                Sous-total:
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-100">
                ${summary.subtotal.toFixed(2)}
              </span>
            </div>
            <div className="flex gap-2">
              <Link
                href="/cart"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-center bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors font-medium"
              >
                Voir le panier
              </Link>
              <Link
                href="/checkout"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-center bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Passer commande
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

