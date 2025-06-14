# Chat 2 - Create Authentication & UI Components Files
# PowerShell script to create all files for Canon Story Chat 2

Write-Host "Creating Chat 2 files for Canon Story..." -ForegroundColor Green

# Define all files to create with their content
$files = @{
    # Environment configuration
    ".env.local.example" = @"
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Clerk URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# Database (Neon)
DATABASE_URL=postgresql://username:password@host/database?sslmode=require
"@

    # Theme configuration
    "src/config/themes.ts" = @"
// Theme definitions for Canon Story
export const themes = {
  light: {
    name: 'Light',
    colors: {
      background: '#FFFFFF',
      foreground: '#1F2937',
      primary: '#2563EB',
      secondary: '#6B7280',
      accent: '#3B82F6',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      border: '#E5E7EB',
      muted: '#F3F4F6',
      card: '#FFFFFF',
      cardForeground: '#1F2937',
    }
  },
  dark: {
    name: 'Dark',
    colors: {
      background: '#111827',
      foreground: '#F9FAFB',
      primary: '#3B82F6',
      secondary: '#9CA3AF',
      accent: '#60A5FA',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      border: '#374151',
      muted: '#1F2937',
      card: '#1F2937',
      cardForeground: '#F9FAFB',
    }
  },
  reading: {
    name: 'Reading (Warm)',
    colors: {
      background: '#FEF3C7',
      foreground: '#92400E',
      primary: '#D97706',
      secondary: '#A16207',
      accent: '#F59E0B',
      success: '#65A30D',
      warning: '#EA580C',
      error: '#DC2626',
      border: '#FDE68A',
      muted: '#FEF3C7',
      card: '#FFFBEB',
      cardForeground: '#92400E',
    }
  }
} as const

export type ThemeName = keyof typeof themes
export type Theme = typeof themes[ThemeName]
"@

    # Theme provider and context
    "src/providers/theme-provider.tsx" = @"
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { themes, type ThemeName } from '@/config/themes'

interface ThemeContextType {
  theme: ThemeName
  setTheme: (theme: ThemeName) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeName>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const savedTheme = localStorage.getItem('theme') as ThemeName
    if (savedTheme && themes[savedTheme]) {
      setTheme(savedTheme)
    }
  }, [])

  useEffect(() => {
    if (!mounted) return
    
    const root = document.documentElement
    const themeColors = themes[theme].colors
    
    // Set CSS variables
    Object.entries(themeColors).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value)
    })
    
    // Set theme class
    root.className = theme
    
    // Save to localStorage
    localStorage.setItem('theme', theme)
  }, [theme, mounted])

  if (!mounted) return null

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
"@

    # Update globals.css with theme variables
    "src/app/globals-update.css" = @"
@import "tailwindcss";

