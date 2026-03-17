import Link from 'next/link';
import { Store } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-[var(--border-color)] bg-[var(--card-background)] mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Branding */}
          <div className="flex items-center gap-2 text-[var(--neutral-500)]">
            <Store size={18} />
            <span className="text-sm font-medium">DevOps Shop</span>
            <span className="text-xs bg-[var(--neutral-100)] text-[var(--neutral-500)] px-2 py-0.5 rounded-full">
              v0.1.0
            </span>
          </div>

          {/* Liens légaux */}
          <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-[var(--neutral-500)]">
            <Link href="/legal" className="hover:text-[var(--foreground)] transition-colors">
              CGU
            </Link>
            <Link href="/privacy" className="hover:text-[var(--foreground)] transition-colors">
              Confidentialité
            </Link>
            <Link href="/support" className="hover:text-[var(--foreground)] transition-colors">
              Support
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[var(--foreground)] transition-colors"
            >
              GitHub
            </a>
          </nav>

          {/* Info technique */}
          <p className="text-xs text-[var(--neutral-400)]">
            6 microservices · Next.js 16
          </p>
        </div>
      </div>
    </footer>
  );
}
