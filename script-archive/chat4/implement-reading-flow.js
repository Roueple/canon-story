// implement-reading-flow.js
// This script implements the core public reading flow for Canon Story,
// including the novel homepage and the chapter reading page.
// Run with: node implement-reading-flow.js

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createFile(filePath, content) {
  const fullPath = path.join(process.cwd(), filePath);
  const dir = path.dirname(fullPath);
  try {
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(fullPath, content.trim(), 'utf-8');
    console.log(`✅ Created/Updated: ${filePath}`);
  } catch (error)
    {
    console.error(`❌ Error creating ${filePath}:`, error.message);
  }
}

const filesToCreate = [
    // 1. Dynamic Novel Homepage
    {
        path: 'src/app/(public)/novels/[novelId]/page.tsx',
        content: `// src/app/(public)/novels/[novelId]/page.tsx
import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Book, Clock, Eye, Star, Tag, Calendar } from 'lucide-react';
import { formatNumber, formatDate } from '@/lib/utils';
import { Button } from '@/components/shared/ui/Button';

async function getNovelDetails(novelId: string) {
    const novel = await prisma.novel.findFirst({
        where: {
            id: novelId,
            isPublished: true,
            isDeleted: false,
        },
        include: {
            author: {
                select: { displayName: true, username: true },
            },
            chapters: {
                where: { isPublished: true, isDeleted: false },
                orderBy: { chapterNumber: 'asc' },
                select: { id: true, title: true, chapterNumber: true, status: true, wordCount: true }
            },
            genres: {
                include: { genre: true }
            },
            tags: {
                include: { tag: true }
            }
        },
    });

    if (!novel) {
        notFound();
    }
    return novel;
}

export default async function NovelHomepage({ params }: { params: { novelId: string } }) {
    const novel = await getNovelDetails(params.novelId);

    const totalWords = novel.chapters.reduce((sum, chapter) => sum + chapter.wordCount, 0);
    const estimatedReadTime = Math.ceil(totalWords / 200); // Average reading speed

    return (
        <div className="bg-background text-foreground">
            {/* Header section with cover */}
            <div className="relative py-24 sm:py-32" style={{ backgroundColor: novel.coverColor }}>
                 {novel.coverImageUrl && (
                    <img
                        src={novel.coverImageUrl}
                        alt={\`Cover for \${novel.title}\`}
                        className="absolute inset-0 w-full h-full object-cover opacity-20"
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white drop-shadow-lg">
                        {novel.title}
                    </h1>
                    <p className="mt-4 text-xl text-gray-200 drop-shadow">
                        by {novel.author.displayName || novel.author.username}
                    </p>
                    <div className="mt-6">
                        <Button size="lg" asChild>
                           <Link href={\`/novels/\${novel.id}/chapters/\${novel.chapters[0]?.id}\`}>
                                Start Reading
                           </Link>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Description & Details */}
                    <div className="lg:col-span-2">
                        <h2 className="text-2xl font-bold mb-4">Description</h2>
                        <p className="text-secondary leading-relaxed whitespace-pre-wrap">
                            {novel.description || 'No description available.'}
                        </p>

                        <div className="mt-8">
                            <h3 className="text-xl font-bold mb-4">Tags</h3>
                            <div className="flex flex-wrap gap-2">
                                {novel.genres.map(({ genre }) => (
                                    <span key={genre.id} className="bg-primary/10 text-primary text-sm font-medium px-3 py-1 rounded-full">{genre.name}</span>
                                ))}
                                {novel.tags.map(({ tag }) => (
                                    <span key={tag.id} className="bg-secondary/10 text-secondary text-sm font-medium px-3 py-1 rounded-full">{tag.name}</span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Stats & Chapter List */}
                    <div>
                        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
                             <h3 className="text-xl font-bold text-card-foreground">Novel Stats</h3>
                            <div className="flex items-center text-secondary">
                                <Star className="h-5 w-5 mr-3 text-yellow-500" />
                                <span>{novel.averageRating.toFixed(1)}/5.0 ({novel.ratingCount} ratings)</span>
                            </div>
                             <div className="flex items-center text-secondary">
                                <Eye className="h-5 w-5 mr-3" />
                                <span>{formatNumber(novel.totalViews)} Views</span>
                            </div>
                            <div className="flex items-center text-secondary">
                                <Book className="h-5 w-5 mr-3" />
                                <span>{novel.chapters.length} Chapters</span>
                            </div>
                            <div className="flex items-center text-secondary">
                                <Clock className="h-5 w-5 mr-3" />
                                <span>~{estimatedReadTime} min read</span>
                            </div>
                            <div className="flex items-center text-secondary">
                                <Calendar className="h-5 w-5 mr-3" />
                                <span>Updated: {formatDate(novel.updatedAt)}</span>
                            </div>
                        </div>

                        <div className="mt-8">
                            <h3 className="text-xl font-bold mb-4">Chapters</h3>
                            <div className="bg-card border border-border rounded-lg max-h-[600px] overflow-y-auto">
                                <ul className="divide-y divide-border">
                                    {novel.chapters.map((chapter) => (
                                        <li key={chapter.id}>
                                            <Link href={\`/novels/\${novel.id}/chapters/\${chapter.id}\`} className="block p-4 hover:bg-muted transition-colors">
                                                <p className="font-medium text-card-foreground">
                                                   Chapter {String(chapter.chapterNumber)}: {chapter.title}
                                                </p>
                                                <span className={\`text-xs px-2 py-0.5 rounded-full \${chapter.status === 'premium' ? 'bg-purple-500/20 text-purple-400' : 'bg-green-500/20 text-green-400'}\`}>
                                                    {chapter.status}
                                                </span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
`
    },

    // 2. Chapter Reading Page
    {
        path: 'src/app/(public)/novels/[novelId]/chapters/[chapterId]/page.tsx',
        content: `// src/app/(public)/novels/[novelId]/chapters/[chapterId]/page.tsx
import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Home, Book } from 'lucide-react';
import { Button } from '@/components/shared/ui/Button';
import { Breadcrumbs } from '@/components/shared/layout/Breadcrumbs';

async function getChapterData(novelId: string, chapterId: string) {
    const chapter = await prisma.chapter.findFirst({
        where: {
            id: chapterId,
            novelId: novelId,
            isPublished: true,
            isDeleted: false,
        },
        include: {
            novel: {
                select: { title: true, id: true }
            }
        }
    });

    if (!chapter) {
        notFound();
    }

    const [prevChapter, nextChapter] = await Promise.all([
        prisma.chapter.findFirst({
            where: {
                novelId: novelId,
                isPublished: true,
                isDeleted: false,
                chapterNumber: { lt: chapter.chapterNumber }
            },
            orderBy: { chapterNumber: 'desc' },
            select: { id: true }
        }),
        prisma.chapter.findFirst({
            where: {
                novelId: novelId,
                isPublished: true,
                isDeleted: false,
                chapterNumber: { gt: chapter.chapterNumber }
            },
            orderBy: { chapterNumber: 'asc' },
            select: { id: true }
        })
    ]);

    return { chapter, prevChapter, nextChapter };
}

export default async function ChapterReadingPage({ params }: { params: { novelId: string, chapterId: string } }) {
    const { chapter, prevChapter, nextChapter } = await getChapterData(params.novelId, params.chapterId);

    const breadcrumbItems = [
        { label: 'Home', href: '/' },
        { label: 'Novels', href: '/novels' },
        { label: chapter.novel.title, href: \`/novels/\${chapter.novel.id}\` },
        { label: \`Chapter \${String(chapter.chapterNumber)}\` }
    ];

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
            <Breadcrumbs items={breadcrumbItems} className="mb-6" />

            <article>
                <header className="mb-8 text-center">
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-2">
                        {chapter.title}
                    </h1>
                    <p className="text-lg text-secondary">
                        Chapter {String(chapter.chapterNumber)}
                    </p>
                </header>

                <div
                    className="prose prose-lg dark:prose-invert max-w-none text-foreground leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: chapter.content }}
                />
            </article>

            {/* Navigation Buttons */}
            <div className="mt-12 pt-8 border-t border-border flex justify-between items-center">
                 {prevChapter ? (
                     <Button asChild variant="outline">
                        <Link href={\`/novels/\${params.novelId}/chapters/\${prevChapter.id}\`}>
                           <ArrowLeft className="h-4 w-4 mr-2" />
                           Previous
                        </Link>
                     </Button>
                ) : <div />}

                <Button asChild variant="ghost">
                    <Link href={\`/novels/\${params.novelId}\`}>
                        <Book className="h-4 w-4 mr-2" />
                        All Chapters
                    </Link>
                </Button>

                {nextChapter ? (
                    <Button asChild variant="outline">
                       <Link href={\`/novels/\${params.novelId}/chapters/\${nextChapter.id}\`}>
                           Next
                           <ArrowRight className="h-4 w-4 ml-2" />
                       </Link>
                    </Button>
                ) : <div />}
            </div>
        </div>
    );
}
`
    },
    // 3. Update Button component to support `asChild` prop
    {
        path: 'src/components/shared/ui/Button.tsx',
        content: `// src/components/shared/ui/Button.tsx
'use client'

import { type ReactNode, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import { Slot } from '@radix-ui/react-slot';

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
  const Comp = asChild ? Slot : 'button';

  const variants = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
    danger: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  }

  const sizes = {
    sm: 'h-9 rounded-md px-3',
    md: 'h-10 px-4 py-2',
    lg: 'h-11 rounded-md px-8',
  }

  return (
    <Comp
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      {children}
    </Comp>
  )
}`
    },
    // 4. Update the public novels list to link to the new homepage
    {
        path: 'src/app/(public)/novels/page.tsx',
        content: `// src/app/(public)/novels/page.tsx
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { BookOpen, Star } from 'lucide-react'
import { formatNumber } from '@/lib/utils'

async function getPublishedNovels() {
  try {
    const novels = await prisma.novel.findMany({
      where: {
        isPublished: true,
        isDeleted: false
      },
      include: {
        author: {
          select: { displayName: true, username: true }
        },
        _count: {
          select: { chapters: { where: { isPublished: true, isDeleted: false } } }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });
    return novels;
  } catch (error) {
    console.error("Failed to fetch novels:", error);
    return [];
  }
}

export default async function NovelsPage() {
  const novels = await getPublishedNovels()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-8 text-foreground">Browse All Novels</h1>
      {novels.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {novels.map((novel) => (
            <Link
              key={novel.id}
              href={\`/novels/\${novel.id}\`}
              className="group bg-card border border-border rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col"
            >
              {novel.coverImageUrl ? (
                <img src={novel.coverImageUrl} alt={novel.title} className="h-48 w-full object-cover" />
              ) : (
                <div
                  className="h-48 w-full"
                  style={{ backgroundColor: novel.coverColor || '#3B82F6' }}
                />
              )}
              <div className="p-4 flex-grow flex flex-col">
                <h2 className="text-lg font-semibold text-card-foreground mb-1 group-hover:text-primary transition-colors truncate">
                  {novel.title}
                </h2>
                <p className="text-sm text-secondary mb-3">
                  by {novel.author.displayName || novel.author.username}
                </p>
                <p className="text-sm text-secondary line-clamp-3 flex-grow">
                  {novel.description || 'No description available.'}
                </p>
                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-sm text-secondary">
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="h-4 w-4" />
                    <span>{novel._count.chapters} Chs</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span>{novel.averageRating.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-card border border-border rounded-lg">
          <h2 className="text-xl font-semibold text-foreground">No Novels Found</h2>
          <p className="text-secondary mt-2">
            There are no published novels available at the moment. Please check back later!
          </p>
        </div>
      )}
    </div>
  )
}`
    }
];


