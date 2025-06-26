import { Suspense } from 'react';
import { getTrendingNovels } from '@/lib/data';
import { NovelCard } from '@/components/shared/NovelCard';
import { LoadingSpinner } from '@/components/shared/ui';
import { TrendingUp } from 'lucide-react';

export const dynamic = 'force-dynamic';

async function TrendingList() {
  const novels = await getTrendingNovels(20);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {novels.map((novel, index) => (
        <div key={novel.id} className="relative">
          {index < 3 && (
            <div className="absolute -top-2 -left-2 z-10 bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
              {index + 1}
            </div>
          )}
          <NovelCard novel={novel} />
        </div>
      ))}
    </div>
  );
}

export default function TrendingPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <TrendingUp className="text-primary" size={32} />
        <h1 className="text-3xl font-bold">Trending Novels</h1>
      </div>
      
      <p className="text-muted-foreground mb-8">
        Discover the most popular novels based on views and ratings.
      </p>
      
      <Suspense fallback={
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      }>
        <TrendingList />
      </Suspense>
    </div>
  );
}
