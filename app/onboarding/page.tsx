'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Store, CreditCard, Settings, Package, CheckCircle2, ExternalLink } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { Stepper } from '@/components/ui/Stepper';
import { useAuth } from '@/lib/auth-context';
import { USER_ROLES } from '@/lib/constants';
import { formatPrice } from '@/lib/utils';
import type { Tenant, Plan, OnboardingProgress } from '@/lib/types';

// ─── Définition des étapes ────────────────────────────────────────────────────

const WIZARD_STEPS = [
  { number: 1, label: 'Infos boutique' },
  { number: 2, label: 'Plan' },
  { number: 3, label: 'Configuration' },
  { number: 4, label: 'Produits' },
  { number: 5, label: 'Confirmation' },
];

// ─── Sous-composants de chaque étape ─────────────────────────────────────────

interface Step1Props {
  name: string;
  email: string;
  subdomain: string;
  onChange: (fields: { name?: string; email?: string; subdomain?: string }) => void;
}

function Step1({ name, email, subdomain, onChange }: Step1Props) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-lg bg-[var(--primary-light,#eff6ff)] flex items-center justify-center">
          <Store size={18} className="text-[var(--primary)]" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-[var(--foreground)]">Informations de la boutique</h2>
          <p className="text-xs text-[var(--neutral-500)]">Renseignez les informations de base de votre boutique.</p>
        </div>
      </div>
      <Input
        label="Nom de la boutique"
        value={name}
        onChange={(e) => onChange({ name: e.target.value })}
        autoComplete="organization"
        required
      />
      <Input
        label="Email de contact"
        type="email"
        value={email}
        onChange={(e) => onChange({ email: e.target.value })}
        autoComplete="email"
        required
      />
      <Input
        label="Sous-domaine"
        value={subdomain}
        onChange={(e) => onChange({ subdomain: e.target.value })}
        hint="Exemple : ma-boutique (sans espaces ni caractères spéciaux)"
        placeholder="ma-boutique"
      />
    </div>
  );
}

interface Step2Props {
  plans: Plan[];
  selectedPlanId: string;
  onSelect: (planId: string) => void;
}

