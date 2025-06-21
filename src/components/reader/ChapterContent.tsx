// src/components/reader/ChapterContent.tsx
'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Clock } from 'lucide-react'
import { calculateReadingTime } from '@/lib/utils'

interface ChapterContentProps {
  chapter: {
    id: string
    title: string
    content: string
    chapterNumber: any
    wordCount: number
  }
  fontSize: number
  theme: string
  isFirst: boolean
  isLast: boolean
  isVisible: boolean
}

export function ChapterContent({
  chapter,
  fontSize,
  theme,
  isFirst,
  isLast,
  isVisible
}: ChapterContentProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  
  // Apply dynamic styles when component mounts or updates
  useEffect(() => {
    if (contentRef.current) {
      // Apply font size to all text elements
      const style = contentRef.current.style
      style.setProperty('--reader-font-size', `${fontSize}px`)
    }
  }, [fontSize])
  
  // Format chapter number
  const formatChapterNumber = (num: any): string => {
    const numStr = num?.toString() || '0'
    const parsed = parseFloat(numStr)
    return parsed % 1 === 0 ? parsed.toString() : parsed.toFixed(2).replace(/\.?0+$/, '')
  }
  
  return (
    <article
      data-chapter-id={chapter.id}
      className={cn(
        "chapter-content-wrapper scroll-mt-20",
        "animate-in fade-in duration-500",
        !isFirst && "border-t-2 border-border pt-16",
        isVisible && "chapter-visible"
      )}
    >
      {/* Chapter Header */}
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
      
      {/* Chapter Content */}
      <div
        ref={contentRef}
        className={cn(
          "chapter-text-content",
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
      
      {/* Chapter Footer */}
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