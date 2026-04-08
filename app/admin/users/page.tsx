'use client';

import { Users } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { USER_ROLES } from '@/lib/constants';

function PageContent() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
      <div className="w-16 h-16 rounded-full bg-[var(--neutral-100)] flex items-center justify-center text-[var(--neutral-400)]">
        <Users size={28} />
      </div>
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-[var(--foreground)]">Gestion des utilisateurs</h1>
        <p className="text-sm text-[var(--neutral-500)] max-w-xs">
          Cette fonctionnalité sera disponible prochainement.
        </p>
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <ProtectedRoute allowedRoles={[USER_ROLES.PLATFORM_ADMIN]}>
      <PageContent />
    </ProtectedRoute>
  );
}
