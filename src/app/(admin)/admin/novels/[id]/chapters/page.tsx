// src/app/(admin)/admin/novels/[id]/chapters/page.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { notFound, useParams } from 'next/navigation' // Import useParams
import { Plus, Edit, Eye, EyeOff, ArrowLeft, ArrowUpDown, BookOpen, Upload } from 'lucide-react'
import { Button, Modal } from '@/components/shared/ui'
import { formatDate, formatChapterNumber } from '@/lib/utils'
import { ImportModal } from '@/components/admin/import/ImportModal';

// Remove params from props:
// export default function ChaptersPage({ params }: { params: { id: string } }) {
export default function ChaptersPage() {
  const routeParams = useParams<{ id: string }>() // Use the hook to get route parameters
  const novelIdFromParams = routeParams.id // Store the id in a variable

  const [novel, setNovel] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showImportModal, setShowImportModal] = useState(false);

  // Renamed fetchNovel to fetchNovelData and made it accept novelId
  const fetchNovelData = async (currentNovelId: string) => {
    if (!currentNovelId) {
      console.error("Novel ID is missing, cannot fetch data.");
      setIsLoading(false);
      setNovel(null);
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/novels/${currentNovelId}`)
      if (!response.ok) {
        // If novel not found by API (e.g., 404), set novel to null
        if (response.status === 404) {
          setNovel(null);
        }
        throw new Error(`Failed to fetch novel (status: ${response.status})`)
      }
      const data = await response.json()
      setNovel(data.data)
    } catch (error) {
      console.error('Error fetching novel:', error)
      setNovel(null); // Ensure novel is null on error
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (novelIdFromParams) {
      fetchNovelData(novelIdFromParams)
    } else {
      // Handle the case where novelIdFromParams might be initially undefined
      setIsLoading(false); 
    }
  }, [novelIdFromParams]) // Depend on novelIdFromParams

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]"> {/* Adjusted min-height */}
        <div className="text-white text-lg flex items-center">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading novel details...
        </div>
      </div>
    )
  }

  // If novelId is not found in params or fetching resulted in novel being null
  if (!novelIdFromParams || !novel) {
    notFound(); // This will render the nearest not-found.tsx page
  }
  
  // novel is guaranteed to be non-null here due to the check above
  // but TypeScript might not infer it if notFound() doesn't throw an error that TS understands.
  // We can add an explicit check or trust notFound() behavior. For safety:
  if (!novel) {
      // This case should ideally be caught by the isLoading or the previous !novel check.
      // If notFound() is correctly configured, this might be redundant.
      return <div className="text-red-500">Error: Novel data could not be loaded.</div>;
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
          <Link href={`/admin/novels/${novelIdFromParams}/chapters/create`}>
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
                    <Link href={`/admin/novels/${novelIdFromParams}/chapters/${chapter.id}/edit`}>
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
              <Button
                onClick={() => setShowImportModal(true)} 
                variant="outline"
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Import Chapters 
              </Button>
              <Link href={`/admin/novels/${novelIdFromParams}/chapters/create`}>
                <Button variant="primary" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Chapter
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* New Import Modal: Ensure novelIdFromParams is used and checked */}
      {showImportModal && novelIdFromParams && (
          <ImportModal
            isOpen={showImportModal}
            onClose={() => setShowImportModal(false)}
            novelId={novelIdFromParams} // Use novelIdFromParams
            onImportComplete={() => {
              if (novelIdFromParams) fetchNovelData(novelIdFromParams); // Refresh chapters
              setShowImportModal(false);
            }}
          />
      )}
    </div>
  )
}