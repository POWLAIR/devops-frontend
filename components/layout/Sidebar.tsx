'use client';

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
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { USER_ROLES } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const ADMIN_NAV: NavItem[] = [
  { href: '/dashboard', label: 'Tableau de bord', icon: <LayoutDashboard size={18} /> },
  { href: '/admin/tenants', label: 'Tenants', icon: <Building2 size={18} /> },
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

function NavLink({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

  return (
    <Link
      href={item.href}
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
      {item.label}
    </Link>
  );
}

export function Sidebar() {
  const { user, isLoading } = useAuth();

  if (isLoading || !user) return null;

  let navItems: NavItem[] = [];
  if (user.role === USER_ROLES.PLATFORM_ADMIN) {
    navItems = ADMIN_NAV;
  } else if (user.role === USER_ROLES.MERCHANT_OWNER || user.role === USER_ROLES.MERCHANT_STAFF) {
    navItems = MERCHANT_NAV;
  } else {
    return null;
  }

  return (
    <aside className="hidden lg:flex flex-col w-56 flex-shrink-0 border-r border-[var(--border-color)] bg-[var(--card-background)] min-h-[calc(100vh-4rem)]">
      <nav className="flex flex-col gap-1 p-3 pt-4">
        {navItems.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </nav>
    </aside>
  );
}
