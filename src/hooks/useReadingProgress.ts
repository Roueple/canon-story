// src/hooks/useReadingProgress.ts
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@clerk/nextjs'
import { debounce } from 'lodash'

interface ReadingProgress {
  novelId: string
  chapterId: string
  progressPercentage: number
  scrollPosition: number
  lastReadAt: Date
}

export function useReadingProgress(novelId?: string) {
  const { isSignedIn, userId } = useAuth()
  const [progress, setProgress] = useState<ReadingProgress | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isSignedIn || !userId || !novelId) {
      setProgress(null)
      return
    }

    const fetchProgress = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/public/users/progress?novelId=${novelId}`)
        if (!response.ok) throw new Error('Failed to fetch reading progress')
        const data = await response.json()
        setProgress(data.data || null)
      } catch (err) {
        console.error('Error fetching reading progress:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch progress')
      } finally {
        setIsLoading(false)
      }
    }
    fetchProgress()
  }, [isSignedIn, userId, novelId])

  const updateProgressDebounced = useCallback(
    debounce(async (chapterId: string, percentage: number, scrollPos?: number) => {
      if (!isSignedIn || !userId || !novelId) return

      try {
        const response = await fetch('/api/public/users/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            novelId,
            chapterId,
            progressPercentage: Math.round(percentage),
            scrollPosition: scrollPos || 0
          })
        })

        if (!response.ok) throw new Error('Failed to update reading progress')
        
        const data = await response.json()
        setProgress(data.data) // Update local state with response from server
      } catch (err) {
        console.error('Error updating reading progress:', err)
        setError(err instanceof Error ? err.message : 'Failed to update progress')
      }
    }, 1000),
    [isSignedIn, userId, novelId]
  )

  const updateProgress = useCallback((chapterId: string, percentage: number, scrollPos?: number) => {
    updateProgressDebounced(chapterId, percentage, scrollPos)
  }, [updateProgressDebounced])

  return { progress, isLoading, error, updateProgress }
}