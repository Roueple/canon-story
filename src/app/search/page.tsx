'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Input } from '@/components/shared/ui';
import { Button } from '@/components/shared/ui';
import { NovelCard } from '@/components/shared/NovelCard';
import { LoadingSpinner } from '@/components/shared/ui';
import { Search } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

function SearchResults({ query }: { query: string }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!query) {
      setResults([]);
      setLoading(false);
      return;
    }

    const searchNovels = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/public/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        if (data.success) {
          setResults(data.data);
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    };

    searchNovels();
  }, [query]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!query) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Enter a search term to find novels.</p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No novels found matching "{query}".</p>
      </div>
    );
  }

  return (
    <>
      <p className="text-muted-foreground mb-6">
        Found {results.length} novel{results.length !== 1 ? 's' : ''} matching "{query}"
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {results.map((novel) => (
          <NovelCard key={novel.id} novel={novel} />
        ))}
      </div>
    </>
  );
}

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const [searchInput, setSearchInput] = useState(initialQuery);
  const debouncedQuery = useDebounce(searchInput, 500);

  useEffect(() => {
    if (debouncedQuery !== initialQuery) {
      const params = new URLSearchParams();
      if (debouncedQuery) {
        params.set('q', debouncedQuery);
      }
      router.push(`/search?${params.toString()}`, { scroll: false });
    }
  }, [debouncedQuery, router, initialQuery]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Search Novels</h1>
      
      <div className="max-w-2xl mx-auto mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
          <Input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by title, description, or author..."
            className="pl-10 pr-4 py-2 text-lg"
            autoFocus
          />
        </div>
      </div>

      <SearchResults query={debouncedQuery} />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}
