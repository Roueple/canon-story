// src/hooks/useReadingProgress.ts
'use client'
import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
// Removed: import { useDebounce } from './useDebounce';

// A simple debounce hook (re-added here)
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

  const debouncedProgress = useDebounce(progress, 1500); // Now uses the local useDebounce

  useEffect(() => {
    if (!currentChapterId) {
        setIsLoading(false);
        return;
    }
    if (!isSignedIn || !novelId || !user?.id) {
      setIsLoading(false);
      setProgress({ chapterId: currentChapterId, progressPercentage: 0, scrollPosition: 0 });
      return;
    }
    
    const fetchProgress = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/public/users/progress?novelId=${novelId}`);
        if (!response.ok) {
          if (response.status === 404) {
            setProgress({ chapterId: currentChapterId, progressPercentage: 0, scrollPosition: 0 });
          } else {
            const errorData = await response.json().catch(() => ({ error: 'Failed to fetch reading progress and parse error' }));
            throw new Error(errorData.error || 'Failed to fetch reading progress');
          }
        } else {
          const data = await response.json();
          if (data.success && data.data) {
            if (data.data.novelId === novelId) {
                 setProgress({
                    chapterId: data.data.chapterId,
                    progressPercentage: data.data.progressPercentage,
                    scrollPosition: data.data.scrollPosition,
                });
            } else {
                 setProgress({ chapterId: currentChapterId, progressPercentage: 0, scrollPosition: 0 });
            }
          } else {
             setProgress({ chapterId: currentChapterId, progressPercentage: 0, scrollPosition: 0 });
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setProgress({ chapterId: currentChapterId, progressPercentage: 0, scrollPosition: 0 });
        console.error("Error fetching progress:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProgress();
  }, [novelId, currentChapterId, isSignedIn, user?.id]);

  const saveProgress = useCallback(async (newProgressToSave: ReadingProgress) => {
    if (!isSignedIn || !novelId || !user?.id || !newProgressToSave) return; // Added null check for newProgressToSave
    try {
      await fetch('/api/public/users/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          novelId,
          chapterId: newProgressToSave.chapterId,
          progressPercentage: newProgressToSave.progressPercentage,
          scrollPosition: newProgressToSave.scrollPosition,
        }),
      });
    } catch (err) {
      console.error('Failed to save reading progress:', err);
    }
  }, [novelId, isSignedIn, user?.id]);
  
  useEffect(() => {
    // Ensure debouncedProgress is not null before trying to access its properties
    if (debouncedProgress && (debouncedProgress.progressPercentage > 0 || debouncedProgress.scrollPosition > 0)) {
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

  const loadedChapterId = isLoading ? null : progress?.chapterId;
  const applicableScrollPosition = isLoading ? 0 : (progress?.chapterId === currentChapterId ? (progress?.scrollPosition || 0) : 0);

  return {
    progress,
    initialChapterId: loadedChapterId,
    initialScrollPosition: applicableScrollPosition,
    updateCurrentChapterProgress,
    isLoadingProgress: isLoading,
    progressError: error,
  };
}