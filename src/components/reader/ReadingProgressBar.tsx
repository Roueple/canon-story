// src/components/reader/ReadingProgressBar.tsx
'use client'

import { useEffect, useState } from 'react'

export function ReadingProgressBar() {
  const [progress, setProgress] = useState(0)
  
  useEffect(() => {
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement
      if (scrollHeight <= clientHeight) {
        setProgress(100)
        return
      }
      const scrollPercentage = (scrollTop / (scrollHeight - clientHeight)) * 100
      setProgress(Math.min(100, Math.max(0, scrollPercentage)))
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
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