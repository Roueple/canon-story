// fix-clerk-colors.js
// Fixes the Clerk color variable error
// Run with: node fix-clerk-colors.js

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createFile(filePath, content) {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    const dir = path.dirname(fullPath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(fullPath, content.trim(), 'utf-8');
    console.log(`✅ Created: ${filePath}`);
  } catch (error) {
    console.error(`❌ Error creating ${filePath}:`, error.message);
  }
}

// Fixed ClerkProvider that doesn't use CSS variables
const fixedClerkProvider = `'use client'

import { ClerkProvider as BaseClerkProvider } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import { useTheme } from './theme-provider'

export function ClerkProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme()
  
  // Define actual color values for each theme
  const themeColors = {
    light: {
      primary: '#2563EB',
      background: '#FFFFFF',
      text: '#1F2937',
    },
    dark: {
      primary: '#3B82F6',
      background: '#111827',
      text: '#F9FAFB',
    },
    reading: {
      primary: '#D97706',
      background: '#FEF3C7',
      text: '#92400E',
    }
  }
  
  const currentColors = themeColors[theme] || themeColors.light
  
  return (
    <BaseClerkProvider
      appearance={{
        baseTheme: theme === 'dark' ? dark : undefined,
        variables: {
          colorPrimary: currentColors.primary,
          colorBackground: currentColors.background,
          colorText: currentColors.text,
          colorTextOnPrimaryBackground: '#FFFFFF',
          colorTextSecondary: theme === 'dark' ? '#9CA3AF' : '#6B7280',
          colorInputBackground: theme === 'dark' ? '#1F2937' : '#FFFFFF',
          colorInputText: currentColors.text,
          borderRadius: '0.5rem',
        },
        elements: {
          formButtonPrimary: {
            backgroundColor: currentColors.primary,
            '&:hover': {
              backgroundColor: theme === 'dark' ? '#2563EB' : '#1D4ED8',
            }
          },
          card: {
            backgroundColor: currentColors.background,
            borderColor: theme === 'dark' ? '#374151' : '#E5E7EB',
          },
          headerTitle: {
            color: currentColors.text,
          },
          headerSubtitle: {
            color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
          },
          socialButtonsBlockButton: {
            borderColor: theme === 'dark' ? '#374151' : '#E5E7EB',
            '&:hover': {
              backgroundColor: theme === 'dark' ? '#1F2937' : '#F9FAFB',
            }
          },
          formFieldLabel: {
            color: currentColors.text,
          },
          formFieldInput: {
            backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
            borderColor: theme === 'dark' ? '#374151' : '#E5E7EB',
            color: currentColors.text,
            '&:focus': {
              borderColor: currentColors.primary,
            }
          },
          footerActionLink: {
            color: currentColors.primary,
            '&:hover': {
              color: theme === 'dark' ? '#60A5FA' : '#1D4ED8',
            }
          }
        }
      }}
    >
      {children}
    </BaseClerkProvider>
  )
}`;

// Also update the theme configuration to ensure colors are properly defined
const updatedThemeConfig = `// Theme definitions for Canon Story
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
export type Theme = typeof themes[ThemeName]`;

// Update the Header component to fix SignInButton
const updatedHeader = `'use client'

import Link from 'next/link'
import { UserButton, useUser, SignInButton, SignedIn, SignedOut } from '@clerk/nextjs'
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
}`;

async function main() {
  console.log('🔧 Fixing Clerk Color Variable Error');
  console.log('===================================\n');

  const files = [
    { path: 'src/providers/clerk-provider.tsx', content: fixedClerkProvider },
    { path: 'src/config/themes.ts', content: updatedThemeConfig },
    { path: 'src/components/shared/layout/Header.tsx', content: updatedHeader }
  ];

  for (const file of files) {
    await createFile(file.path, file.content);
  }

  console.log('\n✅ Clerk color issue fixed!');
  console.log('\n📝 Next steps:');
  console.log('1. Restart your dev server (Ctrl+C then npm run dev)');
  console.log('2. Hard refresh your browser (Ctrl+Shift+R)');
  console.log('3. Try clicking Sign In again - it should work now!');
  console.log('\nThe sign-in modal will now use proper colors for all themes.');
}

main().catch(console.error);