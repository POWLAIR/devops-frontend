'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShoppingCart,
  Bell,
  Search,
  User,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Store,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import { USER_ROLES } from '@/lib/constants';

function NotificationBadge() {
  const { isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnread = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await fetch('/api/notifications/unread-count');
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unread_count ?? data.count ?? 0);
      }
    } catch {
      // Ignorer les erreurs réseau
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }
    fetchUnread();
    const interval = setInterval(fetchUnread, 60_000);
    return () => clearInterval(interval);
  }, [isAuthenticated, fetchUnread]);

  return (
    <Link
      href="/notifications"
      className="relative p-2 rounded-lg text-[var(--neutral-500)] hover:text-[var(--foreground)] hover:bg-[var(--neutral-100)] transition-colors"
      aria-label="Notifications"
    >
      <Bell size={20} />
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-[var(--error)] text-[var(--error-foreground)] text-[10px] font-bold px-1">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Link>
  );
}

function CartButton() {
  const { itemCount } = useCart();
  return (
    <Link
      href="/cart"
      className="relative p-2 rounded-lg text-[var(--neutral-500)] hover:text-[var(--foreground)] hover:bg-[var(--neutral-100)] transition-colors"
      aria-label="Panier"
    >
      <ShoppingCart size={20} />
      {itemCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] text-[10px] font-bold px-1">
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </Link>
  );
}

function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    router.push('/login');
  };

  if (!user) return null;

  const initials = user.full_name
    ? user.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user.email.slice(0, 2).toUpperCase();

  const roleLabel =
    user.role === USER_ROLES.PLATFORM_ADMIN
      ? 'Admin'
      : user.role === USER_ROLES.MERCHANT
      ? 'Marchand'
      : 'Client';

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[var(--neutral-100)] transition-colors"
        aria-label="Menu utilisateur"
        aria-expanded={open}
      >
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-semibold flex-shrink-0">
          {initials}
        </div>
        <div className="hidden sm:flex flex-col items-start leading-none">
          <span className="text-sm font-medium text-[var(--foreground)] max-w-[120px] truncate">
            {user.full_name || user.email}
          </span>
          <span className="text-xs text-[var(--neutral-500)]">{roleLabel}</span>
        </div>
        <ChevronDown
          size={14}
          className={`text-[var(--neutral-400)] transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-52 rounded-xl border border-[var(--border-color)] bg-[var(--card-background)] shadow-[var(--shadow-lg)] z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--border-color)]">
            <p className="text-sm font-medium text-[var(--foreground)] truncate">
              {user.full_name || 'Utilisateur'}
            </p>
            <p className="text-xs text-[var(--neutral-500)] truncate">{user.email}</p>
          </div>
          <nav className="p-1">
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[var(--foreground)] hover:bg-[var(--neutral-100)] transition-colors"
            >
              <User size={15} />
              Mon profil
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[var(--error)] hover:bg-[var(--error-light)] transition-colors"
            >
              <LogOut size={15} />
              Déconnexion
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}

export function Header() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/products?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--border-color)] bg-[var(--card-background)] backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-16 items-center gap-4">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 flex-shrink-0 text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors"
          >
            <Store size={24} />
            <span className="font-bold text-lg hidden sm:inline">DevOps Shop</span>
          </Link>

          {/* Barre de recherche */}
          <form
            onSubmit={handleSearch}
            className="flex-1 max-w-xl mx-auto hidden md:flex items-center"
          >
            <div className="relative w-full">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--neutral-400)] pointer-events-none"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher des produits…"
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--neutral-50)] text-sm placeholder:text-[var(--neutral-400)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition"
              />
            </div>
          </form>

          {/* Actions droite */}
          <div className="flex items-center gap-1 ml-auto">
            {/* Recherche mobile */}
            <Link
              href="/products"
              className="md:hidden p-2 rounded-lg text-[var(--neutral-500)] hover:text-[var(--foreground)] hover:bg-[var(--neutral-100)] transition-colors"
              aria-label="Rechercher"
            >
              <Search size={20} />
            </Link>

            <CartButton />

            {!isLoading && isAuthenticated && <NotificationBadge />}

            {!isLoading && (
              <>
                {isAuthenticated ? (
                  <UserMenu />
                ) : (
                  <div className="hidden sm:flex items-center gap-2">
                    <Link
                      href="/login"
                      className="px-3 py-1.5 rounded-lg text-sm font-medium text-[var(--foreground)] hover:bg-[var(--neutral-100)] transition-colors"
                    >
                      Connexion
                    </Link>
                    <Link
                      href="/register"
                      className="px-3 py-1.5 rounded-lg text-sm font-medium bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)] transition-colors"
                    >
                      S&apos;inscrire
                    </Link>
                  </div>
                )}
              </>
            )}

            {/* Burger mobile */}
            {!isLoading && !isAuthenticated && (
              <button
                className="sm:hidden p-2 rounded-lg text-[var(--neutral-500)] hover:bg-[var(--neutral-100)] transition-colors"
                onClick={() => setMobileMenuOpen((v) => !v)}
                aria-label="Menu"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            )}
          </div>
        </div>

        {/* Menu mobile non connecté */}
        {mobileMenuOpen && !isAuthenticated && (
          <div className="sm:hidden border-t border-[var(--border-color)] py-3 flex flex-col gap-2">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--foreground)] hover:bg-[var(--neutral-100)]"
            >
              Connexion
            </Link>
            <Link
              href="/register"
              onClick={() => setMobileMenuOpen(false)}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--primary)] text-[var(--primary-foreground)] text-center"
            >
              S&apos;inscrire
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
