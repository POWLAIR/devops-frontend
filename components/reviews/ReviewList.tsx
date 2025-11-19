'use client';

import ReviewStars from './ReviewStars';

interface Review {
  id: number;
  rating: number;
  comment: string;
  createdAt: string;
  userId?: string;
}

interface ReviewListProps {
  reviews: Review[];
  emptyMessage?: string;
}

export default function ReviewList({ 
  reviews, 
  emptyMessage = 'Aucun avis pour le moment.' 
}: ReviewListProps) {
  if (reviews.length === 0) {
    return (
      <p className="text-slate-600 dark:text-slate-400 text-center py-8">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div
          key={review.id}
          className="border-b border-slate-200 dark:border-slate-700 pb-4 last:border-0"
        >
          <div className="flex items-center justify-between mb-2">
            <ReviewStars rating={review.rating} size="sm" />
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {new Date(review.createdAt).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </div>
          {review.comment && (
            <p className="text-slate-700 dark:text-slate-300 mt-2">
              {review.comment}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

