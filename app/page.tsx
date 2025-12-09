'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import CategoryGrid from '@/components/home/CategoryGrid';
import { ArrowRight, ShoppingBag, Shield, TruckIcon, HeadphonesIcon } from 'lucide-react';

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                Découvrez les Meilleurs Produits Tech
              </h1>
              <p className="text-xl text-blue-100 mb-8">
                Des laptops aux smartphones, trouvez tout ce dont vous avez besoin pour votre vie numérique.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/products"
                  className="inline-flex items-center justify-center bg-white text-blue-600 px-8 py-4 rounded-lg hover:bg-blue-50 transition-all font-semibold text-lg shadow-lg hover:shadow-xl"
                >
                  Voir le catalogue
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
                {!isAuthenticated && (
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center border-2 border-white text-white px-8 py-4 rounded-lg hover:bg-white hover:text-blue-600 transition-all font-semibold text-lg"
                  >
                    Créer un compte
                  </Link>
                )}
              </div>
            </div>
            <div className="hidden md:block">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <div className="grid grid-cols-2 gap-6">
                  {[
                    { icon: '💻', label: 'Laptops Premium', count: '25+' },
                    { icon: '📱', label: 'Smartphones', count: '40+' },
                    { icon: '🎧', label: 'Audio', count: '30+' },
                    { icon: '⌚', label: 'Wearables', count: '15+' },
                  ].map((stat, index) => (
                    <div key={index} className="text-center">
                      <div className="text-4xl mb-2">{stat.icon}</div>
                      <div className="text-2xl font-bold">{stat.count}</div>
                      <div className="text-sm text-blue-100">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 bg-slate-50">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: TruckIcon, title: 'Livraison Gratuite', desc: 'Dès 50€ d\'achat' },
              { icon: Shield, title: 'Paiement Sécurisé', desc: 'Transactions protégées' },
              { icon: HeadphonesIcon, title: 'Support 24/7', desc: 'Nous sommes là pour vous' },
              { icon: ShoppingBag, title: 'Retours Faciles', desc: '30 jours de garantie' },
            ].map((feature, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 text-blue-600 rounded-full mb-4">
                  <feature.icon className="w-8 h-8" />
                </div>
                <h3 className="font-semibold text-lg mb-2 text-slate-900">{feature.title}</h3>
                <p className="text-slate-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Catégories Populaires</h2>
            <p className="text-slate-600">Explorez nos produits par catégorie</p>
          </div>
          <CategoryGrid />
        </div>
      </section>


      {/* Auth Section */}
      <div className="grid md:grid-cols-2 gap-6 mt-12 mb-12">
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
            <div className="flex gap-4">
              <Link
                href="/products"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md hover:shadow-lg"
              >
                Voir le catalogue
              </Link>
              <Link
                href="/orders"
                className="inline-block bg-slate-600 text-white px-6 py-3 rounded-lg hover:bg-slate-700 transition-colors font-medium shadow-md hover:shadow-lg"
              >
                Mes commandes
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* About Section */}
      <div className="mt-12 border-t border-slate-200 dark:border-slate-700 pt-8">
        <h2 className="text-2xl font-semibold mb-4 text-slate-800 dark:text-slate-100">À propos</h2>
        <p className="text-slate-600 dark:text-slate-300">
          Cette application démontre une architecture microservices avec :
        </p>
        <ul className="list-disc list-inside mt-4 text-slate-600 dark:text-slate-300 space-y-2">
          <li>API Gateway (Next.js) - Point d'entrée unique et interface utilisateur</li>
          <li>Auth Service (Python FastAPI) - Authentification, autorisation et gestion des équipes</li>
          <li>Product Service (NestJS) - Catalogue produits, favoris et avis clients</li>
          <li>Order Service (NestJS) - Gestion complète des commandes</li>
          <li>Payment Service (Go + Fiber) - Traitement des paiements via Stripe</li>
          <li>Notification Service (Python FastAPI) - Envoi d'emails et SMS via SendGrid/Twilio</li>
          <li>Tenant Service (NestJS) - Gestion multi-tenant et onboarding</li>
        </ul>
      </div>
    </div>
  );
}
