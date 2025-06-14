// src/app/(admin)/admin/novels/[id]/chapters/page.tsx
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Plus, Edit, Eye, EyeOff, ArrowLeft, ArrowUpDown } from 'lucide-react'
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
      <Link href="/admin/novels" className="inline-flex items-center text-gray-400 hover:text-white mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Novels
      </Link>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">{novel.title} - Chapters</h1>
          <p className="text-gray-400">Manage chapters for this novel</p>
        </div>
        <Link href={`/admin/novels/${novel.id}/chapters/create`}>
          <Button variant="primary">
            <Plus className="h-4 w-4 mr-2" />
            Add Chapter
          </Button>
        </Link>
      </div>

      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
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
                Views
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
              <tr key={chapter.id} className="hover:bg-gray-750">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-medium text-white">
                    Chapter {formatChapterNumber(chapter.chapterNumber)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-white">{chapter.title}</div>
                  <div className="text-sm text-gray-400">
                    {chapter.wordCount.toLocaleString()} words • {chapter.estimatedReadTime} min read
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      chapter.status === 'draft' ? 'bg-gray-900 text-gray-300' :
                      chapter.status === 'premium' ? 'bg-purple-900 text-purple-300' :
                      'bg-green-900 text-green-300'
                    }`}>
                      {chapter.status}
                    </span>
                    {chapter.isPublished ? (
                      <Eye className="h-4 w-4 text-green-400" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {chapter.views.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                  {chapter.publishedAt ? formatDate(chapter.publishedAt) : 'Not published'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Link href={`/admin/novels/${novel.id}/chapters/${chapter.id}/edit`}>
                    <Button size="sm" variant="ghost">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {novel.chapters.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">No chapters yet. Add your first chapter!</p>
          </div>
        )}
      </div>

      <div className="mt-4 text-sm text-gray-400">
        <p>💡 Tip: Chapters support flexible numbering like 0, 1.5, or 2.1 for special content!</p>
      </div>
    </div>
  )
}