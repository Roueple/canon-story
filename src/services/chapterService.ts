// src/services/chapterService.ts
import { prisma } from '@/lib/db';
import { ChapterStatus } from '@/types';
import { generateSlug, calculateReadingTime } from '@/lib/utils';
import { serializePrismaData } from '@/lib/serialization'; // Ensure this is imported

export const chapterService = {
  async findAll(novelId: string, options: {
    page?: number;
    limit?: number;
    status?: ChapterStatus;
    isPublished?: boolean;
    includeDeleted?: boolean;
  }) {
    const { page = 1, limit = 20, status, isPublished, includeDeleted = false } = options;
    const skip = (page - 1) * limit;

    const where = {
      novelId,
      ...(status && { status }),
      ...(isPublished !== undefined && { isPublished }),
      ...(!includeDeleted && { isDeleted: false })
    };

    const [chaptersData, total] = await Promise.all([ // Renamed to chaptersData
      prisma.chapter.findMany({
        where,
        skip,
        take: limit,
        orderBy: { displayOrder: 'asc' },
        include: {
          chapterMedia: {
            include: { media: true }
          }
        }
      }),
      prisma.chapter.count({ where })
    ]);

    return { chapters: serializePrismaData(chaptersData), total }; // <--- SERIALIZE HERE
  },

  async findById(id: string, includeDeleted = false) {
    const chapter = await prisma.chapter.findFirst({
      where: {
        id,
        ...(!includeDeleted && { isDeleted: false })
      },
      include: {
        novel: {
          select: { id: true, title: true, slug: true, authorId: true }
        },
        chapterMedia: {
          include: { media: true },
          orderBy: { position: 'asc' }
        }
      }
    });
    return serializePrismaData(chapter); // <--- SERIALIZE HERE
  },

  async create(data: {
    novelId: string;
    title: string;
    content: string;
    chapterNumber: number; // Expect number from input
    status?: ChapterStatus;
    isPublished?: boolean;
  }) {
    const slug = generateSlug(data.title);
    const wordCount = data.content.split(/\s+/).length;
    const estimatedReadTime = calculateReadingTime(wordCount);
    
    const lastChapter = await prisma.chapter.findFirst({
      where: { novelId: data.novelId },
      orderBy: { displayOrder: 'desc' },
      select: { displayOrder: true }
    });
    
    // displayOrder will be Decimal if lastChapter.displayOrder is Decimal.
    // Prisma client handles conversion from number to Decimal for create/update.
    const displayOrder = lastChapter 
      ? Number(lastChapter.displayOrder) + 1 
      : data.chapterNumber;

    const createdChapter = await prisma.chapter.create({ // Renamed to createdChapter
      data: {
        ...data, // chapterNumber is passed as number, Prisma handles it
        slug,
        wordCount,
        estimatedReadTime,
        displayOrder, // displayOrder is passed as number, Prisma handles it
        status: data.status || 'draft',
        isPublished: data.isPublished || false
      }
    });
    return serializePrismaData(createdChapter); // <--- SERIALIZE HERE
  },

  async update(id: string, data: {
    title?: string;
    content?: string;
    chapterNumber?: number; // Expect number from input
    displayOrder?: number;  // Expect number from input
    status?: ChapterStatus;
    isPublished?: boolean;
  }) {
    const updateData: any = { ...data }; // Prisma handles number to Decimal conversion for these fields
    
    if (data.title) {
      updateData.slug = generateSlug(data.title);
    }
    
    if (data.content) {
      updateData.wordCount = data.content.split(/\s+/).length;
      updateData.estimatedReadTime = calculateReadingTime(updateData.wordCount);
    }

    const updatedChapter = await prisma.chapter.update({ // Renamed to updatedChapter
      where: { id },
      data: updateData
    });
    return serializePrismaData(updatedChapter); // <--- SERIALIZE HERE
  },

  async softDelete(id: string, deletedBy: string) {
    const comments = await prisma.comment.count({
      where: { chapterId: id, isDeleted: false }
    });
    
    if (comments > 0) {
      throw new Error(`Cannot delete chapter with ${comments} active comments`);
    }

    const deletedChapter = await prisma.chapter.update({ // Renamed to deletedChapter
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy,
        isPublished: false
      }
    });
    return serializePrismaData(deletedChapter); // <--- SERIALIZE HERE
  },

  async updateViews(id: string, userId?: string, sessionId?: string) {
    const recentView = await prisma.chapterView.findFirst({
      where: {
        chapterId: id,
        OR: [
          { userId: userId || undefined },
          { sessionId: sessionId || undefined }
        ],
        viewedAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000) 
        }
      }
    });

    if (!recentView) {
      // The transaction itself doesn't return the chapter directly in a way we can easily serialize
      // We can either fetch it again after or just update.
      // For view updates, often just ensuring the update happens is sufficient.
      // If you need to return the updated chapter, you'd fetch it after the transaction.
      await prisma.$transaction([
        prisma.chapterView.create({
          data: {
            chapterId: id,
            userId,
            sessionId,
            ipAddress: '', 
            userAgent: ''  
          }
        }),
        prisma.chapter.update({
          where: { id },
          data: { views: { increment: 1 } }
        })
      ]);
      // If you needed to return the chapter object:
      // const updatedChapter = await this.findById(id);
      // return serializePrismaData(updatedChapter); 
      // For now, let's assume this function doesn't need to return the chapter object.
    }
  }
};