// chat8-reading-interface.mjs
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = process.cwd();

async function createFile(filePath, content) {
  const fullPath = path.join(projectRoot, filePath);
  const dir = path.dirname(fullPath);
  try {
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(fullPath, content.trim(), 'utf-8');
    console.log(`✅ Created: ${filePath}`);
  } catch (error) {
    console.error(`❌ Error creating ${filePath}:`, error.message);
  }
}

const filesToCreate = [
  // Hooks
  {
    path: 'src/hooks/useReadingSettings.ts',
    content: `// src/hooks/useReadingSettings.ts
'use client'
import { useState, useEffect, useCallback } from 'react';

const FONT_SIZE_KEY = 'reading_font_size';
const AUTOSCROLL_SPEED_KEY = 'reading_autoscroll_speed';
const MIN_FONT_SIZE = 12;
const MAX_FONT_SIZE = 28; // Increased max font size
const DEFAULT_FONT_SIZE = 16;
const DEFAULT_AUTOSCROLL_SPEED = 3; // 1-5 scale

export interface ReadingSettings {
  fontSize: number;
  autoScrollSpeed: number;
}

export function useReadingSettings() {
  const [isMounted, setIsMounted] = useState(false);
  const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE);
  const [autoScrollSpeed, setAutoScrollSpeed] = useState(DEFAULT_AUTOSCROLL_SPEED);

  useEffect(() => {
    setIsMounted(true);
    const storedFontSize = localStorage.getItem(FONT_SIZE_KEY);
    if (storedFontSize) {
      setFontSize(Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, parseInt(storedFontSize, 10))));
    }
    const storedAutoScrollSpeed = localStorage.getItem(AUTOSCROLL_SPEED_KEY);
    if (storedAutoScrollSpeed) {
      setAutoScrollSpeed(parseInt(storedAutoScrollSpeed, 10));
    }
  }, []);

  const updateFontSize = useCallback((newSize: number) => {
    const clampedSize = Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, newSize));
    setFontSize(clampedSize);
    if (isMounted) {
      localStorage.setItem(FONT_SIZE_KEY, clampedSize.toString());
    }
  }, [isMounted]);

  const updateAutoScrollSpeed = useCallback((newSpeed: number) => {
    setAutoScrollSpeed(newSpeed);
    if (isMounted) {
      localStorage.setItem(AUTOSCROLL_SPEED_KEY, newSpeed.toString());
    }
  }, [isMounted]);

  return {
    fontSize,
    updateFontSize,
    minFontSize: MIN_FONT_SIZE,
    maxFontSize: MAX_FONT_SIZE,
    autoScrollSpeed,
    updateAutoScrollSpeed,
    isSettingsReady: isMounted, // Indicates if settings are loaded from localStorage
  };
}`
  },
  {
    path: 'src/hooks/useReadingProgress.ts',
    content: `// src/hooks/useReadingProgress.ts
'use client'
import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { useDebounce } from './useDebounce'; // Assuming you'll create this or have one

// A simple debounce hook (create this file or use a library)
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}


export interface ReadingProgress {
  chapterId: string;
  progressPercentage: number;
  scrollPosition: number;
}

export function useReadingProgress(novelId: string, currentChapterId: string) {
  const { user, isSignedIn } = useUser();
  const [progress, setProgress] = useState<ReadingProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const debouncedProgress = useDebounce(progress, 1500); // Debounce updates by 1.5 seconds

  // Fetch initial progress
  useEffect(() => {
    if (!isSignedIn || !novelId || !user?.id) {
      setIsLoading(false);
      return;
    }
    
    const fetchProgress = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(\`/api/public/users/progress?novelId=\${novelId}\`);
        if (!response.ok) {
          if (response.status === 404) { // No progress found is not an error
            setProgress({ chapterId: currentChapterId, progressPercentage: 0, scrollPosition: 0 });
          } else {
            throw new Error('Failed to fetch reading progress');
          }
        } else {
          const data = await response.json();
          if (data.success && data.data) {
            setProgress({
              chapterId: data.data.chapterId,
              progressPercentage: data.data.progressPercentage,
              scrollPosition: data.data.scrollPosition,
            });
          } else {
             setProgress({ chapterId: currentChapterId, progressPercentage: 0, scrollPosition: 0 });
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        console.error("Error fetching progress:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProgress();
  }, [novelId, isSignedIn, user?.id, currentChapterId]);

  // Save progress
  const saveProgress = useCallback(async (newProgress: ReadingProgress) => {
    if (!isSignedIn || !novelId || !user?.id) return;
    try {
      await fetch('/api/public/users/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          novelId,
          chapterId: newProgress.chapterId,
          progressPercentage: newProgress.progressPercentage,
          scrollPosition: newProgress.scrollPosition,
        }),
      });
    } catch (err) {
      console.error('Failed to save reading progress:', err);
      // Optionally set an error state here for UI feedback
    }
  }, [novelId, isSignedIn, user?.id]);
  
  useEffect(() => {
    if (debouncedProgress && debouncedProgress.progressPercentage > 0) { // Only save if there's actual progress
      saveProgress(debouncedProgress);
    }
  }, [debouncedProgress, saveProgress]);

  const updateCurrentChapterProgress = useCallback((scrollPos: number, percentage: number) => {
    setProgress({
      chapterId: currentChapterId,
      scrollPosition: scrollPos,
      progressPercentage: percentage,
    });
  }, [currentChapterId]);

  return {
    progress, // This is the live progress object for the current chapter
    initialChapterId: isLoading ? null : (progress?.chapterId || currentChapterId),
    initialScrollPosition: isLoading ? 0 : (progress?.scrollPosition || 0),
    updateCurrentChapterProgress,
    isLoadingProgress: isLoading,
    progressError: error,
  };
}`
  },
  {
    path: 'src/hooks/useBookmarks.ts',
    content: `// src/hooks/useBookmarks.ts
'use client'
import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import type { UserBookmarkData } from '@/types'; // Ensure this type is defined

export function useBookmarks(chapterId: string) {
  const { user, isSignedIn } = useUser();
  const [bookmarks, setBookmarks] = useState<UserBookmarkData[]>([]);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookmarks = useCallback(async () => {
    if (!isSignedIn || !chapterId || !user?.id) {
      setIsLoading(false);
      setIsBookmarked(false);
      setBookmarks([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(\`/api/public/users/bookmarks?chapterId=\${chapterId}\`);
      if (!response.ok) throw new Error('Failed to fetch bookmarks');
      const data = await response.json();
      if (data.success) {
        setBookmarks(data.data);
        // Check if current chapter is bookmarked (assuming chapter-level bookmarks for now)
        setIsBookmarked(data.data.some((b: UserBookmarkData) => b.chapterId === chapterId));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [chapterId, isSignedIn, user?.id]);

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  const toggleBookmark = useCallback(async () => {
    if (!isSignedIn || !chapterId || !user?.id) return;
    setError(null);
    const currentlyBookmarked = bookmarks.find(b => b.chapterId === chapterId);

    try {
      if (currentlyBookmarked) {
        // Delete bookmark
        const response = await fetch(\`/api/public/users/bookmarks/\${currentlyBookmarked.id}\`, {
          method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to remove bookmark');
        setBookmarks(prev => prev.filter(b => b.id !== currentlyBookmarked.id));
        setIsBookmarked(false);
      } else {
        // Add bookmark (chapter-level)
        const response = await fetch('/api/public/users/bookmarks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chapterId, note: 'Bookmarked chapter' }), // Position can be 0 for chapter-level
        });
        if (!response.ok) throw new Error('Failed to add bookmark');
        const data = await response.json();
        if (data.success) {
          setBookmarks(prev => [...prev, data.data]);
          setIsBookmarked(true);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      // Revert UI state on error if needed
      fetchBookmarks(); // Re-fetch to ensure consistency
    }
  }, [isSignedIn, chapterId, user?.id, bookmarks, fetchBookmarks]);

  return {
    isBookmarked,
    toggleBookmark,
    isLoadingBookmarks: isLoading,
    bookmarkError: error,
  };
}`
  },
  // Components
  {
    path: 'src/components/reader/ReadingControls.tsx',
    content: `// src/components/reader/ReadingControls.tsx
'use client'
import { Minus, Plus, Play, Pause, Zap, Moon, Sun, BookOpenCheck, Settings2 } from 'lucide-react';
import { Button } from '@/components/shared/ui/Button';
import { useReadingSettings } from '@/hooks/useReadingSettings';
import { useTheme } from '@/providers/theme-provider'; // Assuming this hook exists
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface ReadingControlsProps {
  onToggleAutoScroll: () => void;
  isAutoScrolling: boolean;
  className?: string;
}

export function ReadingControls({ onToggleAutoScroll, isAutoScrolling, className }: ReadingControlsProps) {
  const { 
    fontSize, updateFontSize, minFontSize, maxFontSize,
    autoScrollSpeed, updateAutoScrollSpeed, isSettingsReady
  } = useReadingSettings();
  const { theme, setTheme } = useTheme();
  const [showSettings, setShowSettings] = useState(false);

  if (!isSettingsReady) return null; // Don't render until settings are loaded

  const cycleTheme = () => {
    const themes: Array<'light' | 'dark' | 'reading'> = ['light', 'dark', 'reading'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const ThemeIcon = theme === 'light' ? Sun : theme === 'dark' ? Moon : BookOpenCheck;

  return (
    <div className={cn("fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-md border-t border-border shadow-lg p-3 z-50 transition-transform duration-300", className, showSettings ? "translate-y-0" : "translate-y-[calc(100%-4rem)] md:translate-y-[calc(100%-3.5rem)] hover:translate-y-0")}>
      <button 
        onClick={() => setShowSettings(prev => !prev)} 
        className="absolute -top-8 right-4 md:-top-7 md:right-auto md:left-1/2 md:-translate-x-1/2 bg-primary text-primary-foreground p-2 rounded-t-lg focus:outline-none"
        aria-label={showSettings ? "Hide reading settings" : "Show reading settings"}
      >
        <Settings2 size={20} />
      </button>
      
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Font Size */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-secondary mr-1">Font:</span>
          <Button variant="ghost" size="sm" onClick={() => updateFontSize(fontSize - 1)} disabled={fontSize <= minFontSize} aria-label="Decrease font size">
            <Minus size={16} />
          </Button>
          <span className="text-sm font-medium w-6 text-center">{fontSize}px</span>
          <Button variant="ghost" size="sm" onClick={() => updateFontSize(fontSize + 1)} disabled={fontSize >= maxFontSize} aria-label="Increase font size">
            <Plus size={16} />
          </Button>
        </div>

        {/* Theme Toggle */}
        <Button variant="ghost" size="sm" onClick={cycleTheme} className="flex items-center gap-1.5" aria-label="Cycle theme">
          <ThemeIcon size={16} /> <span className="capitalize text-xs">{theme}</span>
        </Button>

        {/* Auto Scroll */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onToggleAutoScroll} className="flex items-center gap-1.5" aria-label={isAutoScrolling ? "Pause auto-scroll" : "Play auto-scroll"}>
            {isAutoScrolling ? <Pause size={16} /> : <Play size={16} />}
            <span className="text-xs">Scroll</span>
          </Button>
          {isAutoScrolling && (
            <div className="flex items-center gap-1">
              <Zap size={14} className="text-secondary" />
              <input
                type="range"
                min="1"
                max="5"
                value={autoScrollSpeed}
                onChange={(e) => updateAutoScrollSpeed(parseInt(e.target.value))}
                className="w-20 h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                aria-label="Auto-scroll speed"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}`
  },
  {
    path: 'src/components/reader/ReadingProgressBar.tsx',
    content: `// src/components/reader/ReadingProgressBar.tsx
'use client'
import { ProgressBar as SharedProgressBar } from '@/components/shared/ui/ProgressBar'; // Use shared component

interface ReadingProgressBarProps {
  currentProgress: number; // 0-100
  className?: string;
}

export function ReadingProgressBar({ currentProgress, className }: ReadingProgressBarProps) {
  return (
    <div className={className}>
      <SharedProgressBar value={currentProgress} variant="primary" />
    </div>
  );
}`
  },
  {
    path: 'src/components/reader/BookmarkButton.tsx',
    content: `// src/components/reader/BookmarkButton.tsx
'use client'
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { Button } from '@/components/shared/ui/Button';

interface BookmarkButtonProps {
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  isLoading: boolean;
  className?: string;
}

export function BookmarkButton({ isBookmarked, onToggleBookmark, isLoading, className }: BookmarkButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onToggleBookmark}
      disabled={isLoading}
      className={className}
      aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
    >
      {isBookmarked ? (
        <BookmarkCheck size={20} className="text-primary" />
      ) : (
        <Bookmark size={20} />
      )}
      <span className="ml-2 text-xs">{isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>
    </Button>
  );
}`
  },
  // API Routes
  {
    path: 'src/app/api/public/users/progress/route.ts',
    content: `// src/app/api/public/users/progress/route.ts
import { NextRequest } from 'next/server';
import { createProtectedRoute } from '@/lib/api/middleware';
import { successResponse, errorResponse, handleApiError } from '@/lib/api/utils';
import { prisma } from '@/lib/db';

// GET user's reading progress for a novel
export const GET = createProtectedRoute(async (req, { user }) => {
  try {
    const novelId = req.nextUrl.searchParams.get('novelId');
    if (!novelId) {
      return errorResponse('Novel ID is required', 400);
    }

    const progress = await prisma.userReadingProgress.findUnique({
      where: { userId_novelId: { userId: user.id, novelId } },
    });

    if (!progress) {
      return errorResponse('No progress found for this novel', 404);
    }
    // Convert Decimal to number for chapterId if it's stored as Decimal
    // For now, assuming chapterId is string UUID.
    // progressPercentage and scrollPosition are Int, so no conversion needed.
    return successResponse(progress);
  } catch (error) {
    return handleApiError(error);
  }
});

// POST (update) user's reading progress
export const POST = createProtectedRoute(async (req, { user }) => {
  try {
    const body = await req.json();
    const { novelId, chapterId, progressPercentage, scrollPosition } = body;

    if (!novelId || !chapterId || progressPercentage === undefined || scrollPosition === undefined) {
      return errorResponse('Missing required fields: novelId, chapterId, progressPercentage, scrollPosition', 400);
    }
    
    const numericProgressPercentage = Number(progressPercentage);
    const numericScrollPosition = Number(scrollPosition);

    if (isNaN(numericProgressPercentage) || numericProgressPercentage < 0 || numericProgressPercentage > 100) {
        return errorResponse('Invalid progressPercentage. Must be between 0 and 100.', 400);
    }
    if (isNaN(numericScrollPosition) || numericScrollPosition < 0) {
        return errorResponse('Invalid scrollPosition. Must be a non-negative number.', 400);
    }


    const updatedProgress = await prisma.userReadingProgress.upsert({
      where: { userId_novelId: { userId: user.id, novelId } },
      update: { chapterId, progressPercentage: numericProgressPercentage, scrollPosition: numericScrollPosition, lastReadAt: new Date() },
      create: { userId: user.id, novelId, chapterId, progressPercentage: numericProgressPercentage, scrollPosition: numericScrollPosition, lastReadAt: new Date() },
    });
    return successResponse(updatedProgress);
  } catch (error) {
    return handleApiError(error);
  }
});`
  },
  {
    path: 'src/app/api/public/users/bookmarks/route.ts',
    content: `// src/app/api/public/users/bookmarks/route.ts
import { NextRequest } from 'next/server';
import { createProtectedRoute } from '@/lib/api/middleware';
import { successResponse, errorResponse, handleApiError } from '@/lib/api/utils';
import { prisma } from '@/lib/db';

// GET bookmarks for a user, optionally filtered by chapterId
export const GET = createProtectedRoute(async (req, { user }) => {
  try {
    const chapterId = req.nextUrl.searchParams.get('chapterId');
    const bookmarks = await prisma.userBookmark.findMany({
      where: { 
        userId: user.id,
        ...(chapterId && { chapterId }),
      },
      orderBy: { createdAt: 'desc' },
    });
    return successResponse(bookmarks);
  } catch (error) {
    return handleApiError(error);
  }
});

// POST a new bookmark
export const POST = createProtectedRoute(async (req, { user }) => {
  try {
    const body = await req.json();
    const { chapterId, position, note, isPrivate } = body;

    if (!chapterId) {
      return errorResponse('Chapter ID is required', 400);
    }

    const newBookmark = await prisma.userBookmark.create({
      data: {
        userId: user.id,
        chapterId,
        position: position || 0, // Default to 0 for chapter-level
        note,
        isPrivate: isPrivate === undefined ? true : isPrivate,
      },
    });
    return successResponse(newBookmark, 201);
  } catch (error) {
    return handleApiError(error);
  }
});`
  },
  {
    path: 'src/app/api/public/users/bookmarks/[bookmarkId]/route.ts',
    content: `// src/app/api/public/users/bookmarks/[bookmarkId]/route.ts
import { NextRequest } from 'next/server';
import { createProtectedRoute } from '@/lib/api/middleware';
import { successResponse, errorResponse, handleApiError } from '@/lib/api/utils';
import { prisma } from '@/lib/db';

// DELETE a bookmark
export const DELETE = createProtectedRoute(async (req, { user, params }) => {
  try {
    const { bookmarkId } = params;
    if (!bookmarkId) {
      return errorResponse('Bookmark ID is required', 400);
    }

    const bookmark = await prisma.userBookmark.findUnique({
      where: { id: bookmarkId },
    });

    if (!bookmark) {
      return errorResponse('Bookmark not found', 404);
    }
    if (bookmark.userId !== user.id) {
      return errorResponse('Forbidden: You can only delete your own bookmarks', 403);
    }

    await prisma.userBookmark.delete({
      where: { id: bookmarkId },
    });
    return successResponse({ message: 'Bookmark deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
});`
  }
];

async function main() {
  console.log('🚀 Starting Chat 8: Enhanced Reading Interface setup...');
  for (const file of filesToCreate) {
    await createFile(file.path, file.content);
  }
  console.log('\n✅ New files created for Chat 8.');
  console.log('Next steps:');
  console.log('1. Manually update src/app/(public)/novels/[novelId]/chapters/[chapterId]/page.tsx');
  console.log('2. Manually update src/types/index.ts');
  console.log('3. Manually update src/app/globals.css if needed for font styling.');
  console.log('4. Review all created files for any minor adjustments or imports.');
  console.log('5. Run `npm run db:generate` if Prisma schema changes were made (none in this script).');
  console.log('6. Restart your development server.');
}

main().catch(console.error);