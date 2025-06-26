// src/services/chapterService.ts
import { prisma } from '@/lib/db';
import { generateSlug, calculateReadingTime } from '@/lib/utils';
import { serializePrismaData } from '@/lib/serialization';
import { Prisma } from '@prisma/client';

export const chapterService = {
  async findById(id: string, includeDeleted = false) {
    const chapter = await prisma.chapter.findFirst({
      where: {
        id,
        ...(!includeDeleted && { isDeleted: false })
      },
      include: {
        novel: { select: { id: true, title: true, slug: true, authorId: true } },
        chapterMedia: { include: { media: true }, orderBy: { position: 'asc' } }
      }
    });
    return serializePrismaData(chapter);
  },

  async findByNovelId(novelId: string, options: any) {
    const { page = 1, limit = 20, includeUnpublished = false } = options;
    const where = { novelId, isDeleted: false, ...(includeUnpublished ? {} : { isPublished: true }) };
    const [chapters, total] = await Promise.all([
      prisma.chapter.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { displayOrder: 'asc' }
      }),
      prisma.chapter.count({ where })
    ]);
    return { chapters: serializePrismaData(chapters), total };
  },

  async findBySlugAndChapterNumber(novelSlug: string, chapterNumber: Prisma.Decimal) {
    const novel = await prisma.novel.findUnique({
      where: { slug: novelSlug },
      select: { id: true }
    });

    if (!novel) {
      return null;
    }

    const chapter = await prisma.chapter.findFirst({
      where: {
        novelId: novel.id,
        chapterNumber: chapterNumber,
        isPublished: true,
        isDeleted: false
      },
      include: {
        novel: { select: { id: true, title: true, slug: true, authorId: true } },
      }
    });

    return serializePrismaData(chapter);
  },

  async create(data: any) {
    const slug = generateSlug(data.title);
    const wordCount = data.content.split(/\s+/).length;
    const estimatedReadTime = calculateReadingTime(wordCount);
    
    const lastChapter = await prisma.chapter.findFirst({
      where: { novelId: data.novelId },
      orderBy: { displayOrder: 'desc' },
      select: { displayOrder: true }
    });
    
    const displayOrder = lastChapter ? Number(lastChapter.displayOrder) + 1 : (data.chapterNumber || 1);

    const newChapter = await prisma.chapter.create({
      data: {
        ...data,
        chapterNumber: new Prisma.Decimal(data.chapterNumber),
        displayOrder: new Prisma.Decimal(displayOrder),
        slug,
        wordCount,
        estimatedReadTime,
        status: data.status || 'draft',
        isPublished: data.isPublished || false
      }
    });
    return serializePrismaData(newChapter);
  },

  async update(id: string, data: any) {
    const updateData = { ...data };
    if (data.title) updateData.slug = generateSlug(data.title);
    if (data.content) {
      updateData.wordCount = data.content.split(/\s+/).length;
      updateData.estimatedReadTime = calculateReadingTime(updateData.wordCount);
    }
    if (data.chapterNumber) updateData.chapterNumber = new Prisma.Decimal(data.chapterNumber);
    if (data.displayOrder) updateData.displayOrder = new Prisma.Decimal(data.displayOrder);

    const updatedChapter = await prisma.chapter.update({ where: { id }, data: updateData });
    return serializePrismaData(updatedChapter);
  },

  async softDelete(id: string, deletedBy: string) {
    const result = await prisma.chapter.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date(), deletedBy, isPublished: false }
    });
    return serializePrismaData(result);
  },
  
  async updateViews(id: string, userId?: string, sessionId?: string) {
    // This function is fine as it doesn't return data to the client directly.
  }
};