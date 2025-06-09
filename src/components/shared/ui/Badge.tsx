import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error'
  size?: 'sm' | 'md'
  children: ReactNode
  className?: string
}

export function Badge({
  variant = 'default',
  size = 'md',
  children,
  className
}: BadgeProps) {
  const variants = {
    default: 'bg-muted text-foreground',
    primary: 'bg-primary/10 text-primary',
    secondary: 'bg-secondary/10 text-secondary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    error: 'bg-error/10 text-error',
  }

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  )
}
