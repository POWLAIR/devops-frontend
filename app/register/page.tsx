'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { PasswordInput } from '@/components/auth/PasswordInput';
import type { AuthResponse } from '@/lib/types';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export default function RegisterPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, login } = useAuth();

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, isLoading, router]);

  function validate(): boolean {
    setEmailError('');
    setPasswordError('');
    setConfirmError('');
    setFormError('');
    let valid = true;

    if (!EMAIL_REGEX.test(email)) {
      setEmailError('Adresse email invalide.');
      valid = false;
    }
    if (password.length < 8) {
      setPasswordError('Le mot de passe doit contenir au moins 8 caractères.');
      valid = false;
    }
    if (password !== confirmPassword) {
      setConfirmError('Les mots de passe ne correspondent pas.');
      valid = false;
    }
    return valid;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setFormError('');

    try {
      const body: { email: string; password: string; full_name?: string } = {
        email,
        password,
      };
      if (fullName.trim()) {
        body.full_name = fullName.trim();
      }

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data: AuthResponse & { message?: string; detail?: string } = await res.json();

      if (!res.ok) {
        setFormError(data.message ?? data.detail ?? "L'inscription a échoué. Veuillez réessayer.");
        return;
      }

      login(data.token, data.user);
      router.push('/');
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
            <h1 className="text-2xl font-bold text-[var(--foreground)] mb-1">Créer un compte</h1>
            <p className="text-sm text-[var(--neutral-500)]">
              Rejoignez la marketplace
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

            <Input
              label="Nom complet (optionnel)"
              type="text"
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={submitting}
            />

            <PasswordInput
              label="Mot de passe"
              autoComplete="new-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (passwordError) setPasswordError('');
              }}
              error={passwordError}
              hint="Minimum 8 caractères"
              disabled={submitting}
            />

            <PasswordInput
              label="Confirmer le mot de passe"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (confirmError) setConfirmError('');
              }}
              error={confirmError}
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
              Créer mon compte
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-[var(--neutral-500)]">
            Déjà un compte ?{' '}
            <Link
              href="/login"
              className="text-[var(--primary)] font-medium hover:underline"
            >
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
