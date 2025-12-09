'use client';

import { useState, FormEvent } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

interface StripePaymentFormProps {
  clientSecret: string;
  amount: number;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export default function StripePaymentForm({
  clientSecret,
  amount,
  onSuccess,
  onError,
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/orders?payment=success`,
        },
        redirect: 'if_required',
      });

      if (error) {
        setErrorMessage(error.message || 'Une erreur est survenue lors du paiement');
        if (onError) {
          onError(error.message || 'Erreur de paiement');
        }
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inattendue';
      setErrorMessage(message);
      if (onError) {
        onError(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Informations de paiement</h3>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            Montant à payer : <span className="font-bold text-gray-900">{amount.toFixed(2)} €</span>
          </p>
        </div>

        <PaymentElement
          options={{
            layout: 'tabs',
          }}
        />

        {errorMessage && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{errorMessage}</p>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={!stripe || isLoading}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
      >
        {isLoading ? 'Traitement en cours...' : `Payer ${amount.toFixed(2)} €`}
      </button>

      <p className="text-xs text-gray-500 text-center">
        Paiement sécurisé par Stripe. Vos informations sont protégées.
      </p>
    </form>
  );
}



