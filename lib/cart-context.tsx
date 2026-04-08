'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Product } from './types';
import { CART_STORAGE_KEY } from './constants';
import { apiFetch } from './api-client';

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  tenantId: string;
  imageUrl?: string;
}

export interface AddItemResult {
  success: boolean;
  error?: string;
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  total: number;
  addItem: (product: Product, quantity?: number) => Promise<AddItemResult>;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function loadCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as CartItem[]) : [];
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]): void {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Ignorer les erreurs de storage
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    setItems(loadCart());
  }, []);

  const updateItems = useCallback((updater: (prev: CartItem[]) => CartItem[]) => {
    setItems((prev) => {
      const next = updater(prev);
      saveCart(next);
      return next;
    });
  }, []);

  const addItem = useCallback(
    async (product: Product, quantity = 1): Promise<AddItemResult> => {
      try {
        const res = await apiFetch('/api/products/all/validate-batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ products: [{ productId: product.id, quantity }] }),
          skipUnauthorizedHandling: true,
          skipErrorToast: true,
        });
        if (res.ok) {
          const data = await res.json() as { valid: boolean; errors?: string[] };
          if (!data.valid) {
            const error = data.errors?.[0] ?? 'Stock insuffisant pour ce produit.';
            return { success: false, error };
          }
        }
        // En cas d'erreur réseau ou réponse non-ok, on laisse passer (dégradé gracieux)
      } catch {
        // Pas de validation possible, on continue
      }

      updateItems((prev) => {
        const existing = prev.find((i) => i.productId === product.id);
        if (existing) {
          return prev.map((i) =>
            i.productId === product.id
              ? { ...i, quantity: i.quantity + quantity }
              : i
          );
        }
        return [
          ...prev,
          {
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity,
            tenantId: product.tenant_id ?? '',
            imageUrl: product.image_url,
          },
        ];
      });
      return { success: true };
    },
    [updateItems]
  );

  const removeItem = useCallback(
    (productId: string) => {
      updateItems((prev) => prev.filter((i) => i.productId !== productId));
    },
    [updateItems]
  );

  const updateQuantity = useCallback(
    (productId: string, quantity: number) => {
      if (quantity <= 0) {
        updateItems((prev) => prev.filter((i) => i.productId !== productId));
      } else {
        updateItems((prev) =>
          prev.map((i) => (i.productId === productId ? { ...i, quantity } : i))
        );
      }
    },
    [updateItems]
  );

  const clearCart = useCallback(() => {
    updateItems(() => []);
  }, [updateItems]);

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, itemCount, total, addItem, removeItem, updateQuantity, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart doit être utilisé dans un CartProvider');
  }
  return context;
}
