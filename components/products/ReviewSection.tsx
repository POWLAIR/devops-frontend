'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Star, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatRelativeDate } from '@/lib/utils';
import type { Review } from '@/lib/types';
import { cn } from '@/lib/utils';
import { apiFetch, ApiUnauthorizedError } from '@/lib/api-client';

// ─── Normalisation camelCase (NestJS) → frontend type ────────────────────────

function normalizeReview(raw: Record<string, unknown>): Review {
  return {
    id: raw.id as string,
    product_id: (raw.productId as string | undefined) ?? (raw.product_id as string) ?? '',
    user_id: (raw.userId as string | undefined) ?? (raw.user_id as string) ?? '',
    rating: parseInt(String(raw.rating ?? 0), 10),
    comment: (raw.comment as string | undefined) ?? undefined,
    author: (raw.author as string | undefined) ?? undefined,
    created_at: (raw.createdAt as string | undefined) ?? (raw.created_at as string | undefined),
  };
}

function anonymizeAuthor(userId: string): string {
  if (!userId) return 'Anonyme';
  const first = userId.charAt(0).toUpperCase();
  return `${first}${'*'.repeat(4)}`;
}

// ─── StarRating display ───────────────────────────────────────────────────────

function StarDisplay({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={size}
          className={
            i < rating
              ? 'fill-[var(--warning)] text-[var(--warning)]'
              : 'fill-[var(--neutral-300)] text-[var(--neutral-300)]'
          }
        />
      ))}
    </div>
  );
}

// ─── StarRatingInput (clickable) ──────────────────────────────────────────────

function StarRatingInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (rating: number) => void;
}) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex items-center gap-0.5" role="group" aria-label="Note de 1 à 5">
      {Array.from({ length: 5 }).map((_, i) => {
        const starValue = i + 1;
        const isActive = starValue <= (hovered || value);
        return (
          <button
            key={i}
            type="button"
            onClick={() => onChange(starValue)}
            onMouseEnter={() => setHovered(starValue)}
            onMouseLeave={() => setHovered(0)}
            aria-label={`${starValue} étoile${starValue > 1 ? 's' : ''}`}
            className="p-0.5 transition-transform hover:scale-110 focus-visible:outline-none"
          >
            <Star
              size={24}
              className={cn(
                'transition-colors',
                isActive
                  ? 'fill-[var(--warning)] text-[var(--warning)]'
                  : 'fill-[var(--neutral-300)] text-[var(--neutral-300)]'
              )}
            />
          </button>
        );
      })}
      {value > 0 && (
        <span className="ml-2 text-sm text-[var(--neutral-500)]">
          {value} / 5
        </span>
      )}
    </div>
  );
}

// ─── ReviewSection ────────────────────────────────────────────────────────────

interface ReviewSectionProps {
  productId: string;
  isAuthenticated: boolean;
  reviewsBaseUrl?: string;
}

