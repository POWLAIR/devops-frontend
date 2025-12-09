'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ShoppingCart, Heart, User, Search, Menu, LogOut } from 'lucide-react';
import CartButton from '../cart/CartButton';

export default function MainNav() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
    router.push('/');
  };

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link 
            href="/" 
            className="flex items-center space-x-2 shrink-0"
          >
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-2 rounded-lg">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <span className="font-bold text-lg md:text-xl text-slate-900 hidden sm:block">
              TechStore
            </span>
          </Link>

          {/* Search Bar (Desktop) */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-2xl mx-8">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher des produits..."
                className="w-full px-4 py-2.5 pl-11 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-md transition-colors text-sm font-medium"
              >
                Chercher
              </button>
            </div>
          </form>

          {/* Actions */}
          <div className="flex items-center space-x-3 md:space-x-4">
            {/* Favorites */}
            {isAuthenticated && (
              <Link
                href="/favorites"
                className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors group"
                title="Mes favoris"
              >
                <Heart className="w-6 h-6 text-slate-700 group-hover:text-red-500 transition-colors" />
                <span className="sr-only">Favoris</span>
              </Link>
            )}

            {/* Cart */}
            <CartButton />

            {/* User Menu */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm">
                    {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </div>
                  <span className="hidden lg:block text-sm font-medium text-slate-700">
                    {user?.full_name || 'Mon compte'}
                  </span>
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowUserMenu(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-lg shadow-lg py-2 z-50">
                      <div className="px-4 py-3 border-b border-slate-200">
                        <p className="text-sm font-medium text-slate-900">{user?.full_name || 'Utilisateur'}</p>
                        <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                      </div>

                      <Link
                        href="/profile"
                        className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <User className="w-4 h-4 mr-3" />
                        Mon profil
                      </Link>

                      <Link
                        href="/orders"
                        className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <ShoppingCart className="w-4 h-4 mr-3" />
                        Mes commandes
                      </Link>

                      <Link
                        href="/favorites"
                        className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Heart className="w-4 h-4 mr-3" />
                        Mes favoris
                      </Link>

                      {/* Merchant Links */}
                      {(user?.role === 'MERCHANT_OWNER' || user?.role === 'MERCHANT_STAFF' || user?.role === 'PLATFORM_ADMIN') && (
                        <>
                          <div className="border-t border-slate-200 my-2" />
                          <Link
                            href="/dashboard"
                            className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 font-medium"
                            onClick={() => setShowUserMenu(false)}
                          >
                            📊 Dashboard
                          </Link>
                        </>
                      )}

                      <div className="border-t border-slate-200 my-2" />

                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        Déconnexion
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm"
              >
                <User className="w-5 h-5" />
                <span className="hidden md:block">Connexion</span>
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Search Bar */}
        <form onSubmit={handleSearch} className="md:hidden pb-3">
          <div className="relative w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher..."
              className="w-full px-4 py-2 pl-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          </div>
        </form>
      </div>
    </nav>
  );
}

