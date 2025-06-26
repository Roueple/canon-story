// fix2.mjs
import fs from 'fs/promises';
import path from 'path';

// --- Helper Functions ---
async function writeFile(filePath, content) {
    try {
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, content.trim(), 'utf-8');
        console.log(`✅ Created/Fixed: ${filePath}`);
    } catch (error) {
        console.error(`❌ Error writing file ${filePath}:`, error);
    }
}

async function removePath(targetPath) {
    try {
        await fs.rm(path.resolve(process.cwd(), targetPath), { recursive: true, force: true });
        console.log(`🗑️  Removed: ${targetPath}`);
    } catch (error) {
        if (error.code !== 'ENOENT') { // Ignore "file not found" errors
            console.error(`❌ Error removing ${targetPath}:`, error);
        } else {
            console.log(`- Path not found, skipping removal: ${targetPath}`);
        }
    }
}

async function renamePath(oldPath, newPath) {
    try {
        await fs.rename(path.resolve(process.cwd(), oldPath), path.resolve(process.cwd(), newPath));
        console.log(`🔄 Renamed: ${oldPath} -> ${newPath}`);
    } catch (error) {
        if (error.code !== 'ENOENT') {
            console.error(`❌ Error renaming ${oldPath}:`, error);
        } else {
            console.log(`- Path not found, skipping rename: ${oldPath}`);
        }
    }
}


// --- File Content Definitions ---

const libDataContent = `
// src/lib/data.ts
import { Prisma } from '@prisma/client';
import { prisma } from './db';
import { serializeForJSON } from './serialization';

const novelCardInclude = {
  author: { select: { displayName: true, username: true } },
  genres: { include: { genre: true } },
  tags: { include: { tag: true } },
  _count: { select: { chapters: { where: { isPublished: true, isDeleted: false } } } }
};

export async function getTrendingNovels(limit = 6) {
  const novels = await prisma.novel.findMany({
    where: { isPublished: true, isDeleted: false },
    include: novelCardInclude,
    orderBy: { totalViews: 'desc' },
    take: limit
  });
  return serializeForJSON(novels);
}

export async function getRecentNovels(limit = 6) {
  const novels = await prisma.novel.findMany({
    where: { isPublished: true, isDeleted: false },
    include: novelCardInclude,
    orderBy: { publishedAt: 'desc' },
    take: limit
  });
  return serializeForJSON(novels);
}

export async function getPublishedNovels() {
  const novels = await prisma.novel.findMany({
    where: { isPublished: true, isDeleted: false },
    include: novelCardInclude,
    orderBy: { updatedAt: 'desc' }
  });
  return serializeForJSON(novels);
}

export async function getNovelBySlug(slug: string) {
  const novel = await prisma.novel.findUnique({
    where: { slug: slug, isPublished: true, isDeleted: false },
    include: {
      author: { select: { displayName: true, username: true } },
      genres: { include: { genre: true } },
      tags: { include: { tag: true } },
      chapters: { 
        where: { isPublished: true, isDeleted: false }, 
        orderBy: { chapterNumber: 'asc' }, 
        select: { id: true, title: true, chapterNumber: true, createdAt: true } 
      },
      _count: { select: { chapters: true } }
    }
  });
  return serializeForJSON(novel);
}

export async function getChapterByNumber(novelSlug: string, chapterNumberStr: string) {
    const chapterNumber = new Prisma.Decimal(chapterNumberStr);
    const chapter = await prisma.chapter.findFirst({
        where: {
            novel: { slug: novelSlug, isPublished: true, isDeleted: false },
            chapterNumber: chapterNumber,
            isPublished: true,
            isDeleted: false
        },
        include: {
            novel: {
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    chapters: {
                        where: { isPublished: true, isDeleted: false },
                        select: { id: true, chapterNumber: true },
                        orderBy: { chapterNumber: 'asc' }
                    }
                }
            }
        }
    });
    return serializeForJSON(chapter);
}
`;