async function main() {
  console.log('🚀 Implementing the public reading flow for Canon Story...');
  console.log('======================================================\n');

  for (const file of filesToCreate) {
    await createFile(file.path, file.content);
  }

  // Install necessary dependency for the button component
  console.log('\nInstalling @radix-ui/react-slot...');
  try {
      const { exec } = await import('child_process');
      exec('npm install @radix-ui/react-slot', (err, stdout, stderr) => {
          if (err) {
              console.error(`❌ Error installing dependency: ${stderr}`);
              return;
          }
          console.log(`✅ Dependency installed: ${stdout}`);
      });
  } catch (e) {
      console.log('Could not automatically install dependencies. Please run: npm install @radix-ui/react-slot');
  }


  console.log('\n✅ Implementation complete!');
  console.log('\nWhat was created:');
  console.log('1. Novel Homepage: `/novels/[novelId]`');
  console.log('2. Chapter Reading Page: `/novels/[novelId]/chapters/[chapterId]`');
  console.log('3. Updated the main `/novels` page to link to the new novel homepages.');
  console.log('4. Updated the Button component to support linking.');
  
  console.log('\nNext steps:');
  console.log('1. Restart your development server: `npm run dev`');
  console.log('2. Navigate to `/novels`, click on a novel, and then click on a chapter to test the flow.');
}

main().catch(console.error);