:root {
  --background: #ffffff;
  --foreground: #171717;
  --primary: #2563EB;
  --secondary: #6B7280;
  --accent: #3B82F6;
  --success: #10B981;
  --warning: #F59E0B;
  --error: #EF4444;
  --border: #E5E7EB;
  --muted: #F3F4F6;
  --card: #FFFFFF;
  --cardForeground: #1F2937;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-secondary: var(--secondary);
  --color-accent: var(--accent);
  --color-success: var(--success);
  --color-warning: var(--warning);
  --color-error: var(--error);
  --color-border: var(--border);
  --color-muted: var(--muted);
  --color-card: var(--card);
  --color-card-foreground: var(--cardForeground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: Arial, Helvetica, sans-serif;
  transition: background-color 0.3s ease, color 0.3s ease;
}

/* Theme-specific styles */
.dark {
  color-scheme: dark;
}

.reading {
  color-scheme: light;
}

/* Utility classes for theme colors */
.bg-background { background-color: var(--background); }
.bg-foreground { background-color: var(--foreground); }
.bg-primary { background-color: var(--primary); }
.bg-secondary { background-color: var(--secondary); }
.bg-accent { background-color: var(--accent); }
.bg-success { background-color: var(--success); }
.bg-warning { background-color: var(--warning); }
.bg-error { background-color: var(--error); }
.bg-muted { background-color: var(--muted); }
.bg-card { background-color: var(--card); }

.text-background { color: var(--background); }
.text-foreground { color: var(--foreground); }
.text-primary { color: var(--primary); }
.text-secondary { color: var(--secondary); }
.text-accent { color: var(--accent); }
.text-success { color: var(--success); }
.text-warning { color: var(--warning); }
.text-error { color: var(--error); }
.text-muted { color: var(--muted); }
.text-card-foreground { color: var(--cardForeground); }

.border-border { border-color: var(--border); }
.border-primary { border-color: var(--primary); }
.border-secondary { border-color: var(--secondary); }
.border-accent { border-color: var(--accent); }
.border-success { border-color: var(--success); }
.border-warning { border-color: var(--warning); }
.border-error { border-color: var(--error); }
"@

    # Clerk provider wrapper
    "src/providers/clerk-provider.tsx" = @"
'use client'

import { ClerkProvider as BaseClerkProvider } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import { useTheme } from './theme-provider'

export function ClerkProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme()
  
  return (
    <BaseClerkProvider
      appearance={{
        baseTheme: theme === 'dark' ? dark : undefined,
        variables: {
          colorPrimary: theme === 'reading' ? '#D97706' : '#2563EB',
          colorBackground: 'var(--background)',
          colorText: 'var(--foreground)',
        }
      }}
    >
      {children}
    </BaseClerkProvider>
  )
}
"@

    # Root layout update
    "src/app/layout-update.tsx" = @"
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/providers/theme-provider'
import { ClerkProvider } from '@/providers/clerk-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Canon Story - Modern Novel Reading Platform',
  description: 'A comprehensive novel reading platform with community features and gamification',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <ClerkProvider>
            {children}
          </ClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
"@

    # Sign-in page
    "src/app/sign-in/[[...sign-in]]/page.tsx" = @"
import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <SignIn 
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-card",
          }
        }}
      />
    </div>
  )
}
"@

    # Sign-up page
    "src/app/sign-up/[[...sign-up]]/page.tsx" = @"
import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <SignUp 
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-card",
          }
        }}
      />
    </div>
  )
}
"@

    # UI Components - Button
    "src/components/shared/ui/Button.tsx" = @"
import { type ReactNode, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  children: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary/90',
    secondary: 'bg-secondary text-white hover:bg-secondary/90',
    outline: 'border border-border bg-transparent hover:bg-muted',
    ghost: 'bg-transparent hover:bg-muted',
    danger: 'bg-error text-white hover:bg-error/90',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  }

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
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
"@

    # UI Components - Input
    "src/components/shared/ui/Input.tsx" = @"
import { type InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          ref={ref}
          className={cn(
            'w-full rounded-md border border-border bg-background px-3 py-2',
            'text-foreground placeholder:text-secondary',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-error focus:ring-error',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-error">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
"@

    # UI Components - Card
    "src/components/shared/ui/Card.tsx" = @"
import { type ReactNode, type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-card',
        'shadow-sm',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn('px-6 py-4 border-b border-border', className)}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardContent({ className, children, ...props }: CardProps) {
  return (
    <div className={cn('px-6 py-4', className)} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn('px-6 py-4 border-t border-border', className)}
      {...props}
    >
      {children}
    </div>
  )
}
"@

    # UI Components - Modal
    "src/components/shared/ui/Modal.tsx" = @"
'use client'

import { type ReactNode, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  className,
  size = 'md'
}: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div
        className={cn(
          'relative w-full bg-card rounded-lg shadow-xl',
          sizes[size],
          className
        )}
      >
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h2 className="text-xl font-semibold text-card-foreground">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-1 rounded-md hover:bg-muted transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>,
    document.body
  )
}
"@

    # UI Components - Badge
    "src/components/shared/ui/Badge.tsx" = @"
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
"@

    # UI Components - Loading Spinner
    "src/components/shared/ui/LoadingSpinner.tsx" = @"
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  }

  return (
    <Loader2 
      className={cn(
        'animate-spin text-primary',
        sizes[size],
        className
      )} 
    />
  )
}
"@

    # UI Components - Progress Bar
    "src/components/shared/ui/ProgressBar.tsx" = @"
