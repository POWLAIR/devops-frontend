'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

export default function TopBar() {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="bg-slate-900 text-slate-200 text-sm border-b border-slate-800">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          {/* Left: Promo Message */}
          <div className="flex items-center space-x-4">
            <span className="hidden md:block">
              🎉 <strong>Livraison gratuite</strong> dès 50€ d'achat
            </span>
          </div>

          {/* Right: Quick Links */}
          <div className="flex items-center space-x-4">
            {isAuthenticated && user ? (
              <>
                <span className="hidden sm:block text-slate-400">
                  Bienvenue, <strong className="text-white">{user.full_name || user.email}</strong>
                </span>
                <span className="hidden sm:block text-slate-600">|</span>
              </>
            ) : null}

            <Link href="/orders" className="hover:text-white transition-colors">
              📦 Suivi commandes
            </Link>
            
            <span className="hidden sm:block text-slate-600">|</span>
            
            <Link href="/help" className="hover:text-white transition-colors hidden sm:block">
              ❓ Aide
            </Link>
            
            {!isAuthenticated && (
              <>
                <span className="text-slate-600 hidden sm:block">|</span>
                <Link href="/login" className="hover:text-white transition-colors">
                  <span className="hidden sm:inline">👤 </span>Se connecter
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

