'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center py-12">
        <h1 className="text-4xl font-bold mb-4">
          Bienvenue sur DevOps MicroService App
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Application microservices avec API Gateway Next.js
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mt-8">
        {!isAuthenticated ? (
          <>
            <div className="border border-gray-300 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <h2 className="text-2xl font-semibold mb-4">Connexion</h2>
              <p className="text-gray-600 mb-4">
                Connectez-vous à votre compte pour accéder à vos commandes.
              </p>
              <Link
                href="/login"
                className="inline-block bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors"
              >
                Se connecter
              </Link>
            </div>
            <div className="border border-gray-300 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <h2 className="text-2xl font-semibold mb-4">Inscription</h2>
              <p className="text-gray-600 mb-4">
                Créez un nouveau compte pour commencer à utiliser l'application.
              </p>
              <Link
                href="/register"
                className="inline-block bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition-colors"
              >
                S'inscrire
              </Link>
            </div>
          </>
        ) : (
          <div className="border border-gray-300 rounded-lg p-6 hover:shadow-lg transition-shadow md:col-span-2">
            <h2 className="text-2xl font-semibold mb-4">Accès rapide</h2>
            <p className="text-gray-600 mb-4">
              Vous êtes connecté. Accédez à vos commandes ou créez-en une nouvelle.
            </p>
            <Link
              href="/orders"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Voir mes commandes
            </Link>
          </div>
        )}
      </div>

      <div className="mt-12 border-t pt-8">
        <h2 className="text-2xl font-semibold mb-4">À propos</h2>
        <p className="text-gray-600">
          Cette application démontre une architecture microservices avec :
        </p>
        <ul className="list-disc list-inside mt-4 text-gray-600 space-y-2">
          <li>API Gateway (Next.js) - Point d'entrée unique</li>
          <li>Auth Service (FastAPI) - Authentification et autorisation</li>
          <li>Order Service (NestJS) - Gestion des commandes</li>
        </ul>
      </div>
    </div>
  );
}
