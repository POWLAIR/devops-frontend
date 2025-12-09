'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import Stepper from '@/components/onboarding/Stepper';
import toast from 'react-hot-toast';
import { getToken } from '@/lib/auth';

const STEPS = [
  'Infos boutique',
  'Choix du plan',
  'Configuration',
  'Produits',
  'Équipe',
];

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '0€',
    features: ['10 produits max', 'Support email', 'Fonctionnalités de base'],
  },
  {
    id: 'starter',
    name: 'Starter',
    price: '29€/mois',
    features: [
      '100 produits',
      'Support prioritaire',
      'Analyses basiques',
      'Personnalisation',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '99€/mois',
    features: [
      'Produits illimités',
      'Support 24/7',
      'Analyses avancées',
      'API complète',
      'Multi-utilisateurs',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Sur devis',
    features: [
      'Tout de Pro',
      'Serveur dédié',
      'SLA garanti',
      'Formation équipe',
      'Intégrations custom',
    ],
  },
];

export default function OnboardingPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Step 1: Infos boutique
  const [shopName, setShopName] = useState('');
  const [shopLogo, setShopLogo] = useState('');

  // Step 2: Plan
  const [selectedPlan, setSelectedPlan] = useState('free');

  // Step 3: Configuration
  const [domain, setDomain] = useState('');
  const [description, setDescription] = useState('');

  // Step 4: Produits
  const [importMethod, setImportMethod] = useState<'csv' | 'manual'>('manual');

  // Step 5: Équipe
  const [teamEmails, setTeamEmails] = useState(['']);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      const isMerchant =
        user.role === 'merchant_owner' || user.role === 'merchant_staff';
      const isAdmin = user.role === 'platform_admin';
      if (!isMerchant && !isAdmin) {
        router.push('/');
      }
    }
  }, [user, router]);

  const saveProgress = async () => {
    setSaving(true);
    try {
      const token = getToken();
      if (!token || !user) return;

      await fetch(`/api/onboarding/${user.tenant_id}/complete-step`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ step: currentStep }),
      });
    } catch (error) {
      console.error('Error saving progress:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    // Validation basique
    if (currentStep === 1 && !shopName) {
      toast.error('Veuillez entrer le nom de votre boutique');
      return;
    }

    await saveProgress();

    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    } else {
      toast.success('Configuration terminée !');
      router.push('/dashboard');
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const addTeamEmail = () => {
    setTeamEmails([...teamEmails, '']);
  };

  const removeTeamEmail = (index: number) => {
    setTeamEmails(teamEmails.filter((_, i) => i !== index));
  };

  const updateTeamEmail = (index: number, value: string) => {
    const newEmails = [...teamEmails];
    newEmails[index] = value;
    setTeamEmails(newEmails);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Configuration de votre boutique
          </h1>
          <p className="text-gray-600">
            Suivez ces étapes pour démarrer rapidement
          </p>
        </div>

        <Stepper currentStep={currentStep} totalSteps={5} steps={STEPS} />

        <div className="bg-white rounded-lg shadow p-8 mb-6">
          {/* Étape 1 : Infos boutique */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Informations de votre boutique
              </h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de la boutique *
                </label>
                <input
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ma Super Boutique"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL du logo (optionnel)
                </label>
                <input
                  type="url"
                  value={shopLogo}
                  onChange={(e) => setShopLogo(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/logo.png"
                />
              </div>
            </div>
          )}

          {/* Étape 2 : Choix du plan */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Choisissez votre plan
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {PLANS.map((plan) => (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedPlan === plan.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {plan.name}
                    </h3>
                    <p className="text-2xl font-bold text-blue-600 mb-4">
                      {plan.price}
                    </p>
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center text-sm">
                          <svg
                            className="w-4 h-4 text-green-600 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Étape 3 : Configuration */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Configuration avancée
              </h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de domaine (optionnel)
                </label>
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ma-boutique.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description de la boutique
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Décrivez votre boutique..."
                />
              </div>
            </div>
          )}

          {/* Étape 4 : Produits */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Ajoutez vos produits
              </h2>
              <div className="space-y-4">
                <div
                  onClick={() => setImportMethod('manual')}
                  className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                    importMethod === 'manual'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Ajouter manuellement
                  </h3>
                  <p className="text-sm text-gray-600">
                    Ajoutez vos produits un par un via l'interface
                  </p>
                </div>
                <div
                  onClick={() => setImportMethod('csv')}
                  className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                    importMethod === 'csv'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Importer depuis un fichier CSV
                  </h3>
                  <p className="text-sm text-gray-600">
                    Importez plusieurs produits en une fois
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Étape 5 : Équipe */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Invitez votre équipe
              </h2>
              <p className="text-gray-600">
                Ajoutez les emails des membres de votre équipe (optionnel)
              </p>
              <div className="space-y-3">
                {teamEmails.map((email, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => updateTeamEmail(index, e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="email@example.com"
                    />
                    {teamEmails.length > 1 && (
                      <button
                        onClick={() => removeTeamEmail(index)}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={addTeamEmail}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                + Ajouter un membre
              </button>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Précédent
          </button>
          <button
            onClick={handleNext}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {saving
              ? 'Sauvegarde...'
              : currentStep === 5
                ? 'Terminer'
                : 'Suivant'}
          </button>
        </div>
      </div>
    </div>
  );
}

