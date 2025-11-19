'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import CartButton from './cart/CartButton';
import MobileMenu from './MobileMenu';

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <>
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo et Navigation Principale */}
            <div className="flex items-center space-x-6">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden p-2 hover:bg-blue-800 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300"
                aria-label="Ouvrir le menu"
                aria-expanded={mobileMenuOpen}
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
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>

              <Link href="/" className="text-xl font-bold hover:text-blue-100 transition-colors">
                DevOps MicroService App
              </Link>
              
              {/* Navigation Links - Desktop */}
              <nav className="hidden md:flex items-center space-x-4">
              <Link
                href="/products"
                className="hover:text-blue-100 transition-colors font-medium"
              >
                Produits
              </Link>
              {isAuthenticated && (
                <>
                  <Link
                    href="/favorites"
                    className="hover:text-blue-100 transition-colors font-medium"
                  >
                    Favoris
                  </Link>
                  <Link
                    href="/orders"
                    className="hover:text-blue-100 transition-colors font-medium"
                  >
                    Commandes
                  </Link>
                </>
              )}
            </nav>
          </div>

          {/* Actions */}
          <nav className="flex items-center space-x-4">
            {/* Cart Button */}
            <CartButton />

            {/* Auth Section */}
            {isAuthenticated ? (
              <>
                <span className="hidden lg:block text-sm text-blue-50">
                  <strong className="font-semibold">{user?.email}</strong>
                </span>
              <button
                onClick={handleLogout}
                className="bg-blue-800 hover:bg-blue-900 px-4 py-2 rounded-md transition-colors font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                aria-label="Se déconnecter"
              >
                Déconnexion
              </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hover:text-blue-100 transition-colors font-medium"
                >
                  Connexion
                </Link>
                <Link
                  href="/register"
                  className="bg-blue-800 hover:bg-blue-900 px-4 py-2 rounded-md transition-colors font-medium shadow-sm"
                >
                  Inscription
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
    
    {/* Mobile Menu */}
    <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
    </>
  );
}

