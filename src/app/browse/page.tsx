// src/app/browse/page.tsx
import { Suspense } from 'react';
import { novelService } from '@/services/novelService';
import { NovelCard } from '@/components/shared/NovelCard';
import { LoadingSpinner } from '@/components/shared/ui/LoadingSpinner';
import { Input } from '@/components/shared/ui/Input';
import { Search } from 'lucide-react';

export const dynamic = 'force-dynamic';

async function NovelGrid() {

  const { novels } = await novelService.findAll({ isPublished: true, limit: 100 });
  
  if (novels.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No novels found.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {novels.map((novel) => (
        <NovelCard key={novel.id} novel={novel} />
      ))}
    </div>
  );
}

export default async function BrowsePage({
}) {

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Browse All Novels</h1>
        <form action="/search" method="get" className="max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
            <Input
              type="search"
              name="q"
              placeholder="Search all novels..."
              className="pl-10"
            />
          </div>
        </form>
      </div>

      <Suspense fallback={
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      }>
        <NovelGrid />
      </Suspense>
    </div>
  );
}