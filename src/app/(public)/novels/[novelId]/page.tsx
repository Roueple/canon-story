// src/app/(public)/novels/[novelId]/page.tsx
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
                        alt={`Cover for ${novel.title}`}
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
                    {/* FIXED: Conditionally render button only if chapters exist */}
                    {novel.chapters.length > 0 && (
                        <div className="mt-6">
                            <Button size="lg" asChild>
                               <Link href={`/novels/${novel.id}/chapters/${novel.chapters[0]?.id}`}>
                                    Start Reading
                               </Link>
                            </Button>
                        </div>
                    )}
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
                                            <Link href={`/novels/${novel.id}/chapters/${chapter.id}`} className="block p-4 hover:bg-muted transition-colors">
                                                <p className="font-medium text-card-foreground">
                                                   Chapter {String(chapter.chapterNumber)}: {chapter.title}
                                                </p>
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${chapter.status === 'premium' ? 'bg-purple-500/20 text-purple-400' : 'bg-green-500/20 text-green-400'}`}>
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