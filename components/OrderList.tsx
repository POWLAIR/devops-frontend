'use client';

import { useState, useEffect } from 'react';
import { apiClient, ApiError } from '@/lib/api-client';
import type { Order } from '@/lib/types';

interface OrderListProps {
  onEdit?: (order: Order) => void;
  onDelete?: (orderId: string) => void;
  refreshTrigger?: number;
}

export default function OrderList({ onEdit, onDelete, refreshTrigger }: OrderListProps) {
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
      fetchOrders();
    } catch (err) {
      if (err instanceof ApiError) {
        alert(err.message);
      } else {
        alert('Erreur lors de la suppression');
      }
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Chargement des commandes...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Aucune commande pour le moment
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">Mes commandes</h2>
      <div className="grid gap-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className="border border-gray-300 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-semibold text-lg">Commande #{order.id.slice(0, 8)}</h3>
                <p className="text-sm text-gray-500">
                  Créée le: {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  order.status === 'completed'
                    ? 'bg-green-100 text-green-800'
                    : order.status === 'processing'
                    ? 'bg-blue-100 text-blue-800'
                    : order.status === 'cancelled'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {order.status}
              </span>
            </div>
            <div className="mb-2">
              <p className="text-sm text-gray-600">
                {order.items.length} article(s) - Total: {order.total.toFixed(2)} €
              </p>
            </div>
            <div className="flex gap-2 mt-4">
              {onEdit && (
                <button
                  onClick={() => onEdit(order)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Modifier
                </button>
              )}
              <button
                onClick={() => handleDelete(order.id)}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

