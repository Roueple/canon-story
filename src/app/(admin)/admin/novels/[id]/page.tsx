// src/app/(admin)/admin/novels/[id]/page.tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { prisma } from '@/lib/db'
import { EditNovelForm } from '@/components/admin/forms/EditNovelForm'

async function getNovel(id: string) {
  const novel = await prisma.novel.findFirst({
    where: { id, isDeleted: false },
    include: {
      genres: {
        include: { genre: true }
      },
      tags: {
        include: { tag: true }
      }
    }
  })

  if (!novel) notFound()
  return novel
}

async function getGenres() {
  return await prisma.genre.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' }
  })
}

export default async function EditNovelPage({ params }: { params: { id: string } }) {
  const [novel, genres] = await Promise.all([
    getNovel(params.id),
    getGenres()
  ])

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
  )
}