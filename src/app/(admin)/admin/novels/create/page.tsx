// src/app/(admin)/admin/novels/create/page.tsx
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { NovelFormWrapper } from '@/components/admin/forms/NovelFormWrapper';
import { serializeForJSON } from '@/lib/serialization';

async function getGenres() {
  const genres = await prisma.genre.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, name: true }
  });
  // Although the data is simple, serializing is a good practice
  return serializeForJSON(genres);
}

export default async function CreateNovelPage() {
  const genres = await getGenres();

  return (
    <div>
      <Link 
        href="/admin/novels" 
        className="inline-flex items-center text-gray-400 hover:text-white mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Novels
      </Link>

      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <h1 className="text-2xl font-bold text-white mb-6">Create New Novel</h1>
        
        {/* The wrapper handles form logic and now receives the necessary genres prop */}
        <NovelFormWrapper genres={genres} />
      </div>
    </div>
  );
}