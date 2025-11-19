'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast';
import { getToken } from '@/lib/auth';

interface FavoriteButtonProps {
  productId: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export default function FavoriteButton({ 
  productId, 
  size = 'md',
  showLabel = false 
}: FavoriteButtonProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { success, error, warning } = useToast();
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  useEffect(() => {
    if (isAuthenticated) {
      checkFavoriteStatus();
    }
  }, [productId, isAuthenticated]);

  const checkFavoriteStatus = async () => {
    try {
      const token = getToken();
      const res = await fetch(`/api/products/${productId}/is-favorite`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setIsFavorite(data.isFavorite);
      }
    } catch (err) {
      console.error('Error checking favorite status:', err);
    }
  };

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      warning('Veuillez vous connecter pour ajouter aux favoris');
      router.push('/login');
      return;
    }

    setLoading(true);

    try {
      const token = getToken();
      
      if (isFavorite) {
        // Remove from favorites
        const res = await fetch(`/api/favorites/${productId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (res.ok) {
          setIsFavorite(false);
          success('Produit retiré des favoris');
        } else {
          const data = await res.json();
          error(data.message || 'Erreur lors de la suppression des favoris');
        }
      } else {
        // Add to favorites
        const res = await fetch(`/api/favorites`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ productId }),
        });

        if (res.ok) {
          setIsFavorite(true);
          success('Produit ajouté aux favoris');
        } else {
          const data = await res.json();
          error(data.message || 'Erreur lors de l\'ajout aux favoris');
        }
      }
    } catch (err) {
      error('Erreur lors de la modification des favoris');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggleFavorite}
      disabled={loading}
      className={`flex items-center gap-2 ${
        isFavorite 
          ? 'text-red-500 hover:text-red-600' 
          : 'text-slate-400 hover:text-red-500'
      } transition-colors disabled:opacity-50`}
      aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
    >
      <svg 
        className={sizeClasses[size]}
        fill={isFavorite ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
      {showLabel && (
        <span className="text-sm font-medium">
          {isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        </span>
      )}
    </button>
  );
}

