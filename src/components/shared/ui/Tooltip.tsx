'use client'

import { type ReactNode, useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { createPortal } from 'react-dom'

interface TooltipProps {
  content: ReactNode
  children: ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
}

export function Tooltip({
  content,
  children,
  position = 'top',
  className
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isVisible || !triggerRef.current || !tooltipRef.current) return

    const trigger = triggerRef.current.getBoundingClientRect()
    const tooltip = tooltipRef.current.getBoundingClientRect()

    let top = 0
    let left = 0

    // Add scroll position to calculate absolute coordinates
    const scrollX = window.scrollX
    const scrollY = window.scrollY

    switch (position) {
      case 'top':
        top = trigger.top + scrollY - tooltip.height - 8
        left = trigger.left + scrollX + (trigger.width - tooltip.width) / 2
        break
      case 'bottom':
        top = trigger.bottom + scrollY + 8
        left = trigger.left + scrollX + (trigger.width - tooltip.width) / 2
        break
      case 'left':
        top = trigger.top + scrollY + (trigger.height - tooltip.height) / 2
        left = trigger.left + scrollX - tooltip.width - 8
        break
      case 'right':
        top = trigger.top + scrollY + (trigger.height - tooltip.height) / 2
        left = trigger.right + scrollX + 8
        break
    }

    setCoords({ top, left })
  }, [isVisible, position])

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="inline-block"
      >
        {children}
      </div>
      {isMounted && isVisible && createPortal(
        <div
          ref={tooltipRef}
          className={cn(
            'fixed z-50 px-2 py-1 text-sm rounded-md',
            'bg-gray-900 text-white',
            'pointer-events-none',
            'transition-opacity duration-200',
            isVisible ? 'opacity-100' : 'opacity-0', // Added for smooth fade
            className
          )}
          // --- THESE ARE THE CORRECTED LINES ---
          style={{
            top: `${coords.top}px`,
            left: `${coords.left}px`,
          }}
        >
          {content}
        </div>,
        document.body // Render the tooltip in the body
      )}
    </>
  )
}