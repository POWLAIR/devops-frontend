'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import CartButton from './cart/CartButton';

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo et Navigation Principale */}
          <div className="flex items-center space-x-6">
            <Link href="/" className="text-xl font-bold hover:text-blue-100 transition-colors">
              DevOps MicroService App
            </Link>
            
            {/* Navigation Links */}
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
                  className="bg-blue-800 hover:bg-blue-900 px-4 py-2 rounded-md transition-colors font-medium shadow-sm"
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
  );
}

