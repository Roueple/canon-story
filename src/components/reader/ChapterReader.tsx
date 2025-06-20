// src/components/reader/ChapterReader.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react'; // Added useState, useRef, useEffect
import { ReadingControls } from './ReadingControls'; // Assuming path is correct
import { ReadingProgressBar } from './ReadingProgressBar';
import { BookmarkButton } from './BookmarkButton';
import { useReadingSettings } from '@/hooks/useReadingSettings';
// You might also want to integrate useReadingProgress and useBookmarks here
// if this component is meant to be a self-contained reader.
// For now, focusing on fixing the ReadingControls props.

interface ChapterReaderProps {
  title: string;
  contentHtml: string;
  chapterNumber: string | number;
  wordCount: number;
  estimatedReadTime: number;
  // Add other props this component needs, e.g., for bookmarks, progress
  // For demonstration, let's assume these are passed or handled internally
  isBookmarkedInitially?: boolean;
  onToggleBookmark?: () => void;
  isLoadingBookmark?: boolean;
}

export function ChapterReader({
  title,
  contentHtml,
  chapterNumber,
  wordCount,
  estimatedReadTime,
  isBookmarkedInitially = false, // Example prop
  onToggleBookmark = () => console.warn("onToggleBookmark not implemented"), // Example prop
  isLoadingBookmark = false, // Example prop
}: ChapterReaderProps) {
  const { fontSize, autoScrollSpeed, isSettingsReady } = useReadingSettings();
  const contentRef = useRef<HTMLDivElement>(null);
  const autoScrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // State for ReadingControls
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(0); // Example progress state

  const handleToggleAutoScroll = () => {
    setIsAutoScrolling(prev => !prev);
  };

  // Auto-scroll logic (simplified from page.tsx)
  useEffect(() => {
    if (isAutoScrolling && contentRef.current) {
      autoScrollIntervalRef.current = setInterval(() => {
        if (contentRef.current) {
          contentRef.current.scrollBy({ top: autoScrollSpeed, behavior: 'smooth' });
          if (contentRef.current.scrollTop + contentRef.current.clientHeight >= contentRef.current.scrollHeight - 5) {
            setIsAutoScrolling(false);
          }
        }
      }, 100);
    } else if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
      autoScrollIntervalRef.current = null;
    }
    return () => {
      if (autoScrollIntervalRef.current) clearInterval(autoScrollIntervalRef.current);
    };
  }, [isAutoScrolling, autoScrollSpeed]);

  // Scroll progress logic (simplified)
  useEffect(() => {
    const contentEl = contentRef.current;
    if (!contentEl) return;

    const handleScroll = () => {
      const scrollTop = contentEl.scrollTop;
      const scrollHeight = contentEl.scrollHeight - contentEl.clientHeight;
      const progress = scrollHeight > 0 ? Math.min(100, Math.round((scrollTop / scrollHeight) * 100)) : (contentEl.scrollHeight > 0 ? 100 : 0);
      setCurrentProgress(progress);
      // Here you would call your useReadingProgress hook's update function
    };

    contentEl.addEventListener('scroll', handleScroll, { passive: true });
    return () => contentEl.removeEventListener('scroll', handleScroll);
  }, [contentRef]);


  if (!isSettingsReady) {
    return <div>Loading settings...</div>; // Or a spinner
  }

  return (
    <div className="flex flex-col min-h-screen">
      <ReadingProgressBar currentProgress={currentProgress} className="fixed top-0 left-0 right-0 z-50 h-1" />
      
      <div className="max-w-4xl mx-auto px-4 pt-8 pb-24 sm:pt-12 sm:pb-32 w-full flex-grow">
        <article ref={contentRef} className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          <header className="mb-8 text-center">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-2">
              {title}
            </h1>
            <div className="text-sm text-secondary space-x-2">
              <span>Chapter {chapterNumber}</span>
              <span>•</span>
              <span>~{estimatedReadTime} min read</span>
              <span>•</span>
              <span>{wordCount.toLocaleString()} words</span>
            </div>
          </header>
          <div
            className="prose prose-lg dark:prose-invert max-w-none text-foreground leading-relaxed"
            style={{ fontSize: `${fontSize}px` }}
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />
        </article>
        <div className="mt-4 flex justify-end">
            <BookmarkButton
                isBookmarked={isBookmarkedInitially}
                onToggleBookmark={onToggleBookmark}
                isLoading={isLoadingBookmark}
            />
        </div>
      </div>
      
      {/* Correctly passing props to ReadingControls */}
      <ReadingControls 
        onToggleAutoScroll={handleToggleAutoScroll} 
        isAutoScrolling={isAutoScrolling} 
      />
    </div>
  );
}