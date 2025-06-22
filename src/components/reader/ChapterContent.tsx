// src/components/reader/ChapterContent.tsx
'use client'

import { useRef, useEffect } from 'react'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useImageModal } from '@/hooks/useImageModal'

interface ChapterContentProps {
  chapter: {
    id: string
    title: string
    content: string
    chapterNumber: number | string // Can be number or string
    wordCount: number
  }
  fontSize: number
  theme: string
  isFirst?: boolean
  isLast?: boolean
  isVisible?: boolean
}

export function ChapterContent({ 
  chapter, 
  fontSize, 
  theme, 
  isFirst = false,
  isLast = false,
  isVisible = true
}: ChapterContentProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  useImageModal()

  // Safe number formatting
  const formatChapterNumber = (num: number | string): string => {
    // Handle if it's already a string
    if (typeof num === 'string') {
      const parsed = parseFloat(num);
      if (isNaN(parsed)) return num;
      num = parsed;
    }
    
    // Handle if it's a number
    if (typeof num === 'number') {
      return num % 1 === 0 ? num.toString() : num.toFixed(2).replace(/\.?0+$/, '');
    }
    
    // Fallback
    return String(num);
  }
  
  // Safe number display
  const safeWordCount = typeof chapter.wordCount === 'number' 
    ? chapter.wordCount 
    : parseInt(String(chapter.wordCount)) || 0;
  
  const calculateReadingTime = (words: number) => Math.ceil(words / 200);
  
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
            {calculateReadingTime(safeWordCount)} min read
          </span>
          <span>•</span>
          <span>{safeWordCount.toLocaleString()} words</span>
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