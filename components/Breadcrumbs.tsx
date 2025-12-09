'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const routeMapping: Record<string, string> = {
  '': 'Accueil',
  products: 'Produits',
  orders: 'Commandes',
  favorites: 'Favoris',
  cart: 'Panier',
  checkout: 'Paiement',
  login: 'Connexion',
  register: 'Inscription',
  profile: 'Mon Profil',
  notifications: 'Notifications',
  dashboard: 'Dashboard',
  team: 'Équipe',
  payments: 'Paiements',
  onboarding: 'Configuration',
};

export default function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) {
    return null;
  }

  return (
    <nav className="mb-6" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2 text-sm">
        <li>
          <Link
            href="/"
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            Accueil
          </Link>
        </li>
        {segments.map((segment, index) => {
          const path = `/${segments.slice(0, index + 1).join('/')}`;
          const isLast = index === segments.length - 1;
          const label = routeMapping[segment] || segment;

          return (
            <li key={path} className="flex items-center space-x-2">
              <span className="text-gray-400">/</span>
              {isLast ? (
                <span className="text-gray-900 font-medium">{label}</span>
              ) : (
                <Link
                  href={path}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

