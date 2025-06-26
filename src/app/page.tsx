import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/shared/ui';
import { NovelCard } from '@/components/shared/NovelCard';
import { getTrendingNovels, getRecentNovels } from '@/lib/data';
import { LoadingSpinner } from '@/components/shared/ui';

export const dynamic = 'force-dynamic';

async function TrendingSection() {
  const novels = await getTrendingNovels(6);
  
  return (
    <section>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Trending Novels</h2>
        <Link href="/trending">
          <Button variant="outline" size="sm">View All</Button>
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {novels.map((novel) => (
          <NovelCard key={novel.id} novel={novel} />
        ))}
      </div>
    </section>
  );
}

async function RecentSection() {
  const novels = await getRecentNovels(6);
  
  return (
    <section>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Recently Added</h2>
        <Link href="/novels">
          <Button variant="outline" size="sm">View All</Button>
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {novels.map((novel) => (
          <NovelCard key={novel.id} novel={novel} />
        ))}
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Welcome to Canon Story</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Discover amazing stories, track your reading progress, and join a vibrant community of readers and writers.
        </p>
      </div>

      <div className="space-y-12">
        <Suspense fallback={
          <div className="flex justify-center py-8">
            <LoadingSpinner size="lg" />
          </div>
        }>
          <TrendingSection />
        </Suspense>

        <Suspense fallback={
          <div className="flex justify-center py-8">
            <LoadingSpinner size="lg" />
          </div>
        }>
          <RecentSection />
        </Suspense>
      </div>

      <div className="mt-12 text-center">
        <Link href="/browse">
          <Button size="lg">Browse All Novels</Button>
        </Link>
      </div>
    </div>
  );
}
