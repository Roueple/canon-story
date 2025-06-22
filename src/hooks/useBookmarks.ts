// src/hooks/useBookmarks.ts
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@clerk/nextjs'

interface Bookmark {
  id: string
  userId: string
  novelId: string
  chapterId: string
  position?: number
  note?: string
  createdAt: Date
}

export function useBookmarks(novelId?: string) {
  const { isSignedIn, userId } = useAuth()
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch bookmarks
  useEffect(() => {
    if (!isSignedIn || !userId) {
      setBookmarks([])
      return
    }

    const fetchBookmarks = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        const url = novelId 
          ? `/api/public/users/bookmarks?novelId=${novelId}`
          : '/api/public/users/bookmarks'
          
        const response = await fetch(url)
        
        if (!response.ok) {
          throw new Error('Failed to fetch bookmarks')
        }
        
        const data = await response.json()
        setBookmarks(data.data || [])
      } catch (err) {
        console.error('Error fetching bookmarks:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch bookmarks')
        setBookmarks([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchBookmarks()
  }, [isSignedIn, userId, novelId])

  // Check if a chapter is bookmarked
  const isBookmarked = useCallback((chapterId: string): boolean => {
    return bookmarks.some(bookmark => bookmark.chapterId === chapterId)
  }, [bookmarks])

  // Toggle bookmark
  const toggleBookmark = useCallback(async (chapterId: string, position?: number, note?: string) => {
    if (!isSignedIn || !userId || !novelId) {
      console.warn('Cannot bookmark: User not signed in or missing data')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const existingBookmark = bookmarks.find(b => b.chapterId === chapterId)
      
      if (existingBookmark) {
        // Remove bookmark
        const response = await fetch(`/api/public/users/bookmarks/${existingBookmark.id}`, {
          method: 'DELETE'
        })
        
        if (!response.ok) {
          throw new Error('Failed to remove bookmark')
        }
        
        setBookmarks(prev => prev.filter(b => b.id !== existingBookmark.id))
      } else {
        // Add bookmark
        const response = await fetch('/api/public/users/bookmarks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            novelId,
            chapterId,
            position,
            note
          })
        })
        
        if (!response.ok) {
          throw new Error('Failed to add bookmark')
        }
        
        const data = await response.json()
        setBookmarks(prev => [...prev, data.data])
      }
    } catch (err) {
      console.error('Error toggling bookmark:', err)
      setError(err instanceof Error ? err.message : 'Failed to toggle bookmark')
    } finally {
      setIsLoading(false)
    }
  }, [isSignedIn, userId, novelId, bookmarks])

  // Add bookmark
  const addBookmark = useCallback(async (chapterId: string, position?: number, note?: string) => {
    if (!isBookmarked(chapterId)) {
      await toggleBookmark(chapterId, position, note)
    }
  }, [isBookmarked, toggleBookmark])

  // Remove bookmark
  const removeBookmark = useCallback(async (chapterId: string) => {
    if (isBookmarked(chapterId)) {
      await toggleBookmark(chapterId)
    }
  }, [isBookmarked, toggleBookmark])

  return {
    bookmarks,
    isLoading,
    error,
    isBookmarked,
    toggleBookmark,
    addBookmark,
    removeBookmark
  }
}