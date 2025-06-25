// src/services/recommendationService.ts
import { prisma } from '@/lib/db';
import { serializeForJSON } from '@/lib/serialization';

export const recommendationService = {
  async getRecommendations(userId: string, limit = 10) {
    // Get user's reading history
    const userHistory = await this.getUserReadingHistory(userId);
    
    if (userHistory.length === 0) {
      // Return popular novels for new users
      return this.getPopularNovels(limit);
    }

    // Get genres and tags from user's reading history
    const userPreferences = await this.analyzeUserPreferences(userId, userHistory);
    
    // Find similar novels
    const recommendations = await this.findSimilarNovels(
      userPreferences,
      userHistory.map(h => h.novelId),
      limit
    );

    return serializeForJSON(recommendations);
  },

  async getUserReadingHistory(userId: string) {
    return await prisma.userReadingProgress.findMany({
      where: { userId },
      select: {
        novelId: true,
        lastChapterId: true,
        progressPercentage: true,
        novel: {
          include: {
            genres: { include: { genre: true } },
            tags: { include: { tag: true } }
          }
        }
      },
      orderBy: { lastReadAt: 'desc' },
      take: 20
    });
  },

  async analyzeUserPreferences(userId: string, history: any[]) {
    const genreCount: Record<string, number> = {};
    const tagCount: Record<string, number> = {};
    
    // Count genres and tags from reading history
    history.forEach(item => {
      item.novel.genres.forEach((g: any) => {
        genreCount[g.genreId] = (genreCount[g.genreId] || 0) + 1;
      });
      
      item.novel.tags.forEach((t: any) => {
        tagCount[t.tagId] = (tagCount[t.tagId] || 0) + 1;
      });
    });

    // Sort by frequency
    const topGenres = Object.entries(genreCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([id]) => id);
      
    const topTags = Object.entries(tagCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([id]) => id);

    return { genres: topGenres, tags: topTags };
  },

  async findSimilarNovels(preferences: any, excludeIds: string[], limit: number) {
    const { genres, tags } = preferences;

    const novels = await prisma.novel.findMany({
      where: {
        isPublished: true,
        isDeleted: false,
        id: { notIn: excludeIds },
        OR: [
          {
            genres: {
              some: { genreId: { in: genres } }
            }
          },
          {
            tags: {
              some: { tagId: { in: tags } }
            }
          }
        ]
      },
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
      },
      orderBy: [
        { averageRating: 'desc' },
        { totalViews: 'desc' },
        { updatedAt: 'desc' }
      ],
      take: limit
    });

    // Score novels based on matching preferences
    const scoredNovels = novels.map(novel => {
      let score = 0;
      
      // Genre matches
      novel.genres.forEach((g: any) => {
        if (genres.includes(g.genreId)) {
          score += 3; // Higher weight for genre matches
        }
      });
      
      // Tag matches
      novel.tags.forEach((t: any) => {
        if (tags.includes(t.tagId)) {
          score += 1;
        }
      });
      
      // Boost for rating and views
      score += (novel.averageRating || 0) * 0.5;
      score += Math.log10((novel.totalViews || 0) + 1) * 0.3;
      
      return { ...novel, score };
    });

    // Sort by score and return
    return scoredNovels
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  },

  async getPopularNovels(limit: number) {
    const novels = await prisma.novel.findMany({
      where: {
        isPublished: true,
        isDeleted: false
      },
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
      },
      orderBy: [
        { totalViews: 'desc' },
        { averageRating: 'desc' }
      ],
      take: limit
    });

    return novels;
  },

  async getRelatedNovels(novelId: string, limit = 6) {
    // Get the current novel's genres and tags
    const novel = await prisma.novel.findUnique({
      where: { id: novelId },
      include: {
        genres: { select: { genreId: true } },
        tags: { select: { tagId: true } }
      }
    });

    if (!novel) return [];

    const genreIds = novel.genres.map(g => g.genreId);
    const tagIds = novel.tags.map(t => t.tagId);

    // Find novels with similar genres or tags
    const related = await prisma.novel.findMany({
      where: {
        isPublished: true,
        isDeleted: false,
        id: { not: novelId },
        OR: [
          {
            genres: {
              some: { genreId: { in: genreIds } }
            }
          },
          {
            tags: {
              some: { tagId: { in: tagIds } }
            }
          }
        ]
      },
      include: {
        _count: {
          select: {
            chapters: {
              where: { isPublished: true, isDeleted: false }
            }
          }
        }
      },
      orderBy: [
        { averageRating: 'desc' },
        { totalViews: 'desc' }
      ],
      take: limit
    });

    return serializeForJSON(related);
  }
};