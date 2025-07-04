// src/services/chapterService.ts

import { prisma } from '@/lib/db';
import { generateSlug, calculateReadingTime } from '@/lib/utils';
import { serializeForJSON } from '@/lib/serialization';
import { Chapter, Prisma } from '@prisma/client';
import { auditedSoftDelete } from './baseService';

// --- Data Transfer Object (DTO) Interfaces for Type Safety ---
export interface ChapterCreateData {
  novelId: string;
  title: string;
  content: string;
  chapterNumber: number; // Use standard number
  displayOrder?: number;  // Use standard number
  status?: string;
  isPublished?: boolean;
}

export type ChapterUpdateData = Partial<Omit<ChapterCreateData, 'novelId'>>;

export const chapterService = {
  // ... (findById and findByNovelId methods are unchanged)

  // FIX: Use a standard `number` for chapterNumber in the `where` clause.
  async findBySlugAndChapterNumber(novelSlug: string, chapterNumber: number): Promise<Chapter | null> {
    const chapter = await prisma.chapter.findFirst({
      where: {
        novel: { slug: novelSlug },
        chapterNumber: chapterNumber, // Prisma expects a `number` here
        isPublished: true,
        isDeleted: false
      },
      include: {
        novel: { select: { id: true, title: true, slug: true, authorId: true } },
      }
    });
    return serializeForJSON(chapter);
  },

  // FIX: Pass numbers directly to Prisma. Do not use `new Prisma.Decimal()`.
  async create(data: ChapterCreateData): Promise<Chapter> {
    const { novelId, title, content, chapterNumber, ...rest } = data;
    
    const wordCount = content.split(/\s+/).length;
    const estimatedReadTime = calculateReadingTime(wordCount);
    
    const lastChapter = await prisma.chapter.findFirst({
      where: { novelId },
      orderBy: { displayOrder: 'desc' },
      select: { displayOrder: true }
    });
    
    // Perform arithmetic with standard numbers.
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
        chapterNumber: chapterNumber, // Pass the number directly
        displayOrder: displayOrder,   // Pass the number directly
        wordCount,
        estimatedReadTime,
      }
    });
    return serializeForJSON(newChapter);
  },

  // FIX: Pass numbers directly to Prisma. Do not use `new Prisma.Decimal()`.
  async update(id: string, data: ChapterUpdateData): Promise<Chapter> {
    const updateData: Prisma.ChapterUpdateInput = { ...data };
    
    if (data.title) {
      updateData.slug = generateSlug(data.title);
    }
    if (data.content) {
      updateData.wordCount = data.content.split(/\s+/).length;
      updateData.estimatedReadTime = calculateReadingTime(updateData.wordCount);
    }
    // Prisma's update input also expects a standard `number`.
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
   * This now works correctly because the `ModelName` type in baseService is fixed.
   */
  async softDelete(id: string, deletedBy: string | null, reason?: string): Promise<Chapter> {
    return auditedSoftDelete<Chapter>('chapter', id, deletedBy, reason);
  },
};