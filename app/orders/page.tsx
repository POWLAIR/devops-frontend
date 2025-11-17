'use client';

import { useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import OrderList from '@/components/OrderList';
import OrderForm from '@/components/OrderForm';
import type { Order } from '@/lib/types';

export default function OrdersPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | undefined>(undefined);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleEdit = (order: Order) => {
    setEditingOrder(order);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingOrder(undefined);
  };

  const handleSuccess = () => {
    setShowForm(false);
    setEditingOrder(undefined);
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <ProtectedRoute>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Gestion des commandes</h1>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              + Nouvelle commande
            </button>
          )}
        </div>

        {showForm ? (
          <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-md mb-6">
            <OrderForm
              order={editingOrder}
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          </div>
        ) : (
          <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-md">
            <OrderList
              onEdit={handleEdit}
              refreshTrigger={refreshTrigger}
            />
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

