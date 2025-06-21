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
  chapterNumber: any
  wordCount: number
  publishedAt: string | null
  novel: {
    id: string
    title: string
    author: string
  }
}

interface ChapterWithNavigation {
  currentChapter: Chapter
  prevChapterId: string | null
  nextChapterId: string | null
  totalChapters: number
  allChapterIds: string[]
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
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      
      switch(e.key.toLowerCase()) {
        case 'f':
          setIsFocusMode(prev => !prev)
          break
        case ' ':
          e.preventDefault()
          setIsAutoScrolling(prev => !prev)
          break
        case 'arrowleft':
          if (pageData?.prevChapterId) {
            router.push(`/novels/${params.novelId}/chapters/${pageData.prevChapterId}`)
          }
          break
        case 'arrowright':
          if (pageData?.nextChapterId) {
            router.push(`/novels/${params.novelId}/chapters/${pageData.nextChapterId}`)
          }
          break
        case '+':
        case '=':
          updateFontSize(Math.min(fontSize + 1, 32))
          break
        case '-':
        case '_':
          updateFontSize(Math.max(fontSize - 1, 12))
          break
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [fontSize, pageData, params.novelId, router, updateFontSize])
  
  if (isLoading || !isSettingsReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    )
  }
  
  if (error || !pageData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-destructive">{error || 'Chapter not found'}</p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    )
  }
  
  return (
    <div className={cn(
      "min-h-screen bg-background text-foreground transition-all duration-300",
      isFocusMode && "focus-mode"
    )}>
      {/* Header - Hidden in focus mode via CSS */}
      <header className="reader-header sticky top-0 z-50 bg-card/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/novels/${params.novelId}`)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Novel
              </Button>
              <div className="hidden sm:block">
                <h1 className="text-lg font-semibold">{pageData.currentChapter.novel.title}</h1>
                <p className="text-sm text-muted-foreground">by {pageData.currentChapter.novel.author}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Chapter {pageData.currentChapter.chapterNumber} of {pageData.totalChapters}
              </span>
            </div>
          </div>
        </div>
      </header>
      
      {/* Progress Bar */}
      <ReadingProgressBar />
      
      {/* Main Content */}
      <main ref={contentRef} className="reader-content">
        <InfiniteScrollReader
          initialChapterId={params.chapterId as string}
          novelId={params.novelId as string}
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
        isAutoScrolling={isAutoScrolling}
        onToggleAutoScroll={() => setIsAutoScrolling(!isAutoScrolling)}
        autoScrollSpeed={autoScrollSpeed}
        onAutoScrollSpeedChange={updateAutoScrollSpeed}
        theme={theme}
        isFocusMode={isFocusMode}
        onToggleFocusMode={() => setIsFocusMode(!isFocusMode)}
      />
      
      {/* Keyboard shortcuts hint */}
      <div className="fixed bottom-20 right-4 text-xs text-muted-foreground opacity-50 hover:opacity-100 transition-opacity">
        <div>F - Focus Mode</div>
        <div>Space - Auto Scroll</div>
        <div>← → - Navigate</div>
        <div>+ - - Font Size</div>
      </div>
    </div>
  )
}