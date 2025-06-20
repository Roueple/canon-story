// src/app/(admin)/admin/novels/page.tsx
import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@/lib/db'
import { Plus, Edit, Eye, EyeOff, BookOpen } from 'lucide-react'
import { Button } from '@/components/shared/ui'
import { formatDate, formatNumber } from '@/lib/utils'

async function getNovels() {
  return await prisma.novel.findMany({
    where: { isDeleted: false },
    include: {
      author: {
        select: { displayName: true, username: true }
      },
      _count: {
        select: { chapters: true }
      }
    },
    orderBy: { updatedAt: 'desc' }
  })
}

export default async function AdminNovelsPage() {
  const novels = await getNovels()

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Novels</h1>
          <p className="text-gray-400 mt-1">Manage your novel collection</p>
        </div>
        <Link href="/admin/novels/create">
          <Button variant="primary" className="gap-2">
            <Plus className="h-4 w-4" />
            Create Novel
          </Button>
        </Link>
      </div>

      {novels.length > 0 ? (
        <div className="grid gap-4">
          {novels.map((novel) => (
            <div key={novel.id} className="bg-gray-800 rounded-lg border border-gray-700 p-6 hover:border-gray-600 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  {/* Cover Image */}
                  <div className="relative h-24 w-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-700">
                    {novel.coverImageUrl ? (
                      <Image
                        src={novel.coverImageUrl}
                        alt={novel.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div
                        className="h-full w-full"
                        style={{ backgroundColor: novel.coverColor }}
                      />
                    )}
                  </div>
                  
                  {/* Novel Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-white">
                        {novel.title}
                      </h3>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        novel.status === 'ongoing' ? 'bg-green-900/50 text-green-300' :
                        novel.status === 'completed' ? 'bg-blue-900/50 text-blue-300' :
                        novel.status === 'hiatus' ? 'bg-yellow-900/50 text-yellow-300' :
                        'bg-gray-700 text-gray-300'
                      }`}>
                        {novel.status}
                      </span>
                      {novel.isPublished ? (
                        <span title="Published">
                          <Eye className="h-4 w-4 text-green-400" />
                        </span>
                      ) : (
                        <span title="Draft">
                          <EyeOff className="h-4 w-4 text-gray-500" />
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-400 mb-3">
                      by {novel.author.displayName || novel.author.username}
                    </p>
                    
                    {novel.description && (
                      <p className="text-sm text-gray-300 mb-3 line-clamp-2">
                        {novel.description}
                      </p>
                    )}
                    
                    {/* Stats */}
                    <div className="flex items-center gap-6 text-sm text-gray-400">
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4" />
                        {novel._count.chapters} chapters
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {formatNumber(novel.totalViews)} views
                      </div>
                      <div>
                        Updated {formatDate(novel.updatedAt)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions - Removed Analytics button */}
                <div className="flex items-center gap-2 ml-4">
                  <Link href={`/admin/novels/${novel.id}`}>
                    <Button size="sm" variant="outline" className="gap-1">
                      <Edit className="h-3 w-3" />
                      Edit
                    </Button>
                  </Link>
                  <Link href={`/admin/novels/${novel.id}/chapters`}>
                    <Button size="sm" variant="outline" className="gap-1">
                      <BookOpen className="h-3 w-3" />
                      Chapters
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-12 text-center">
          <h2 className="text-xl font-semibold text-white mb-2">No novels yet</h2>
          <p className="text-gray-400 mb-6">Get started by creating your first novel</p>
          <Link href="/admin/novels/create">
            <Button variant="primary">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Novel
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}