'use client';

import { useState, useEffect } from 'react';
import { apiClient, ApiError } from '@/lib/api-client';
import { useToast } from '@/lib/toast';
import type { Order } from '@/lib/types';

interface OrderListProps {
  onEdit?: (order: Order) => void;
  onDelete?: (orderId: string) => void;
  refreshTrigger?: number;
  userRole?: string;
}

export default function OrderList({ onEdit, onDelete, refreshTrigger, userRole }: OrderListProps) {
  const isCustomer = userRole === 'customer';
  const canManageOrders = !isCustomer; // Merchants et admins peuvent gérer
  const { error: errorToast, success } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOrders = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await apiClient.getOrders();
      setOrders(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Erreur lors du chargement des commandes');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [refreshTrigger]);

  const handleDelete = async (orderId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette commande ?')) {
      return;
    }

    try {
      await apiClient.deleteOrder(orderId);
      if (onDelete) {
        onDelete(orderId);
      }
      success('Commande supprimée avec succès');
      fetchOrders();
    } catch (err) {
      if (err instanceof ApiError) {
        errorToast(err.message);
      } else {
        errorToast('Erreur lors de la suppression');
      }
    }
  };

  if (isLoading) {
    return <div className="text-center py-12 text-slate-600 dark:text-slate-300 text-lg">Chargement des commandes...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
        {error}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500 dark:text-slate-400 text-lg">
        Aucune commande pour le moment
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className="border border-slate-200 dark:border-slate-700 rounded-xl p-6 hover:shadow-lg transition-all duration-300 bg-white dark:bg-slate-900/50"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-xl text-slate-800 dark:text-slate-100 mb-1">Commande #{order.id.slice(0, 8)}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Créée le: {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  order.status === 'shipped'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                    : order.status === 'confirmed'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                    : order.status === 'cancelled'
                    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                }`}
              >
                {order.status}
              </span>
            </div>
            <div className="mb-4">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {order.items.length} article(s) - Total: <span className="font-semibold text-blue-600 dark:text-blue-400">{order.total.toFixed(2)} €</span>
              </p>
            </div>
            {canManageOrders && (
              <div className="flex gap-3 mt-4">
                {onEdit && (
                  <button
                    onClick={() => onEdit(order)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm hover:shadow-md"
                  >
                    Modifier
                  </button>
                )}
                <button
                  onClick={() => handleDelete(order.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-sm hover:shadow-md"
                >
                  Supprimer
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

