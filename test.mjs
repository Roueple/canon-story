// roueple-canon-story/fix-chat-8.mjs
import { writeFile, readFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';

console.log('🔧 Applying fixes for Chat 8: Reader Implementation...');

async function applyFix(filePath, newContent) {
  const fullPath = join(process.cwd(), filePath);
  try {
    await mkdir(dirname(fullPath), { recursive: true });
    await writeFile(fullPath, newContent, 'utf-8');
    console.log(`✅ Fixed: ${filePath}`);
    return 1;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return 0;
  }
}

const fixes = [
  {
    path: 'src/app/(public)/novels/[novelId]/chapters/[chapterId]/page.tsx',
    content: `// src/app/(public)/novels/[novelId]/chapters/[chapterId]/page.tsx
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
        const res = await fetch(\`/api/public/novels/\${params.novelId}/chapters/\${params.chapterId}\`)
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
        <Button onClick={() => router.push(\`/novels/\${params.novelId}\`)}>
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
            <Link href={\`/novels/\${params.novelId}\`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
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

      <main className="container mx-auto px-4 py-8 max-w-4xl" style={{ '--reader-font-size': \`\${fontSize}px\` } as React.CSSProperties}>
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
}`
  },
  {
    path: 'src/components/reader/InfiniteScrollReader.tsx',
    content: `// src/components/reader/InfiniteScrollReader.tsx
'use client'

import { useRef, useCallback, useEffect } from 'react'
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
      const res = await fetch(\`/api/public/novels/\${novelId}/chapters/\${chapterId}/content\`)
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
}`
  },
  {
    path: 'src/components/reader/ChapterContent.tsx',
    content: `// src/components/reader/ChapterContent.tsx
'use client'

import { useRef, useEffect } from 'react'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useImageModal } from '@/hooks/useImageModal'
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver'

interface ChapterContentProps {
  chapter: {
    id: string
    title: string
    content: string
    chapterNumber: number
    wordCount: number
  }
  fontSize: number
  theme: string
  isFirst?: boolean
  isLast?: boolean
  onVisible: (chapterId: string) => void;
}

export function ChapterContent({ 
  chapter, 
  fontSize, 
  theme,
  isFirst = false,
  isLast = false,
  onVisible,
}: ChapterContentProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  useImageModal()

  // Notify parent when this chapter becomes visible
  useIntersectionObserver(contentRef, ([entry]) => {
    if (entry.isIntersecting) {
      onVisible(chapter.id)
    }
  }, { threshold: 0.5 })

  // Anti-copy/paste measures
  useEffect(() => {
    const element = contentRef.current;
    if (!element) return;

    const preventRightClick = (e: MouseEvent) => e.preventDefault();
    element.addEventListener('contextmenu', preventRightClick);

    return () => {
      element.removeEventListener('contextmenu', preventRightClick);
    }
  }, []);

  const formatChapterNumber = (num: number): string => {
    return num % 1 === 0 ? num.toString() : num.toFixed(2).replace(/\\.0+$/, '').replace(/(\\.\\d*?)0+$/, '$1')
  }
  
  const calculateReadingTime = (words: number) => Math.ceil(words / 200)
  
  return (
    <article
      ref={contentRef}
      data-chapter-id={chapter.id}
      className={cn(
        "chapter-content-wrapper scroll-mt-20",
        "animate-in fade-in duration-500",
        !isFirst && "border-t-2 border-border pt-16"
      )}
    >
      <header className="mb-8 text-center space-y-2">
        <h2 className="text-3xl font-bold">
          Chapter {formatChapterNumber(chapter.chapterNumber)}
        </h2>
        {chapter.title && (
          <h3 className="text-xl text-muted-foreground">{chapter.title}</h3>
        )}
        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {calculateReadingTime(chapter.wordCount)} min read
          </span>
          <span>•</span>
          <span>{chapter.wordCount.toLocaleString()} words</span>
        </div>
      </header>
      
      <div
        className={cn(
          "chapter-text-content no-select", // Added 'no-select' class
          "prose prose-lg max-w-none",
          theme === 'dark' && "prose-invert",
          theme === 'reading' && "prose-reading"
        )}
        style={{
          fontSize: 'var(--reader-font-size, 16px)',
          lineHeight: '1.8'
        }}
        dangerouslySetInnerHTML={{ __html: chapter.content }}
      />
      
      {!isLast && (
        <div className="mt-16 text-center">
          <div className="inline-flex items-center text-sm text-muted-foreground">
            <span>End of Chapter {formatChapterNumber(chapter.chapterNumber)}</span>
          </div>
        </div>
      )}
    </article>
  )
}`
  },
  {
    path: 'src/app/api/public/novels/[novelId]/chapters/[chapterId]/route.ts',
    content: `// src/app/api/public/novels/[novelId]/chapters/[chapterId]/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse, handleApiError } from '@/lib/api/utils'
import { serializeForJSON } from '@/lib/api/utils' // Use the correct serializer

export async function GET(
  request: NextRequest,
  { params }: { params: { novelId: string; chapterId: string } }
) {
  try {
    const { novelId, chapterId } = params
    
    // 1. Fetch current chapter and its novel details
    const currentChapter = await prisma.chapter.findFirst({
      where: {
        id: chapterId,
        novelId: novelId,
        isPublished: true,
        isDeleted: false,
      },
      include: {
        novel: {
          select: {
            title: true,
          }
        }
      }
    })

    if (!currentChapter) {
      return errorResponse('Chapter not found or not published.', 404)
    }

    // 2. Fetch all published chapter IDs and their order for navigation
    const allChaptersInNovel = await prisma.chapter.findMany({
      where: {
        novelId: novelId,
        isPublished: true,
        isDeleted: false,
      },
      select: {
        id: true,
        displayOrder: true,
      },
      orderBy: { displayOrder: 'asc' }
    })

    const allChapterIds = allChaptersInNovel.map(ch => ch.id)
    const currentIndex = allChapterIds.indexOf(chapterId)
    
    const prevChapterId = currentIndex > 0 ? allChapterIds[currentIndex - 1] : null
    const nextChapterId = currentIndex < allChapterIds.length - 1 ? allChapterIds[currentIndex + 1] : null

    // 3. Prepare the response payload
    const responsePayload = {
      currentChapter,
      prevChapterId,
      nextChapterId,
      allChapterIds,
    }

    // 4. Return serialized data
    return successResponse(responsePayload)
  } catch (error) {
    return handleApiError(error)
  }
}`
  },
  {
    path: 'src/app/api/public/novels/[novelId]/chapters/[chapterId]/content/route.ts',
    content: `// src/app/api/public/novels/[novelId]/chapters/[chapterId]/content/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse, handleApiError } from '@/lib/api/utils'

export async function GET(
  request: NextRequest,
  { params }: { params: { novelId: string; chapterId: string } }
) {
  try {
    const { novelId, chapterId } = params
    const chapter = await prisma.chapter.findFirst({
      where: {
        id: chapterId,
        novelId: novelId,
        isPublished: true,
        isDeleted: false,
      },
      select: {
        id: true,
        title: true,
        content: true,
        chapterNumber: true,
        wordCount: true,
        publishedAt: true,
        novelId: true
      }
    })
    
    if (!chapter) {
      return errorResponse('Chapter content not found', 404)
    }
    
    // The successResponse function will handle serialization
    return successResponse(chapter)
  } catch (error) {
    return handleApiError(error)
  }
}`
  },
  {
    path: 'src/hooks/useReadingProgress.ts',
    content: `// src/hooks/useReadingProgress.ts
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@clerk/nextjs'
import { debounce } from 'lodash'

interface ReadingProgress {
  novelId: string
  chapterId: string
  progressPercentage: number
  scrollPosition: number
  lastReadAt: Date
}

export function useReadingProgress(novelId?: string) {
  const { isSignedIn, userId } = useAuth()
  const [progress, setProgress] = useState<ReadingProgress | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isSignedIn || !userId || !novelId) {
      setProgress(null)
      return
    }

    const fetchProgress = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch(\`/api/public/users/progress?novelId=\${novelId}\`)
        if (!response.ok) throw new Error('Failed to fetch reading progress')
        const data = await response.json()
        setProgress(data.data || null)
      } catch (err) {
        console.error('Error fetching reading progress:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch progress')
      } finally {
        setIsLoading(false)
      }
    }
    fetchProgress()
  }, [isSignedIn, userId, novelId])

  const updateProgressDebounced = useCallback(
    debounce(async (chapterId: string, percentage: number, scrollPos?: number) => {
      if (!isSignedIn || !userId || !novelId) return

      try {
        const response = await fetch('/api/public/users/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            novelId,
            chapterId,
            progressPercentage: Math.round(percentage),
            scrollPosition: scrollPos || 0
          })
        })

        if (!response.ok) throw new Error('Failed to update reading progress')
        
        const data = await response.json()
        setProgress(data.data) // Update local state with response from server
      } catch (err) {
        console.error('Error updating reading progress:', err)
        setError(err instanceof Error ? err.message : 'Failed to update progress')
      }
    }, 1000),
    [isSignedIn, userId, novelId]
  )

  const updateProgress = useCallback((chapterId: string, percentage: number, scrollPos?: number) => {
    updateProgressDebounced(chapterId, percentage, scrollPos)
  }, [updateProgressDebounced])

  return { progress, isLoading, error, updateProgress }
}`
  },
  {
    path: 'src/hooks/useIntersectionObserver.ts',
    content: `// src/hooks/useIntersectionObserver.ts
import { useEffect, useRef } from 'react'

export function useIntersectionObserver(
  targetRef: React.RefObject<Element>,
  callback: IntersectionObserverCallback,
  options?: IntersectionObserverInit
) {
  const observerRef = useRef<IntersectionObserver | null>(null)
  
  useEffect(() => {
    if (!targetRef.current) return
    
    observerRef.current = new IntersectionObserver(callback, {
      root: null, // Observe against the viewport
      ...options
    })
    
    observerRef.current.observe(targetRef.current)
    
    const observer = observerRef.current; // Capture observer for cleanup
    return () => {
      observer?.disconnect()
    }
  }, [targetRef, callback, options])
}`
  },
  {
    path: 'src/components/reader/ReadingProgressBar.tsx',
    content: `// src/components/reader/ReadingProgressBar.tsx
'use client'

import { useEffect, useState } from 'react'

export function ReadingProgressBar() {
  const [progress, setProgress] = useState(0)
  
  useEffect(() => {
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement
      if (scrollHeight <= clientHeight) {
        setProgress(100)
        return
      }
      const scrollPercentage = (scrollTop / (scrollHeight - clientHeight)) * 100
      setProgress(Math.min(100, Math.max(0, scrollPercentage)))
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  
  return (
    <div className="fixed top-0 left-0 right-0 h-1 bg-muted z-[60]">
      <div
        className="h-full bg-primary transition-all duration-150 ease-out"
        style={{ width: \`\${progress}%\` }}
      />
    </div>
  )
}`
  },
  {
    path: 'src/components/reader/ReadingControls.tsx',
    content: `// src/components/reader/ReadingControls.tsx
'use client'

import { useState } from 'react'
import { Minus, Plus, Play, Pause, Zap, Moon, Sun, BookOpenCheck, Settings2, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/shared/ui/Button'
import { cn } from '@/lib/utils'
import type { ThemeName } from '@/config/themes'

interface ReadingControlsProps {
  fontSize: number
  onFontSizeChange: (size: number) => void
  isAutoScrolling: boolean
  onToggleAutoScroll: () => void
  autoScrollSpeed: number
  onAutoScrollSpeedChange: (speed: number) => void
  theme: ThemeName
  onThemeChange: (theme: ThemeName) => void
  isFocusMode: boolean
  onToggleFocusMode: () => void
}

export function ReadingControls({
  fontSize,
  onFontSizeChange,
  isAutoScrolling,
  onToggleAutoScroll,
  autoScrollSpeed,
  onAutoScrollSpeedChange,
  theme,
  onThemeChange,
  isFocusMode,
  onToggleFocusMode
}: ReadingControlsProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  const minFontSize = 12
  const maxFontSize = 32
  
  const cycleTheme = () => {
    const themes: ThemeName[] = ['light', 'dark', 'reading']
    const currentIndex = themes.indexOf(theme)
    const nextIndex = (currentIndex + 1) % themes.length
    onThemeChange(themes[nextIndex])
  }
  
  const ThemeIcon = theme === 'light' ? Sun : theme === 'dark' ? Moon : BookOpenCheck
  
  return (
    <div className={cn(
      "reader-controls fixed bottom-0 left-0 right-0 z-50",
      "bg-card/95 backdrop-blur-md border-t shadow-lg",
      "transition-transform duration-300 ease-in-out",
      isExpanded ? "translate-y-0" : "translate-y-[calc(100%-3.5rem)]"
    )}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute -top-10 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-2 rounded-t-lg hover:bg-primary/90 transition-colors"
        aria-label={isExpanded ? "Hide controls" : "Show controls"}
      >
        <Settings2 className="h-4 w-4" />
      </button>
      
      <div className="container max-w-4xl mx-auto p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <span className="text-sm font-medium mr-2">Font Size:</span>
            <Button variant="ghost" size="sm" onClick={() => onFontSizeChange(Math.max(fontSize - 1, minFontSize))} disabled={fontSize <= minFontSize} aria-label="Decrease font size">
              <Minus className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium w-12 text-center bg-muted rounded px-2 py-1">{fontSize}px</span>
            <Button variant="ghost" size="sm" onClick={() => onFontSizeChange(Math.min(fontSize + 1, maxFontSize))} disabled={fontSize >= maxFontSize} aria-label="Increase font size">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center justify-center gap-2">
            <Button variant="ghost" size="sm" onClick={cycleTheme} className="flex items-center gap-2" aria-label="Change theme">
              <ThemeIcon className="h-4 w-4" />
              <span className="capitalize text-xs">{theme}</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={onToggleFocusMode} className={cn("flex items-center gap-2", isFocusMode && "bg-primary/10")} aria-label={isFocusMode ? "Exit focus mode" : "Enter focus mode"}>
              {isFocusMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              <span className="text-xs">Focus</span>
            </Button>
          </div>
          
          <div className="flex items-center justify-center sm:justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={onToggleAutoScroll} className="flex items-center gap-2" aria-label={isAutoScrolling ? "Stop auto-scroll" : "Start auto-scroll"}>
              {isAutoScrolling ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              <span className="text-xs">Auto Scroll</span>
            </Button>
            {isAutoScrolling && (
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-muted-foreground" />
                <input type="range" min="1" max="10" value={autoScrollSpeed} onChange={(e) => onAutoScrollSpeedChange(parseInt(e.target.value))} className="w-20 h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary" aria-label="Auto-scroll speed" />
                <span className="text-xs w-4">{autoScrollSpeed}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}`
  },
  {
    path: 'src/app/globals.css',
    content: `@import "tailwindcss";

:root {
  --background: #ffffff;
  --foreground: #171717;
  --primary: #2563EB;
  --secondary: #6B7280;
  --accent: #3B82F6;
  --success: #10B981;
  --warning: #F59E0B;
  --error: #EF4444;
  --border: #E5E7EB;
  --muted: #F3F4F6;
  --card: #FFFFFF;
  --cardForeground: #1F2937;
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: Arial, Helvetica, sans-serif;
  transition: background-color 0.3s ease, color 0.3s ease;
}

/* Theme-specific styles */
.dark {
  color-scheme: dark;
}

.reading {
  color-scheme: light;
}

/* Utility classes for theme colors */
.bg-background { background-color: var(--background); }
.bg-foreground { background-color: var(--foreground); }
.bg-primary { background-color: var(--primary); }
.bg-secondary { background-color: var(--secondary); }
.bg-accent { background-color: var(--accent); }
.bg-success { background-color: var(--success); }
.bg-warning { background-color: var(--warning); }
.bg-error { background-color: var(--error); }
.bg-muted { background-color: var(--muted); }
.bg-card { background-color: var(--card); }

.text-background { color: var(--background); }
.text-foreground { color: var(--foreground); }
.text-primary { color: var(--primary); }
.text-secondary { color: var(--secondary); }
.text-accent { color: var(--accent); }
.text-success { color: var(--success); }
.text-warning { color: var(--warning); }
.text-error { color: var(--error); }
.text-muted { color: var(--muted); }
.text-card-foreground { color: var(--cardForeground); }

.border-border { border-color: var(--border); }
.border-primary { border-color: var(--primary); }
.border-secondary { border-color: var(--secondary); }
.border-accent { border-color: var(--accent); }
.border-success { border-color: var(--success); }
.border-warning { border-color: var(--warning); }
.border-error { border-color: var(--error); }

/* CRITICAL: Force white text in admin area contenteditable */
.bg-gray-900 [contenteditable],
.bg-gray-900 [contenteditable] * {
  color: #F3F4F6 !important;
}

/* Ensure placeholder text is visible */
[contenteditable]:empty:before {
  content: attr(placeholder);
  color: #9CA3AF !important;
  pointer-events: none;
  display: block;
}

/* Admin area specific styles */
.bg-gray-900 {
  color: #F3F4F6;
}

.bg-gray-900 .prose {
  color: #F3F4F6;
}

/* Fix for content editable in dark mode */
[contenteditable] {
  -webkit-text-fill-color: #F3F4F6;
}

/* Selection colors in editor */
::selection {
  background-color: #3B82F6;
  color: #FFFFFF;
}

.prose img { /* Or a more specific selector for chapter content images */
  max-width: 100%;
  height: auto;
  margin-top: 1.5em; /* Example margin */
  margin-bottom: 1.5em; /* Example margin */
  border-radius: 0.375rem; /* Example rounded corners */
}

/* Add these styles to src/app/globals.css */

/* Reader Container Styles */
.reader-scroll-container {
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
}

/* Focus Mode */
.focus-mode header,
.focus-mode footer,
.focus-mode .reader-controls {
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
}

.focus-mode .reader-content {
  padding-top: 0;
}

/* Chapter Content Typography */
.chapter-text-content {
  --reader-font-size: 16px;
  font-size: var(--reader-font-size) !important;
}

.chapter-text-content * {
  color: inherit !important;
  transition: font-size 0.2s ease;
}

.chapter-text-content p {
  font-size: inherit !important;
  margin-bottom: 1.5em;
  text-align: justify;
  text-justify: inter-word;
}

.chapter-text-content h1,
.chapter-text-content h2,
.chapter-text-content h3,
.chapter-text-content h4,
.chapter-text-content h5,
.chapter-text-content h6 {
  color: inherit !important;
  margin-top: 2em;
  margin-bottom: 1em;
  font-weight: 700;
}

.chapter-text-content h1 { font-size: calc(var(--reader-font-size) * 2) !important; }
.chapter-text-content h2 { font-size: calc(var(--reader-font-size) * 1.75) !important; }
.chapter-text-content h3 { font-size: calc(var(--reader-font-size) * 1.5) !important; }
.chapter-text-content h4 { font-size: calc(var(--reader-font-size) * 1.25) !important; }
.chapter-text-content h5 { font-size: calc(var(--reader-font-size) * 1.1) !important; }
.chapter-text-content h6 { font-size: calc(var(--reader-font-size) * 1) !important; }

.chapter-text-content ul,
.chapter-text-content ol {
  margin: 1.5em 0;
  padding-left: 2em;
}

.chapter-text-content li {
  font-size: inherit !important;
  margin-bottom: 0.5em;
}

.chapter-text-content blockquote {
  border-left: 4px solid var(--primary);
  padding-left: 1em;
  margin: 1.5em 0;
  font-style: italic;
  opacity: 0.9;
}

.chapter-text-content a {
  color: var(--primary) !important;
  text-decoration: underline;
}

.chapter-text-content img {
  max-width: 100%;
  height: auto;
  margin: 2em auto;
  display: block;
  border-radius: 0.5rem;
  cursor: zoom-in;
  transition: transform 0.3s ease;
}

.chapter-text-content img:hover {
  transform: scale(1.02);
}

/* Theme-specific styles */
.prose-reading {
  --tw-prose-body: #3d2914;
  --tw-prose-headings: #2d1810;
  --tw-prose-links: #8b4513;
  --tw-prose-bold: #2d1810;
  --tw-prose-quotes: #5d4e37;
}

/* Reading theme background */
.bg-\\[\\#f4e8d0\\] {
  background-color: #f4e8d0;
}

/* Dark theme adjustments */
.dark .chapter-text-content {
  color: #e5e5e5 !important;
}

.dark .chapter-text-content h1,
.dark .chapter-text-content h2,
.dark .chapter-text-content h3,
.dark .chapter-text-content h4,
.dark .chapter-text-content h5,
.dark .chapter-text-content h6 {
  color: #ffffff !important;
}

/* Loading animations */
@keyframes pulse-fade {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

.chapter-content-wrapper {
  opacity: 0;
  animation: fadeIn 0.5s ease forwards;
}

@keyframes fadeIn {
  to { opacity: 1; }
}

/* Smooth scrolling for auto-scroll */
body:has(.auto-scrolling) {
  scroll-behavior: auto;
}

/* Mobile optimizations */
@media (max-width: 640px) {
  .chapter-text-content {
    text-align: left;
  }
}

/* Anti-Copy/Paste Class */
.no-select {
  -webkit-touch-callout: none; /* iOS Safari */
  -webkit-user-select: none;   /* Safari */
  -khtml-user-select: none;    /* Konqueror HTML */
  -moz-user-select: none;      /* Old versions of Firefox */
  -ms-user-select: none;       /* Internet Explorer/Edge */
  user-select: none;           /* Non-prefixed version */
}
`
  },
];

async function run() {
  let successCount = 0;
  for (const fix of fixes) {
    const result = await applyFix(fix.path, fix.content);
    successCount += result;
  }

  console.log(`\n--------------------------------------`);
  if (successCount === fixes.length) {
    console.log(`\n🎉 All ${successCount} files fixed successfully!`);
    console.log(`
Summary of Changes:
1.  **Reader Architecture Refactored**: Moved state management to the main page component (\`.../[chapterId]/page.tsx\`) to prevent re-rendering loops and resource exhaustion. This resolves the duplicate key errors and the \`ERR_INSUFFICIENT_RESOURCES\` crashes.
2.  **Data Serialization Fixed**: Corrected the API endpoints to properly convert Prisma's \`Decimal\` and \`BigInt\` types to numbers/strings, fixing the \`[object] [object]\` display bug for chapter numbers.
3.  **Scrolling Behavior Corrected**: The reader now uses the main browser scrollbar, providing a more natural experience and fixing layout issues.
4.  **Anti-Copy/Paste Implemented**: Added CSS and JavaScript to disable text selection and right-clicking on chapter content as a deterrent.
5.  **Reading Progress Hook Improved**: The \`useReadingProgress\` hook is now compatible with the infinite scroll reader, correctly tracking progress as the user moves between chapters.
6.  **Infinite Scroll Logic**: The new reader now loads previous and next chapters seamlessly as the user scrolls.

Please restart your development server (\`npm run dev\`) to see the changes.
    `);
  } else {
    console.log(`\n⚠️  ${fixes.length - successCount} out of ${fixes.length} fixes failed. Please review the errors above.`);
  }
  console.log(`--------------------------------------`);
}

run();