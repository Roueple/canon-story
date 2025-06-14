// src/app/(admin)/admin/novels/[id]/chapters/[chapterId]/edit/page.tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { prisma } from '@/lib/db'
import { EditChapterForm } from '@/components/admin/forms/EditChapterForm'

async function getChapter(id: string) {
  const chapter = await prisma.chapter.findFirst({
    where: { id, isDeleted: false },
    include: {
      novel: {
        select: { id: true, title: true }
      }
    }
  })

  if (!chapter) notFound()
  return chapter
}

export default async function EditChapterPage({ 
  params 
}: { 
  params: { id: string, chapterId: string } 
}) {
  const chapter = await getChapter(params.chapterId)

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
          chapter={chapter}
        />
      </div>
    </div>
  )
}