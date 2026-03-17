'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCcw, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('[GlobalError]', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4 text-center">
      <div className="w-20 h-20 rounded-full bg-[var(--error-light)] flex items-center justify-center text-[var(--error)]">
        <AlertTriangle size={36} />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Une erreur est survenue</h1>
        <p className="text-[var(--neutral-500)] max-w-sm">
          {error.message || 'Une erreur inattendue s\'est produite. Veuillez réessayer.'}
        </p>
        {error.digest && (
          <p className="text-xs text-[var(--neutral-400)] font-mono">Ref : {error.digest}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors"
        >
          <RotateCcw size={16} />
          Réessayer
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-[var(--border-color)] text-[var(--foreground)] text-sm font-medium hover:bg-[var(--neutral-100)] transition-colors"
        >
          <ArrowLeft size={16} />
          Accueil
        </Link>
      </div>
    </div>
  );
}
