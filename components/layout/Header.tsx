'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ShoppingCart,
  Bell,
  User,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Store,
  Trash2,
  ShoppingBag,
  Heart,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import { useMobileMenu } from '@/lib/mobile-menu-context';
import { USER_ROLES } from '@/lib/constants';
import { formatPrice } from '@/lib/utils';
import { apiFetch } from '@/lib/api-client';

async function fetchUnreadCount(): Promise<number> {
  const res = await apiFetch('/api/notifications/unread-count', { skipErrorToast: true });
  if (!res.ok) return 0;
  const data = await res.json();
  return data.unread_count ?? data.count ?? 0;
}

function NotificationBadge() {
  const { isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnread = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const n = await fetchUnreadCount();
      setUnreadCount(n);
    } catch {
      /* silencieux */
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }
    refreshUnread();
    const onFocus = () => {
      void refreshUnread();
    };
    window.addEventListener('focus', onFocus);
    const interval = setInterval(refreshUnread, 30_000);
    return () => {
      window.removeEventListener('focus', onFocus);
      clearInterval(interval);
    };
  }, [isAuthenticated, refreshUnread]);

  const badgeLabel =
    unreadCount > 0
      ? `${unreadCount > 99 ? '99+' : unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}`
      : 'Notifications';

  return (
    <Link
      href="/notifications"
      className="relative p-2 rounded-lg text-[var(--neutral-500)] hover:text-[var(--foreground)] hover:bg-[var(--neutral-100)] transition-colors"
      aria-label={badgeLabel}
    >
      <Bell size={20} aria-hidden />
      {unreadCount > 0 && (
        <span
          className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-[var(--error)] text-[var(--error-foreground)] text-[10px] font-bold px-1"
          aria-hidden
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Link>
  );
}

function CartButton() {
  const { items, itemCount, total, removeItem } = useCart();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const previewItems = items.slice(0, 3);
  const hasMore = items.length > 3;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-lg text-[var(--neutral-500)] hover:text-[var(--foreground)] hover:bg-[var(--neutral-100)] transition-colors"
        aria-label="Panier"
        aria-expanded={open}
      >
        <ShoppingCart size={20} aria-hidden />
        {itemCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] text-[10px] font-bold px-1">
            {itemCount > 99 ? '99+' : itemCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl border border-[var(--border-color)] bg-[var(--card-background)] shadow-[var(--shadow-lg)] z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--border-color)] flex items-center justify-between">
            <span className="text-sm font-semibold text-[var(--foreground)]">
              Panier {itemCount > 0 && <span className="text-[var(--neutral-500)] font-normal">({itemCount} article{itemCount > 1 ? 's' : ''})</span>}
            </span>
          </div>

          {items.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-[var(--neutral-500)]">
              Votre panier est vide
            </div>
          ) : (
            <>
              <ul className="divide-y divide-[var(--border-color)]">
                {previewItems.map((item) => (
                  <li key={item.productId} className="flex items-center gap-3 px-4 py-3">
                    <div className="relative w-10 h-10 rounded-lg bg-[var(--neutral-100)] overflow-hidden flex-shrink-0">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          fill
                          sizes="40px"
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[var(--neutral-400)]">
                          <ShoppingCart size={16} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--foreground)] truncate">{item.name}</p>
                      <p className="text-xs text-[var(--neutral-500)]">
                        {item.quantity} × {formatPrice(item.price)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm font-semibold text-[var(--primary)]">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                      <button
                        onClick={() => removeItem(item.productId)}
                        className="p-1 rounded text-[var(--neutral-400)] hover:text-[var(--error)] hover:bg-[var(--error-light)] transition-colors"
                        aria-label={`Retirer ${item.name}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>

              {hasMore && (
                <p className="px-4 py-2 text-xs text-[var(--neutral-500)] text-center border-t border-[var(--border-color)]">
                  +{items.length - 3} autre{items.length - 3 > 1 ? 's' : ''} article{items.length - 3 > 1 ? 's' : ''}
                </p>
              )}

              <div className="px-4 py-3 border-t border-[var(--border-color)] space-y-3">
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span className="text-[var(--foreground)]">Total</span>
                  <span className="text-[var(--primary)]">{formatPrice(total)}</span>
                </div>
                <Link
                  href="/cart"
                  onClick={() => setOpen(false)}
                  className="block w-full text-center px-4 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors"
                >
                  Voir le panier
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
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
      : user.role === USER_ROLES.MERCHANT_OWNER || user.role === USER_ROLES.MERCHANT_STAFF
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
            {user.role === USER_ROLES.CUSTOMER && (
              <>
                <Link
                  href="/orders"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[var(--foreground)] hover:bg-[var(--neutral-100)] transition-colors"
                >
                  <ShoppingBag size={15} />
                  Mes commandes
                </Link>
                <Link
                  href="/favorites"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[var(--foreground)] hover:bg-[var(--neutral-100)] transition-colors"
                >
                  <Heart size={15} />
                  Mes favoris
                </Link>
              </>
            )}
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
  const { isOpen: mobileNavOpen, toggle: toggleMobileNav } = useMobileMenu();

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

          {/* Actions droite */}
          <div className="flex items-center gap-1 ml-auto">
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

            {/* Menu navigation mobile (drawer latéral) */}
            <button
              type="button"
              className="lg:hidden p-2 rounded-lg text-[var(--neutral-500)] hover:bg-[var(--neutral-100)] transition-colors"
              onClick={toggleMobileNav}
              aria-label={mobileNavOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              aria-expanded={mobileNavOpen}
              aria-controls="mobile-navigation-drawer"
            >
              {mobileNavOpen ? <X size={20} aria-hidden /> : <Menu size={20} aria-hidden />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
