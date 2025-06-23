// src/components/reader/ChapterContent.tsx
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
    return num % 1 === 0 ? num.toString() : num.toFixed(2).replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1')
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
}