import { cn } from '@/lib/utils'

interface ProgressBarProps {
  value: number
  max?: number
  className?: string
  showLabel?: boolean
  variant?: 'default' | 'success' | 'warning' | 'error'
}

export function ProgressBar({
  value,
  max = 100,
  className,
  showLabel = false,
  variant = 'default'
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
  
  const variants = {
    default: 'bg-primary',
    success: 'bg-success',
    warning: 'bg-warning',
    error: 'bg-error',
  }

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between text-sm text-secondary mb-1">
          <span>Progress</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full transition-all duration-300 ease-out',
            variants[variant]
          )}
          style={{ width: `{percentage}%` }}
        />
      </div>
    </div>
  )
}
"@

    # UI Components - Tooltip
    "src/components/shared/ui/Tooltip.tsx" = @"
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
            top: `{coords.top}px`,
            left: `{coords.left}px`,
          }}
        >
          {content}
        </div>
      )}
    </>
  )
}
"@

    # UI Components barrel export
    "src/components/shared/ui/index.ts" = @"
export { Button } from './Button'
export { Input } from './Input'
export { Card, CardHeader, CardContent, CardFooter } from './Card'
export { Modal } from './Modal'
export { Badge } from './Badge'
export { LoadingSpinner } from './LoadingSpinner'
export { ProgressBar } from './ProgressBar'
export { Tooltip } from './Tooltip'
export { DeleteConfirmation } from './DeleteConfirmation'
"@

    # Layout Components - Header
    "src/components/shared/layout/Header.tsx" = @"
'use client'

import Link from 'next/link'
import { UserButton, useUser, SignInButton } from '@clerk/nextjs'
import { BookOpen, Menu, Moon, Sun, BookOpenCheck } from 'lucide-react'
import { useState } from 'react'
import { useTheme } from '@/providers/theme-provider'
import { Button } from '@/components/shared/ui'
import { cn } from '@/lib/utils'

export function Header() {
  const { user, isLoaded } = useUser()
  const { theme, setTheme } = useTheme()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const themeIcons = {
    light: Sun,
    dark: Moon,
    reading: BookOpenCheck
  }

  const ThemeIcon = themeIcons[theme]

  const cycleTheme = () => {
    const themes: Array<'light' | 'dark' | 'reading'> = ['light', 'dark', 'reading']
    const currentIndex = themes.indexOf(theme)
    const nextIndex = (currentIndex + 1) % themes.length
    setTheme(themes[nextIndex])
  }

  const isAdmin = user?.publicMetadata?.role === 'admin'

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-card/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Navigation */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-card-foreground">
                Canon Story
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:ml-8 md:flex md:space-x-4">
              <Link
                href="/novels"
                className="px-3 py-2 text-sm font-medium text-secondary hover:text-foreground"
              >
                Browse
              </Link>
              <Link
                href="/genres"
                className="px-3 py-2 text-sm font-medium text-secondary hover:text-foreground"
              >
                Genres
              </Link>
              <Link
                href="/trending"
                className="px-3 py-2 text-sm font-medium text-secondary hover:text-foreground"
              >
                Trending
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  className="px-3 py-2 text-sm font-medium text-warning hover:text-warning/80"
                >
                  Admin
                </Link>
              )}
            </nav>
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <button
              onClick={cycleTheme}
              className="p-2 rounded-md hover:bg-muted transition-colors"
              aria-label="Toggle theme"
            >
              <ThemeIcon className="h-5 w-5" />
            </button>

            {/* User Menu */}
            {isLoaded && (
              <>
                {user ? (
                  <UserButton 
                    afterSignOutUrl="/"
                    appearance={{
                      elements: {
                        avatarBox: "h-8 w-8"
                      }
                    }}
                  />
                ) : (
                  <SignInButton mode="modal">
                    <Button size="sm">Sign In</Button>
                  </SignInButton>
                )}
              </>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-md hover:bg-muted"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-4 space-y-2">
            <Link
              href="/novels"
              className="block px-3 py-2 text-base font-medium text-secondary hover:text-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              Browse
            </Link>
            <Link
              href="/genres"
              className="block px-3 py-2 text-base font-medium text-secondary hover:text-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              Genres
            </Link>
            <Link
              href="/trending"
              className="block px-3 py-2 text-base font-medium text-secondary hover:text-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              Trending
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                className="block px-3 py-2 text-base font-medium text-warning hover:text-warning/80"
                onClick={() => setMobileMenuOpen(false)}
              >
                Admin Dashboard
              </Link>
            )}
          </nav>
        )}
      </div>
    </header>
  )
}
"@

    # Layout Components - Footer
    "src/components/shared/layout/Footer.tsx" = @"
