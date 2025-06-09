'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface NavItem {
  href: string
  label: string
  icon?: React.ReactNode
}

interface NavigationProps {
  items: NavItem[]
  className?: string
}

export function Navigation({ items, className }: NavigationProps) {
  const pathname = usePathname()

  return (
    <nav className={cn('space-y-1', className)}>
      {items.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-white'
                : 'text-secondary hover:bg-muted hover:text-foreground'
            )}
          >
            {item.icon && <span className="h-5 w-5">{item.icon}</span>}
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
