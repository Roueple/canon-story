import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getNovelBySlug } from '@/lib/data';
import { Button } from '@/components/shared/ui';
import { Badge } from '@/components/shared/ui';
import { Card } from '@/components/shared/ui';
import { BookOpen, Clock, Eye, Star, User } from 'lucide-react';
import { formatNumber, formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function NovelDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const novel = await getNovelBySlug(params.slug);

  if (!novel) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left column - Novel info */}
        <div className="lg:col-span-1">
          <Card className="p-6">
            {novel.coverImageUrl && (
              <img
                src={novel.coverImageUrl}
                alt={novel.title}
                className="w-full aspect-[3/4] object-cover rounded-lg mb-6"
              />
            )}
            
            <h1 className="text-2xl font-bold mb-2">{novel.title}</h1>
            
            <div className="flex items-center gap-2 text-muted-foreground mb-4">
              <User size={16} />
              <span>{novel.author.displayName || novel.author.username}</span>
            </div>

            <div className="space-y-2 mb-6">
              <div className="flex items-center gap-2">
                <BookOpen size={16} />
                <span>{novel._count.chapters} Chapters</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Eye size={16} />
                <span>{formatNumber(novel.totalViews)} Views</span>
              </div>
              
              {novel.averageRating > 0 && (
                <div className="flex items-center gap-2">
                  <Star size={16} />
                  <span>{novel.averageRating.toFixed(1)} Rating</span>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <Clock size={16} />
                <span>Updated {formatDate(novel.updatedAt)}</span>
              </div>
            </div>

            {novel.genres.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Genres</h3>
                <div className="flex flex-wrap gap-2">
                  {novel.genres.map((g) => (
                    <Link key={g.genre.id} href={`/genres/${g.genre.slug}`}>
                      <Badge variant="secondary">{g.genre.name}</Badge>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {novel.tags.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {novel.tags.map((t) => (
                    <Badge key={t.tag.id} variant="outline" className="text-xs">
                      {t.tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Right column - Description and chapters */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Description</h2>
            <div className="prose prose-sm max-w-none">
              {novel.description || 'No description available.'}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Chapters</h2>
              {novel.chapters.length > 0 && (
                <Link href={`/novels/${novel.slug}/chapters/${novel.chapters[0].chapterNumber}`}>
                  <Button>Start Reading</Button>
                </Link>
              )}
            </div>

            {novel.chapters.length === 0 ? (
              <p className="text-muted-foreground">No chapters available yet.</p>
            ) : (
              <div className="space-y-2">
                {novel.chapters.map((chapter, index) => (
                  <Link
                    key={chapter.id}
                    href={`/novels/${novel.slug}/chapters/${chapter.chapterNumber}`}
                    className="block"
                  >
                    <div className="p-3 rounded-lg hover:bg-muted transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-muted-foreground text-sm">
                            Chapter {chapter.chapterNumber}
                          </span>
                          <h3 className="font-medium">{chapter.title}</h3>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(chapter.createdAt)}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
