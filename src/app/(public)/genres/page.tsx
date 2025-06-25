// src/app/(public)/genres/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/shared/ui';

interface Genre {
  id: string;
  name: string;
  description?: string;
  color: string;
  _count?: {
    novels: number;
  };
}

export default function GenresPage() {
  const router = useRouter();
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGenres();
  }, []);

  const fetchGenres = async () => {
    try {
      const res = await fetch('/api/public/genres');
      const data = await res.json();
      if (data.success) {
        setGenres(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch genres:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Browse by Genre</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {genres.map(genre => (
          <Card
            key={genre.id}
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => router.push(`/search?genres=${genre.id}`)}
          >
            <div 
              className="h-2 rounded-t-lg" 
              style={{ backgroundColor: genre.color }}
            />
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-2">{genre.name}</h3>
              {genre.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {genre.description}
                </p>
              )}
              <p className="text-sm text-gray-500">
                {genre._count?.novels || 0} novels
              </p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}