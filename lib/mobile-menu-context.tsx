'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface MobileMenuContextType {
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
}

const MobileMenuContext = createContext<MobileMenuContextType | undefined>(undefined);

export function MobileMenuProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = useCallback(() => setIsOpen((v) => !v), []);
  const close = useCallback(() => setIsOpen(false), []);

  return (
    <MobileMenuContext.Provider value={{ isOpen, toggle, close }}>
      {children}
    </MobileMenuContext.Provider>
  );
}

export function useMobileMenu(): MobileMenuContextType {
  const ctx = useContext(MobileMenuContext);
  if (!ctx) {
    throw new Error('useMobileMenu doit être utilisé dans un MobileMenuProvider');
  }
  return ctx;
}
