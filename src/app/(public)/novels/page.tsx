// src/app/(public)/novels/page.tsx
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { NovelCard } from '@/components/shared/NovelCard'

async function getPublishedNovels() {
  return await prisma.novel.findMany({
    where: {
      isPublished: true,
      isDeleted: false,
    },
    include: {
      author: {
        select: { displayName: true, username: true }
      },
      _count: {
        select: { chapters: true }
      }
    },
    orderBy: {
      updatedAt: 'desc'
    }
  })
}

export default async function NovelsPage() {
  const novels = await getPublishedNovels()

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">All Novels</h1>
      
      {novels.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {novels.map((novel) => (
            <NovelCard key={novel.id} novel={novel} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-card border border-border rounded-lg">
          <h2 className="text-xl font-semibold text-foreground">No Novels Found</h2>
          <p className="text-secondary mt-2">
            There are no published novels available at the moment. Please check back later!
          </p>
        </div>
      )}
    </div>
  )
}