import Link from 'next/link'
import { BookOpen } from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="mt-auto border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold text-card-foreground">
                Canon Story
              </span>
            </div>
            <p className="text-sm text-secondary">
              A modern novel reading platform with community features and gamification.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-card-foreground">
              Discover
            </h3>
            <ul className="space-y-2 text-sm text-secondary">
              <li>
                <Link href="/novels" className="hover:text-foreground">
                  All Novels
                </Link>
              </li>
              <li>
                <Link href="/genres" className="hover:text-foreground">
                  Genres
                </Link>
              </li>
              <li>
                <Link href="/trending" className="hover:text-foreground">
                  Trending
                </Link>
              </li>
              <li>
                <Link href="/leaderboards" className="hover:text-foreground">
                  Leaderboards
                </Link>
              </li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-card-foreground">
              Community
            </h3>
            <ul className="space-y-2 text-sm text-secondary">
              <li>
                <Link href="/community/forums" className="hover:text-foreground">
                  Forums
                </Link>
              </li>
              <li>
                <Link href="/community/events" className="hover:text-foreground">
                  Events
                </Link>
              </li>
              <li>
                <Link href="/subscription/plans" className="hover:text-foreground">
                  Premium
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-card-foreground">
              Support
            </h3>
            <ul className="space-y-2 text-sm text-secondary">
              <li>
                <Link href="/help" className="hover:text-foreground">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-foreground">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-foreground">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-8">
          <p className="text-center text-sm text-secondary">
            © {currentYear} Canon Story. All rights reserved. Built with safety-first architecture.
          </p>
        </div>
      </div>
    </footer>
  )
}
"@

    # Layout Components - Navigation
    "src/components/shared/layout/Navigation.tsx" = @"
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
"@

    # Layout Components - Sidebar
    "src/components/shared/layout/Sidebar.tsx" = @"
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
"@

    # Layout Components - Breadcrumbs
    "src/components/shared/layout/Breadcrumbs.tsx" = @"
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
"@

    # Layout barrel export
    "src/components/shared/layout/index.ts" = @"
export { Header } from './Header'
export { Footer } from './Footer'
export { Navigation } from './Navigation'
export { Sidebar } from './Sidebar'
export { Breadcrumbs } from './Breadcrumbs'
export { ThemeProvider } from './ThemeProvider'
"@

    # ThemeProvider Layout Component
    "src/components/shared/layout/ThemeProvider.tsx" = @"
'use client'