export function ReviewSection({ productId, isAuthenticated, reviewsBaseUrl }: ReviewSectionProps) {
  const reviewsUrl = reviewsBaseUrl ?? `/api/products/${productId}/reviews`;
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const fetchReviews = useCallback(() => {
    setIsLoading(true);
    (async () => {
      try {
        const res = await apiFetch(reviewsUrl, { skipErrorToast: true, skipUnauthorizedHandling: true });
        const data: unknown = await res.json();
        const raw = Array.isArray(data)
          ? data
          : Array.isArray((data as { data?: unknown[] })?.data)
            ? (data as { data: unknown[] }).data
            : [];
        setReviews(raw.map((r: Record<string, unknown>) => normalizeReview(r)));
      } catch {
        setReviews([]);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [reviewsUrl]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setSubmitError('Veuillez sélectionner une note.');
      return;
    }
    setSubmitting(true);
    setSubmitError('');
    try {
      const res = await apiFetch(reviewsUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment: comment.trim() || undefined }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).message ?? 'Erreur lors de la soumission.');
      }
      setSubmitSuccess(true);
      setRating(0);
      setComment('');
      fetchReviews();
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (err: unknown) {
      if (err instanceof ApiUnauthorizedError) return;
      setSubmitError(err instanceof Error ? err.message : 'Erreur inconnue.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section>
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare size={20} className="text-[var(--primary)]" />
        <h2 className="text-xl font-bold text-[var(--foreground)]">
          Avis clients
          {!isLoading && reviews.length > 0 && (
            <span className="ml-2 text-base font-normal text-[var(--neutral-500)]">
              ({reviews.length})
            </span>
          )}
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Reviews list */}
        <div className="lg:col-span-2 space-y-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-[var(--border-color)] bg-[var(--card-background)] p-5 space-y-3"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))
          ) : reviews.length === 0 ? (
            <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-background)] p-8 text-center">
              <p className="text-[var(--neutral-500)] text-sm">
                Aucun avis pour le moment.{' '}
                {isAuthenticated
                  ? 'Soyez le premier à laisser un avis !'
                  : 'Connectez-vous pour laisser un avis.'}
              </p>
            </div>
          ) : (
            reviews.map((review) => (
              <div
                key={review.id}
                className="rounded-xl border border-[var(--border-color)] bg-[var(--card-background)] p-5"
              >
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-full bg-[var(--primary-light)] flex items-center justify-center text-[var(--primary)] text-xs font-bold">
                      {(review.author ?? review.user_id ?? '?').charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-[var(--foreground)]">
                      {review.author
                        ? review.author
                        : anonymizeAuthor(review.user_id)}
                    </span>
                    <StarDisplay rating={review.rating} />
                  </div>
                  {review.created_at && (
                    <span className="text-xs text-[var(--neutral-400)]">
                      {formatRelativeDate(review.created_at)}
                    </span>
                  )}
                </div>
                {review.comment && (
                  <p className="text-sm text-[var(--neutral-600)] leading-relaxed">
                    {review.comment}
                  </p>
                )}
              </div>
            ))
          )}
        </div>

        {/* Add review form */}
        <div>
          {isAuthenticated ? (
            <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-background)] p-5 sticky top-6">
              <h3 className="text-base font-semibold text-[var(--foreground)] mb-4">
                Laisser un avis
              </h3>

              {submitSuccess && (
                <div
                  className="mb-4 rounded-lg bg-[var(--success-light,color-mix(in_srgb,var(--success)_15%,transparent))] border border-[var(--success)] text-[var(--success)] text-sm px-3 py-2"
                  role="status"
                  aria-live="polite"
                >
                  Avis publié avec succès !
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--neutral-500)] mb-2">
                    Note *
                  </label>
                  <StarRatingInput value={rating} onChange={setRating} />
                </div>

                <div>
                  <label
                    htmlFor="review-comment"
                    className="block text-xs font-semibold uppercase tracking-wider text-[var(--neutral-500)] mb-2"
                  >
                    Commentaire <span className="normal-case font-normal">(optionnel)</span>
                  </label>
                  <textarea
                    id="review-comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Partagez votre expérience…"
                    rows={4}
                    disabled={submitting}
                    className={cn(
                      'w-full px-3 py-2 text-sm rounded-lg border border-[var(--border-color)]',
                      'bg-[var(--input-background,var(--card-background))] text-[var(--foreground)]',
                      'placeholder:text-[var(--neutral-400)]',
                      'focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]',
                      'disabled:opacity-50 disabled:cursor-not-allowed',
                      'resize-none'
                    )}
                  />
                </div>

                {submitError && (
                  <p className="text-xs text-[var(--error)]" role="alert" aria-live="polite">
                    {submitError}
                  </p>
                )}

                <Button
                  type="submit"
                  size="md"
                  loading={submitting}
                  disabled={rating === 0}
                  className="w-full"
                >
                  Publier l&apos;avis
                </Button>
              </form>
            </div>
          ) : (
            <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-background)] p-5 text-center">
              <p className="text-sm text-[var(--neutral-500)] mb-3">
                Vous devez être connecté pour laisser un avis.
              </p>
              <a
                href="/login"
                className="inline-flex items-center justify-center h-8 px-3 text-xs rounded-lg border border-[var(--border-color)] text-[var(--foreground)] hover:bg-[var(--neutral-100)] transition-colors font-medium"
              >
                Se connecter
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
