'use client';

import { useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import OrderList from '@/components/OrderList';
import OrderForm from '@/components/OrderForm';
import { useAuth } from '@/lib/auth-context';
import type { Order } from '@/lib/types';

export default function OrdersPage() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | undefined>(undefined);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Déterminer si l'utilisateur est un merchant ou admin
  const isMerchant = user?.role === 'merchant_owner' || user?.role === 'merchant_staff';
  const isAdmin = user?.role === 'platform_admin';
  const isCustomer = user?.role === 'customer';
  const canCreateOrder = isMerchant || isAdmin;

  // Titre selon le rôle
  const pageTitle = isCustomer ? 'Mes commandes' : 'Gestion des commandes';

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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-100">{pageTitle}</h1>
          {!showForm && canCreateOrder && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-md hover:shadow-lg"
            >
              + Nouvelle commande
            </button>
          )}
        </div>

        {showForm ? (
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-8 shadow-xl mb-6">
            <OrderForm
              order={editingOrder}
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-8 shadow-xl">
            <OrderList
              onEdit={canCreateOrder ? handleEdit : undefined}
              onDelete={canCreateOrder ? undefined : undefined}
              refreshTrigger={refreshTrigger}
              userRole={user?.role}
            />
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

