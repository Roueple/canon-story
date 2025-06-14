// src/app/(admin)/admin/novels/page.tsx
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { Plus, Edit, Eye, EyeOff, Trash2 } from 'lucide-react'
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
    orderBy: { createdAt: 'desc' }
  })
}

export default async function AdminNovelsPage() {
  const novels = await getNovels()

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Novels</h1>
          <p className="text-gray-400">Manage your novel collection</p>
        </div>
        <Link href="/admin/novels/create">
          <Button variant="primary">
            <Plus className="h-4 w-4 mr-2" />
            Create Novel
          </Button>
        </Link>
      </div>

      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Novel
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Chapters
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Views
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {novels.map((novel) => (
              <tr key={novel.id} className="hover:bg-gray-750">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div
                      className="h-10 w-10 rounded-lg mr-3"
                      style={{ backgroundColor: novel.coverColor }}
                    />
                    <div>
                      <div className="text-sm font-medium text-white">
                        {novel.title}
                      </div>
                      <div className="text-sm text-gray-400">
                        by {novel.author.displayName || novel.author.username}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      novel.status === 'ongoing' ? 'bg-green-900 text-green-300' :
                      novel.status === 'completed' ? 'bg-blue-900 text-blue-300' :
                      novel.status === 'hiatus' ? 'bg-yellow-900 text-yellow-300' :
                      'bg-gray-900 text-gray-300'
                    }`}>
                      {novel.status}
                    </span>
                    {novel.isPublished ? (
                      <Eye className="h-4 w-4 text-green-400" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {novel._count.chapters}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {formatNumber(novel.totalViews)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                  {formatDate(novel.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    <Link href={`/admin/novels/${novel.id}`}>
                      <Button size="sm" variant="ghost">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href={`/admin/novels/${novel.id}/chapters`}>
                      <Button size="sm" variant="ghost">
                        Chapters
                      </Button>
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {novels.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">No novels yet. Create your first novel!</p>
          </div>
        )}
      </div>
    </div>
  )
}