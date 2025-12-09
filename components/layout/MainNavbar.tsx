'use client';

import Link from 'next/link';
import { ShoppingCart, Search, Menu, X, Heart, LayoutDashboard, Users } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';

export default function MainNavbar() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/products?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  // Déterminer si on affiche les liens merchant
  const isMerchant = user?.role === 'merchant_owner' || user?.role === 'merchant_staff';
  const isOwner = user?.role === 'merchant_owner' || user?.role === 'platform_admin';
  const isCustomer = user?.role === 'customer';
  const isAdmin = user?.role === 'platform_admin';

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center text-white font-bold text-xl">
              D
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                DevOps Shop
              </h1>
              <p className="text-xs text-slate-500">Votre marketplace multi-tenant</p>
            </div>
          </Link>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-8">
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher des produits..."
                  className="w-full px-4 py-2 pl-10 pr-4 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              </div>
            </form>
          </div>

          {/* Actions - Desktop */}
          <div className="hidden md:flex items-center gap-4">
            {/* Favoris */}
            {isCustomer && (
              <Link
                href="/favorites"
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
                title="Mes favoris"
              >
                <Heart className="w-5 h-5 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">Favoris</span>
              </Link>
            )}

            {/* Dashboard Merchant */}
            {(isMerchant || isAdmin) && (
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
                title="Dashboard"
              >
                <LayoutDashboard className="w-5 h-5 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">Dashboard</span>
              </Link>
            )}

            {/* Équipe - Owner uniquement */}
            {isOwner && (
              <Link
                href="/team"
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
                title="Gestion de l'équipe"
              >
                <Users className="w-5 h-5 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">Équipe</span>
              </Link>
            )}

            {/* Panier */}
            {isCustomer && (
              <Link
                href="/cart"
                className="relative flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <ShoppingCart className="w-5 h-5" />
                <span className="font-medium">Panier</span>
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-slate-100"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white">
          <div className="px-4 py-4 space-y-3">
            {/* Search - Mobile */}
            <form onSubmit={handleSearch}>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher..."
                  className="w-full px-4 py-2 pl-10 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              </div>
            </form>

            {/* Actions - Mobile */}
            <div className="pt-4 border-t border-slate-200 space-y-2">
              {isCustomer && (
                <>
                  <Link
                    href="/favorites"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-slate-100"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Heart className="w-5 h-5" />
                    <span>Mes favoris</span>
                  </Link>
                  <Link
                    href="/cart"
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg justify-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <ShoppingCart className="w-5 h-5" />
                    <span>Panier ({cartCount})</span>
                  </Link>
                </>
              )}
              {(isMerchant || isAdmin) && (
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-slate-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <LayoutDashboard className="w-5 h-5" />
                  <span>Dashboard</span>
                </Link>
              )}
              {isOwner && (
                <Link
                  href="/team"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-slate-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Users className="w-5 h-5" />
                  <span>Équipe</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