// Re-export from providers for convenience
export { ThemeProvider } from '@/providers/theme-provider'
"@

    # Auth utilities
    "src/lib/auth.ts" = @"
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import type { UserRole } from '@/types'

export async function getCurrentUser() {
  const { userId } = await auth()
  
  if (!userId) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { 
      id: userId,
      isDeleted: false 
    }
  })

  return user
}

export async function requireAuth() {
  const user = await getCurrentUser()
  
  if (!user) {
    throw new Error('Unauthorized')
  }

  return user
}

export async function requireRole(requiredRole: UserRole) {
  const user = await requireAuth()
  
  const roleHierarchy: Record<UserRole, number> = {
    reader: 1,
    premium_reader: 2,
    moderator: 3,
    admin: 4
  }

  const userLevel = roleHierarchy[user.role as UserRole] || 0
  const requiredLevel = roleHierarchy[requiredRole] || 0

  if (userLevel < requiredLevel) {
    throw new Error('Insufficient permissions')
  }

  return user
}

export async function isAdmin(userId?: string | null) {
  if (!userId) return false
  
  const user = await prisma.user.findUnique({
    where: { 
      id: userId,
      isDeleted: false 
    },
    select: { role: true }
  })

  return user?.role === 'admin'
}
"@

    # Public layout
    "src/app/(public)/layout.tsx" = @"
import { Header } from '@/components/shared/layout/Header'
import { Footer } from '@/components/shared/layout/Footer'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  )
}
"@

    # Admin layout
    "src/app/(admin)/layout.tsx" = @"
import { requireRole } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  try {
    await requireRole('admin')
  } catch {
    redirect('/sign-in')
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="flex h-screen">
        {/* Admin Sidebar - will be implemented in Chat 3 */}
        <div className="w-64 bg-gray-950 border-r border-gray-800">
          <div className="p-4">
            <h1 className="text-xl font-bold text-white">Admin Panel</h1>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
"@

    # Admin dashboard placeholder
    "src/app/(admin)/admin/page.tsx" = @"
export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-gray-800 p-6 border border-gray-700">
          <h3 className="text-sm font-medium text-gray-400">Total Users</h3>
          <p className="mt-2 text-3xl font-semibold text-white">0</p>
        </div>
        <div className="rounded-lg bg-gray-800 p-6 border border-gray-700">
          <h3 className="text-sm font-medium text-gray-400">Active Novels</h3>
          <p className="mt-2 text-3xl font-semibold text-white">0</p>
        </div>
        <div className="rounded-lg bg-gray-800 p-6 border border-gray-700">
          <h3 className="text-sm font-medium text-gray-400">Total Chapters</h3>
          <p className="mt-2 text-3xl font-semibold text-white">0</p>
        </div>
        <div className="rounded-lg bg-gray-800 p-6 border border-gray-700">
          <h3 className="text-sm font-medium text-gray-400">Active Subscriptions</h3>
          <p className="mt-2 text-3xl font-semibold text-white">0</p>
        </div>
      </div>
    </div>
  )
}
"@

    # Update middleware for role checking
    "src/middleware-update.ts" = @"
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

// Define the routes that should be protected
const isProtectedRoute = createRouteMatcher([
  '/admin(.*)',
  '/profile(.*)',
  '/settings(.*)',
]);

// Define admin-only routes
const isAdminRoute = createRouteMatcher([
  '/admin(.*)',
]);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  // Protect routes that require authentication
  if (isProtectedRoute(req)) {
    await auth.protect();
  }

  // For admin routes, check if user has admin role
  if (isAdminRoute(req)) {
    const { sessionClaims } = await auth();
    const userRole = sessionClaims?.metadata?.role;

    if (userRole !== 'admin') {
      // Redirect non-admins to home
      return NextResponse.redirect(new URL('/', req.url));
    }
  }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
"@

    # Webhook for Clerk user sync
    "src/app/api/webhooks/clerk/route.ts" = @"
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { Webhook } from 'svix'
import { prisma } from '@/lib/db'

