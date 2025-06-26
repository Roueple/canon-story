// FILE: src/components/reader/InfiniteScrollReader.tsx
'use client'

import { useRef, useCallback, useEffect, useState } from 'react'
import { ChapterContent } from './ChapterContent'
import { LoadingSpinner } from '@/components/shared/ui'
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver'

interface Chapter {
  id: string
  novelId: string
  title: string
  content: string
  chapterNumber: number
  wordCount: number
  novel: {
    title: string
  }
}

interface InfiniteScrollReaderProps {
  novelId: string
  initialChapter: Chapter
  loadedChapters: Chapter[]
  setLoadedChapters: React.Dispatch<React.SetStateAction<Chapter[]>>
  allChapterIds: string[]
  onChapterVisible: (chapterId: string) => void
  fontSize: number
  theme: string
}

export function InfiniteScrollReader({
  novelId,
  initialChapter,
  loadedChapters,
  setLoadedChapters,
  allChapterIds,
  onChapterVisible,
  fontSize,
  theme,
}: InfiniteScrollReaderProps) {
  const topSentinelRef = useRef<HTMLDivElement>(null)
  const bottomSentinelRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState<{ top: boolean; bottom: boolean }>({ top: false, bottom: false })

  const fetchChapter = useCallback(async (chapterId: string) => {
    if (loadedChapters.some(c => c.id === chapterId)) return null
    try {
      const res = await fetch(`/api/public/novels/${novelId}/chapters/${chapterId}/content`)
      if (!res.ok) return null
      const data = await res.json()
      return data.data
    } catch (error) {
      console.error('Failed to fetch chapter:', error)
      return null
    }
  }, [novelId, loadedChapters])

  const loadPrevious = useCallback(async () => {
    const firstChapterId = loadedChapters[0]?.id
    if (!firstChapterId) return

    const currentIndex = allChapterIds.indexOf(firstChapterId)
    if (currentIndex > 0) {
      const prevChapterId = allChapterIds[currentIndex - 1]
      if (loadedChapters.some(c => c.id === prevChapterId)) return
      
      setLoading(prev => ({ ...prev, top: true }))
      const chapter = await fetchChapter(prevChapterId)
      if (chapter) {
        setLoadedChapters(prev => [chapter, ...prev])
      }
      setLoading(prev => ({ ...prev, top: false }))
    }
  }, [allChapterIds, loadedChapters, fetchChapter, setLoadedChapters])

  const loadNext = useCallback(async () => {
    const lastChapterId = loadedChapters[loadedChapters.length - 1]?.id
    if (!lastChapterId) return
    
    const currentIndex = allChapterIds.indexOf(lastChapterId)
    if (currentIndex < allChapterIds.length - 1) {
      const nextChapterId = allChapterIds[currentIndex + 1]
      if (loadedChapters.some(c => c.id === nextChapterId)) return

      setLoading(prev => ({ ...prev, bottom: true }))
      const chapter = await fetchChapter(nextChapterId)
      if (chapter) {
        setLoadedChapters(prev => [...prev, chapter])
      }
      setLoading(prev => ({ ...prev, bottom: false }))
    }
  }, [allChapterIds, loadedChapters, fetchChapter, setLoadedChapters])

  useIntersectionObserver(topSentinelRef, ([entry]) => {
    if (entry.isIntersecting && !loading.top) {
      loadPrevious()
    }
  }, { threshold: 1.0 })

  useIntersectionObserver(bottomSentinelRef, ([entry]) => {
    if (entry.isIntersecting && !loading.bottom) {
      loadNext()
    }
  }, { threshold: 1.0 })

  return (
    <div className="space-y-16">
      <div ref={topSentinelRef} className="h-1">
        {loading.top && <div className="flex justify-center py-4"><LoadingSpinner /></div>}
      </div>

      {loadedChapters.map((chapter, index) => (
        <ChapterContent
          key={chapter.id}
          chapter={chapter}
          fontSize={fontSize}
          theme={theme}
          onVisible={onChapterVisible}
          isFirst={index === 0}
          isLast={index === allChapterIds.length - 1 && loadedChapters.length === allChapterIds.length}
        />
      ))}
      
      <div ref={bottomSentinelRef} className="h-1">
        {loading.bottom && <div className="flex justify-center py-4"><LoadingSpinner /></div>}
      </div>
    </div>
  )
}