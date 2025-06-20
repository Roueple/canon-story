// src/app/(admin)/admin/novels/[id]/chapters/page.tsx
'use client'

import { useState, useEffect } from 'react' // Ensure useState is here
import Link from 'next/link'
import { notFound } from 'next/navigation'
// import { useEffect } from 'react' // This would be redundant if combined above
import { Plus, Edit, Eye, EyeOff, ArrowLeft, ArrowUpDown, BookOpen, Upload } from 'lucide-react'
import { Button, Modal } from '@/components/shared/ui'
import { formatDate, formatChapterNumber } from '@/lib/utils'
import { ImportModal } from '@/components/admin/import/ImportModal';

export default function ChaptersPage({ params }: { params: { id: string } }) {
  const [novel, setNovel] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  // const [showImporter, setShowImporter] = useState(false) // Removed by script
  const [showImportModal, setShowImportModal] = useState(false);


  useEffect(() => {
    fetchNovel()
  }, [params.id])

  const fetchNovel = async () => {
    try {
      const response = await fetch(`/api/admin/novels/${params.id}`)
      if (!response.ok) throw new Error('Failed to fetch novel')
      const data = await response.json()
      setNovel(data.data)
    } catch (error) {
      console.error('Error fetching novel:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // const handleImportComplete = () => { // Removed by script
  //   setShowImporter(false)
  //   fetchNovel() 
  // }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (!novel) {
    notFound()
  }

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
        <div className="flex gap-3">
          <Button onClick={() => setShowImportModal(true)} variant="outline" className="gap-2">
              <Upload className="h-4 w-4" />
              Import Chapters
          </Button>
          <Link href={`/admin/novels/${novel.id}/chapters/create`}>
            <Button variant="primary" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Chapter
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">Total Chapters</p>
          <p className="text-2xl font-bold text-white">{novel.chapters?.length || 0}</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">Published</p>
          <p className="text-2xl font-bold text-green-400">
            {novel.chapters?.filter((ch: any) => ch.isPublished).length || 0}
          </p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">Drafts</p>
          <p className="text-2xl font-bold text-yellow-400">
            {novel.chapters?.filter((ch: any) => !ch.isPublished).length || 0}
          </p>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        {novel.chapters && novel.chapters.length > 0 ? (
          <table className="w-full">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  <button className="flex items-center gap-1 hover:text-white transition-colors">
                    Chapter <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Words</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Updated</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {novel.chapters.map((chapter: any) => (
                <tr key={chapter.id} className="hover:bg-gray-750">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-white">
                      {formatChapterNumber(chapter.chapterNumber)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-white">{chapter.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        chapter.status === 'free' ? 'bg-green-900/50 text-green-300' :
                        'bg-yellow-900/50 text-yellow-300' // Assuming 'draft' or other non-free are yellow
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
                    {chapter.wordCount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {formatDate(chapter.updatedAt)}
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
        ) : (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No chapters yet</h3>
            <p className="text-gray-400 mb-6">Get started by adding your first chapter</p>
            <div className="flex gap-3 justify-center">
              {/* This button's onClick was already correct in your provided file */}
              <Button
                onClick={() => setShowImportModal(true)} 
                variant="outline"
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Import Chapters 
              </Button>
              <Link href={`/admin/novels/${novel.id}/chapters/create`}>
                <Button variant="primary" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Chapter
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
{/* Old importer modal block removed by script */} 

      {/* New Import Modal */}
      {showImportModal && novel && (
          <ImportModal
            isOpen={showImportModal}
            onClose={() => setShowImportModal(false)}
            novelId={novel.id}
            onImportComplete={() => {
              fetchNovel(); // Refresh chapters
              setShowImportModal(false);
            }}
          />
      )}
    </div>
  )
}