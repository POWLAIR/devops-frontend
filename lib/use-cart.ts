'use client';

import { useState, useEffect } from 'react';

/**
 * CartItem: Représentation du panier côté frontend
 * 
 * IMPORTANT: Les champs name, price et imageUrl sont des COPIES pour l'UX uniquement.
 * Ils ne sont PAS la source de vérité. Le backend (order-service) valide les prix
 * et le stock via product-service lors de la création de commande.
 */
export interface CartItem {
  productId: string;
  name: string;        // Copie pour affichage, pas source de vérité
  price: number;       // Copie pour affichage, pas source de vérité
  quantity: number;
  imageUrl?: string;   // Copie pour affichage, pas source de vérité
}

/**
 * CartSummary: Totaux calculés côté client
 * 
 * IMPORTANT: Ces calculs sont ESTIMATIFS pour l'UX uniquement.
 * Le backend (order-service) recalcule les totaux définitifs avec les prix validés.
 */
export interface CartSummary {
  subtotal: number;    // Estimation (prix peuvent avoir changé)
  tax: number;         // Estimation (10% du subtotal)
  shipping: number;    // Estimation (5.99$ si < 50$)
  total: number;       // Estimation (somme des précédents)
  itemCount: number;
}

// Constantes pour calculs ESTIMATIFS (UX uniquement)
const TAX_RATE = 0.1; // 10% tax
const FREE_SHIPPING_THRESHOLD = 50;
const SHIPPING_COST = 5.99;

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = () => {
    const cartData = localStorage.getItem('cart');
    if (cartData) {
      setCart(JSON.parse(cartData));
    }
    setIsLoaded(true);
  };

  const saveCart = (newCart: CartItem[]) => {
    localStorage.setItem('cart', JSON.stringify(newCart));
    setCart(newCart);
    
    // Dispatch custom event for CartButton to listen
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('cartUpdated'));
    }
  };

  const addItem = (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    const existingItem = cart.find((i) => i.productId === item.productId);

    if (existingItem) {
      const updatedCart = cart.map((i) =>
        i.productId === item.productId
          ? { ...i, quantity: i.quantity + (item.quantity || 1) }
          : i
      );
      saveCart(updatedCart);
    } else {
      const newItem: CartItem = {
        ...item,
        quantity: item.quantity || 1,
      };
      saveCart([...cart, newItem]);
    }
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(productId);
      return;
    }

    const updatedCart = cart.map((item) =>
      item.productId === productId ? { ...item, quantity: newQuantity } : item
    );
    saveCart(updatedCart);
  };

  const removeItem = (productId: string) => {
    const updatedCart = cart.filter((item) => item.productId !== productId);
    saveCart(updatedCart);
  };

  const clearCart = () => {
    localStorage.removeItem('cart');
    setCart([]);
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('cartUpdated'));
    }
  };

  const getItemCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const getSubtotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  /**
   * getSummary: Calcule les totaux ESTIMATIFS pour l'affichage UX
   * 
   * IMPORTANT: Ces valeurs sont indicatives uniquement.
   * Le backend recalcule les totaux définitifs lors de la création de commande
   * avec les prix validés depuis product-service.
   */
  const getSummary = (): CartSummary => {
    const subtotal = getSubtotal();
    const tax = subtotal * TAX_RATE;
    const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
    const total = subtotal + tax + shipping;
    const itemCount = getItemCount();

    return {
      subtotal,
      tax,
      shipping,
      total,
      itemCount,
    };
  };

  return {
    cart,
    isLoaded,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    getItemCount,
    getSubtotal,
    getSummary,
  };
}

