// src/app/(admin)/admin/novels/[id]/page.tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { prisma } from '@/lib/db'
import { EditNovelForm } from '@/components/admin/forms/EditNovelForm'
import { novelService } from '@/services/novelService'
import { serializeForJSON } from '@/lib/serialization'

async function getNovel(id: string) {
  const novelData = await novelService.findById(id, true);
  if (!novelData) {
    notFound();
  }
  // The service guarantees serializable data. No further action needed here.
  return novelData;
}

async function getGenres() {
  const genres = await prisma.genre.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' }
  });
  // Simple serialization for consistency
  return serializeForJSON(genres);
}

export default async function EditNovelPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  
  const [novel, genres] = await Promise.all([
    getNovel(params.id),
    getGenres()
  ]);

  return (
    <div>
      <Link href="/admin/novels" className="inline-flex items-center text-gray-400 hover:text-white mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Novels
      </Link>

      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <h1 className="text-2xl font-bold text-white mb-6">Edit Novel</h1>
        
        <EditNovelForm
          novel={novel}
          genres={genres}
        />
      </div>
    </div>
  );
}
