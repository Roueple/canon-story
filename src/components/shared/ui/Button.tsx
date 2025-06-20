// src/components/shared/ui/Button.tsx
'use client'

import { type ReactNode, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import { Slot } from '@radix-ui/react-slot'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  asChild?: boolean
  children: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className,
  disabled,
  children,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : 'button'

  const variants = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    outline: 'border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
    danger: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  }

  const sizes = {
    sm: 'h-9 rounded-md px-3',
    md: 'h-10 px-4 py-2',
    lg: 'h-11 rounded-md px-8',
  }

  if (asChild) {
    return (
      <Slot
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
          variants[variant],
          sizes[size],
          className
        )}
        // disabled prop might not be directly applicable to Slot's child (e.g. Link)
        // but we keep it for consistency if the child can handle it.
        // Or, we could omit it for Slot. For now, let's keep it.
        {...(disabled || isLoading ? { 'aria-disabled': true, disabled: true } : {})}
        {...props}
      >
        {/*
          When asChild is true, Slot expects a single React element child.
          We pass the children directly. The Loader icon needs to be part of the children
          passed *to* the Button component if it's to be used with asChild.
          However, for simplicity and common use cases, we'll render the loader
          conditionally only when not asChild. If a loader is needed with asChild,
          the consumer of Button will need to manage that.
        */}
        {children}
      </Slot>
    )
  }

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
}