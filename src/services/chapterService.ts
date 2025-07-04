// src/services/chapterService.ts
import { prisma } from '@/lib/db';
import { generateSlug, calculateReadingTime } from '@/lib/utils';
import { serializeForJSON } from '@/lib/serialization';
import { Chapter, Prisma } from '@prisma/client';
import { auditedSoftDelete, findByIdGeneric } from './baseService';

export interface ChapterCreateData {
  novelId: string;
  title: string;
  content: string;
  chapterNumber: number;
  displayOrder?: number;
  status?: string;
  isPublished?: boolean;
  isPremium?: boolean;
}

export type ChapterUpdateData = Partial<Omit<ChapterCreateData, 'novelId'>>;

export const chapterService = {
  /**
   * Finds a single chapter by its ID.
   * REFACTORED: Uses the generic findById function.
   */
  async findById(id: string, includeNovel = false): Promise<Chapter | null> {
    const include = includeNovel ? { novel: true } : undefined;
    return findByIdGeneric<Chapter>('chapter', id, include);
  },

  /**
   * Finds all chapters for a given novel with pagination.
   */
  async findByNovelId(novelId: string, options: { page?: number; limit?: number; includeUnpublished?: boolean }) {
    const { page = 1, limit = 100, includeUnpublished = false } = options;
    const where: Prisma.ChapterWhereInput = {
      novelId,
      isDeleted: false,
    };
    if (!includeUnpublished) {
      where.isPublished = true;
    }

    const [chapters, total] = await prisma.$transaction([
      prisma.chapter.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { displayOrder: 'asc' },
      }),
      prisma.chapter.count({ where }),
    ]);

    return { chapters: serializeForJSON(chapters), total };
  },
  
  /**
   * Finds a specific chapter by its slug and number.
   */
  async findBySlugAndChapterNumber(novelSlug: string, chapterNumber: number): Promise<Chapter | null> {
    const chapter = await prisma.chapter.findFirst({
      where: {
        novel: { slug: novelSlug },
        chapterNumber: chapterNumber,
        isPublished: true,
        isDeleted: false
      },
      include: {
        novel: { select: { id: true, title: true, slug: true, authorId: true } },
      }
    });
    return serializeForJSON(chapter);
  },

  /**
   * Creates a new chapter. Retains custom logic.
   */
  async create(data: ChapterCreateData): Promise<Chapter> {
    const { novelId, title, content, chapterNumber, ...rest } = data;
    
    const wordCount = content.split(/\s+/).length;
    const estimatedReadTime = calculateReadingTime(wordCount);
    
    const lastChapter = await prisma.chapter.findFirst({
      where: { novelId },
      orderBy: { displayOrder: 'desc' },
      select: { displayOrder: true }
    });
    
    const displayOrder = lastChapter?.displayOrder 
      ? Number(lastChapter.displayOrder) + 1 
      : data.displayOrder ?? chapterNumber;

    const newChapter = await prisma.chapter.create({
      data: {
        ...rest,
        novel: { connect: { id: novelId } },
        title,
        content,
        slug: generateSlug(title),
        chapterNumber: chapterNumber,
        displayOrder: displayOrder,
        wordCount,
        estimatedReadTime,
      }
    });
    return serializeForJSON(newChapter);
  },

  /**
   * Updates an existing chapter. Retains custom logic.
   */
  async update(id: string, data: ChapterUpdateData): Promise<Chapter> {
    const updateData: Prisma.ChapterUpdateInput = { ...data };
    
    if (data.title) {
      updateData.slug = generateSlug(data.title);
    }
    if (data.content) {
      updateData.wordCount = data.content.split(/\s+/).length;
      updateData.estimatedReadTime = calculateReadingTime(updateData.wordCount);
    }
    if (data.chapterNumber !== undefined) {
      updateData.chapterNumber = data.chapterNumber;
    }
    if (data.displayOrder !== undefined) {
      updateData.displayOrder = data.displayOrder;
    }

    const updatedChapter = await prisma.chapter.update({ where: { id }, data: updateData });
    return serializeForJSON(updatedChapter);
  },

  /**
   * Soft-deletes a chapter and creates audit logs.
   * REFACTORED: Uses the generic auditedSoftDelete function.
   */
  async softDelete(id: string, deletedBy: string | null, reason?: string): Promise<Chapter> {
    return auditedSoftDelete<Chapter>('chapter', id, deletedBy, reason);
  },
};