// src/app/(public)/novels/[novelId]/chapters/[chapterId]/page.tsx
'use client';

import { useEffect, useState, useRef, useCallback, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Home, Book, Loader2 } from 'lucide-react';
import { Button } from '@/components/shared/ui/Button';
import { Breadcrumbs, type BreadcrumbItem } from '@/components/shared/layout/Breadcrumbs';
import { ReadingControls } from '@/components/reader/ReadingControls';
import { ReadingProgressBar } from '@/components/reader/ReadingProgressBar';
import { BookmarkButton } from '@/components/reader/BookmarkButton';
import { useReadingSettings } from '@/hooks/useReadingSettings';
import { useReadingProgress } from '@/hooks/useReadingProgress';
import { useBookmarks } from '@/hooks/useBookmarks';
import { formatChapterNumber, calculateReadingTime } from '@/lib/utils';
import type { Chapter, Novel } from '@prisma/client';

interface ChapterWithNovel extends Chapter {
  novel: Pick<Novel, 'id' | 'title' | 'slug'>;
}

interface ChapterPageData {
  currentChapter: ChapterWithNovel;
  prevChapterId: string | null;
  nextChapterId: string | null;
}

async function fetchChapterPageData(novelId: string, chapterId: string): Promise<ChapterPageData | null> {
  try {
    const chapterRes = await fetch(`/api/public/chapters/${chapterId}/details?novelId=${novelId}`);
    if (!chapterRes.ok) {
      const errorData = await chapterRes.json().catch(() => ({ error: 'Failed to fetch chapter details and parse error' }));
      console.error("API Error fetching chapter details:", chapterRes.status, errorData.error);
      throw new Error(errorData.error || `Failed to fetch chapter details (status: ${chapterRes.status})`);
    }
    const data = await chapterRes.json();
    if (data.success) return data.data;
    console.error("API call to fetchChapterPageData was not successful:", data.error);
    return null;
  } catch (error) {
    console.error("Failed to fetch chapter data:", error);
    return null;
  }
}

