// src/hooks/useIntersectionObserver.ts

import { useEffect, useRef } from 'react'

export function useIntersectionObserver(
  containerRef: React.RefObject<HTMLDivElement>, // Changed from HTMLElement to HTMLDivElement
  callback: (entries: IntersectionObserverEntry[]) => void,
  options?: IntersectionObserverInit
) {
  const observerRef = useRef<IntersectionObserver | null>(null)
  
  useEffect(() => {
    if (!containerRef.current) return
    
    // Create observer
    observerRef.current = new IntersectionObserver(callback, {
      root: containerRef.current,
      ...options
    })
    
    // Observe all chapter elements
    const chapters = containerRef.current.querySelectorAll('[data-chapter-id]')
    chapters.forEach(chapter => {
      observerRef.current?.observe(chapter)
    })
    
    return () => {
      observerRef.current?.disconnect()
    }
  }, [containerRef, callback, options])
  
  // Re-observe when new chapters are added
  useEffect(() => {
    if (!containerRef.current || !observerRef.current) return
    
    const observer = new MutationObserver(() => {
      const chapters = containerRef.current!.querySelectorAll('[data-chapter-id]')
      chapters.forEach(chapter => {
        if (!observerRef.current) return
        observerRef.current.unobserve(chapter)
        observerRef.current.observe(chapter)
      })
    })
    
    observer.observe(containerRef.current, {
      childList: true,
      subtree: true
    })
    
    return () => observer.disconnect()
  }, [containerRef])
}