'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import Breadcrumbs from '@/components/Breadcrumbs';
import { Skeleton } from '@/components/ui/Skeleton';
import toast from 'react-hot-toast';
import { getToken } from '@/lib/auth';
import type { User } from '@/lib/types';

export default function TeamPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState('');

  // Formulaire d'invitation
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState('merchant_staff');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      // Vérifier si l'utilisateur est owner ou admin
      if (user.role !== 'merchant_owner' && user.role !== 'platform_admin') {
        router.push('/');
        return;
      }
      loadTeamUsers();
    }
  }, [user, router]);

  const loadTeamUsers = async () => {
    try {
      setLoading(true);
      setError('');

      const token = getToken();
      if (!token) {
        throw new Error('Non authentifié');
      }

      const response = await fetch('/api/team/users', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des utilisateurs');
      }

      const data = await response.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement');
      toast.error(err.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);

    try {
      const token = getToken();
      if (!token) {
        throw new Error('Non authentifié');
      }

      const response = await fetch('/api/team/invite', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: inviteEmail,
          full_name: inviteName,
          role: inviteRole,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Erreur lors de l\'invitation');
      }

      toast.success('Invitation envoyée avec succès');
      setShowInviteForm(false);
      setInviteEmail('');
      setInviteName('');
      setInviteRole('merchant_staff');
      loadTeamUsers();
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de l\'invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    if (userId === user?.id) {
      toast.error('Vous ne pouvez pas modifier votre propre statut');
      return;
    }

    try {
      const token = getToken();
      if (!token) {
        throw new Error('Non authentifié');
      }

      const response = await fetch(`/api/team/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Erreur lors de la mise à jour');
      }

      toast.success('Statut mis à jour');
      loadTeamUsers();
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la mise à jour');
    }
  };

  const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = {
      merchant_owner: 'bg-purple-100 text-purple-800',
      merchant_staff: 'bg-blue-100 text-blue-800',
      customer: 'bg-gray-100 text-gray-800',
      platform_admin: 'bg-red-100 text-red-800',
    };

    const labels: Record<string, string> = {
      merchant_owner: 'Propriétaire',
      merchant_staff: 'Staff',
      customer: 'Client',
      platform_admin: 'Admin',
    };

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${styles[role] || styles.customer}`}
      >
        {labels[role] || role}
      </span>
    );
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
      <div className="max-w-6xl mx-auto px-4">
        <Breadcrumbs />

        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestion de l'équipe</h1>
            <p className="text-gray-600 mt-2">
              Invitez et gérez les membres de votre équipe
            </p>
          </div>
          <button
            onClick={() => setShowInviteForm(!showInviteForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {showInviteForm ? 'Annuler' : 'Inviter un membre'}
          </button>
        </div>

        {/* Formulaire d'invitation */}
        {showInviteForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Inviter un nouveau membre</h2>
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="email@example.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom complet
                  </label>
                  <input
                    type="text"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Jean Dupont"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rôle
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="merchant_staff">Staff</option>
                  <option value="merchant_owner">Propriétaire</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={inviting}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {inviting ? 'Envoi en cours...' : 'Envoyer l\'invitation'}
              </button>
            </form>
          </div>
        )}

        {/* Liste des utilisateurs */}
        {loading ? (
          <Skeleton className="h-96 w-full" />
        ) : error ? (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg">
            {error}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Utilisateur
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rôle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email vérifié
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((teamUser) => (
                    <tr key={teamUser.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {teamUser.full_name || 'Sans nom'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {teamUser.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRoleBadge(teamUser.role)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            teamUser.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {teamUser.is_active ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {teamUser.email_verified ? (
                          <span className="text-green-600">✓ Vérifié</span>
                        ) : (
                          <span className="text-orange-600">En attente</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {teamUser.id !== user?.id && (
                          <button
                            onClick={() =>
                              handleToggleStatus(teamUser.id, teamUser.is_active)
                            }
                            className={`px-3 py-1 rounded ${
                              teamUser.is_active
                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            } transition-colors`}
                          >
                            {teamUser.is_active ? 'Désactiver' : 'Activer'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