function Step2({ plans, selectedPlanId, onSelect }: Step2Props) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-lg bg-[var(--primary-light,#eff6ff)] flex items-center justify-center">
          <CreditCard size={18} className="text-[var(--primary)]" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-[var(--foreground)]">Choisissez votre plan</h2>
          <p className="text-xs text-[var(--neutral-500)]">Sélectionnez le plan adapté à vos besoins.</p>
        </div>
      </div>
      {plans.length === 0 ? (
        <div className="flex justify-center py-6">
          <Spinner size="md" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {plans.map((plan) => {
            const planKey = plan.id;
            const isSelected = planKey === selectedPlanId;
            return (
              <button
                key={plan.id}
                type="button"
                onClick={() => onSelect(planKey)}
                className={`text-left rounded-xl border-2 p-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] ${
                  isSelected
                    ? 'border-[var(--primary)] bg-[var(--primary-light,#eff6ff)]'
                    : 'border-[var(--border-color)] hover:border-[var(--primary)] hover:bg-[var(--neutral-100)]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm text-[var(--foreground)]">{plan.name}</span>
                  <span className="text-sm font-bold text-[var(--primary)]">
                    {plan.monthlyPrice === 0 ? 'Gratuit' : `${formatPrice(plan.monthlyPrice)}/mois`}
                  </span>
                </div>
                <ul className="space-y-1 mt-2">
                  {plan.productLimit > 0 && (
                    <li className="flex items-start gap-1.5 text-xs text-[var(--neutral-600)]">
                      <span className="text-[var(--primary)] mt-0.5">✓</span>
                      Jusqu&apos;à {plan.productLimit} produits
                    </li>
                  )}
                  {plan.orderLimit > 0 && (
                    <li className="flex items-start gap-1.5 text-xs text-[var(--neutral-600)]">
                      <span className="text-[var(--primary)] mt-0.5">✓</span>
                      {plan.orderLimit} commandes/mois
                    </li>
                  )}
                  {plan.productLimit === 0 && (
                    <li className="flex items-start gap-1.5 text-xs text-[var(--neutral-600)]">
                      <span className="text-[var(--primary)] mt-0.5">✓</span>
                      Produits et commandes illimités
                    </li>
                  )}
                </ul>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface Step3Props {
  description: string;
  customDomain: string;
  onChange: (fields: { description?: string; customDomain?: string }) => void;
}

function Step3({ description, customDomain, onChange }: Step3Props) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-lg bg-[var(--primary-light,#eff6ff)] flex items-center justify-center">
          <Settings size={18} className="text-[var(--primary)]" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-[var(--foreground)]">Configuration avancée</h2>
          <p className="text-xs text-[var(--neutral-500)]">Personnalisez davantage votre boutique.</p>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="description" className="text-sm font-medium text-[var(--foreground)]">
          Description de la boutique
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => onChange({ description: e.target.value })}
          rows={4}
          placeholder="Décrivez votre boutique en quelques mots…"
          className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--card-background)] text-sm text-[var(--foreground)] px-3 py-2.5 transition focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent placeholder:text-[var(--neutral-400)] resize-none"
        />
      </div>
      <Input
        label="Domaine personnalisé (optionnel)"
        value={customDomain}
        onChange={(e) => onChange({ customDomain: e.target.value })}
        hint="Exemple : www.ma-boutique.com"
        placeholder="www.ma-boutique.com"
      />
    </div>
  );
}

interface Step4Props {
  productCount: number;
}

function Step4({ productCount }: Step4Props) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-lg bg-[var(--primary-light,#eff6ff)] flex items-center justify-center">
          <Package size={18} className="text-[var(--primary)]" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-[var(--foreground)]">Ajout de produits</h2>
          <p className="text-xs text-[var(--neutral-500)]">Commencez à alimenter votre catalogue.</p>
        </div>
      </div>
      <div className="rounded-xl border border-[var(--border-color)] bg-[var(--neutral-50,#f9fafb)] p-5 text-center">
        <p className="text-3xl font-bold text-[var(--primary)] mb-1">{productCount}</p>
        <p className="text-sm text-[var(--neutral-600)]">
          {productCount === 0 ? 'Aucun produit pour le moment' : `produit${productCount > 1 ? 's' : ''} dans votre catalogue`}
        </p>
      </div>
      <div className="space-y-3">
        <p className="text-sm text-[var(--neutral-600)]">
          Choisissez comment ajouter vos premiers produits :
        </p>
        <div className="space-y-2">
          <Link
            href="/products/manage"
            className="flex items-center justify-between w-full rounded-lg border border-[var(--border-color)] px-4 py-3 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--neutral-100)] hover:border-[var(--primary)] transition-colors"
          >
            <span>Ajout manuel</span>
            <ExternalLink size={15} className="text-[var(--neutral-400)]" />
          </Link>
          <div className="flex items-center justify-between w-full rounded-lg border border-[var(--border-color)] px-4 py-3 text-sm text-[var(--neutral-400)] cursor-not-allowed">
            <span>Import CSV</span>
            <span className="text-xs bg-[var(--neutral-100)] text-[var(--neutral-500)] px-2 py-0.5 rounded-full">Bientôt</span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface Step5Props {
  shopName: string;
  shopEmail: string;
  shopSubdomain: string;
  description: string;
  customDomain: string;
  selectedPlanId: string;
  plans: Plan[];
}

function Step5({ shopName, shopEmail, shopSubdomain, description, customDomain, selectedPlanId, plans }: Step5Props) {
  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-lg bg-[var(--success-light,#f0fdf4)] flex items-center justify-center">
          <CheckCircle2 size={18} className="text-[var(--success,#16a34a)]" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-[var(--foreground)]">Confirmation</h2>
          <p className="text-xs text-[var(--neutral-500)]">Vérifiez votre configuration avant de terminer.</p>
        </div>
      </div>
      <div className="rounded-xl border border-[var(--border-color)] divide-y divide-[var(--border-color)]">
        <SummaryRow label="Nom de la boutique" value={shopName || '—'} />
        <SummaryRow label="Email de contact" value={shopEmail || '—'} />
        <SummaryRow label="Sous-domaine" value={shopSubdomain || '—'} />
        <SummaryRow label="Plan" value={selectedPlan ? selectedPlan.name : selectedPlanId || '—'} />
        <SummaryRow label="Description" value={description || '—'} />
        {customDomain && (
          <SummaryRow label="Domaine personnalisé" value={customDomain} />
        )}
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3">
      <span className="text-xs text-[var(--neutral-500)] min-w-0 flex-shrink-0">{label}</span>
      <span className="text-xs font-medium text-[var(--foreground)] text-right min-w-0 break-all">{value}</span>
    </div>
  );
}

// ─── Wizard principal ─────────────────────────────────────────────────────────

function OnboardingWizard() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [plans, setPlans] = useState<Plan[]>([]);
  const [productCount, setProductCount] = useState(0);

  const [shopName, setShopName] = useState('');
  const [shopEmail, setShopEmail] = useState('');
  const [shopSubdomain, setShopSubdomain] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [description, setDescription] = useState('');
  const [customDomain, setCustomDomain] = useState('');

  const tenantId = user?.tenant_id;

  const initData = useCallback(async () => {
    if (!tenantId) return;
    setIsLoading(true);
    try {
      const [progressRes, tenantRes] = await Promise.all([
        fetch(`/api/tenant-onboarding/${tenantId}/progress`),
        fetch(`/api/tenants/${tenantId}`),
      ]);

      if (progressRes.ok) {
        const progress: OnboardingProgress = await progressRes.json();
        const step = progress.currentStep || 1;
        setCurrentStep(step);
        // Le backend ne stocke qu'un entier (étape la plus haute atteinte),
        // pas un tableau — on dérive les étapes complétées depuis currentStep.
        setCompletedSteps(Array.from({ length: step - 1 }, (_, i) => i + 1));
      }

      if (tenantRes.ok) {
        const t: Tenant = await tenantRes.json();
        setShopName(t.name || '');
        setShopEmail(t.contactEmail || '');
        setShopSubdomain(t.subdomain || '');
        setDescription(t.description || '');
        setCustomDomain(t.customDomain || '');
        // plan actif via subscriptions (tenant-service)
        const activePlan = t.subscriptions?.find((s) => s.status === 'active')?.plan?.id;
        setSelectedPlanId(activePlan || '');
      }
    } catch {
      setError('Erreur lors du chargement de la progression.');
    } finally {
      setIsLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    initData();
  }, [initData]);

  // Chargement des plans au montage (nécessaire dès l'étape 2 et pour le résumé étape 5)
  useEffect(() => {
    fetch('/api/plans')
      .then((res) => res.json())
      .then((data) => setPlans(Array.isArray(data) ? data : data.plans ?? []))
      .catch(() => setError('Impossible de charger les plans.'));
  }, []);

  useEffect(() => {
    if (currentStep === 4) {
      fetch('/api/products')
        .then((res) => res.json())
        .then((data) => {
          const items = Array.isArray(data) ? data : data.products ?? data.items ?? [];
          setProductCount(items.length);
        })
        .catch(() => {});
    }
  }, [currentStep]);

  const patchTenant = async (fields: Partial<Tenant>) => {
    if (!tenantId) return;
    const res = await fetch(`/api/tenants/${tenantId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    });
    if (!res.ok) throw new Error('Erreur lors de la sauvegarde.');
  };

  const completeStep = async (step: number) => {
    if (!tenantId) return;
    const res = await fetch(`/api/tenant-onboarding/${tenantId}/complete-step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step }),
    });
    if (!res.ok) throw new Error("Erreur lors de la validation de l'étape.");
  };

  const handleNext = async () => {
    setIsSaving(true);
    setError(null);
    try {
      if (currentStep === 1) {
        if (!shopName.trim()) throw new Error('Le nom de la boutique est requis.');
        if (!shopEmail.trim()) throw new Error("L'email de contact est requis.");
        await patchTenant({
          name: shopName,
          contactEmail: shopEmail,
          subdomain: shopSubdomain,
        } as Partial<Tenant>);
      } else if (currentStep === 2) {
        if (!selectedPlanId) throw new Error('Veuillez sélectionner un plan.');
        await patchTenant({ planId: selectedPlanId } as Partial<Tenant>);
      } else if (currentStep === 3) {
        await patchTenant({
          description,
          ...(customDomain ? { customDomain } : {}),
        } as Partial<Tenant>);
      }
      await completeStep(currentStep);
      setCompletedSteps((prev) => [...new Set([...prev, currentStep])]);
      setCurrentStep((prev) => prev + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFinish = async () => {
    setIsSaving(true);
    setError(null);
    try {
      await completeStep(5);
      await refreshUser();
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-1">Configuration de votre boutique</h1>
        <p className="text-sm text-[var(--neutral-500)]">
          Suivez les étapes pour terminer la mise en place de votre boutique.
        </p>
      </div>

      <Stepper
        steps={WIZARD_STEPS}
        currentStep={currentStep}
        completedSteps={completedSteps}
        className="mb-8"
      />

      {error && (
        <div
          className="mb-4 px-4 py-3 rounded-lg border border-[var(--error)] bg-red-50 text-[var(--error)] text-sm"
          role="alert"
          aria-live="assertive"
        >
          {error}
        </div>
      )}

      <Card>
        <div className="p-1">
          {currentStep === 1 && (
            <Step1
              name={shopName}
              email={shopEmail}
              subdomain={shopSubdomain}
              onChange={(f) => {
                if (f.name !== undefined) setShopName(f.name);
                if (f.email !== undefined) setShopEmail(f.email);
                if (f.subdomain !== undefined) setShopSubdomain(f.subdomain);
              }}
            />
          )}
          {currentStep === 2 && (
            <Step2 plans={plans} selectedPlanId={selectedPlanId} onSelect={setSelectedPlanId} />
          )}
          {currentStep === 3 && (
            <Step3
              description={description}
              customDomain={customDomain}
              onChange={(f) => {
                if (f.description !== undefined) setDescription(f.description);
                if (f.customDomain !== undefined) setCustomDomain(f.customDomain);
              }}
            />
          )}
          {currentStep === 4 && <Step4 productCount={productCount} />}
          {currentStep === 5 && (
            <Step5
              shopName={shopName}
              shopEmail={shopEmail}
              shopSubdomain={shopSubdomain}
              description={description}
              customDomain={customDomain}
              selectedPlanId={selectedPlanId}
              plans={plans}
            />
          )}

          <div className="flex items-center justify-between mt-6 pt-4 border-t border-[var(--border-color)]">
            {currentStep > 1 ? (
              <Button
                variant="outline"
                onClick={() => setCurrentStep((p) => p - 1)}
                disabled={isSaving}
              >
                Précédent
              </Button>
            ) : (
              <div />
            )}
            {currentStep < 5 ? (
              <Button onClick={handleNext} loading={isSaving}>
                Suivant
              </Button>
            ) : (
              <Button onClick={handleFinish} loading={isSaving}>
                Terminer l&apos;onboarding
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  return (
    <ProtectedRoute allowedRoles={[USER_ROLES.MERCHANT_OWNER]}>
      <OnboardingWizard />
    </ProtectedRoute>
  );
}
