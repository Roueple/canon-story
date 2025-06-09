'use client'

import { type ReactNode, useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

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

  useEffect(() => {
    if (!isVisible || !triggerRef.current || !tooltipRef.current) return

    const trigger = triggerRef.current.getBoundingClientRect()
    const tooltip = tooltipRef.current.getBoundingClientRect()

    let top = 0
    let left = 0

    switch (position) {
      case 'top':
        top = trigger.top - tooltip.height - 8
        left = trigger.left + (trigger.width - tooltip.width) / 2
        break
      case 'bottom':
        top = trigger.bottom + 8
        left = trigger.left + (trigger.width - tooltip.width) / 2
        break
      case 'left':
        top = trigger.top + (trigger.height - tooltip.height) / 2
        left = trigger.left - tooltip.width - 8
        break
      case 'right':
        top = trigger.top + (trigger.height - tooltip.height) / 2
        left = trigger.right + 8
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
      {isVisible && (
        <div
          ref={tooltipRef}
          className={cn(
            'fixed z-50 px-2 py-1 text-sm rounded-md',
            'bg-gray-900 text-white',
            'pointer-events-none',
            className
          )}
          style={{
            top: {coords.top}px,
            left: {coords.left}px,
          }}
        >
          {content}
        </div>
      )}
    </>
  )
}
