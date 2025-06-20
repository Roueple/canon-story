// src/app/(public)/novels/[novelId]/chapters/[chapterId]/page.tsx
'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // For navigation
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

// Client-side data fetching function
async function fetchChapterPageData(novelId: string, chapterId: string): Promise<ChapterPageData | null> {
  try {
    // OPTION 1: Ideal - A single API endpoint that provides current chapter and prev/next IDs
    // const res = await fetch(`/api/public/chapters/${chapterId}/details?novelId=${novelId}`);
    // if (!res.ok) throw new Error('Failed to fetch chapter details');
    // const data = await res.json();
    // if (data.success) return data.data;
    // return null;

    // OPTION 2: Fallback - Multiple API calls (less performant, adapt as needed)
    const chapterRes = await fetch(`/api/public/chapters/${chapterId}`);
    if (!chapterRes.ok) throw new Error('Chapter not found');
    const chapterData = await chapterRes.json();
    if (!chapterData.success) throw new Error(chapterData.error || 'Failed to load chapter');
    
    const currentChapterFromApi = chapterData.data as ChapterWithNovel; // Assuming API returns novel nested

    // Fetch novel details if not included in chapter API (current API does include it)
    // const novelRes = await fetch(`/api/public/novels/${novelId}`);
    // if (!novelRes.ok) throw new Error('Novel not found');
    // const novelData = await novelRes.json();
    // if (!novelData.success) throw new Error(novelData.error || 'Failed to load novel');
    // const novelInfo = novelData.data as Pick<Novel, 'id' | 'title' | 'slug'>;

    // Fetch all chapters for the novel to determine prev/next (can be slow for many chapters)
    const allChaptersRes = await fetch(`/api/public/novels/${novelId}/chapters?limit=1000`); // Adjust limit
    if (!allChaptersRes.ok) throw new Error('Failed to fetch chapter list for navigation');
    const allChaptersData = await allChaptersRes.json();
    if (!allChaptersData.success) throw new Error(allChaptersData.error || 'Failed to load chapter list');
    
    const chaptersList: { id: string, chapterNumber: number | string }[] = allChaptersData.data.map((ch: any) => ({
        id: ch.id,
        chapterNumber: parseFloat(String(ch.chapterNumber)) // Ensure chapterNumber is numeric for sorting
    })).sort((a:any, b:any) => a.chapterNumber - b.chapterNumber);

    const currentIndex = chaptersList.findIndex(ch => ch.id === chapterId);
    const prevChapterId = currentIndex > 0 ? chaptersList[currentIndex - 1].id : null;
    const nextChapterId = currentIndex < chaptersList.length - 1 ? chaptersList[currentIndex + 1].id : null;
    
    return {
      currentChapter: currentChapterFromApi, // Use the novel info from the chapter API
      prevChapterId,
      nextChapterId,
    };

  } catch (error) {
    console.error("Failed to fetch chapter data:", error);
    return null;
  }
}


export default function ChapterReadingPage({ params }: { params: { novelId: string, chapterId: string } }) {
  const router = useRouter();
  const [pageData, setPageData] = useState<ChapterPageData | null>(null);
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [errorPage, setErrorPage] = useState<string | null>(null);

  const contentRef = useRef<HTMLDivElement>(null);
  const autoScrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);

  const { fontSize, autoScrollSpeed, isSettingsReady } = useReadingSettings();
  const { 
    progress, 
    updateCurrentChapterProgress, 
    initialChapterId, 
    initialScrollPosition, 
    isLoadingProgress 
  } = useReadingProgress(params.novelId, params.chapterId);
  const { isBookmarked, toggleBookmark, isLoadingBookmarks } = useBookmarks(params.chapterId);

  useEffect(() => {
    async function loadData() {
      setIsLoadingPage(true);
      setErrorPage(null);
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

  useEffect(() => {
    const contentEl = contentRef.current;
    if (!contentEl || isLoadingProgress || !pageData || !isSettingsReady) return;

    if (initialChapterId === params.chapterId && initialScrollPosition > 0) {
      setTimeout(() => {
        if (contentRef.current) contentRef.current.scrollTop = initialScrollPosition;
      }, 100);
    }
    
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
  }, [contentRef, updateCurrentChapterProgress, isLoadingProgress, initialChapterId, initialScrollPosition, params.chapterId, pageData, isSettingsReady]);

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

  const toggleAutoScroll = () => setIsAutoScrolling(prev => !prev);

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


  if (isLoadingPage || !isSettingsReady) {
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
      <ReadingProgressBar currentProgress={progress?.progressPercentage || 0} className="fixed top-0 left-0 right-0 z-[60] h-1" /> {/* Increased z-index */}
      
      <div className="max-w-4xl mx-auto px-4 pt-8 pb-24 sm:pt-12 sm:pb-32 w-full flex-grow">
        <Breadcrumbs items={breadcrumbItems} className="mb-6" />

        <article ref={contentRef} className="overflow-y-auto chapter-content-area" style={{ maxHeight: 'calc(100vh - 220px)', fontSize: `${fontSize}px` }}> {/* Added class and applied font size here */}
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
            className="prose prose-lg dark:prose-invert max-w-none leading-relaxed" // Prose handles its own font sizing relative to parent
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