export async function POST(req: Request) {
  // Get the headers
  const headerPayload = await headers()
  const svix_id = headerPayload.get("svix-id")
  const svix_timestamp = headerPayload.get("svix-timestamp")
  const svix_signature = headerPayload.get("svix-signature")

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400
    })
  }

  // Get the body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  // Create a new Svix instance with your webhook secret
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '')

  let evt: WebhookEvent

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return new Response('Error occured', {
      status: 400
    })
  }

  // Handle the webhook
  const eventType = evt.type

  if (eventType === 'user.created' || eventType === 'user.updated') {
    const { id, email_addresses, username, first_name, last_name, image_url } = evt.data

    const email = email_addresses[0]?.email_address
    if (!email) {
      return new Response('No email found', { status: 400 })
    }

    try {
      await prisma.user.upsert({
        where: { id },
        update: {
          email,
          username: username || null,
          displayName: [first_name, last_name].filter(Boolean).join(' ') || null,
          avatarUrl: image_url || null,
          emailVerified: email_addresses[0]?.verification?.status === 'verified',
          lastLoginAt: new Date(),
        },
        create: {
          id,
          email,
          username: username || null,
          displayName: [first_name, last_name].filter(Boolean).join(' ') || null,
          avatarUrl: image_url || null,
          emailVerified: email_addresses[0]?.verification?.status === 'verified',
          role: 'reader', // Default role
        },
      })

      // Log the user sync
      await prisma.auditLog.create({
        data: {
          userId: id,
          action: eventType === 'user.created' ? 'create' : 'update',
          modelName: 'User',
          recordId: id,
          newData: { email, username },
        }
      })
    } catch (error) {
      console.error('Error syncing user:', error)
      return new Response('Error syncing user', { status: 500 })
    }
  }

  if (eventType === 'user.deleted') {
    const { id } = evt.data

    try {
      // Soft delete the user
      await prisma.user.update({
        where: { id },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: 'clerk-webhook',
          deletionReason: 'User deleted from Clerk',
        }
      })

      // Log the deletion
      await prisma.auditLog.create({
        data: {
          userId: id,
          action: 'delete',
          modelName: 'User',
          recordId: id,
          oldData: { deletedFrom: 'clerk' },
        }
      })
    } catch (error) {
      console.error('Error deleting user:', error)
      return new Response('Error deleting user', { status: 500 })
    }
  }

  return new Response('', { status: 200 })
}
"@

    # Enhanced home page with auth
    "src/app/(public)/page.tsx" = @"
import { auth } from '@clerk/nextjs/server'
import { BookOpen, Users, Trophy, Sparkles, Shield, Database } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/shared/ui'

