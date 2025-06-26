import Link from 'next/link';
import { Button } from '@/components/shared/ui';
import { Card } from '@/components/shared/ui';
import { Badge } from '@/components/shared/ui';
import { Plus, Edit, Eye, BookOpen } from 'lucide-react';
import { formatNumber, formatDate } from '@/lib/utils';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

async function getNovels() {
  const novels = await prisma.novel.findMany({
    include: {
      author: {
        select: {
          username: true,
          displayName: true
        }
      },
      _count: {
        select: {
          chapters: true,
          comments: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Convert Decimal types to numbers
  return novels.map(novel => ({
    ...novel,
    totalViews: novel.totalViews ? Number(novel.totalViews) : 0,
    averageRating: novel.averageRating ? Number(novel.averageRating) : 0
  }));
}

export default async function AdminNovelsPage() {
  const novels = await getNovels();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Novels</h1>
        <Link href="/admin/novels/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Novel
          </Button>
        </Link>
      </div>

      {novels.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">No novels created yet.</p>
          <Link href="/admin/novels/create">
            <Button>Create Your First Novel</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-4">
          {novels.map((novel) => (
            <Card key={novel.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex gap-4 flex-1">
                  {novel.coverImageUrl && (
                    <img
                      src={novel.coverImageUrl}
                      alt={novel.title}
                      className="w-20 h-28 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h2 className="text-xl font-semibold">{novel.title}</h2>
                      <Badge variant={novel.published ? "default" : "secondary"}>
                        {novel.published ? "Published" : "Draft"}
                      </Badge>
                      {novel.completed && (
                        <Badge variant="outline">Completed</Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2">
                      by {novel.author.displayName || novel.author.username}
                    </p>
                    
                    <p className="text-sm line-clamp-2 mb-4">{novel.description}</p>
                    
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4" />
                        {novel._count.chapters} chapters
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {formatNumber(novel.totalViews)} views
                      </span>
                      <span>
                        Updated {formatDate(novel.updatedAt)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2 ml-4">
                  <Link href={`/admin/novels/${novel.id}/edit`}>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href={`/novels/${novel.slug}`} target="_blank">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
