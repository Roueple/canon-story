// src/app/(public)/search/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Input, Button, Badge, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shared/ui';
import { NovelCard } from '@/components/shared/NovelCard';
import { Search, Filter, X } from 'lucide-react';
import { debounce } from '@/lib/utils';

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    genres: searchParams.get('genres')?.split(',') || [],
    tags: searchParams.get('tags')?.split(',') || [],
    status: searchParams.get('status') || 'all',
    sortBy: searchParams.get('sortBy') || 'relevance'
  });
  const [genres, setGenres] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);

  // Load genres and tags
  useEffect(() => {
    fetch('/api/public/genres').then(res => res.json()).then(data => setGenres(data.data || []));
    fetch('/api/public/tags').then(res => res.json()).then(data => setTags(data.data || []));
  }, []);

  // Search function
  const performSearch = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (filters.genres.length) params.set('genres', filters.genres.join(','));
    if (filters.tags.length) params.set('tags', filters.tags.join(','));
    if (filters.status !== 'all') params.set('status', filters.status);
    if (filters.sortBy !== 'relevance') params.set('sortBy', filters.sortBy);

    try {
      const res = await fetch(`/api/public/search?${params}`);
      const data = await res.json();
      setResults(data.data?.novels || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  }, [query, filters]);

  // Debounced search
  const debouncedSearch = useCallback(
    debounce(() => performSearch(), 500),
    [performSearch]
  );

  // Update URL and search when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (filters.genres.length) params.set('genres', filters.genres.join(','));
    if (filters.tags.length) params.set('tags', filters.tags.join(','));
    if (filters.status !== 'all') params.set('status', filters.status);
    if (filters.sortBy !== 'relevance') params.set('sortBy', filters.sortBy);
    
    router.push(`/search?${params}`);
    debouncedSearch();
  }, [query, filters]);

  const toggleGenre = (genreId: string) => {
    setFilters(prev => ({
      ...prev,
      genres: prev.genres.includes(genreId)
        ? prev.genres.filter(g => g !== genreId)
        : [...prev.genres, genreId]
    }));
  };

  const toggleTag = (tagId: string) => {
    setFilters(prev => ({
      ...prev,
      tags: prev.tags.includes(tagId)
        ? prev.tags.filter(t => t !== tagId)
        : [...prev.tags, tagId]
    }));
  };

  const clearFilters = () => {
    setFilters({
      genres: [],
      tags: [],
      status: 'all',
      sortBy: 'relevance'
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-6">Search Novels</h1>
        
        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            type="text"
            placeholder="Search by title, description, or author..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-full"
          />
        </div>

        {/* Filters */}
        <div className="space-y-4 mb-6">
          {/* Genre Filter */}
          <div>
            <h3 className="font-semibold mb-2">Genres</h3>
            <div className="flex flex-wrap gap-2">
              {genres.map(genre => (
                <Badge
                  key={genre.id}
                  variant={filters.genres.includes(genre.id) ? 'primary' : 'secondary'}
                  className="cursor-pointer"
                  onClick={() => toggleGenre(genre.id)}
                >
                  {genre.name}
                </Badge>
              ))}
            </div>
          </div>

          {/* Tag Filter */}
          <div>
            <h3 className="font-semibold mb-2">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <Badge
                  key={tag.id}
                  variant={filters.tags.includes(tag.id) ? 'primary' : 'secondary'}
                  className="cursor-pointer"
                  onClick={() => toggleTag(tag.id)}
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          </div>

          {/* Status and Sort */}
          <div className="flex gap-4">
            <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="ongoing">Ongoing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="hiatus">Hiatus</SelectItem>
            </Select>

            <Select value={filters.sortBy} onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))}>
                <SelectItem value="relevance">Relevance</SelectItem>
                <SelectItem value="views">Most Viewed</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="updated">Recently Updated</SelectItem>
                <SelectItem value="created">Newest</SelectItem>
            </Select>

            <Button variant="outline" onClick={clearFilters}>
              <X className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        </div>
      ) : (
        <div>
          {results.length > 0 ? (
            <>
              <p className="text-gray-600 mb-4">{results.length} results found</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.map(novel => (
                  <NovelCard key={novel.id} novel={novel} />
                ))}
              </div>
            </>
          ) : query || filters.genres.length || filters.tags.length ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No results found. Try adjusting your search or filters.</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}