export default async function HomePage() {
  const { userId } = await auth()

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/50 to-background">
      {/* Hero Section */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
              Welcome to Canon Story
            </h1>
            <p className="mx-auto mt-3 max-w-md text-base text-secondary sm:text-lg md:mt-5 md:max-w-3xl md:text-xl">
              A modern novel reading platform with community features, gamification, and an immersive reading experience.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              {userId ? (
                <Link href="/novels">
                  <Button size="lg">Browse Novels</Button>
                </Link>
              ) : (
                <>
                  <Link href="/sign-up">
                    <Button size="lg">Get Started</Button>
                  </Link>
                  <Link href="/sign-in">
                    <Button size="lg" variant="outline">Sign In</Button>
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Feature Grid */}
          <div className="mt-20 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-primary text-white">
                <BookOpen className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-foreground">Rich Content</h3>
              <p className="mt-2 text-sm text-secondary">
                Support for chapters, images, and formatted text
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-primary text-white">
                <Trophy className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-foreground">Gamification</h3>
              <p className="mt-2 text-sm text-secondary">
                Achievements, levels, and customization rewards
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-primary text-white">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-foreground">Community</h3>
              <p className="mt-2 text-sm text-secondary">
                Comments, reviews, and social features
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-primary text-white">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-foreground">Premium</h3>
              <p className="mt-2 text-sm text-secondary">
                Exclusive content and enhanced features
              </p>
            </div>
          </div>

          {/* Safety Features */}
          <div className="mt-16 rounded-lg bg-card p-8 border border-border">
            <div className="flex items-center justify-center mb-6">
              <Shield className="h-8 w-8 text-success mr-3" />
              <h2 className="text-2xl font-bold text-card-foreground">Built with Safety in Mind</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="flex items-start">
                <Database className="h-6 w-6 text-success mt-1 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-card-foreground">Neon Database Branching</h3>
                  <p className="text-sm text-secondary">Create database snapshots before any risky operations</p>
                </div>
              </div>
              <div className="flex items-start">
                <Shield className="h-6 w-6 text-success mt-1 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-card-foreground">Soft Deletes</h3>
                  <p className="text-sm text-secondary">Nothing is permanently deleted - recover data anytime</p>
                </div>
              </div>
              <div className="flex items-start">
                <Database className="h-6 w-6 text-success mt-1 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-card-foreground">No Cascade Deletes</h3>
                  <p className="text-sm text-secondary">Protected against accidental data loss</p>
                </div>
              </div>
              <div className="flex items-start">
                <Shield className="h-6 w-6 text-success mt-1 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-card-foreground">Audit Trail</h3>
                  <p className="text-sm text-secondary">Complete history of all data changes</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
"@

    # Install additional dependencies command
    "install-deps.ps1" = @"
Write-Host "Installing additional dependencies for Chat 2..." -ForegroundColor Green

npm install @clerk/themes svix --save

Write-Host "Dependencies installed successfully!" -ForegroundColor Green
"@
}

# Create all files
foreach ($filePath in $files.Keys) {
    $content = $files[$filePath]
    
    # Create directory if it doesn't exist
    $directory = Split-Path -Parent $filePath
    if ($directory -and !(Test-Path $directory)) {
        New-Item -Path $directory -ItemType Directory -Force | Out-Null
    }
    
    # Create file with content
    Set-Content -Path $filePath -Value $content -Encoding UTF8
    Write-Host "Created: $filePath" -ForegroundColor Gray
}

# Special handling for updating existing files
Write-Host "`nUpdating existing files..." -ForegroundColor Yellow

# Update globals.css
if (Test-Path "src/app/globals.css") {
    Copy-Item "src/app/globals-update.css" "src/app/globals.css" -Force
    Remove-Item "src/app/globals-update.css"
    Write-Host "Updated: src/app/globals.css" -ForegroundColor Gray
}

# Update layout.tsx
if (Test-Path "src/app/layout.tsx") {
    Copy-Item "src/app/layout-update.tsx" "src/app/layout.tsx" -Force
    Remove-Item "src/app/layout-update.tsx"
    Write-Host "Updated: src/app/layout.tsx" -ForegroundColor Gray
}

# Update middleware.ts
if (Test-Path "middleware.ts") {
    Copy-Item "src/middleware-update.ts" "middleware.ts" -Force
    Remove-Item "src/middleware-update.ts"
    Write-Host "Updated: middleware.ts" -ForegroundColor Gray
}

Write-Host "`n✅ Chat 2 files created successfully!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Copy .env.local.example to .env.local and add your Clerk keys" -ForegroundColor White
Write-Host "2. Run: .\install-deps.ps1" -ForegroundColor White
Write-Host "3. Run: npm run dev" -ForegroundColor White
Write-Host "4. Set up Clerk webhook endpoint in Clerk dashboard" -ForegroundColor White
Write-Host "   - Endpoint URL: https://your-domain.com/api/webhooks/clerk" -ForegroundColor White
Write-Host "   - Events: user.created, user.updated, user.deleted" -ForegroundColor White