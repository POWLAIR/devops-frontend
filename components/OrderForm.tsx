'use client';

import { useState, FormEvent } from 'react';
import { apiClient, ApiError } from '@/lib/api-client';
import type { Order, OrderItem, CreateOrderRequest, UpdateOrderRequest } from '@/lib/types';

interface OrderFormProps {
  order?: Order;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function OrderForm({ order, onSuccess, onCancel }: OrderFormProps) {
  const [items, setItems] = useState<Omit<OrderItem, 'id'>[]>(
    order?.items.map((item) => ({ name: item.name, quantity: item.quantity, price: item.price })) || [
      { name: '', quantity: 1, price: 0 },
    ]
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const addItem = () => {
    setItems([...items, { name: '', quantity: 1, price: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof Omit<OrderItem, 'id'>, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.quantity * item.price, 0);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (items.some((item) => !item.name || item.quantity <= 0 || item.price < 0)) {
      setError('Veuillez remplir tous les champs correctement');
      return;
    }

    setIsLoading(true);

    try {
      if (order) {
        // Mise à jour
        const updateData: UpdateOrderRequest = { items };
        await apiClient.updateOrder(order.id, updateData);
      } else {
        // Création
        const createData: CreateOrderRequest = { items };
        await apiClient.createOrder(createData);
      }
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Une erreur est survenue');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
        {order ? 'Modifier la commande' : 'Nouvelle commande'}
      </h2>

      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={index} className="border border-slate-200 dark:border-slate-700 rounded-lg p-5 space-y-3 bg-slate-50 dark:bg-slate-900/50">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-slate-700 dark:text-slate-200">Article {index + 1}</h3>
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium transition-colors"
                >
                  Supprimer
                </button>
              )}
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-200">Nom</label>
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => updateItem(index, 'name', e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  placeholder="Nom de l'article"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-200">Quantité</label>
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-200">Prix (€)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.price}
                  onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value) || 0)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addItem}
        className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors font-medium"
      >
        + Ajouter un article
      </button>

      <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
        <div className="flex justify-between items-center mb-4">
          <span className="text-lg font-semibold text-slate-700 dark:text-slate-200">Total:</span>
          <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{calculateTotal().toFixed(2)} €</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors font-semibold shadow-md hover:shadow-lg"
        >
          {isLoading ? 'Enregistrement...' : order ? 'Mettre à jour' : 'Créer la commande'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors font-medium"
          >
            Annuler
          </button>
        )}
      </div>
    </form>
  );
}

