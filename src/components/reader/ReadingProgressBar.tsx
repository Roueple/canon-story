// src/components/reader/ReadingProgressBar.tsx
'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

export function ReadingProgressBar() {
  const [progress, setProgress] = useState(0)
  
  useEffect(() => {
    const handleScroll = () => {
      const scrollContainer = document.querySelector('.reader-scroll-container')
      if (!scrollContainer) return
      
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer
      const scrollPercentage = (scrollTop / (scrollHeight - clientHeight)) * 100
      setProgress(Math.min(100, Math.max(0, scrollPercentage)))
    }
    
    const scrollContainer = document.querySelector('.reader-scroll-container')
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll, { passive: true })
      return () => scrollContainer.removeEventListener('scroll', handleScroll)
    }
  }, [])
  
  return (
    <div className="fixed top-0 left-0 right-0 h-1 bg-muted z-[60]">
      <div
        className="h-full bg-primary transition-all duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}