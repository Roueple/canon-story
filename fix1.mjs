// generate-discovery-api-routes.mjs
import fs from 'fs/promises';
import path from 'path';

// Helper to ensure directory exists
async function ensureDir(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (error) {
    console.error(`Error creating directory ${dir}:`, error);
  }
}

// Helper to write file
async function writeFile(filePath, content) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content);
  console.log(`Created: ${filePath}`);
}

// Genre Individual Route
const genreIdRouteContent = `// src/app/api/admin/genres/[id]/route.ts
import { NextRequest } from 'next/server';
import { createAdminRoute } from '@/lib/api/middleware';
import { successResponse, errorResponse, handleApiError } from '@/lib/api/utils';
import { genreService } from '@/services/genreService';

export const GET = createAdminRoute(async (req, { params }) => {
  try {
    const { id } = await params;
    if (!id) return errorResponse('Genre ID is required', 400);
    
    const genre = await genreService.findById(id);
    if (!genre) return errorResponse('Genre not found', 404);
    
    return successResponse(genre);
  } catch (error) {
    return handleApiError(error);
  }
});

export const PUT = createAdminRoute(async (req, { params }) => {
  try {
    const { id } = await params;
    if (!id) return errorResponse('Genre ID is required', 400);
    
    const body = await req.json();
    const genre = await genreService.update(id, body);
    
    return successResponse(genre);
  } catch (error) {
    return handleApiError(error);
  }
});

export const DELETE = createAdminRoute(async (req, { params }) => {
  try {
    const { id } = await params;
    if (!id) return errorResponse('Genre ID is required', 400);
    
    await genreService.delete(id);
    return successResponse({ message: 'Genre deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
});`;

// Search Suggestions Route
const searchSuggestionsContent = `// src/app/api/public/search/suggestions/route.ts
import { NextRequest } from 'next/server';
import { successResponse, handleApiError } from '@/lib/api/utils';
import { searchService } from '@/services/searchService';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '5');

    const suggestions = await searchService.getSearchSuggestions(query, limit);
    return successResponse(suggestions);
  } catch (error) {
    return handleApiError(error);
  }
}`;

// Related Novels Route
const relatedNovelsContent = `// src/app/api/public/novels/[novelId]/related/route.ts
import { NextRequest } from 'next/server';
import { successResponse, errorResponse, handleApiError } from '@/lib/api/utils';
import { recommendationService } from '@/services/recommendationService';

export async function GET(
  req: NextRequest,
  { params }: { params: { novelId: string } }
) {
  try {
    const { novelId } = params;
    if (!novelId) {
      return errorResponse('Novel ID is required', 400);
    }

    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '6');
    const related = await recommendationService.getRelatedNovels(novelId, limit);
    
    return successResponse(related);
  } catch (error) {
    return handleApiError(error);
  }
}`;

// Home Recommendations Route
const homeRecommendationsContent = `// src/app/api/public/home/recommendations/route.ts
import { NextRequest } from 'next/server';
import { successResponse, handleApiError } from '@/lib/api/utils';
import { recommendationService } from '@/services/recommendationService';
import { auth } from '@clerk/nextjs';

export async function GET(req: NextRequest) {
  try {
    const { userId } = auth();
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '10');

    let recommendations;
    if (userId) {
      recommendations = await recommendationService.getRecommendations(userId, limit);
    } else {
      recommendations = await recommendationService.getPopularNovels(limit);
    }

    return successResponse(recommendations);
  } catch (error) {
    return handleApiError(error);
  }
}`;

// Update Genre Util (for sorting)
const genreServiceUpdateContent = `// Add this method to genreService.ts

  async updateSortOrder(genres: { id: string; sortOrder: number }[]) {
    await prisma.$transaction(
      genres.map(({ id, sortOrder }) =>
        prisma.genre.update({
          where: { id },
          data: { sortOrder }
        })
      )
    );
  },

  async delete(id: string) {
    // Check if genre is in use
    const novelsUsingGenre = await prisma.novelGenre.count({
      where: { genreId: id }
    });

    if (novelsUsingGenre > 0) {
      throw new Error(\`Cannot delete genre: \${novelsUsingGenre} novels are using it\`);
    }

    await prisma.genre.delete({
      where: { id }
    });
  }`;

