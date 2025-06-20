// src/hooks/useBookmarks.ts
'use client'
import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import type { UserBookmarkData } from '@/types'; // Ensure this type is defined

export function useBookmarks(chapterId: string) {
  const { user, isSignedIn } = useUser();
  const [bookmarks, setBookmarks] = useState<UserBookmarkData[]>([]);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookmarks = useCallback(async () => {
    if (!isSignedIn || !chapterId || !user?.id) {
      setIsLoading(false);
      setIsBookmarked(false);
      setBookmarks([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/public/users/bookmarks?chapterId=${chapterId}`);
      if (!response.ok) throw new Error('Failed to fetch bookmarks');
      const data = await response.json();
      if (data.success) {
        setBookmarks(data.data);
        // Check if current chapter is bookmarked (assuming chapter-level bookmarks for now)
        setIsBookmarked(data.data.some((b: UserBookmarkData) => b.chapterId === chapterId));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [chapterId, isSignedIn, user?.id]);

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  const toggleBookmark = useCallback(async () => {
    if (!isSignedIn || !chapterId || !user?.id) return;
    setError(null);
    const currentlyBookmarked = bookmarks.find(b => b.chapterId === chapterId);

    try {
      if (currentlyBookmarked) {
        // Delete bookmark
        const response = await fetch(`/api/public/users/bookmarks/${currentlyBookmarked.id}`, {
          method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to remove bookmark');
        setBookmarks(prev => prev.filter(b => b.id !== currentlyBookmarked.id));
        setIsBookmarked(false);
      } else {
        // Add bookmark (chapter-level)
        const response = await fetch('/api/public/users/bookmarks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chapterId, note: 'Bookmarked chapter' }), // Position can be 0 for chapter-level
        });
        if (!response.ok) throw new Error('Failed to add bookmark');
        const data = await response.json();
        if (data.success) {
          setBookmarks(prev => [...prev, data.data]);
          setIsBookmarked(true);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      // Revert UI state on error if needed
      fetchBookmarks(); // Re-fetch to ensure consistency
    }
  }, [isSignedIn, chapterId, user?.id, bookmarks, fetchBookmarks]);

  return {
    isBookmarked,
    toggleBookmark,
    isLoadingBookmarks: isLoading,
    bookmarkError: error,
  };
}