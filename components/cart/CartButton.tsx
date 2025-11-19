'use client';

import { useEffect, useState } from 'react';
import { useCart } from '@/lib/use-cart';
import CartDropdown from './CartDropdown';

export default function CartButton() {
  const { getItemCount } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [itemCount, setItemCount] = useState(0);

  useEffect(() => {
    const updateCount = () => {
      setItemCount(getItemCount());
    };

    updateCount();
    window.addEventListener('cartUpdated', updateCount);

    return () => {
      window.removeEventListener('cartUpdated', updateCount);
    };
  }, [getItemCount]);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative hover:text-blue-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300 rounded-lg p-1"
        aria-label={`Panier (${itemCount} article${itemCount > 1 ? 's' : ''})`}
        aria-expanded={isOpen}
      >
        <svg 
          className="w-6 h-6" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" 
          />
        </svg>
        {itemCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {itemCount > 99 ? '99+' : itemCount}
          </span>
        )}
      </button>

      <CartDropdown isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </div>
  );
}

