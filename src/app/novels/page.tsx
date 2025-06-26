import { Suspense } from 'react';
import { getPublishedNovels } from '@/lib/data';
import { NovelCard } from '@/components/shared/NovelCard';
import { LoadingSpinner } from '@/components/shared/ui';

export const dynamic = 'force-dynamic';

async function NovelsList() {
  const novels = await getPublishedNovels();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {novels.map((novel) => (
        <NovelCard key={novel.id} novel={novel} />
      ))}
    </div>
  );
}

export default function NovelsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">All Novels</h1>
      
      <Suspense fallback={
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      }>
        <NovelsList />
      </Suspense>
    </div>
  );
}
