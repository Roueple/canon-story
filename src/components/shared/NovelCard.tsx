// src/components/shared/NovelCard.tsx
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/shared/ui';
import { Badge } from '@/components/shared/ui';
import { BookOpen, Eye, Star } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { hexToRgba, formatNumber } from '@/lib/utils';

interface NovelCardProps {
  novel: any;
  showLastChapter?: boolean;
}

export function NovelCard({ novel, showLastChapter = false }: NovelCardProps) {
  if (!novel || !novel.slug) {
    return null;
  }

  return (
    <Link href={`/novels/${novel.slug}`}>
      <Card className="hover:shadow-lg transition-shadow h-full cursor-pointer flex flex-col bg-card border-border">
        {novel.coverImageUrl ? (
          <div className="aspect-[3/4] relative overflow-hidden rounded-t-lg bg-gray-700">
            <img 
              src={novel.coverImageUrl} 
              alt={novel.title}
              className="object-cover w-full h-full"
            />
          </div>
        ) : (
           <div className="aspect-[3/4] rounded-t-lg" style={{ backgroundColor: novel.coverColor || '#3B82F6' }}></div>
        )}
        
        <CardHeader>
          <h3 className="font-semibold text-lg line-clamp-2 text-card-foreground group-hover:text-primary transition-colors">{novel.title}</h3>
          <p className="text-sm text-secondary">by {novel.author?.displayName || 'Unknown Author'}</p>
        </CardHeader>
        
        <CardContent className="flex-grow">
          <p className="text-sm text-secondary line-clamp-3 mb-4">{novel.description}</p>
          
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
            <div className="text-xs text-secondary mt-2">
              Latest: Ch {novel.chapters[0].chapterNumber} - {formatDistanceToNow(new Date(novel.chapters[0].publishedAt))} ago
            </div>
          )}
        </CardContent>
        
        <CardFooter className="text-xs text-secondary mt-auto">
          <div className="flex items-center gap-4 w-full justify-between">
            <span className="flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              {novel._count?.chapters || 0} Chs
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {formatNumber(novel.totalViews || 0)}
            </span>
            {novel.averageRating > 0 && (
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3 text-yellow-500" />
                {Number(novel.averageRating).toFixed(1)}
              </span>
            )}
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}