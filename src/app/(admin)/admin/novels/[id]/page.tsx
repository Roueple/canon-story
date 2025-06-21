// src/app/(admin)/admin/novels/[id]/page.tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { prisma } from '@/lib/db' // Keep prisma import if needed for getGenres
import { EditNovelForm } from '@/components/admin/forms/EditNovelForm'
import { novelService } from '@/services/novelService'; // <--- ADD THIS IMPORT

async function getNovel(id: string) {
  const novelData = await novelService.findById(id, true); // Use true to include deleted for admin view if needed
  if (!novelData) {
    notFound();
  }
  return novelData; // novelService now returns serialized data
}

async function getGenres() {
  return await prisma.genre.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' }
  });
}

export default async function EditNovelPage({ params }: { params: { id: string } }) {
  // Fetch novel and genres in parallel
  const [novel, genres] = await Promise.all([
    getNovel(params.novelId),
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
          novel={novel} // novel is now correctly defined and serialized
          genres={genres}
        />
      </div>
    </div>
  );
}