const chapterIdPageContent = `
// src/app/(public)/novels/[slug]/chapters/[chapterId]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Bookmark } from 'lucide-react'
import { Button, LoadingSpinner } from '@/components/shared/ui'
import { InfiniteScrollReader } from '@/components/reader/InfiniteScrollReader'
import { ReadingControls } from '@/components/reader/ReadingControls'
import { ReadingProgressBar } from '@/components/reader/ReadingProgressBar'
import { useReadingSettings } from '@/hooks/useReadingSettings'
import { useReadingProgress } from '@/hooks/useReadingProgress'
import { useBookmarks } from '@/hooks/useBookmarks'
import { useTheme } from '@/providers/theme-provider'
import { cn } from '@/lib/utils'

interface Chapter {
  id: string
  novelId: string
  title: string
  content: string
  chapterNumber: number
  wordCount: number
  novel: {
    title: string;
  }
}

interface ChapterWithNav {
  currentChapter: Chapter;
  prevChapterId: string | null;
  nextChapterId: string | null;
  allChapterIds: string[];
}

export default function ChapterPage() {
  const params = useParams<{ slug: string; chapterId: string }>()
  const router = useRouter()
  
  const [novelId, setNovelId] = useState<string | null>(null);
  const [novelTitle, setNovelTitle] = useState<string>('');
  const [initialData, setInitialData] = useState<ChapterWithNav | null>(null)
  const [loadedChapters, setLoadedChapters] = useState<Chapter[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [isAutoScrolling, setIsAutoScrolling] = useState(false)
  const [isFocusMode, setIsFocusMode] = useState(false)
  const [visibleChapterId, setVisibleChapterId] = useState<string | null>(params.chapterId)
  
  const { 
    fontSize, 
    autoScrollSpeed, 
    updateFontSize, 
    updateAutoScrollSpeed, 
    isSettingsReady 
  } = useReadingSettings()
  
  const { theme, setTheme } = useTheme()
  const { updateProgress } = useReadingProgress(novelId)
  const { bookmarks, toggleBookmark, isBookmarked, isLoading: bookmarkLoading } = useBookmarks(novelId)

  // 1. Fetch novel ID from slug
  useEffect(() => {
    const fetchNovelMeta = async () => {
      if (!params.slug) return;
      setIsLoading(true);
      try {
        const res = await fetch(\`/api/public/novels/get-id-by-slug/\${params.slug}\`);
        if (!res.ok) throw new Error('Novel not found');
        const data = await res.json();
        if (data.success && data.data.id) {
            setNovelId(data.data.id);
            setNovelTitle(data.data.title);
        } else {
            throw new Error(data.error || 'Could not fetch novel metadata.');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        setIsLoading(false);
      }
    };
    fetchNovelMeta();
  }, [params.slug]);

  // 2. Fetch initial chapter details and navigation once novel ID is available
  useEffect(() => {
    if (!novelId) return;

    const fetchInitialData = async () => {
      try {
        const res = await fetch(\`/api/public/novels/\${novelId}/chapters/\${params.chapterId}\`)
        if (!res.ok) throw new Error('Failed to load chapter details.')
        const data = await res.json()
        if (data.success) {
            setInitialData(data.data)
            setLoadedChapters([data.data.currentChapter])
            setVisibleChapterId(data.data.currentChapter.id)
        } else {
            throw new Error(data.error || 'Could not load chapter data.');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.')
      } finally {
        setIsLoading(false)
      }
    }
    fetchInitialData()
  }, [novelId, params.chapterId]);

  // Auto-scroll logic (unchanged)
  useEffect(() => {
    if (!isAutoScrolling) return
    const scrollInterval = setInterval(() => {
      window.scrollBy(0, 1)
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
        setIsAutoScrolling(false)
      }
    }, 50 / autoScrollSpeed)
    return () => clearInterval(scrollInterval)
  }, [isAutoScrolling, autoScrollSpeed])

  const currentChapter = loadedChapters.find(c => c.id === visibleChapterId)
  
  if (isLoading || !isSettingsReady || !novelId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-error">{error}</p>
        <Button onClick={() => router.push(\`/novels/\${params.slug}\`)}>
          Back to Novel
        </Button>
      </div>
    )
  }
  
  if (!initialData || !currentChapter) {
    return (
       <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className={cn("min-h-screen", isFocusMode && "focus-mode", theme)}>
      <ReadingProgressBar />
      {!isFocusMode && (
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <Link href={\`/novels/\${params.slug}\`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">{novelTitle}</span>
            </Link>
            <Button variant="ghost" size="sm" onClick={() => toggleBookmark(currentChapter.id)} disabled={bookmarkLoading}>
              {isBookmarked(currentChapter.id) ? (
                <Bookmark className="h-4 w-4 text-primary fill-current" />
              ) : (
                <Bookmark className="h-4 w-4" />
              )}
            </Button>
          </div>
        </header>
      )}
      <main className="container mx-auto px-4 py-8 max-w-4xl" style={{ '--reader-font-size': \`\${fontSize}px\` } as React.CSSProperties}>
        <InfiniteScrollReader
          novelId={novelId}
          initialChapter={initialData.currentChapter}
          loadedChapters={loadedChapters}
          setLoadedChapters={setLoadedChapters}
          allChapterIds={initialData.allChapterIds}
          onChapterVisible={setVisibleChapterId}
          fontSize={fontSize}
          theme={theme}
        />
      </main>
      <ReadingControls
        fontSize={fontSize}
        onFontSizeChange={updateFontSize}
        isAutoScrolling={isAutoScrolling}
        onToggleAutoScroll={() => setIsAutoScrolling(prev => !prev)}
        autoScrollSpeed={autoScrollSpeed}
        onAutoScrollSpeedChange={updateAutoScrollSpeed}
        theme={theme}
        onThemeChange={setTheme}
        isFocusMode={isFocusMode}
        onToggleFocusMode={() => setIsFocusMode(prev => !prev)}
      />
    </div>
  )
}
`;


