// src/hooks/useReadingProgress.ts
'use client'
import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { useDebounce } from './useDebounce'; // Assuming you'll create this or have one

// A simple debounce hook (create this file or use a library)
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}


export interface ReadingProgress {
  chapterId: string;
  progressPercentage: number;
  scrollPosition: number;
}

export function useReadingProgress(novelId: string, currentChapterId: string) {
  const { user, isSignedIn } = useUser();
  const [progress, setProgress] = useState<ReadingProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const debouncedProgress = useDebounce(progress, 1500); // Debounce updates by 1.5 seconds

  // Fetch initial progress
  useEffect(() => {
    if (!isSignedIn || !novelId || !user?.id) {
      setIsLoading(false);
      return;
    }
    
    const fetchProgress = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/public/users/progress?novelId=${novelId}`);
        if (!response.ok) {
          if (response.status === 404) { // No progress found is not an error
            setProgress({ chapterId: currentChapterId, progressPercentage: 0, scrollPosition: 0 });
          } else {
            throw new Error('Failed to fetch reading progress');
          }
        } else {
          const data = await response.json();
          if (data.success && data.data) {
            setProgress({
              chapterId: data.data.chapterId,
              progressPercentage: data.data.progressPercentage,
              scrollPosition: data.data.scrollPosition,
            });
          } else {
             setProgress({ chapterId: currentChapterId, progressPercentage: 0, scrollPosition: 0 });
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        console.error("Error fetching progress:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProgress();
  }, [novelId, isSignedIn, user?.id, currentChapterId]);

  // Save progress
  const saveProgress = useCallback(async (newProgress: ReadingProgress) => {
    if (!isSignedIn || !novelId || !user?.id) return;
    try {
      await fetch('/api/public/users/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          novelId,
          chapterId: newProgress.chapterId,
          progressPercentage: newProgress.progressPercentage,
          scrollPosition: newProgress.scrollPosition,
        }),
      });
    } catch (err) {
      console.error('Failed to save reading progress:', err);
      // Optionally set an error state here for UI feedback
    }
  }, [novelId, isSignedIn, user?.id]);
  
  useEffect(() => {
    if (debouncedProgress && debouncedProgress.progressPercentage > 0) { // Only save if there's actual progress
      saveProgress(debouncedProgress);
    }
  }, [debouncedProgress, saveProgress]);

  const updateCurrentChapterProgress = useCallback((scrollPos: number, percentage: number) => {
    setProgress({
      chapterId: currentChapterId,
      scrollPosition: scrollPos,
      progressPercentage: percentage,
    });
  }, [currentChapterId]);

  return {
    progress, // This is the live progress object for the current chapter
    initialChapterId: isLoading ? null : (progress?.chapterId || currentChapterId),
    initialScrollPosition: isLoading ? 0 : (progress?.scrollPosition || 0),
    updateCurrentChapterProgress,
    isLoadingProgress: isLoading,
    progressError: error,
  };
}