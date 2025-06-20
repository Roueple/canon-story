// src/app/(admin)/admin/novels/[id]/chapters/[chapterId]/edit/page.tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
// prisma import might not be needed here if getChapter solely relies on the service
// import { prisma } from '@/lib/db'
import { EditChapterForm } from '@/components/admin/forms/EditChapterForm'
import { Prisma } from '@prisma/client' // Keep for types if EditChapterForm expects specific Prisma types
import { chapterService } from '@/services/chapterService'; // <--- ADD THIS IMPORT

// Define a type for the processed chapter to be passed to the client component
// This type should align with what chapterService.findById returns AFTER serialization
type ProcessedChapterForForm = Omit<Prisma.ChapterGetPayload<{
  include: {
    novel: {
      select: { id: true, title: true }
    }
  }
}>, 'chapterNumber' | 'displayOrder' | 'views' | 'wordCount' | 'estimatedReadTime' | 'imageCount'> & {
  chapterNumber: number; // Expect number after serialization
  displayOrder: number;  // Expect number after serialization
  views: string; // Expect string for BigInt
  wordCount: number;
  estimatedReadTime: number;
  imageCount: number;
  // Add other fields if chapterService returns more or different structure
};


async function getChapter(id: string) {
  // Use chapterService to get the chapter data, which should be serialized
  const chapterData = await chapterService.findById(id, true); // true to include deleted for admin view

  if (!chapterData) {
    notFound();
  }
  // The chapterService should already handle Decimal to Number and BigInt to String conversions.
  // If EditChapterForm requires specific types not matching service output, adjust ProcessedChapterForForm
  // or the service's return structure.
  return chapterData as ProcessedChapterForForm; // Cast if confident about the structure
}


export default async function EditChapterPage({ 
  params 
}: { 
  params: { id: string, chapterId: string } 
}) {
  const chapter = await getChapter(params.chapterId);

  return (
    <div>
      <Link 
        href={`/admin/novels/${params.id}/chapters`} 
        className="inline-flex items-center text-gray-400 hover:text-white mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Chapters
      </Link>

      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <h1 className="text-2xl font-bold text-white mb-6">Edit Chapter</h1>
        
        <EditChapterForm
          chapter={chapter} // chapter is now correctly defined and serialized
        />
      </div>
    </div>
  );
}