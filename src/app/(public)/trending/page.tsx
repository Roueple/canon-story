// src/app/(public)/trending/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NovelCard } from '@/components/shared/NovelCard';
import { TrendingUp, Clock, Star } from 'lucide-react';

export default function TrendingPage() {
  const [trendingNovels, setTrendingNovels] = useState<any[]>([]);
  const [recentlyUpdated, setRecentlyUpdated] = useState<any[]>([]);
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('week');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrending();
    fetchRecentlyUpdated();
  }, [period]);

  const fetchTrending = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/public/trending?period=${period}`);
      const data = await res.json();
      setTrendingNovels(data.data || []);
    } catch (error) {
      console.error('Error fetching trending:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentlyUpdated = async () => {
    try {
      const res = await fetch('/api/public/trending/recent');
      const data = await res.json();
      setRecentlyUpdated(data.data || []);
    } catch (error) {
      console.error('Error fetching recent:', error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Discover</h1>

      <Tabs defaultValue="trending" className="space-y-8">
        <TabsList>
          <TabsTrigger value="trending" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Trending
          </TabsTrigger>
          <TabsTrigger value="recent" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Recently Updated
          </TabsTrigger>
          <TabsTrigger value="top" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            Top Rated
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trending" className="space-y-6">
          <div className="flex gap-2 mb-4">
            {(['day', 'week', 'month'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-md capitalize ${
                  period === p 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-secondary hover:bg-secondary/80'
                }`}
              >
                This {p}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trendingNovels.map((novel, index) => (
                <div key={novel.id} className="relative">
                  <div className="absolute -top-3 -left-3 bg-primary text-primary-foreground rounded-full h-8 w-8 flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </div>
                  <NovelCard novel={novel} />
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="recent" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentlyUpdated.map(novel => (
              <NovelCard key={novel.id} novel={novel} showLastChapter />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="top" className="space-y-6">
          <p className="text-gray-600">Top rated novels coming soon...</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}