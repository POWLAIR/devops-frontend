'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const categories = [
  { name: 'Tous', slug: 'all', icon: '🏬' },
  { name: 'Laptops', slug: 'Laptops', icon: '💻' },
  { name: 'Smartphones', slug: 'Smartphones', icon: '📱' },
  { name: 'Tablets', slug: 'Tablets', icon: '📱' },
  { name: 'Audio', slug: 'Audio', icon: '🎧' },
  { name: 'Wearables', slug: 'Wearables', icon: '⌚' },
  { name: 'Cameras', slug: 'Cameras', icon: '📷' },
  { name: 'Gaming', slug: 'Gaming', icon: '🎮' },
];

export default function CategoryBar() {
  const searchParams = useSearchParams();
  const currentCategory = searchParams?.get('category') || 'all';

  return (
    <div className="bg-slate-50 border-b border-slate-200">
      <div className="container mx-auto px-4">
        <nav className="flex items-center space-x-1 overflow-x-auto py-3 scrollbar-hide">
          {categories.map((category) => {
            const isActive = currentCategory === category.slug;
            
            return (
              <Link
                key={category.slug}
                href={category.slug === 'all' ? '/products' : `/products?category=${category.slug}`}
                className={`
                  flex items-center space-x-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all
                  ${isActive 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-slate-700 hover:bg-slate-200'
                  }
                `}
              >
                <span>{category.icon}</span>
                <span className="text-sm font-medium">{category.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

