'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import Breadcrumbs from '@/components/Breadcrumbs';
import { Skeleton } from '@/components/ui/Skeleton';
import toast from 'react-hot-toast';
import { getToken } from '@/lib/auth';
import { formatCurrency } from '@/lib/dashboard-utils';

interface Payment {
  id: string;
  order_id: string;
  amount: number;
  status: string;
  created_at: string;
}

export default function PaymentsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [error, setError] = useState('');

  const COMMISSION_RATE = 0.05; // 5%

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      // Vérifier si l'utilisateur est un merchant ou admin
      const isMerchant =
        user.role === 'merchant_owner' || user.role === 'merchant_staff';
      const isAdmin = user.role === 'platform_admin';
      if (!isMerchant && !isAdmin) {
        router.push('/');
        return;
      }
      loadPayments();
    }
  }, [user, router]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      setError('');

      const token = getToken();
      if (!token) {
        throw new Error('Non authentifié');
      }

      const response = await fetch('/api/payments', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        // Si le service de paiement n'est pas disponible, retourner un tableau vide
        setPayments([]);
        return;
      }

      const data = await response.json();
      setPayments(data);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (payments.length === 0) {
      toast.error('Aucune donnée à exporter');
      return;
    }

    const headers = [
      'ID',
      'Commande',
      'Montant Brut',
      'Commission (5%)',
      'Montant Net',
      'Statut',
      'Date',
    ];

    const rows = payments.map((payment) => {
      const commission = payment.amount * COMMISSION_RATE;
      const net = payment.amount - commission;
      return [
        payment.id,
        payment.order_id,
        payment.amount.toFixed(2),
        commission.toFixed(2),
        net.toFixed(2),
        payment.status,
        new Date(payment.created_at).toLocaleString('fr-FR'),
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `paiements_${new Date().toISOString().split('T')[0]}.csv`
    );
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Export CSV réussi');
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      succeeded: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
    };

    const labels: Record<string, string> = {
      succeeded: 'Réussi',
      pending: 'En attente',
      failed: 'Échec',
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}
      >
        {labels[status] || status}
      </span>
    );
  };

  const totalBrut = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalCommission = totalBrut * COMMISSION_RATE;
  const totalNet = totalBrut - totalCommission;

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
      <div className="max-w-7xl mx-auto px-4">
        <Breadcrumbs />

        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Historique des Paiements
            </h1>
            <p className="text-gray-600 mt-2">
              Consultez et exportez vos transactions
            </p>
          </div>
          <button
            onClick={exportToCSV}
            disabled={payments.length === 0}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Exporter CSV
          </button>
        </div>

        {/* Résumé */}
        {payments.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Total Brut</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(totalBrut)}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Commission (5%)</p>
              <p className="text-2xl font-bold text-red-600">
                -{formatCurrency(totalCommission)}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Total Net</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(totalNet)}
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Liste des paiements */}
        {loading ? (
          <Skeleton className="h-96 w-full" />
        ) : payments.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            Aucun paiement enregistré
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Commande
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Montant Brut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Commission
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Montant Net
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payments.map((payment) => {
                    const commission = payment.amount * COMMISSION_RATE;
                    const net = payment.amount - commission;
                    return (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {payment.id.substring(0, 8)}...
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {payment.order_id.substring(0, 8)}...
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                          -{formatCurrency(commission)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                          {formatCurrency(net)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(payment.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(payment.created_at).toLocaleString('fr-FR')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

