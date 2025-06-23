// src/app/(admin)/admin/novels/[id]/chapters/[chapterId]/edit/page.tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { EditChapterForm } from '@/components/admin/forms/EditChapterForm'
import { chapterService } from '@/services/chapterService'

// The service now handles serialization, so we don't need to do it here.
async function getChapter(id: string) {
  const chapterData = await chapterService.findById(id, true);
  if (!chapterData) {
    notFound();
  }
  return chapterData;
}

export default async function EditChapterPage({ 
  params: paramsPromise
}: { 
  params: Promise<{ id: string, chapterId: string }> 
}) {
  const params = await paramsPromise;
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
        
        {/* 'chapter' is now a plain JSON object, safe to pass to a client component */}
        <EditChapterForm
          chapter={chapter}
        />
      </div>
    </div>
  );
}
