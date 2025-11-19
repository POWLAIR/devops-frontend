'use client';

export interface CartSummaryData {
  subtotal: number;
  tax?: number;
  shipping?: number;
  total: number;
  itemCount: number;
}

interface CartSummaryProps {
  summary: CartSummaryData;
  onCheckout?: () => void;
  checkoutLabel?: string;
  showCheckoutButton?: boolean;
}

export default function CartSummary({ 
  summary, 
  onCheckout,
  checkoutLabel = 'Passer la commande',
  showCheckoutButton = true
}: CartSummaryProps) {
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 sticky top-4">
      <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">
        Résumé de la commande
      </h2>

      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-slate-600 dark:text-slate-400">
          <span>Articles ({summary.itemCount})</span>
          <span>${summary.subtotal.toFixed(2)}</span>
        </div>

        {summary.tax !== undefined && (
          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span>TVA</span>
            <span>${summary.tax.toFixed(2)}</span>
          </div>
        )}

        {summary.shipping !== undefined && (
          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span>Livraison</span>
            <span>
              {summary.shipping === 0 ? 'Gratuite' : `$${summary.shipping.toFixed(2)}`}
            </span>
          </div>
        )}

        <div className="border-t border-slate-200 dark:border-slate-700 pt-3 mt-3">
          <div className="flex justify-between text-lg font-bold text-slate-800 dark:text-slate-100">
            <span>Total</span>
            <span>${summary.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {showCheckoutButton && onCheckout && (
        <button
          onClick={onCheckout}
          className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          {checkoutLabel}
        </button>
      )}
    </div>
  );
}

