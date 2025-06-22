// src/app/(public)/novels/[novelId]/chapters/[chapterId]/page.tsx
'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { ArrowLeft, Bookmark, BookmarkCheck, Clock, Eye } from 'lucide-react'
import { Button } from '@/components/shared/ui/Button'
import { LoadingSpinner } from '@/components/shared/ui/LoadingSpinner'
import { InfiniteScrollReader } from '@/components/reader/InfiniteScrollReader'
import { ReadingControls } from '@/components/reader/ReadingControls'
import { ReadingProgressBar } from '@/components/reader/ReadingProgressBar'
import { useReadingProgress } from '@/hooks/useReadingProgress'
import { useBookmarks } from '@/hooks/useBookmarks'
import { useReadingSettings } from '@/hooks/useReadingSettings'
import { useTheme } from '@/providers/theme-provider'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface Chapter {
  id: string
  novelId: string
  title: string
  content: string
  chapterNumber: number | string // Can be either
  wordCount: number | string // Can be either
  publishedAt: string | null
  novel: {
    id: string
    title: string
    author: string // Must be string, not object
  }
}

interface ChapterWithNavigation {
  currentChapter: Chapter
  prevChapterId: string | null
  nextChapterId: string | null
  totalChapters: number
  allChapterIds: string[]
}

// Safe number formatter
function formatChapterNumber(num: number | string): string {
  if (typeof num === 'string') {
    const parsed = parseFloat(num);
    return isNaN(parsed) ? num : formatChapterNumber(parsed);
  }
  return num % 1 === 0 ? num.toString() : num.toFixed(2).replace(/\.?0+$/, '');
}

// Safe number converter
function toNumber(val: number | string | any): number {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') return parseFloat(val) || 0;
  if (val && typeof val === 'object' && 'toNumber' in val) return val.toNumber();
  return 0;
}

