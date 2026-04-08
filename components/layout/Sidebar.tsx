'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  Bell,
  Package,
  ShoppingBag,
  Wallet,
  Rocket,
  Users,
  CheckCircle2,
  Home,
  ShoppingCart,
  Heart,
  User,
  LogIn,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useMobileMenu } from '@/lib/mobile-menu-context';
import { USER_ROLES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { ONBOARDING_DONE_KEY } from '@/app/onboarding/page';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  done?: boolean;
}

const ADMIN_NAV: NavItem[] = [
  { href: '/dashboard', label: 'Tableau de bord', icon: <LayoutDashboard size={18} /> },
  { href: '/admin/tenants', label: 'Tenants', icon: <Building2 size={18} /> },
  { href: '/admin/users', label: 'Utilisateurs', icon: <Users size={18} /> },
  { href: '/orders', label: 'Toutes les commandes', icon: <ShoppingBag size={18} /> },
  { href: '/payments', label: 'Paiements', icon: <CreditCard size={18} /> },
  { href: '/notifications', label: 'Notifications', icon: <Bell size={18} /> },
];

const MERCHANT_NAV: NavItem[] = [
  { href: '/dashboard', label: 'Tableau de bord', icon: <LayoutDashboard size={18} /> },
  { href: '/products/manage', label: 'Mes produits', icon: <Package size={18} /> },
  { href: '/orders', label: 'Commandes', icon: <ShoppingBag size={18} /> },
  { href: '/payments', label: 'Paiements reçus', icon: <Wallet size={18} /> },
];

const MERCHANT_OWNER_EXTRA: NavItem = {
  href: '/onboarding',
  label: 'Onboarding',
  icon: <Rocket size={18} />,
};

const CUSTOMER_NAV: NavItem[] = [
  { href: '/', label: 'Accueil', icon: <Home size={18} /> },
  { href: '/products', label: 'Produits', icon: <Package size={18} /> },
  { href: '/cart', label: 'Panier', icon: <ShoppingCart size={18} /> },
  { href: '/orders', label: 'Mes commandes', icon: <ShoppingBag size={18} /> },
  { href: '/favorites', label: 'Favoris', icon: <Heart size={18} /> },
  { href: '/profile', label: 'Profil', icon: <User size={18} /> },
];

const GUEST_NAV: NavItem[] = [
  { href: '/', label: 'Accueil', icon: <Home size={18} /> },
  { href: '/products', label: 'Produits', icon: <Package size={18} /> },
  { href: '/login', label: 'Connexion', icon: <LogIn size={18} /> },
  { href: '/register', label: "S'inscrire", icon: <UserPlus size={18} /> },
];

function NavLink({
  item,
  onNavigate,
}: {
  item: NavItem;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
        isActive
          ? 'bg-[var(--primary-light)] text-[var(--primary)]'
          : 'text-[var(--neutral-600)] hover:bg-[var(--neutral-100)] hover:text-[var(--foreground)]'
      )}
    >
      <span
        className={cn(
          'flex-shrink-0',
          isActive ? 'text-[var(--primary)]' : 'text-[var(--neutral-400)]'
        )}
      >
        {item.icon}
      </span>
      <span className="flex-1 min-w-0 truncate">{item.label}</span>
      {item.done && (
        <CheckCircle2
          size={14}
          className="flex-shrink-0 text-[var(--success,#16a34a)]"
          aria-label="Terminé"
        />
      )}
    </Link>
  );
}

export function Sidebar() {
  const { user, isLoading } = useAuth();
  const { isOpen, close } = useMobileMenu();
  const [onboardingDone, setOnboardingDone] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOnboardingDone(!!localStorage.getItem(ONBOARDING_DONE_KEY));
    }
  }, []);

  if (isLoading) {
    return (
      <>
        {isOpen && (
          <button
            type="button"
            aria-label="Fermer le menu de navigation"
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            onClick={close}
          />
        )}
        <aside
          className={cn(
            'fixed left-0 top-16 bottom-0 z-40 flex w-64 flex-col border-r border-[var(--border-color)] bg-[var(--card-background)]',
            'transform transition-transform duration-200 ease-out lg:hidden',
            isOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'
          )}
        >
          <div className="p-4 text-sm text-[var(--neutral-500)]">Chargement…</div>
        </aside>
      </>
    );
  }

  const isAdmin = user?.role === USER_ROLES.PLATFORM_ADMIN;
  const isMerchant =
    user?.role === USER_ROLES.MERCHANT_OWNER || user?.role === USER_ROLES.MERCHANT_STAFF;
  const isCustomer = user?.role === USER_ROLES.CUSTOMER;

  let desktopNavItems: NavItem[] = [];
  if (isAdmin) {
    desktopNavItems = ADMIN_NAV;
  } else if (isMerchant) {
    desktopNavItems =
      user.role === USER_ROLES.MERCHANT_OWNER
        ? [...MERCHANT_NAV, { ...MERCHANT_OWNER_EXTRA, done: onboardingDone }]
        : MERCHANT_NAV;
  }

  let mobileNavItems: NavItem[] = GUEST_NAV;
  if (isAdmin) {
    mobileNavItems = ADMIN_NAV;
  } else if (isMerchant) {
    mobileNavItems =
      user.role === USER_ROLES.MERCHANT_OWNER
        ? [...MERCHANT_NAV, { ...MERCHANT_OWNER_EXTRA, done: onboardingDone }]
        : MERCHANT_NAV;
  } else if (isCustomer) {
    mobileNavItems = CUSTOMER_NAV;
  }

  const showDesktopSidebar = isAdmin || isMerchant;

  return (
    <>
      {/* Drawer mobile (tous les rôles + invité) */}
      {isOpen && (
        <button
          type="button"
          aria-label="Fermer le menu de navigation"
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={close}
        />
      )}
      <aside
        id="mobile-navigation-drawer"
        aria-hidden={!isOpen}
        className={cn(
          'fixed left-0 top-16 bottom-0 z-40 flex w-64 flex-col border-r border-[var(--border-color)] bg-[var(--card-background)]',
          'transform transition-transform duration-200 ease-out lg:hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'
        )}
      >
        <nav className="flex flex-col gap-1 overflow-y-auto p-3 pt-4" aria-label="Navigation principale">
          {mobileNavItems.map((item) => (
            <NavLink key={item.href} item={item} onNavigate={close} />
          ))}
        </nav>
      </aside>

      {/* Sidebar desktop (marchands / admins) */}
      {showDesktopSidebar && (
        <aside className="hidden lg:flex flex-col w-56 flex-shrink-0 border-r border-[var(--border-color)] bg-[var(--card-background)] min-h-[calc(100vh-4rem)]">
          <nav className="flex flex-col gap-1 p-3 pt-4" aria-label="Navigation latérale">
            {desktopNavItems.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </nav>
        </aside>
      )}
    </>
  );
}
