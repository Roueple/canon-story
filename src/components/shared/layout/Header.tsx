'use client'

import Link from 'next/link'
import { UserButton, useUser, SignInButton, SignedIn, SignedOut } from '@clerk/nextjs'
import { BookOpen, Menu, Moon, Sun, BookOpenCheck, Globe } from 'lucide-react'
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

  const isAdmin = user?.publicMetadata?.role === 'admin' || user?.publicMetadata?.role === 'moderator'

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
                href="/browse"
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
                <Link href="/admin">
                  <Button variant="primary" size="sm" className="admin-button-glow">
                    <Globe className="h-5 w-5 mr-1" />
                    Admin
                  </Button>
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
                <SignedIn>
                  <UserButton 
                    afterSignOutUrl="/"
                    appearance={{
                      elements: {
                        avatarBox: "h-8 w-8"
                      }
                    }}
                  />
                </SignedIn>
                <SignedOut>
                  <SignInButton mode="modal">
                    <Button size="sm">Sign In</Button>
                  </SignInButton>
                </SignedOut>
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
              href="/browse"
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
                className="block px-3 py-2 text-base font-medium text-green-400 hover:text-green-300"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Globe className="h-5 w-5 mr-2" />
                Admin Dashboard
              </Link>
            )}
          </nav>
        )}
      </div>
    </header>
  )
}