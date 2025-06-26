// fix2.mjs
import fs from 'fs/promises';
import path from 'path';

// --- Helper Functions ---
async function writeFile(filePath, content) {
    try {
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, content.trim(), 'utf-8');
        console.log(`✅ Fixed: ${filePath}`);
    } catch (error) {
        console.error(`❌ Error writing file ${filePath}:`, error);
    }
}

async function removePath(targetPath) {
    try {
        const resolvedPath = path.resolve(process.cwd(), targetPath);
        await fs.rm(resolvedPath, { recursive: true, force: true });
        console.log(`🗑️  Removed: ${targetPath}`);
    } catch (error) {
        if (error.code !== 'ENOENT') { // Ignore "file not found" errors
            console.error(`❌ Error removing ${targetPath}:`, error);
        } else {
            console.log(`- Path not found, skipping removal: ${targetPath}`);
        }
    }
}

// --- File Content Definitions ---

// Fix for: src/app/(public)/novels/[slug]/page.tsx
const novelSlugPageContent = `
// src/app/(public)/novels/[slug]/page.tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Book, Clock, Eye, Star, Calendar, BookOpen } from 'lucide-react';
import { novelService } from '@/services/novelService';
import { formatNumber, formatDate } from '@/lib/utils';
import { Button } from '@/components/shared/ui/Button';
import { Badge } from '@/components/shared/ui/Badge';

async function getNovelDetails(slug: string) {
    const novel = await novelService.findBySlug(slug);
    if (!novel) {
        notFound();
    }
    return novel;
}

export default async function NovelHomepage({ params: paramsPromise }: { params: Promise<{ slug: string }> }) {
    const params = await paramsPromise;
    const { slug } = params;
    const novel = await getNovelDetails(slug);

    if (!novel || !novel.chapters) {
        return notFound();
    }

    const totalWords = novel.chapters.reduce((sum, chapter) => sum + chapter.wordCount, 0);
    const estimatedReadTime = Math.ceil(totalWords / 200); // Average reading speed

    return (
        <div className="bg-background text-foreground">
            {/* Novel Header with Cover */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid md:grid-cols-[300px_1fr] gap-8">
                    {/* Cover Image */}
                    <div className="flex justify-center md:justify-start">
                        <div className="relative w-full max-w-[300px] aspect-[2/3] rounded-lg overflow-hidden shadow-xl">
                            {novel.coverImageUrl ? (
                                <Image
                                    src={novel.coverImageUrl}
                                    alt={\`Cover for \${novel.title}\`}
                                    fill
                                    className="object-cover"
                                    priority
                                />
                            ) : (
                                <div 
                                    className="w-full h-full"
                                    style={{ backgroundColor: novel.coverColor }}
                                />
                            )}
                        </div>
                    </div>

                    {/* Novel Info */}
                    <div className="space-y-6">
                        <div>
                            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
                                {novel.title}
                            </h1>
                            <p className="text-xl text-secondary">
                                by {novel.author.displayName || novel.author.username}
                            </p>
                        </div>

                        {novel.description && (
                            <p className="text-lg leading-relaxed text-secondary">
                                {novel.description}
                            </p>
                        )}

                        {/* Novel Stats */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                            <div className="flex items-center text-secondary">
                                <Star className="h-5 w-5 mr-2 text-yellow-500" />
                                <span>{Number(novel.averageRating).toFixed(1)}/5.0 ({novel.ratingCount} ratings)</span>
                            </div>
                            <div className="flex items-center text-secondary">
                                <Eye className="h-5 w-5 mr-2" />
                                <span>{formatNumber(novel.totalViews)} Views</span>
                            </div>
                            <div className="flex items-center text-secondary">
                                <Book className="h-5 w-5 mr-2" />
                                <span>{novel.chapters.length} Chapters</span>
                            </div>
                            <div className="flex items-center text-secondary">
                                <Clock className="h-5 w-5 mr-2" />
                                <span>~{estimatedReadTime} min read</span>
                            </div>
                            <div className="flex items-center text-secondary">
                                <Calendar className="h-5 w-5 mr-2" />
                                <span>Updated: {formatDate(novel.updatedAt)}</span>
                            </div>
                        </div>

                        {/* Genre and Tags */}
                        {(novel.genres.length > 0 || novel.tags.length > 0) && (
                            <div className="flex flex-wrap gap-2">
                                {novel.genres.map((novelGenre) => (
                                    <Link
                                        key={novelGenre.genre.id}
                                        href={\`/genres/\${novelGenre.genre.slug}\`}
                                        className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm hover:bg-primary/20 transition-colors"
                                    >
                                        {novelGenre.genre.name}
                                    </Link>
                                ))}
                                {novel.tags.map((novelTag) => (
                                    <Badge
                                        key={novelTag.tag.id}
                                        variant="secondary"
                                        className="text-sm"
                                    >
                                        #{novelTag.tag.name}
                                    </Badge>
                                ))}
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-4">
                            {novel.chapters.length > 0 && (
                                <Link href={\`/novels/\${novel.slug}/chapters/\${novel.chapters[0].id}\`}>
                                    <Button size="lg" className="gap-2">
                                        <BookOpen className="h-5 w-5" />
                                        Start Reading
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Chapters Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h2 className="text-2xl font-bold mb-6">Chapters</h2>
                {novel.chapters.length > 0 ? (
                    <div data-testid="chapter-list" className="bg-card border border-border rounded-lg max-h-[600px] overflow-y-auto">
                        <ul className="divide-y divide-border">
                            {novel.chapters.map((chapter) => (
                                <li key={chapter.id} data-testid="chapter-item">
                                    <Link 
                                        href={\`/novels/\${novel.slug}/chapters/\${chapter.id}\`} 
                                        className="block p-4 hover:bg-muted transition-colors"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium text-card-foreground">
                                                    Chapter {String(chapter.chapterNumber)}: {chapter.title}
                                                </p>
                                                {chapter.wordCount > 0 && (
                                                    <p className="text-sm text-muted-foreground">
                                                        {formatNumber(chapter.wordCount)} words
                                                    </p>
                                                )}
                                            </div>
                                            {chapter.status === 'premium' && (
                                                <Badge variant="warning" size="sm">Premium</Badge>
                                            )}
                                        </div>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : (
                    <div className="bg-card border border-border rounded-lg p-8 text-center">
                        <p className="text-muted-foreground">No chapters available yet.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
`;