export default function ChapterReadingPage({ params: paramsPromise }: { params: Promise<{ novelId: string, chapterId: string }> }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const [pageData, setPageData] = useState<ChapterPageData | null>(null);
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [errorPage, setErrorPage] = useState<string | null>(null);

  const contentRef = useRef<HTMLDivElement>(null);
  const autoScrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [initialScrollApplied, setInitialScrollApplied] = useState(false); // Flag for initial scroll

  const { fontSize, autoScrollSpeed, isSettingsReady } = useReadingSettings();
  
  const { 
    progress: currentReadingProgress, // Renamed to avoid confusion with progress bar's 'progress' prop
    updateCurrentChapterProgress, 
    initialChapterId, // This is the chapterId from the *loaded* progress
    initialScrollPosition, // This is the scrollPos if loaded progress is for *current* chapter
    isLoadingProgress 
  } = useReadingProgress(params.novelId, params.chapterId);
  const { isBookmarked, toggleBookmark, isLoadingBookmarks } = useBookmarks(params.chapterId);

  useEffect(() => {
    async function loadData() {
      if (!params.novelId || !params.chapterId) {
        setErrorPage("Novel or Chapter ID is missing.");
        setIsLoadingPage(false);
        return;
      }
      setIsLoadingPage(true);
      setErrorPage(null);
      setInitialScrollApplied(false); // Reset flag when new chapter data is being loaded
      const data = await fetchChapterPageData(params.novelId, params.chapterId);
      if (data) {
        setPageData(data);
      } else {
        setErrorPage("Failed to load chapter content or chapter not found.");
      }
      setIsLoadingPage(false);
    }
    loadData();
  }, [params.novelId, params.chapterId]);

  // Effect for applying initial scroll position
  useEffect(() => {
    const contentEl = contentRef.current;
    if (!contentEl || isLoadingProgress || !pageData || !isSettingsReady || initialScrollApplied) {
      return;
    }

    // Only apply if the loaded progress (initialChapterId) is for the current chapter (params.chapterId)
    // and initialScrollPosition is meaningful (greater than 0)
    if (initialChapterId === params.chapterId && initialScrollPosition > 0) {
      console.log(`Applying initial scroll: ${initialScrollPosition} for chapter ${params.chapterId}`);
      contentEl.scrollTop = initialScrollPosition;
      setInitialScrollApplied(true);
    } else if (initialChapterId !== params.chapterId && contentEl.scrollTop !== 0) {
      // If loaded progress is for a different chapter, or no progress, scroll to top for current chapter
      console.log(`No specific progress for ${params.chapterId} or different chapter's progress loaded. Scrolling to top.`);
      contentEl.scrollTop = 0;
      setInitialScrollApplied(true); // Mark as "applied" even if it's just to scroll to top
    } else if (initialScrollPosition === 0) {
      // If scroll position is 0, consider it applied
      setInitialScrollApplied(true);
    }
  }, [
    contentRef, 
    isLoadingProgress, 
    pageData, 
    isSettingsReady, 
    initialScrollApplied, 
    initialChapterId, 
    initialScrollPosition, 
    params.chapterId
  ]);

  // Effect for handling scroll events
  useEffect(() => {
    const contentEl = contentRef.current;
    if (!contentEl || !pageData) return; // Ensure pageData is loaded

    const handleScroll = () => {
      if (!contentRef.current) return;
      const scrollTop = contentRef.current.scrollTop;
      const scrollHeight = contentRef.current.scrollHeight - contentRef.current.clientHeight;
      const currentProgressVal = scrollHeight > 0 ? Math.min(100, Math.round((scrollTop / scrollHeight) * 100)) : (contentRef.current.scrollHeight > 0 ? 100 : 0);
      updateCurrentChapterProgress(scrollTop, currentProgressVal);
    };

    contentEl.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
        if (contentEl) contentEl.removeEventListener('scroll', handleScroll);
    };
  }, [contentRef, pageData, updateCurrentChapterProgress]); // Dependencies: only what's needed for listening

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

  const toggleAutoScroll = useCallback(() => {
    setIsAutoScrolling(prev => !prev);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft' && pageData?.prevChapterId) {
        router.push(`/novels/${params.novelId}/chapters/${pageData.prevChapterId}`);
      } else if (event.key === 'ArrowRight' && pageData?.nextChapterId) {
        router.push(`/novels/${params.novelId}/chapters/${pageData.nextChapterId}`);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pageData, params.novelId, router]);


  if (isLoadingPage || !isSettingsReady || !params.novelId || !params.chapterId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (errorPage || !pageData) {
    return <div className="text-center py-10 text-error bg-background min-h-screen">{errorPage || "Chapter not found."}</div>;
  }

  const { currentChapter, prevChapterId, nextChapterId } = pageData;
  const estimatedReadTime = calculateReadingTime(currentChapter.wordCount);

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Home', href: '/' },
    { label: 'Novels', href: '/novels' },
    { label: currentChapter.novel.title, href: `/novels/${currentChapter.novel.id}` },
    { label: `Chapter ${formatChapterNumber(Number(currentChapter.chapterNumber))}` }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <ReadingProgressBar currentProgress={currentReadingProgress?.progressPercentage || 0} className="fixed top-0 left-0 right-0 z-[60] h-1" />
      
      <div className="max-w-4xl mx-auto px-4 pt-8 pb-24 sm:pt-12 sm:pb-32 w-full flex-grow">
        <Breadcrumbs items={breadcrumbItems} className="mb-6" />

        <article ref={contentRef} className="overflow-y-auto chapter-content-area" style={{ maxHeight: 'calc(100vh - 220px)', fontSize: `${fontSize}px` }}>
          <header className="mb-8 text-center">
            <h1 className="text-3xl sm:text-4xl font-extrabold mb-2">
              {currentChapter.title}
            </h1>
            <div className="text-sm text-secondary space-x-2">
              <span>Chapter {formatChapterNumber(Number(currentChapter.chapterNumber))}</span>
              <span>•</span>
              <span>~{estimatedReadTime} min read</span>
              <span>•</span>
              <span>{currentChapter.wordCount.toLocaleString()} words</span>
            </div>
          </header>

          <div
            className="prose prose-lg dark:prose-invert max-w-none leading-relaxed"
            dangerouslySetInnerHTML={{ __html: currentChapter.content }}
          />
        </article>

        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
          {prevChapterId ? (
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href={`/novels/${params.novelId}/chapters/${prevChapterId}`}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Previous
              </Link>
            </Button>
          ) : <div className="w-full sm:w-auto" />}
          
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <Button asChild variant="ghost" className="w-full sm:w-auto">
              <Link href={`/novels/${params.novelId}`}>
                <Book className="h-4 w-4 mr-2" /> All Chapters
              </Link>
            </Button>
            <BookmarkButton 
              isBookmarked={isBookmarked} 
              onToggleBookmark={toggleBookmark} 
              isLoading={isLoadingBookmarks}
              className="w-full sm:w-auto"
            />
          </div>

          {nextChapterId ? (
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href={`/novels/${params.novelId}/chapters/${nextChapterId}`}>
                Next <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          ) : <div className="w-full sm:w-auto" />}
        </div>
      </div>
      
      <ReadingControls onToggleAutoScroll={toggleAutoScroll} isAutoScrolling={isAutoScrolling} />
    </div>
  );
}