// src/services/trendingService.ts
import { prisma } from '@/lib/db';
import { serializeForJSON } from '@/lib/serialization';

export const trendingService = {
  async getTrendingNovels(period: 'day' | 'week' | 'month' = 'week', limit = 20) {
    const startDate = this.getStartDate(period);
    
    // Get novels with recent activity
    const trendingData = await prisma.chapterView.groupBy({
      by: ['chapterId'],
      where: {
        viewedAt: { gte: startDate },
        chapter: {
          novel: {
            isPublished: true,
            isDeleted: false
          }
        }
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: limit * 2 // Get more to ensure we have enough unique novels
    });

    // Get unique novel IDs from chapter views
    const chapterIds = trendingData.map(d => d.chapterId).filter(Boolean) as string[];
    
    const chapters = await prisma.chapter.findMany({
      where: { id: { in: chapterIds } },
      select: { novelId: true }
    });

    const novelIds = [...new Set(chapters.map(c => c.novelId))].slice(0, limit);

    // Get full novel data
    const novels = await prisma.novel.findMany({
      where: { id: { in: novelIds } },
      include: {
        genres: { include: { genre: true } },
        tags: { include: { tag: true } },
        _count: {
          select: {
            chapters: {
              where: { isPublished: true, isDeleted: false }
            }
          }
        }
      }
    });

    // Calculate trending score
    const scoredNovels = await Promise.all(novels.map(async (novel) => {
      const recentViews = await this.getRecentViews(novel.id, startDate);
      const recentComments = await this.getRecentComments(novel.id, startDate);
      const recentRatings = await this.getRecentRatings(novel.id, startDate);
      
      const trendingScore = this.calculateTrendingScore({
        recentViews,
        recentComments,
        recentRatings,
        totalViews: Number(novel.totalViews || 0),
        averageRating: novel.averageRating?.toNumber() || 0,
      });

      return {
        ...novel,
        trendingScore,
        recentActivity: {
          views: recentViews,
          comments: recentComments,
          ratings: recentRatings
        }
      };
    }));

    // Sort by trending score
    const sortedNovels = scoredNovels
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .slice(0, limit);

    return serializeForJSON(sortedNovels);
  },

  async getRecentlyUpdated(limit = 20) {
    const novels = await prisma.novel.findMany({
      where: {
        isPublished: true,
        isDeleted: false,
        chapters: {
          some: {
            isPublished: true,
            isDeleted: false,
            publishedAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
            }
          }
        }
      },
      include: {
        genres: { include: { genre: true } },
        tags: { include: { tag: true } },
        chapters: {
          where: {
            isPublished: true,
            isDeleted: false
          },
          orderBy: { publishedAt: 'desc' },
          take: 1,
          select: {
            id: true,
            title: true,
            chapterNumber: true,
            publishedAt: true
          }
        },
        _count: {
          select: {
            chapters: {
              where: { isPublished: true, isDeleted: false }
            }
          }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: limit
    });

    return serializeForJSON(novels);
  },

  getStartDate(period: 'day' | 'week' | 'month'): Date {
    const now = new Date();
    switch (period) {
      case 'day':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  },

  async getRecentViews(novelId: string, since: Date): Promise<number> {
    const chapters = await prisma.chapter.findMany({
      where: { novelId },
      select: { id: true }
    });
    
    const chapterIds = chapters.map(c => c.id);
    
    return await prisma.chapterView.count({
      where: {
        chapterId: { in: chapterIds },
        viewedAt: { gte: since }
      }
    });
  },

  async getRecentComments(novelId: string, since: Date): Promise<number> {
    return await prisma.comment.count({
      where: {
        chapter: {                    // ← filter by the related Chapter
          novelId: novelId
        },
        createdAt: {
          gte: since
        }
      }
    });
  },

  async getRecentRatings(novelId: string, since: Date): Promise<number> {
    return await prisma.rating.count({
      where: {
        novelId,
        createdAt: { gte: since }
      }
    });
  },

  calculateTrendingScore(metrics: {
    recentViews: number;
    recentComments: number;
    recentRatings: number;
    totalViews: number;
    averageRating: number;
  }): number {
    const {
      recentViews,
      recentComments,
      recentRatings,
      totalViews,
      averageRating
    } = metrics;

    // Weighted scoring algorithm
    let score = 0;
    
    // Recent activity (70% weight)
    score += recentViews * 1.0;
    score += recentComments * 3.0;
    score += recentRatings * 2.0;
    
    // Overall popularity (20% weight)
    score += Math.log10(totalViews + 1) * 10;
    
    // Quality factor (10% weight)
    score += averageRating * 5;
    
    return Math.round(score);
  }
};