import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav className={cn('flex items-center space-x-1 text-sm', className)}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1

        return (
          <div key={index} className="flex items-center">
            {index > 0 && (
              <ChevronRight className="mx-1 h-4 w-4 text-secondary" />
            )}
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="text-secondary hover:text-foreground"
              >
                {item.label}
              </Link>
            ) : (
              <span className={cn(isLast ? 'text-foreground font-medium' : 'text-secondary')}>
                {item.label}
              </span>
            )}
          </div>
        )
      })}
    </nav>
  )
}
