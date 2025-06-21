// src/hooks/useReadingProgress.ts
'use client'

import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'

interface ReadingProgress {
  novelId: string
  chapterId: string
  progress: number
  lastRead: Date
}

export function useReadingProgress() {
  const { isSignedIn } = useAuth()
  const [progressMap, setProgressMap] = useState<Map<string, ReadingProgress>>(new Map())
  
  // Load saved progress from localStorage
  useEffect(() => {
    if (!isSignedIn) return
    
    const saved = localStorage.getItem('reading-progress')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        const map = new Map<string, ReadingProgress>()
        Object.entries(parsed).forEach(([key, value]) => {
          if (value && typeof value === 'object' && 'novelId' in value) {
            map.set(key, value as ReadingProgress)
          }
        })
        setProgressMap(map)
      } catch (error) {
        console.error('Error loading reading progress:', error)
      }
    }
  }, [isSignedIn])
  
  // Update progress
  const updateProgress = useCallback((novelId: string, chapterId: string, progress: number) => {
    const newProgress: ReadingProgress = {
      novelId,
      chapterId,
      progress,
      lastRead: new Date()
    }
    
    setProgressMap(prev => {
      const newMap = new Map(prev)
      newMap.set(`${novelId}-${chapterId}`, newProgress)
      
      // Save to localStorage
      const toSave = Object.fromEntries(newMap)
      localStorage.setItem('reading-progress', JSON.stringify(toSave))
      
      return newMap
    })
    
    // Save to server (simplified without debounce for now)
    if (isSignedIn) {
      fetch('/api/public/users/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          novelId,
          chapterId,
          progressPercentage: progress,
          scrollPosition: 0
        })
      }).catch(console.error)
    }
  }, [isSignedIn])
  
  // Get progress for a specific chapter
  const getProgress = useCallback((novelId: string, chapterId: string): number => {
    const progress = progressMap.get(`${novelId}-${chapterId}`)
    return progress?.progress || 0
  }, [progressMap])
  
  // Get last read chapter for a novel - SIMPLIFIED VERSION
  const getLastReadChapter = useCallback((novelId: string): string | null => {
    const entries = Array.from(progressMap.values())
    const novelProgress = entries.filter(p => p.novelId === novelId)
    
    if (novelProgress.length === 0) return null
    
    const sorted = novelProgress.sort((a, b) => {
      return new Date(b.lastRead).getTime() - new Date(a.lastRead).getTime()
    })
    
    return sorted[0].chapterId
  }, [progressMap])
  
  return {
    updateProgress,
    getProgress,
    getLastReadChapter
  }
}