export default function ChapterPage() {
  const params = useParams()
  const router = useRouter()
  const { isSignedIn, userId } = useAuth()
  const contentRef = useRef<HTMLDivElement>(null)
  
  const [pageData, setPageData] = useState<ChapterWithNavigation | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAutoScrolling, setIsAutoScrolling] = useState(false)
  const [isFocusMode, setIsFocusMode] = useState(false)
  
  const { fontSize, autoScrollSpeed, updateFontSize, updateAutoScrollSpeed, isSettingsReady } = useReadingSettings()
  const { theme } = useTheme()
  
  // Initial chapter load
  useEffect(() => {
    async function fetchChapter() {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/public/novels/${params.novelId}/chapters/${params.chapterId}`)
        if (!response.ok) throw new Error('Failed to fetch chapter')
        
        const data = await response.json()
        setPageData(data)
        
        // Track view
        if (isSignedIn) {
          fetch('/api/public/novels/track-view', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              novelId: params.novelId,
              chapterId: params.chapterId 
            })
          }).catch(console.error)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load chapter')
      } finally {
        setIsLoading(false)
      }
    }

    fetchChapter()
  }, [params.novelId, params.chapterId, isSignedIn])

  // Reading progress tracking
  const { updateProgress } = useReadingProgress(
    params.novelId as string,
    params.chapterId as string
  )

  // Bookmark functionality - with safe handling
  const bookmarksHook = useBookmarks(params.novelId as string)
  
  // Safely extract bookmark functions
  const bookmarks = bookmarksHook?.bookmarks || []
  const toggleBookmark = bookmarksHook?.toggleBookmark || (() => {})
  const bookmarkLoading = bookmarksHook?.isLoading || false
  
  // Safe bookmark check
  const isChapterBookmarked = useMemo(() => {
    if (!bookmarksHook?.isBookmarked || typeof bookmarksHook.isBookmarked !== 'function') {
      // Fallback: check if current chapter is in bookmarks array
      return bookmarks.some(b => b.chapterId === params.chapterId)
    }
    return bookmarksHook.isBookmarked(params.chapterId as string)
  }, [bookmarksHook, bookmarks, params.chapterId])

  // Navigation functions
  const navigateToChapter = useCallback((chapterId: string | null) => {
    if (chapterId) {
      router.push(`/novels/${params.novelId}/chapters/${chapterId}`)
    }
  }, [params.novelId, router])

  const handlePrevChapter = () => navigateToChapter(pageData?.prevChapterId || null)
  const handleNextChapter = () => navigateToChapter(pageData?.nextChapterId || null)

  // Scroll tracking for progress
  useEffect(() => {
    if (!contentRef.current || !isSignedIn) return

    const handleScroll = () => {
      const element = contentRef.current
      if (!element) return

      const scrollTop = window.scrollY
      const scrollHeight = element.scrollHeight
      const clientHeight = window.innerHeight
      const scrollPercentage = (scrollTop / (scrollHeight - clientHeight)) * 100

      updateProgress(Math.min(100, Math.max(0, scrollPercentage)))
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isSignedIn, updateProgress])

  // Auto-scroll functionality
  useEffect(() => {
    if (!isAutoScrolling) return

    const scrollInterval = setInterval(() => {
      window.scrollBy(0, 1)
      
      // Stop at bottom
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
        setIsAutoScrolling(false)
      }
    }, 50 / autoScrollSpeed)

    return () => clearInterval(scrollInterval)
  }, [isAutoScrolling, autoScrollSpeed])

  // Loading state
  if (isLoading || !isSettingsReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Error state
  if (error || !pageData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-error">{error || 'Chapter not found'}</p>
        <Button onClick={() => router.push(`/novels/${params.novelId}`)}>
          Back to Novel
        </Button>
      </div>
    )
  }

  const { currentChapter } = pageData

  return (
    <div className={cn("min-h-screen", isFocusMode && "focus-mode")}>
      {/* Header */}
      {!isFocusMode && (
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link
                  href={`/novels/${currentChapter.novelId}`}
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">{currentChapter.novel.title}</span>
                </Link>
                <span className="text-muted-foreground">/</span>
                <span className="font-medium">
                  Chapter {formatChapterNumber(currentChapter.chapterNumber)}
                </span>
              </div>
              
              {isSignedIn && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleBookmark(currentChapter.id)}
                  disabled={bookmarkLoading}
                >
                  {isChapterBookmarked ? (
                    <BookmarkCheck className="h-4 w-4 text-primary" />
                  ) : (
                    <Bookmark className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          </div>
        </header>
      )}

      {/* Progress Bar */}
      <ReadingProgressBar />

      {/* Main Content */}
      <main 
        ref={contentRef}
        className="container mx-auto px-4 py-8 max-w-4xl"
        style={{ '--reader-font-size': `${fontSize}px` } as React.CSSProperties}
      >
        {/* Use InfiniteScrollReader for better performance */}
        <InfiniteScrollReader
          initialChapterId={currentChapter.id}
          novelId={currentChapter.novelId}
          allChapterIds={pageData.allChapterIds}
          fontSize={fontSize}
          theme={theme}
          isAutoScrolling={isAutoScrolling}
          autoScrollSpeed={autoScrollSpeed}
        />
      </main>

      {/* Reading Controls */}
      <ReadingControls
        fontSize={fontSize}
        onFontSizeChange={updateFontSize}
        autoScrollSpeed={autoScrollSpeed}
        onAutoScrollSpeedChange={updateAutoScrollSpeed}
        isAutoScrolling={isAutoScrolling}
        onToggleAutoScroll={() => setIsAutoScrolling(!isAutoScrolling)}
        isFocusMode={isFocusMode}
        onToggleFocusMode={() => setIsFocusMode(!isFocusMode)}
        onPrevChapter={pageData.prevChapterId ? handlePrevChapter : undefined}
        onNextChapter={pageData.nextChapterId ? handleNextChapter : undefined}
      />
    </div>
  )
}