'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <Link href="/" className="text-xl font-bold hover:text-blue-100 transition-colors">
              DevOps MicroService App
            </Link>
            {isAuthenticated && (
              <Link
                href="/orders"
                className="hover:text-blue-100 transition-colors font-medium"
              >
                Commandes
              </Link>
            )}
          </div>
          <nav className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-blue-50">
                  Connecté en tant que: <strong className="font-semibold">{user?.email}</strong>
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

