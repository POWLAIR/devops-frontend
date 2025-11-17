'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center py-12">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
          Bienvenue sur DevOps MicroService App
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-300 mb-8">
          Application microservices avec API Gateway Next.js
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mt-8">
        {!isAuthenticated ? (
          <>
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <h2 className="text-2xl font-semibold mb-4 text-slate-800 dark:text-slate-100">Connexion</h2>
              <p className="text-slate-600 dark:text-slate-300 mb-6">
                Connectez-vous à votre compte pour accéder à vos commandes.
              </p>
              <Link
                href="/login"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md hover:shadow-lg"
              >
                Se connecter
              </Link>
            </div>
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <h2 className="text-2xl font-semibold mb-4 text-slate-800 dark:text-slate-100">Inscription</h2>
              <p className="text-slate-600 dark:text-slate-300 mb-6">
                Créez un nouveau compte pour commencer à utiliser l'application.
              </p>
              <Link
                href="/register"
                className="inline-block bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors font-medium shadow-md hover:shadow-lg"
              >
                S'inscrire
              </Link>
            </div>
          </>
        ) : (
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-8 hover:shadow-xl transition-all duration-300 md:col-span-2">
            <h2 className="text-2xl font-semibold mb-4 text-slate-800 dark:text-slate-100">Accès rapide</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              Vous êtes connecté. Accédez à vos commandes ou créez-en une nouvelle.
            </p>
            <Link
              href="/orders"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md hover:shadow-lg"
            >
              Voir mes commandes
            </Link>
          </div>
        )}
      </div>

      <div className="mt-12 border-t border-slate-200 dark:border-slate-700 pt-8">
        <h2 className="text-2xl font-semibold mb-4 text-slate-800 dark:text-slate-100">À propos</h2>
        <p className="text-slate-600 dark:text-slate-300">
          Cette application démontre une architecture microservices avec :
        </p>
        <ul className="list-disc list-inside mt-4 text-slate-600 dark:text-slate-300 space-y-2">
          <li>API Gateway (Next.js) - Point d'entrée unique</li>
          <li>Auth Service (FastAPI) - Authentification et autorisation</li>
          <li>Order Service (NestJS) - Gestion des commandes</li>
        </ul>
      </div>
    </div>
  );
}