// --- Main Execution ---
async function main() {
    console.log('🚀 Applying structural fixes and creating missing files...');

    // 1. Clean up old/duplicate files and directories
    console.log('\n--- Cleaning up project structure ---');
    await removePath('src/app/novels');
    await removePath('src/app/admin');
    await removePath('src/app/(public)/novels/[novelId]');
    await removePath('src/app/(public)/novel');
    await removePath('src/lib/prisma.ts');
    await removePath('src/app/(public)/novels/[slug]/chapters/[chapterNumber]/page.tsx'); // remove old file before renaming dir
    
    // 2. Create the missing data.ts file
    console.log('\n--- Creating missing files ---');
    await writeFile('src/lib/data.ts', libDataContent);

    // 3. Fix the public chapter route
    console.log('\n--- Fixing chapter reading route ---');
    await renamePath(
        'src/app/(public)/novels/[slug]/chapters/[chapterNumber]', 
        'src/app/(public)/novels/[slug]/chapters/[chapterId]'
    );
    await writeFile(
        'src/app/(public)/novels/[slug]/chapters/[chapterId]/page.tsx', 
        chapterIdPageContent
    );
    
    console.log('\n\n✅ Fix script completed successfully!');
    console.log('Summary of changes:');
    console.log('  - Removed several old/duplicate route directories.');
    console.log('  - Removed redundant `src/lib/prisma.ts`.');
    console.log('  - Created `src/lib/data.ts` with necessary data-fetching functions.');
    console.log('  - Renamed chapter route to use `[chapterId]` for consistency.');
    console.log('  - Updated chapter page logic to work correctly with slugs.');
    console.log('\nPlease restart your development server to see the changes.');
}

main().catch(console.error);