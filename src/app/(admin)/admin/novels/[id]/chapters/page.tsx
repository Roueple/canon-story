// src/app/(admin)/admin/novels/[id]/chapters/page.tsx
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Plus, Edit, Eye, EyeOff, ArrowLeft, ArrowUpDown, BookOpen } from 'lucide-react'
import { Button } from '@/components/shared/ui'
import { formatDate, formatChapterNumber } from '@/lib/utils'

async function getNovel(id: string) {
  const novel = await prisma.novel.findFirst({
    where: { id, isDeleted: false },
    include: {
      chapters: {
        where: { isDeleted: false },
        orderBy: { displayOrder: 'asc' }
      }
    }
  })

  if (!novel) notFound()
  return novel
}

export default async function ChaptersPage({ params }: { params: { id: string } }) {
  const novel = await getNovel(params.id)

  return (
    <div>
      <Link href="/admin/novels" className="inline-flex items-center text-gray-400 hover:text-white mb-6 transition-colors">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Novels
      </Link>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">{novel.title}</h1>
          <p className="text-gray-400 mt-1">Manage chapters for this novel</p>
        </div>
        <Link href={`/admin/novels/${novel.id}/chapters/create`}>
          <Button variant="primary" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Chapter
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">Total Chapters</p>
          <p className="text-2xl font-bold text-white">{novel.chapters.length}</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">Published</p>
          <p className="text-2xl font-bold text-green-400">
            {novel.chapters.filter(ch => ch.isPublished).length}
          </p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">Drafts</p>
          <p className="text-2xl font-bold text-yellow-400">
            {novel.chapters.filter(ch => !ch.isPublished).length}
          </p>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        {novel.chapters.length > 0 ? (
          <table className="w-full">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    Chapter
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Stats
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Published
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {novel.chapters.map((chapter) => (
                <tr key={chapter.id} className="hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-white">
                      Chapter {formatChapterNumber(chapter.chapterNumber)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-white">{chapter.title}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {chapter.wordCount.toLocaleString()} words • {chapter.estimatedReadTime} min read
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        chapter.status === 'draft' ? 'bg-gray-700 text-gray-300' :
                        chapter.status === 'premium' ? 'bg-purple-900/50 text-purple-300' :
                        'bg-green-900/50 text-green-300'
                      }`}>
                        {chapter.status}
                      </span>
                      {chapter.isPublished ? (
                        <Eye className="h-4 w-4 text-green-400" title="Published" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-gray-500" title="Draft" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-300">
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {chapter.views.toLocaleString()} views
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {chapter.publishedAt ? formatDate(chapter.publishedAt) : 'Not published'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/novels/${novel.id}/chapters/${chapter.id}/edit`}>
                        <Button size="sm" variant="outline" className="gap-1">
                          <Edit className="h-3 w-3" />
                          Edit
                        </Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-16">
            <BookOpen className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No chapters yet</p>
            <p className="text-gray-500 text-sm mt-2">Create your first chapter to get started</p>
            <Link href={`/admin/novels/${novel.id}/chapters/create`}>
              <Button variant="primary" className="mt-4 gap-2">
                <Plus className="h-4 w-4" />
                Create First Chapter
              </Button>
            </Link>
          </div>
        )}
      </div>

      <div className="mt-4 bg-blue-900/20 border border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-300">
          💡 <strong>Pro Tip:</strong> Chapters support flexible numbering like 0 (prologue), 1.5 (side story), or 2.1 (extended chapter) for special content!
        </p>
      </div>
    </div>
  )
}