// Fix for: src/app/browse/page.tsx
const browsePageContent = `
// src/app/browse/page.tsx
import { Suspense } from 'react';
import { novelService } from '@/services/novelService';
import { NovelCard } from '@/components/shared/NovelCard';
import { LoadingSpinner } from '@/components/shared/ui/LoadingSpinner';
import { Input } from '@/components/shared/ui/Input';
import { Search } from 'lucide-react';

export const dynamic = 'force-dynamic';

async function NovelGrid({ searchQuery }: { searchQuery?: string }) {
  const { novels } = await novelService.findAll({ isPublished: true, limit: 100 });
  
  const filteredNovels = searchQuery 
    ? novels.filter(novel => 
        novel.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (novel.description && novel.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : novels;

  if (filteredNovels.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No novels found.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {filteredNovels.map((novel) => (
        <NovelCard key={novel.id} novel={novel} />
      ))}
    </div>
  );
}

export default async function BrowsePage({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const searchParams = await searchParamsPromise;
  const searchQuery = searchParams?.q;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Browse Novels</h1>
        <form action="/browse" method="get" className="max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
            <Input
              type="search"
              name="q"
              defaultValue={searchQuery}
              placeholder="Search novels..."
              className="pl-10"
            />
          </div>
        </form>
      </div>

      <Suspense fallback={
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      }>
        <NovelGrid searchQuery={searchQuery} />
      </Suspense>
    </div>
  );
}
`;

// --- Main Execution ---
async function main() {
    console.log('🚀 Applying routing and data fetching fixes...');

    // 1. Resolve duplicate route issue for /trending
    console.log('\n--- Resolving duplicate /trending route ---');
    await removePath('src/app/trending/page.tsx');
    
    // 2. Fix awaiting params in dynamic route
    console.log('\n--- Fixing dynamic route data fetching for /novels/[slug] ---');
    await writeFile('src/app/(public)/novels/[slug]/page.tsx', novelSlugPageContent);

    // 3. Fix awaiting searchParams in browse page
    console.log('\n--- Fixing searchParams data fetching for /browse ---');
    await writeFile('src/app/browse/page.tsx', browsePageContent);
    
    console.log('\n\n✅ Fix script completed successfully!');
    console.log('Summary of changes:');
    console.log('  - Removed duplicate `src/app/trending/page.tsx` file.');
    console.log('  - Correctly awaited `params` in `src/app/(public)/novels/[slug]/page.tsx`.');
    console.log('  - Correctly awaited `searchParams` in `src/app/browse/page.tsx`.');
    console.log('\nPlease restart your development server to see the changes.');
}

main().catch(console.error);