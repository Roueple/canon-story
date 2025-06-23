// src/hooks/useIntersectionObserver.ts
import { useEffect, useRef } from 'react'

export function useIntersectionObserver(
  // FIX: Allow the ref's current value to be null initially
  targetRef: React.RefObject<Element | null>, 
  callback: IntersectionObserverCallback,
  options?: IntersectionObserverInit
) {
  const observerRef = useRef<IntersectionObserver | null>(null)
  
  useEffect(() => {
    // This check already handles the null case correctly at runtime.
    // The type signature now matches this logic.
    if (!targetRef.current) return 
    
    observerRef.current = new IntersectionObserver(callback, {
      root: null, // Observe against the viewport
      ...options
    })
    
    observerRef.current.observe(targetRef.current)
    
    const observer = observerRef.current; // Capture observer for cleanup
    return () => {
      observer?.disconnect()
    }
  }, [targetRef, callback, options])
}