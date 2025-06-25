
// src/components/shared/NovelCard.tsx
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/shared/ui';
import { Badge } from '@/components/shared/ui';
import { BookOpen, Eye, Star, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { hexToRgba } from '@/lib/utils';

interface NovelCardProps {
  novel: any;
  showLastChapter?: boolean;
}

export function NovelCard({ novel, showLastChapter = false }: NovelCardProps) {
  // Gracefully handle missing novel data
  if (!novel || !novel.slug) {
    return null;
  }

  return (
    <Link href={`/novels/${novel.slug}`}>
      <Card className="hover:shadow-lg transition-shadow h-full cursor-pointer flex flex-col">
        {novel.coverImageUrl && (
          <div className="aspect-[3/4] relative overflow-hidden rounded-t-lg bg-gray-700">
            <img 
              src={novel.coverImageUrl} 
              alt={novel.title}
              className="object-cover w-full h-full"
            />
          </div>
        )}
        
        <CardHeader>
          <h3 className="font-semibold text-lg line-clamp-2">{novel.title}</h3>
          <p className="text-sm text-muted-foreground">by {novel.author?.displayName || 'Unknown Author'}</p>
        </CardHeader>
        
        <CardContent className="flex-grow">
          <p className="text-sm line-clamp-3 mb-4">{novel.description}</p>
          
          {novel.genres && novel.genres.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {novel.genres.slice(0, 3).map((g: any) => (
                g.genre && <Badge 
                  key={g.genre.id} 
                  className="text-xs border-transparent"
                  style={{ 
                    backgroundColor: hexToRgba(g.genre.color || '#6B7280', 0.15), 
                    color: g.genre.color || '#6B7280'
                  }}
                >
                  {g.genre.name}
                </Badge>
              ))}
            </div>
          )}
          
          {showLastChapter && novel.chapters && novel.chapters[0] && (
            <div className="text-xs text-muted-foreground mt-2">
              Latest: Ch {novel.chapters[0].chapterNumber} - {formatDistanceToNow(new Date(novel.chapters[0].publishedAt))} ago
            </div>
          )}
        </CardContent>
        
        <CardFooter className="text-xs text-muted-foreground mt-auto">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              {novel._count?.chapters || 0}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {novel.totalViews || 0}
            </span>
            {novel.averageRating > 0 && (
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3" />
                {Number(novel.averageRating).toFixed(1)}
              </span>
            )}
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
