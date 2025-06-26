// src/app/(public)/novels/[slug]/page.tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Book, Clock, Eye, Star, Calendar, BookOpen } from 'lucide-react';
import { novelService } from '@/services/novelService';
import { formatNumber, formatDate } from '@/lib/utils';
import { Button } from '@/components/shared/ui/Button';

async function getNovelDetails(slug: string) {
    const novel = await novelService.findBySlug(slug);
    if (!novel) {
        notFound();
    }
    return novel;
}

export default async function NovelHomepage({ params }: { params: { slug: string } }) {
    const { slug } = params;
    const novel = await getNovelDetails(slug);

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
                                    alt={`Cover for ${novel.title}`}
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
                                        href={`/genres/${novelGenre.genre.slug}`}
                                        className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm hover:bg-primary/20 transition-colors"
                                    >
                                        {novelGenre.genre.name}
                                    </Link>
                                ))}
                                {novel.tags.map((novelTag) => (
                                    <span
                                        key={novelTag.tag.id}
                                        className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-sm"
                                    >
                                        #{novelTag.tag.name}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-4">
                            {novel.chapters.length > 0 && (
                                <Link href={`/novels/${novel.slug}/chapters/${novel.chapters[0].id}`}>
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
                                        href={`/novels/${novel.slug}/chapters/${chapter.id}`} 
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
                                                <span className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-600 rounded-full">
                                                    Premium
                                                </span>
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