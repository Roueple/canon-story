// src/components/shared/ui/Select.tsx
import { cn } from '@/lib/utils'
import * as React from 'react'

const Select = React.forwardRef<
  HTMLSelectElement,
  React.HTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
        'w-full px-3 py-2 bg-background border border-border text-foreground rounded-md focus:ring-2 focus:ring-primary focus:border-transparent',
        className
    )}
    {...props}
  >
    {children}
  </select>
))
Select.displayName = 'Select'

const SelectTrigger = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement>
>(({className, children, ...props}, ref) => (
    // This is a placeholder for styling. We will use the native select element.
    // In a real scenario, this would be part of a Radix Select implementation.
    <div className={className}>{children}</div>
))
SelectTrigger.displayName = 'SelectTrigger'

const SelectValue = React.forwardRef<
    HTMLSpanElement,
    React.HTMLAttributes<HTMLSpanElement>
>(({className, children, ...props}, ref) => (
    <span ref={ref} className={className} {...props}>{children || 'Select...'}</span>
))
SelectValue.displayName = 'SelectValue'


const SelectContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  // This is a placeholder as we are using native select
  <div ref={ref} className={cn("hidden", className)} {...props}>{children}</div>
))
SelectContent.displayName = 'SelectContent'


const SelectItem = React.forwardRef<
  HTMLOptionElement,
  React.OptionHTMLAttributes<HTMLOptionElement>
>(({ className, children, ...props }, ref) => (
  <option ref={ref} className={cn('bg-card text-card-foreground', className)} {...props}>
    {children}
  </option>
))
SelectItem.displayName = 'SelectItem'


export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }