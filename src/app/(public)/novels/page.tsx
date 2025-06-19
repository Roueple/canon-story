// src/app/(public)/novels/page.tsx
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { BookOpen, Star } from 'lucide-react'

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
            <Link
              key={novel.id}
              href={`/novels/${novel.id}`}
              className="group bg-card border border-border rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col"
            >
              {/* Cover Image - Aspect ratio preserved */}
              <div className="relative w-full aspect-[2/3] bg-gray-200 dark:bg-gray-800">
                {novel.coverImageUrl ? (
                  <img 
                    src={novel.coverImageUrl} 
                    alt={novel.title} 
                    className="absolute inset-0 w-full h-full object-contain"
                  />
                ) : (
                  <div
                    className="absolute inset-0 w-full h-full"
                    style={{ backgroundColor: novel.coverColor || '#3B82F6' }}
                  />
                )}
              </div>
              
              {/* Novel Info */}
              <div className="p-4 flex-grow flex flex-col">
                <h2 className="text-lg font-semibold text-card-foreground mb-1 group-hover:text-primary transition-colors truncate">
                  {novel.title}
                </h2>
                <p className="text-sm text-secondary mb-3">
                  by {novel.author.displayName || novel.author.username}
                </p>
                <p className="text-sm text-secondary line-clamp-3 flex-grow">
                  {novel.description || 'No description available.'}
                </p>
                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-sm text-secondary">
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="h-4 w-4" />
                    <span>{novel._count.chapters} Chs</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span>{Number(novel.averageRating).toFixed(1)}</span>
                  </div>
                </div>
              </div>
            </Link>
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