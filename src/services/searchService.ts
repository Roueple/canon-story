// src/services/searchService.ts
import { prisma } from '@/lib/db';
import { serializeForJSON } from '@/lib/serialization';
import { Prisma } from '@prisma/client';

interface SearchOptions {
  query: string;
  page?: number;
  limit?: number;
  filters?: {
    genres?: string[];
    tags?: string[];
    status?: string;
    isPremium?: boolean;
    minChapters?: number;
    maxChapters?: number;
    sortBy?: 'relevance' | 'views' | 'rating' | 'updated' | 'created';
    sortOrder?: 'asc' | 'desc';
  };
}

export const searchService = {
  async searchNovels(options: SearchOptions) {
    const { query, page = 1, limit = 20, filters = {} } = options;
    const skip = (page - 1) * limit;

    // Build where conditions
    const where: Prisma.NovelWhereInput = {
      isPublished: true,
      isDeleted: false,
    };

    // Full-text search on title and description
    if (query && query.trim()) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { author: { contains: query, mode: 'insensitive' } }
      ];
    }

    // Genre filter
    if (filters.genres && filters.genres.length > 0) {
      where.genres = {
        some: {
          genreId: { in: filters.genres }
        }
      };
    }

    // Tag filter
    if (filters.tags && filters.tags.length > 0) {
      where.tags = {
        some: {
          tagId: { in: filters.tags }
        }
      };
    }

    // Status filter
    if (filters.status) {
      where.status = filters.status;
    }

    // Premium filter
    if (filters.isPremium !== undefined) {
      where.isPremium = filters.isPremium;
    }

    // Chapter count filters
    if (filters.minChapters !== undefined || filters.maxChapters !== undefined) {
      const chapterWhere: any = {};
      if (filters.minChapters) chapterWhere.gte = filters.minChapters;
      if (filters.maxChapters) chapterWhere.lte = filters.maxChapters;
      
      where.chapters = {
        some: {
          isPublished: true,
          isDeleted: false
        }
      };
    }

    // Get results with pagination
    const [novels, total] = await prisma.$transaction([
      prisma.novel.findMany({
        where,
        include: {
          genres: {
            include: { genre: true }
          },
          tags: {
            include: { tag: true }
          },
          _count: {
            select: {
              chapters: {
                where: { isPublished: true, isDeleted: false }
              }
            }
          }
        },
        orderBy: this.getOrderBy(filters.sortBy, filters.sortOrder),
        skip,
        take: limit
      }),
      prisma.novel.count({ where })
    ]);

    // Update search analytics
    if (query && query.trim()) {
      await this.logSearch(query, total);
    }

    return {
      novels: serializeForJSON(novels),
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  },

  async searchChapters(options: SearchOptions) {
    const { query, page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const where: Prisma.ChapterWhereInput = {
      isPublished: true,
      isDeleted: false,
      novel: {
        isPublished: true,
        isDeleted: false
      }
    };

    if (query && query.trim()) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { content: { contains: query, mode: 'insensitive' } }
      ];
    }

    const [chapters, total] = await prisma.$transaction([
      prisma.chapter.findMany({
        where,
        include: {
          novel: {
            select: {
              id: true,
              title: true,
              slug: true,
              author: true
            }
          }
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.chapter.count({ where })
    ]);

    return {
      chapters: serializeForJSON(chapters),
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  },

  async getSearchSuggestions(query: string, limit = 5) {
    if (!query || query.length < 2) return [];

    const novels = await prisma.novel.findMany({
      where: {
        isPublished: true,
        isDeleted: false,
        title: {
          startsWith: query,
          mode: 'insensitive'
        }
      },
      select: {
        id: true,
        title: true,
        slug: true
      },
      take: limit
    });

    return serializeForJSON(novels);
  },

  getOrderBy(sortBy?: string, sortOrder: 'asc' | 'desc' = 'desc'): Prisma.NovelOrderByWithRelationInput {
    switch (sortBy) {
      case 'views':
        return { totalViews: sortOrder };
      case 'rating':
        return { averageRating: sortOrder };
      case 'updated':
        return { updatedAt: sortOrder };
      case 'created':
        return { createdAt: sortOrder };
      default:
        // For relevance, we'll use a combination of factors
        return [
          { totalViews: 'desc' },
          { averageRating: 'desc' },
          { updatedAt: 'desc' }
        ];
    }
  },

  async logSearch(query: string, resultCount: number) {
    // Log search for analytics (implement SearchLog model if needed)
    console.log(`Search logged: "${query}" - ${resultCount} results`);
  }
};