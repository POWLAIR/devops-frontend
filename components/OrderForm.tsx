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
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-2xl font-bold">
        {order ? 'Modifier la commande' : 'Nouvelle commande'}
      </h2>

      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={index} className="border border-gray-300 rounded p-4 space-y-2">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium">Article {index + 1}</h3>
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  Supprimer
                </button>
              )}
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nom</label>
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => updateItem(index, 'name', e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Nom de l'article"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Quantité</label>
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Prix (€)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.price}
                  onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value) || 0)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addItem}
        className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
      >
        + Ajouter un article
      </button>

      <div className="border-t pt-4">
        <div className="flex justify-between items-center mb-4">
          <span className="text-lg font-semibold">Total:</span>
          <span className="text-xl font-bold">{calculateTotal().toFixed(2)} €</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Enregistrement...' : order ? 'Mettre à jour' : 'Créer la commande'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
          >
            Annuler
          </button>
        )}
      </div>
    </form>
  );
}

