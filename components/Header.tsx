'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="bg-blue-600 text-white shadow-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <Link href="/" className="text-xl font-bold hover:text-blue-200">
              DevOps MicroService App
            </Link>
            {isAuthenticated && (
              <Link
                href="/orders"
                className="hover:text-blue-200 transition-colors"
              >
                Commandes
              </Link>
            )}
          </div>
          <nav className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <span className="text-sm">
                  Connecté en tant que: <strong>{user?.email}</strong>
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded transition-colors"
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hover:text-blue-200 transition-colors"
                >
                  Connexion
                </Link>
                <Link
                  href="/register"
                  className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded transition-colors"
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

