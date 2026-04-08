'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { PasswordInput } from '@/components/auth/PasswordInput';
import type { AuthResponse } from '@/lib/types';
import { apiFetch } from '@/lib/api-client';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading, login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const redirect = searchParams.get('redirect') || '/';

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, isLoading, router]);

  function validate(): boolean {
    setEmailError('');
    setFormError('');

    if (!EMAIL_REGEX.test(email)) {
      setEmailError('Adresse email invalide.');
      return false;
    }
    if (!password) {
      setFormError('Le mot de passe est requis.');
      return false;
    }
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setFormError('');

    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        skipUnauthorizedHandling: true,
        skipErrorToast: true,
      });

      const data: AuthResponse & { message?: string; detail?: string } = await res.json();

      if (!res.ok) {
        setFormError(data.message ?? data.detail ?? 'Identifiants incorrects.');
        return;
      }

      login(data.token, data.user);
      router.push(redirect);
    } catch {
      setFormError('Impossible de contacter le serveur. Vérifiez votre connexion.');
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading) return null;
  if (isAuthenticated) return null;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-[var(--card-background)] border border-[var(--border-color)] rounded-2xl shadow-[var(--shadow-md)] px-8 py-10">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-[var(--foreground)] mb-1">Connexion</h1>
            <p className="text-sm text-[var(--neutral-500)]">
              Accédez à votre espace personnel
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            <Input
              label="Adresse email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError('');
              }}
              error={emailError}
              disabled={submitting}
            />

            <PasswordInput
              label="Mot de passe"
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (formError) setFormError('');
              }}
              disabled={submitting}
            />

            {formError && (
              <p
                className="text-sm text-[var(--error)] bg-[var(--error-soft,color-mix(in_srgb,var(--error)_10%,transparent))] border border-[var(--error)] rounded-lg px-3 py-2"
                role="alert"
                aria-live="polite"
              >
                {formError}
              </p>
            )}

            <Button
              type="submit"
              size="lg"
              loading={submitting}
              className="w-full mt-1"
            >
              Se connecter
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-[var(--neutral-500)]">
            Pas encore de compte ?{' '}
            <Link
              href="/register"
              className="text-[var(--primary)] font-medium hover:underline"
            >
              S&apos;inscrire
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