// NovelCard Component (corrected version)
const novelCardContent = `// src/components/shared/NovelCard.tsx
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/shared/ui';
import { Badge } from '@/components/shared/ui';
import { BookOpen, Eye, Star, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface NovelCardProps {
  novel: any;
  showLastChapter?: boolean;
}

export function NovelCard({ novel, showLastChapter = false }: NovelCardProps) {
  return (
    <Link href={\`/novels/\${novel.slug}\`}>
      <Card className="hover:shadow-lg transition-shadow h-full cursor-pointer">
        {novel.coverImageUrl && (
          <div className="aspect-[3/4] relative overflow-hidden rounded-t-lg">
            <img 
              src={novel.coverImageUrl} 
              alt={novel.title}
              className="object-cover w-full h-full"
            />
          </div>
        )}
        
        <CardHeader>
          <h3 className="font-semibold text-lg line-clamp-2">{novel.title}</h3>
          <p className="text-sm text-muted-foreground">by {novel.author}</p>
        </CardHeader>
        
        <CardContent>
          <p className="text-sm line-clamp-3 mb-4">{novel.description}</p>
          
          {/* Genres */}
          {novel.genres && novel.genres.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {novel.genres.slice(0, 3).map((g: any) => (
                <Badge 
                  key={g.genre.id} 
                  variant="secondary" 
                  className="text-xs"
                  style={{ backgroundColor: \`\${g.genre.color}20\`, color: g.genre.color }}
                >
                  {g.genre.name}
                </Badge>
              ))}
            </div>
          )}
          
          {/* Last Chapter */}
          {showLastChapter && novel.chapters && novel.chapters[0] && (
            <div className="text-xs text-muted-foreground mt-2">
              Latest: Ch {novel.chapters[0].chapterNumber} - {formatDistanceToNow(new Date(novel.chapters[0].publishedAt))} ago
            </div>
          )}
        </CardContent>
        
        <CardFooter className="text-xs text-muted-foreground">
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
                {novel.averageRating.toFixed(1)}
              </span>
            )}
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}`;

// Update debounce util
const debounceUtilContent = `// Add to src/lib/utils.ts if not exists

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}`;

// Genre Page Update
const genrePageContent = `// src/app/(public)/genres/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/shared/ui';

interface Genre {
  id: string;
  name: string;
  description?: string;
  color: string;
  _count?: {
    novels: number;
  };
}

export default function GenresPage() {
  const router = useRouter();
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGenres();
  }, []);

  const fetchGenres = async () => {
    try {
      const res = await fetch('/api/public/genres');
      const data = await res.json();
      if (data.success) {
        setGenres(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch genres:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Browse by Genre</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {genres.map(genre => (
          <Card
            key={genre.id}
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => router.push(\`/search?genres=\${genre.id}\`)}
          >
            <div 
              className="h-2 rounded-t-lg" 
              style={{ backgroundColor: genre.color }}
            />
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-2">{genre.name}</h3>
              {genre.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {genre.description}
                </p>
              )}
              <p className="text-sm text-gray-500">
                {genre._count?.novels || 0} novels
              </p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}`;

// Main script
async function main() {
  console.log('🚀 Generating remaining Content Discovery API routes...\n');

  // Create API routes
  await writeFile('src/app/api/admin/genres/[id]/route.ts', genreIdRouteContent);
  await writeFile('src/app/api/admin/tags/[id]/route.ts', `// src/app/api/admin/tags/[id]/route.ts
import { NextRequest } from 'next/server';
import { createAdminRoute } from '@/lib/api/middleware';
import { successResponse, errorResponse, handleApiError } from '@/lib/api/utils';
import { tagService } from '@/services/tagService';

export const GET = createAdminRoute(async (req, { params }) => {
  try {
    const { id } = await params;
    if (!id) return errorResponse('Tag ID is required', 400);
    
    const tag = await tagService.findById(id);
    if (!tag) return errorResponse('Tag not found', 404);
    
    return successResponse(tag);
  } catch (error) {
    return handleApiError(error);
  }
});

export const PUT = createAdminRoute(async (req, { params }) => {
  try {
    const { id } = await params;
    if (!id) return errorResponse('Tag ID is required', 400);
    
    const body = await req.json();
    const tag = await tagService.update(id, body);
    
    return successResponse(tag);
  } catch (error) {
    return handleApiError(error);
  }
});

export const DELETE = createAdminRoute(async (req, { params }) => {
  try {
    const { id } = await params;
    if (!id) return errorResponse('Tag ID is required', 400);
    
    await tagService.delete(id);
    return successResponse({ message: 'Tag deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
});`);

  await writeFile('src/app/api/public/search/suggestions/route.ts', searchSuggestionsContent);
  await writeFile('src/app/api/public/novels/[novelId]/related/route.ts', relatedNovelsContent);
  await writeFile('src/app/api/public/home/recommendations/route.ts', homeRecommendationsContent);

  // Create components
  await writeFile('src/components/shared/NovelCard.tsx', novelCardContent);
  await writeFile('src/app/(public)/genres/page.tsx', genrePageContent);

  console.log('\n✅ All API routes and components generated successfully!');
  console.log('\n📝 Next steps:');
  console.log('1. Run: node generate-discovery-api-routes.mjs');
  console.log('2. Update genreService.ts with the delete method');
  console.log('3. Add debounce to utils.ts if not exists');
  console.log('4. Update admin navigation to include Tags and Genres links');
  console.log('5. Run database migration for search indexes');
  console.log('6. Test all discovery features');
}

// Run the script
main().catch(console.error);