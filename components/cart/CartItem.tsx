'use client';

import Image from 'next/image';

export interface CartItemData {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

interface CartItemProps {
  item: CartItemData;
  onUpdateQuantity: (productId: string, newQuantity: number) => void;
  onRemove: (productId: string) => void;
}

export default function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  return (
    <div className="flex gap-4 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
      {/* Image */}
      <div className="relative w-20 h-20 flex-shrink-0">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            className="object-contain rounded"
            sizes="80px"
          />
        ) : (
          <div className="w-full h-full bg-slate-200 dark:bg-slate-700 rounded flex items-center justify-center">
            <span className="text-slate-400 text-xs">No Image</span>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-grow">
        <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-2">
          {item.name}
        </h3>
        <p className="text-blue-600 dark:text-blue-400 font-bold mb-2">
          ${item.price.toFixed(2)}
        </p>

        <div className="flex items-center gap-4">
          {/* Quantity Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
              className="w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded transition-colors"
              aria-label="Diminuer la quantité"
            >
              -
            </button>
            <span className="w-12 text-center font-medium">{item.quantity}</span>
            <button
              onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
              className="w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded transition-colors"
              aria-label="Augmenter la quantité"
            >
              +
            </button>
          </div>

          {/* Remove Button */}
          <button
            onClick={() => onRemove(item.productId)}
            className="text-red-600 dark:text-red-400 hover:underline text-sm"
          >
            Supprimer
          </button>
        </div>
      </div>

      {/* Total */}
      <div className="text-right flex-shrink-0">
        <p className="font-bold text-slate-800 dark:text-slate-100">
          ${(item.price * item.quantity).toFixed(2)}
        </p>
      </div>
    </div>
  );
}

