'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Home, ChevronRight, User as UserIcon, Lock, Info } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';
import { formatDateTime } from '@/lib/utils';
import { USER_ROLES } from '@/lib/constants';
import type { UserUpdateRequest, PasswordUpdateRequest } from '@/lib/types';

const ROLE_LABELS: Record<string, string> = {
  [USER_ROLES.PLATFORM_ADMIN]: 'Administrateur plateforme',
  [USER_ROLES.MERCHANT_OWNER]: 'Propriétaire boutique',
  [USER_ROLES.MERCHANT_STAFF]: 'Employé boutique',
  [USER_ROLES.CUSTOMER]: 'Client',
};

function ProfileContent() {
  const { user, isLoading, refreshUser } = useAuth();
  const { addToast } = useToast();

  // Section 1: Informations
  const [fullName, setFullName] = useState('');
  const [infoError, setInfoError] = useState<string | null>(null);
  const [isSavingInfo, setIsSavingInfo] = useState(false);

  // Section 2: Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Refresh on mount to get fresh data
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Initialize form from context once loaded
  useEffect(() => {
    if (user) {
      setFullName(user.full_name ?? '');
    }
  }, [user]);

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setInfoError(null);
    setIsSavingInfo(true);
    try {
      const body: UserUpdateRequest = { full_name: fullName };
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { message?: string; detail?: string };
      if (!res.ok) {
        setInfoError(data.message ?? data.detail ?? 'Impossible de mettre à jour le profil.');
        return;
      }
      await refreshUser();
      addToast('Profil mis à jour.', 'success');
    } catch {
      setInfoError('Erreur réseau. Veuillez réessayer.');
    } finally {
      setIsSavingInfo(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    if (newPassword.length < 8) {
      setPasswordError('Le nouveau mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas.');
      return;
    }
    setIsSavingPassword(true);
    try {
      const body: PasswordUpdateRequest = {
        current_password: currentPassword,
        new_password: newPassword,
      };
      const res = await fetch('/api/users/me/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { message?: string; detail?: string };
      if (!res.ok) {
        setPasswordError(data.message ?? data.detail ?? 'Impossible de changer le mot de passe.');
        return;
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      addToast('Mot de passe changé avec succès.', 'success');
    } catch {
      setPasswordError('Erreur réseau. Veuillez réessayer.');
    } finally {
      setIsSavingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
          <Skeleton className="h-5 w-48 mb-6 rounded-lg" />
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-56 w-full rounded-xl" />
          <Skeleton className="h-36 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav
          aria-label="Fil d'Ariane"
          className="flex items-center gap-1.5 text-sm text-[var(--neutral-500)] mb-6"
        >
          <Link
            href="/"
            className="hover:text-[var(--foreground)] transition-colors flex items-center gap-1"
          >
            <Home size={14} />
            Accueil
          </Link>
          <ChevronRight size={14} />
          <span className="text-[var(--foreground)] font-medium">Mon profil</span>
        </nav>

        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-6">Mon profil</h1>

        <div className="space-y-6">
          {/* Section 1: Informations personnelles */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <UserIcon size={18} className="text-[var(--primary)]" />
                <h2 className="text-base font-semibold text-[var(--foreground)]">
                  Informations personnelles
                </h2>
              </div>
            </CardHeader>
            <CardBody>
              <form onSubmit={handleSaveInfo} className="space-y-4">
                <Input
                  label="Nom complet"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Votre nom complet"
                />

                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <Input
                        label="Adresse email"
                        type="email"
                        value={user.email}
                        disabled
                        readOnly
                      />
                    </div>
                    {!user.email_verified && (
                      <Badge variant="warning" className="mt-1 shrink-0">
                        Non vérifié
                      </Badge>
                    )}
                  </div>
                  {!user.email_verified && (
                    <p className="text-xs text-[var(--neutral-500)]">
                      L'email ne peut pas être modifié avant vérification.
                    </p>
                  )}
                </div>

                {infoError && (
                  <p role="alert" className="text-sm text-[var(--error)]">
                    {infoError}
                  </p>
                )}

                <div className="flex justify-end pt-2">
                  <Button type="submit" loading={isSavingInfo}>
                    Sauvegarder
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>

          {/* Section 2: Mot de passe */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lock size={18} className="text-[var(--primary)]" />
                <h2 className="text-base font-semibold text-[var(--foreground)]">Mot de passe</h2>
              </div>
            </CardHeader>
            <CardBody>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <Input
                  label="Mot de passe actuel"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <Input
                  label="Nouveau mot de passe"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  hint="Minimum 8 caractères"
                  required
                  autoComplete="new-password"
                />
                <Input
                  label="Confirmer le nouveau mot de passe"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />

                {passwordError && (
                  <p role="alert" className="text-sm text-[var(--error)]">
                    {passwordError}
                  </p>
                )}

                <div className="flex justify-end pt-2">
                  <Button type="submit" loading={isSavingPassword}>
                    Changer le mot de passe
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>

          {/* Section 3: Mon compte */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Info size={18} className="text-[var(--primary)]" />
                <h2 className="text-base font-semibold text-[var(--foreground)]">Mon compte</h2>
              </div>
            </CardHeader>
            <CardBody>
              <dl className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-[var(--neutral-500)]">Rôle</dt>
                  <dd>
                    <Badge variant="primary">{ROLE_LABELS[user.role] ?? user.role}</Badge>
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-[var(--neutral-500)]">Membre depuis</dt>
                  <dd className="text-[var(--foreground)]">{formatDateTime(user.created_at)}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-[var(--neutral-500)]">Email vérifié</dt>
                  <dd>
                    {user.email_verified ? (
                      <Badge variant="success">Vérifié</Badge>
                    ) : (
                      <Badge variant="warning">Non vérifié</Badge>
                    )}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-[var(--neutral-500)]">Compte actif</dt>
                  <dd>
                    {user.is_active ? (
                      <Badge variant="success">Actif</Badge>
                    ) : (
                      <Badge variant="error">Inactif</Badge>
                    )}
                  </dd>
                </div>
              </dl>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}
