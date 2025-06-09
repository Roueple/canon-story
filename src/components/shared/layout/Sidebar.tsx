'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarProps {
  children: React.ReactNode
  className?: string
  collapsible?: boolean
}

export function Sidebar({ children, className, collapsible = true }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        'relative flex h-full flex-col border-r border-border bg-card transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64',
        className
      )}
    >
      {collapsible && (
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-6 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card hover:bg-muted"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      )}
      <div className={cn('flex-1 overflow-y-auto', isCollapsed && 'px-2')}>
        {children}
      </div>
    </aside>
  )
}
