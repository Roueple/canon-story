// src/app/(admin)/admin/novels/[id]/chapters/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { notFound, useParams } from 'next/navigation'
import { Plus, Edit, Eye, EyeOff, ArrowLeft, GripVertical, BookOpen, Upload } from 'lucide-react' // Added GripVertical, removed ArrowUpDown
import { Button } from '@/components/shared/ui'
import { formatDate, formatChapterNumber } from '@/lib/utils'
import { ImportModal } from '@/components/admin/import/ImportModal';
import { 
    DragDropContext, 
    Droppable, 
    Draggable, 
    type DropResult, // Import DropResult
    type DraggableProvided, // Import DraggableProvided
    type DraggableStateSnapshot, // Import DraggableStateSnapshot
    type DroppableProvided // Import DroppableProvided
} from '@hello-pangea/dnd';

interface ChapterDetail {
  id: string;
  title: string;
  chapterNumber: number;
  displayOrder: number;
  status: string;
  isPublished: boolean;
  wordCount: number;
  updatedAt: string;
}

interface NovelWithChapters {
  id: string;
  title: string;
  chapters: ChapterDetail[];
}


export default function ChaptersPage() {
  const routeParams = useParams<{ id: string }>()
  const novelIdFromParams = routeparams.novelId

  const [novel, setNovel] = useState<NovelWithChapters | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showImportModal, setShowImportModal] = useState(false);
  const [isReordering, setIsReordering] = useState(false);


  const fetchNovelData = useCallback(async (currentNovelId: string) => {
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
        if (response.status === 404) setNovel(null);
        throw new Error(`Failed to fetch novel (status: ${response.status})`)
      }
      const result = await response.json()
      if (result.success && result.data) {
        const sortedChapters = result.data.chapters.sort((a: ChapterDetail, b: ChapterDetail) => a.displayOrder - b.displayOrder);
        setNovel({ ...result.data, chapters: sortedChapters });
      } else {
        throw new Error(result.error || 'Failed to parse novel data');
      }
    } catch (error) {
      console.error('Error fetching novel:', error)
      setNovel(null);
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (novelIdFromParams) {
      fetchNovelData(novelIdFromParams)
    } else {
      setIsLoading(false); 
    }
  }, [novelIdFromParams, fetchNovelData])

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || !novel || !novel.chapters) return;

    const items = Array.from(novel.chapters);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedChapterOrder = items.map((chapter, index) => ({
      id: chapter.id,
      displayOrder: index + 1 
    }));
    
    setNovel(prevNovel => prevNovel ? ({ ...prevNovel, chapters: items.map((ch, idx) => ({...ch, displayOrder: idx + 1})) }) : null);
    setIsReordering(true);

    try {
      const response = await fetch('/api/admin/chapters/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ novelId: novelIdFromParams, chapterOrder: updatedChapterOrder })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reorder chapters');
      }
    } catch (error) {
      console.error("Failed to save chapter order:", error);
      if (novelIdFromParams) fetchNovelData(novelIdFromParams); 
      alert(`Error saving chapter order: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsReordering(false);
    }
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
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

  if (!novelIdFromParams || !novel) {
    notFound();
  }
  
  if (!novel) { 
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
          <p className="text-gray-400 mt-1">Manage chapters for this novel. Drag to reorder.</p>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">Total Chapters</p>
          <p className="text-2xl font-bold text-white">{novel.chapters?.length || 0}</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">Published</p>
          <p className="text-2xl font-bold text-green-400">
            {novel.chapters?.filter((ch) => ch.isPublished).length || 0}
          </p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">Drafts</p>
          <p className="text-2xl font-bold text-yellow-400">
            {novel.chapters?.filter((ch) => !ch.isPublished).length || 0}
          </p>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-x-auto">
        {novel.chapters && novel.chapters.length > 0 ? (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="chaptersDroppable">
              {(provided: DroppableProvided) => ( // Typed provided
                <table className="w-full min-w-[700px]" {...provided.droppableProps} ref={provided.innerRef}>
                  <thead className="bg-gray-900">
                    <tr>
                      <th className="px-2 py-3 w-10"></th> 
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                         Order
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Title</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Words</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Updated</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {novel.chapters.map((chapter, index) => (
                      <Draggable key={chapter.id} draggableId={chapter.id} index={index}>
                        {(providedDraggable: DraggableProvided, snapshot: DraggableStateSnapshot) => ( // Typed provided and snapshot
                          <tr
                            ref={providedDraggable.innerRef}
                            {...providedDraggable.draggableProps}
                            className={`hover:bg-gray-750 ${snapshot.isDragging ? 'bg-gray-700 shadow-lg' : ''}`}
                          >
                            <td className="px-2 py-4 whitespace-nowrap text-gray-400" {...providedDraggable.dragHandleProps}>
                              <GripVertical className="h-5 w-5" />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm font-medium text-white">
                                {formatChapterNumber(chapter.chapterNumber)} 
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-white truncate max-w-xs">{chapter.title}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                  chapter.status === 'free' || chapter.status === 'published' 
                                  ? 'bg-green-900/50 text-green-300' 
                                  : chapter.status === 'premium' 
                                    ? 'bg-purple-900/50 text-purple-300' 
                                    : 'bg-yellow-900/50 text-yellow-300'
                                }`}>
                                  {chapter.status}
                                </span>
                                <span title={chapter.isPublished ? "Published" : "Draft"}>
                                  {chapter.isPublished ? (
                                    <Eye className="h-4 w-4 text-green-400" />
                                  ) : (
                                    <EyeOff className="h-4 w-4 text-gray-500" />
                                  )}
                                </span>
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
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </tbody>
                </table>
              )}
            </Droppable>
          </DragDropContext>
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
      {isReordering && (
        <div className="fixed bottom-4 right-4 bg-yellow-500 text-black px-4 py-2 rounded-md shadow-lg text-sm">
          Saving new chapter order...
        </div>
      )}

      {showImportModal && novelIdFromParams && (
          <ImportModal
            isOpen={showImportModal}
            onClose={() => setShowImportModal(false)}
            novelId={novelIdFromParams}
            onImportComplete={() => {
              if (novelIdFromParams) fetchNovelData(novelIdFromParams);
              setShowImportModal(false);
            }}
          />
      )}
    </div>
  )
}