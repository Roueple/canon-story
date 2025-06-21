// src/components/reader/InfiniteScrollReader.tsx
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@clerk/nextjs'
import { LoadingSpinner } from '@/components/shared/ui/LoadingSpinner'
import { ChapterContent } from './ChapterContent'
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver'
import { useReadingProgress } from '@/hooks/useReadingProgress'
import { cn } from '@/lib/utils'

interface Chapter {
  id: string
  novelId: string
  title: string
  content: string
  chapterNumber: any
  wordCount: number
  publishedAt: string | null
}

interface InfiniteScrollReaderProps {
  initialChapterId: string
  novelId: string
  allChapterIds: string[]
  fontSize: number
  theme: string
  isAutoScrolling: boolean
  autoScrollSpeed: number
}

export function InfiniteScrollReader({
  initialChapterId,
  novelId,
  allChapterIds,
  fontSize,
  theme,
  isAutoScrolling,
  autoScrollSpeed
}: InfiniteScrollReaderProps) {
  const { isSignedIn } = useAuth()
  const containerRef = useRef<HTMLDivElement>(null!)
  const autoScrollRef = useRef<number | null>(null)
  
  const [loadedChapters, setLoadedChapters] = useState<Chapter[]>([])
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({})
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0)
  const [visibleChapters, setVisibleChapters] = useState<Set<string>>(new Set())
  
  const { updateProgress } = useReadingProgress()
  
  // Find initial chapter index
  useEffect(() => {
    const index = allChapterIds.findIndex(id => id === initialChapterId)
    if (index !== -1) {
      setCurrentChapterIndex(index)
    }
  }, [initialChapterId, allChapterIds])
  
  // Load a chapter
  const loadChapter = useCallback(async (chapterId: string) => {
    if (loadingStates[chapterId] || loadedChapters.find(ch => ch.id === chapterId)) {
      return
    }
    
    setLoadingStates(prev => ({ ...prev, [chapterId]: true }))
    
    try {
      const response = await fetch(`/api/public/novels/${novelId}/chapters/${chapterId}/content`)
      if (!response.ok) throw new Error('Failed to fetch chapter')
      
      const chapter = await response.json()
      
      setLoadedChapters(prev => {
        const newChapters = [...prev, chapter]
        // Sort by chapter number to maintain order
        return newChapters.sort((a, b) => {
          const aNum = parseFloat(a.chapterNumber.toString())
          const bNum = parseFloat(b.chapterNumber.toString())
          return aNum - bNum
        })
      })
    } catch (error) {
      console.error('Error loading chapter:', error)
    } finally {
      setLoadingStates(prev => ({ ...prev, [chapterId]: false }))
    }
  }, [novelId, loadingStates, loadedChapters])
  
  // Initial load: current chapter + adjacent ones
  useEffect(() => {
    const loadInitialChapters = async () => {
      const startIdx = Math.max(0, currentChapterIndex - 1)
      const endIdx = Math.min(allChapterIds.length - 1, currentChapterIndex + 1)
      
      for (let i = startIdx; i <= endIdx; i++) {
        await loadChapter(allChapterIds[i])
      }
    }
    
    loadInitialChapters()
  }, [currentChapterIndex, allChapterIds, loadChapter])
  
  // Intersection observer for tracking visible chapters
  const observerCallback = useCallback((entries: IntersectionObserverEntry[]) => {
    entries.forEach(entry => {
      const chapterId = entry.target.getAttribute('data-chapter-id')
      if (!chapterId) return
      
      if (entry.isIntersecting) {
        setVisibleChapters(prev => new Set(prev).add(chapterId))
        
        // Update current chapter based on visibility
        const chapterIndex = allChapterIds.indexOf(chapterId)
        if (chapterIndex !== -1 && entry.intersectionRatio > 0.5) {
          setCurrentChapterIndex(chapterIndex)
          
          // Update URL without navigation
          window.history.replaceState({}, '', `/novels/${novelId}/chapters/${chapterId}`)
        }
        
        // Track reading progress
        if (isSignedIn) {
          const chapter = loadedChapters.find(ch => ch.id === chapterId)
          if (chapter) {
            updateProgress(novelId, chapterId, entry.intersectionRatio * 100)
          }
        }
      } else {
        setVisibleChapters(prev => {
          const newSet = new Set(prev)
          newSet.delete(chapterId)
          return newSet
        })
      }
    })
  }, [allChapterIds, novelId, isSignedIn, loadedChapters, updateProgress])
  
  // Setup intersection observer
  useIntersectionObserver(
    containerRef,
    observerCallback,
    { threshold: [0, 0.25, 0.5, 0.75, 1], rootMargin: '100px' }
  )
  
  // Load more chapters when scrolling near edges
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return
      
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current
      const scrollPercentage = (scrollTop / (scrollHeight - clientHeight)) * 100
      
      // Load next chapter when 80% scrolled
      if (scrollPercentage > 80 && currentChapterIndex < allChapterIds.length - 1) {
        const nextIdx = Math.min(currentChapterIndex + 2, allChapterIds.length - 1)
        loadChapter(allChapterIds[nextIdx])
      }
      
      // Load previous chapter when scrolled to top
      if (scrollPercentage < 20 && currentChapterIndex > 0) {
        const prevIdx = Math.max(currentChapterIndex - 2, 0)
        loadChapter(allChapterIds[prevIdx])
      }
    }
    
    const container = containerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true })
      return () => container.removeEventListener('scroll', handleScroll)
    }
  }, [currentChapterIndex, allChapterIds, loadChapter])
  
  // Auto-scroll functionality
  useEffect(() => {
    if (isAutoScrolling && containerRef.current) {
      const scroll = () => {
        if (containerRef.current) {
          containerRef.current.scrollTop += autoScrollSpeed * 0.5
        }
      }
      
      autoScrollRef.current = window.setInterval(scroll, 50)
    } else if (autoScrollRef.current) {
      window.clearInterval(autoScrollRef.current)
      autoScrollRef.current = null
    }
    
    return () => {
      if (autoScrollRef.current) {
        window.clearInterval(autoScrollRef.current)
      }
    }
  }, [isAutoScrolling, autoScrollSpeed])
  
  return (
    <div
      ref={containerRef}
      className={cn(
        "reader-scroll-container h-screen overflow-y-auto scroll-smooth",
        "px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16",
        theme === 'dark' && 'bg-gray-900',
        theme === 'reading' && 'bg-[#f4e8d0]'
      )}
      style={{
        fontSize: `${fontSize}px`,
        maxWidth: '800px',
        margin: '0 auto'
      }}
    >
      <div className="py-8 space-y-16">
        {loadedChapters.map((chapter, index) => (
          <ChapterContent
            key={chapter.id}
            chapter={chapter}
            fontSize={fontSize}
            theme={theme}
            isFirst={index === 0}
            isLast={index === loadedChapters.length - 1}
            isVisible={visibleChapters.has(chapter.id)}
          />
        ))}
        
        {/* Loading indicator for next chapter */}
        {loadingStates[allChapterIds[currentChapterIndex + 1]] && (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
            <span className="ml-2 text-muted-foreground">Loading next chapter...</span>
          </div>
        )}
        
        {/* End of novel indicator */}
        {currentChapterIndex === allChapterIds.length - 1 && 
         loadedChapters.length === allChapterIds.length && (
          <div className="text-center py-16 space-y-4">
            <h3 className="text-2xl font-semibold">End of Novel</h3>
            <p className="text-muted-foreground">You've reached the end. Thank you for reading!</p>
          </div>
        )}
      </div>
    </div>
  )
}