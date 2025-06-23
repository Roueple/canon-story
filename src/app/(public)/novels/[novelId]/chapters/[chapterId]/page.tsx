// src/app/(public)/novels/[novelId]/chapters/[chapterId]/page.tsx
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Bookmark, Loader2 } from 'lucide-react'
import { Button, LoadingSpinner } from '@/components/shared/ui'
import { InfiniteScrollReader } from '@/components/reader/InfiniteScrollReader'
import { ReadingControls } from '@/components/reader/ReadingControls'
import { ReadingProgressBar } from '@/components/reader/ReadingProgressBar'
import { useReadingSettings } from '@/hooks/useReadingSettings'
import { useReadingProgress } from '@/hooks/useReadingProgress'
import { useBookmarks } from '@/hooks/useBookmarks'
import { useTheme } from '@/providers/theme-provider'
import { cn } from '@/lib/utils'

interface Chapter {
  id: string
  novelId: string
  title: string
  content: string
  chapterNumber: number
  wordCount: number
  novel: {
    title: string;
  }
}

interface ChapterWithNav {
  currentChapter: Chapter;
  prevChapterId: string | null;
  nextChapterId: string | null;
  allChapterIds: string[];
}

export default function ChapterPage() {
  const params = useParams<{ novelId: string; chapterId: string }>()
  const router = useRouter()
  
  const [initialData, setInitialData] = useState<ChapterWithNav | null>(null)
  const [loadedChapters, setLoadedChapters] = useState<Chapter[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [isAutoScrolling, setIsAutoScrolling] = useState(false)
  const [isFocusMode, setIsFocusMode] = useState(false)
  const [visibleChapterId, setVisibleChapterId] = useState<string | null>(params.chapterId)
  
  const { 
    fontSize, 
    autoScrollSpeed, 
    updateFontSize, 
    updateAutoScrollSpeed, 
    isSettingsReady 
  } = useReadingSettings()
  
  const { theme, setTheme } = useTheme()

  const { updateProgress } = useReadingProgress(params.novelId)
  const { bookmarks, toggleBookmark, isBookmarked, isLoading: bookmarkLoading } = useBookmarks(params.novelId)

  // 1. Fetch initial chapter details and navigation
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoading(true)
        const res = await fetch(`/api/public/novels/${params.novelId}/chapters/${params.chapterId}`)
        if (!res.ok) throw new Error('Failed to load chapter details.')
        const data = await res.json()
        setInitialData(data.data)
        setLoadedChapters([data.data.currentChapter])
        setVisibleChapterId(data.data.currentChapter.id)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.')
      } finally {
        setIsLoading(false)
      }
    }
    fetchInitialData()
  }, [params.novelId, params.chapterId])

  // 2. Auto-scroll logic
  useEffect(() => {
    if (!isAutoScrolling) return
    const scrollInterval = setInterval(() => {
      window.scrollBy(0, 1)
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
        setIsAutoScrolling(false)
      }
    }, 50 / autoScrollSpeed)
    return () => clearInterval(scrollInterval)
  }, [isAutoScrolling, autoScrollSpeed])

  const currentChapter = loadedChapters.find(c => c.id === visibleChapterId)
  
  if (isLoading || !isSettingsReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-error">{error}</p>
        <Button onClick={() => router.push(`/novels/${params.novelId}`)}>
          Back to Novel
        </Button>
      </div>
    )
  }
  
  if (!initialData || !currentChapter) {
    return (
       <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className={cn("min-h-screen", isFocusMode && "focus-mode", theme)}>
      <ReadingProgressBar />
      
      {!isFocusMode && (
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <Link href={`/novels/${params.novelId}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">{currentChapter.novel.title}</span>
            </Link>
            <Button variant="ghost" size="sm" onClick={() => toggleBookmark(currentChapter.id)} disabled={bookmarkLoading}>
              {isBookmarked(currentChapter.id) ? (
                <Bookmark className="h-4 w-4 text-primary fill-current" />
              ) : (
                <Bookmark className="h-4 w-4" />
              )}
            </Button>
          </div>
        </header>
      )}

      <main className="container mx-auto px-4 py-8 max-w-4xl" style={{ '--reader-font-size': `${fontSize}px` } as React.CSSProperties}>
        <InfiniteScrollReader
          novelId={params.novelId}
          initialChapter={initialData.currentChapter}
          loadedChapters={loadedChapters}
          setLoadedChapters={setLoadedChapters}
          allChapterIds={initialData.allChapterIds}
          onChapterVisible={setVisibleChapterId}
          fontSize={fontSize}
          theme={theme}
        />
      </main>

      <ReadingControls
        fontSize={fontSize}
        onFontSizeChange={updateFontSize}
        isAutoScrolling={isAutoScrolling}
        onToggleAutoScroll={() => setIsAutoScrolling(prev => !prev)}
        autoScrollSpeed={autoScrollSpeed}
        onAutoScrollSpeedChange={updateAutoScrollSpeed}
        theme={theme}
        onThemeChange={setTheme}
        isFocusMode={isFocusMode}
        onToggleFocusMode={() => setIsFocusMode(prev => !prev)}
      />
    </div>
  )
}