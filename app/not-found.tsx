import Link from 'next/link';
import { ArrowLeft, SearchX } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4 text-center">
      <div className="w-20 h-20 rounded-full bg-[var(--neutral-100)] flex items-center justify-center text-[var(--neutral-400)]">
        <SearchX size={36} />
      </div>

      <div className="space-y-2">
        <p className="text-6xl font-bold text-[var(--neutral-200)]">404</p>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Page introuvable</h1>
        <p className="text-[var(--neutral-500)] max-w-sm">
          La page que vous recherchez n&apos;existe pas ou a été déplacée.
        </p>
      </div>

      <Link
        href="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors"
      >
        <ArrowLeft size={16} />
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
