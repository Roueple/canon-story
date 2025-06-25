
// src/services/novelService.ts
import { prisma } from '@/lib/db';
import { slugify } from '@/lib/utils';
import { serializeForJSON } from '@/lib/serialization';
import { Prisma } from '@prisma/client';

export const novelService = {
  async findAll(options: {
    page?: number;
    limit?: number;
    authorId?: string;
    status?: string;
    isPublished?: boolean;
    includeDeleted?: boolean;
  } = {}) {
    const { page = 1, limit = 20, authorId, status, isPublished, includeDeleted = false } = options;
    const where: any = {};
    if (!includeDeleted) where.isDeleted = false;
    if (authorId) where.authorId = authorId;
    if (status) where.status = status;
    if (isPublished !== undefined) where.isPublished = isPublished;

    const [novels, total] = await Promise.all([
      prisma.novel.findMany({
        where,
        include: {
          author: { select: { id: true, displayName: true, username: true } },
          _count: { select: { chapters: { where: { isDeleted: false } } } }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { updatedAt: 'desc' }
      }),
      prisma.novel.count({ where })
    ]);

    return { novels: serializeForJSON(novels), total };
  },

  async findById(id: string, includeDeleted = false) {
    const novel = await prisma.novel.findFirst({
      where: { id, ...(!includeDeleted && { isDeleted: false }) },
      include: {
        author: { select: { id: true, displayName: true, username: true } },
        chapters: { where: { isDeleted: false }, orderBy: { displayOrder: 'asc' } },
        genres: { select: { genre: { select: { id: true, name: true } } } },
        // --- FIX: Include tags in the query ---
        tags: { select: { tag: { select: { id: true, name: true } } } }
      }
    });
    return serializeForJSON(novel);
  },

  async create(data: any) {
    const { genreIds, tagIds, ...novelData } = data;
    const slug = await this.generateUniqueSlug(novelData.title);

    const createPayload: Prisma.NovelCreateInput = {
      ...novelData,
      author: { connect: { id: novelData.authorId } },
      slug,
    };

    if (genreIds && Array.isArray(genreIds) && genreIds.length > 0) {
      createPayload.genres = {
        create: genreIds.map((id: string) => ({ genreId: id })),
      };
    }
    // --- FIX: Add logic to create tag relations ---
    if (tagIds && Array.isArray(tagIds) && tagIds.length > 0) {
      createPayload.tags = {
        create: tagIds.map((id: string) => ({ tagId: id })),
      };
    }
    
    const novel = await prisma.novel.create({ data: createPayload });
    return serializeForJSON(novel);
  },

  async update(id: string, data: any) {
    const { genreIds, tagIds, ...novelData } = data;
    const updatePayload: Prisma.NovelUpdateInput = { ...novelData };

    if (genreIds !== undefined) {
      updatePayload.genres = {
        deleteMany: {},
        create: (genreIds as string[]).map((genreId: string) => ({ genreId: genreId })),
      };
    }
    // --- FIX: Add logic to update tag relations ---
    if (tagIds !== undefined) {
      updatePayload.tags = {
        deleteMany: {},
        create: (tagIds as string[]).map((tagId: string) => ({ tagId: tagId })),
      };
    }
    
    const novel = await prisma.novel.update({ 
      where: { id }, 
      data: updatePayload 
    });
    
    return serializeForJSON(novel);
  },

  async softDelete(id: string, deletedBy: string) {
    const result = await prisma.novel.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date(), deletedBy }
    });
    return serializeForJSON(result);
  },

  async generateUniqueSlug(title: string, excludeId?: string): Promise<string> {
    let slug = slugify(title);
    let counter = 1;
    while (true) {
      const where: any = { slug };
      if (excludeId) where.id = { not: excludeId };
      const existing = await prisma.novel.findFirst({ where });
      if (!existing) break;
      slug = `${slugify(title)}-${counter++}`;
    }
    return slug;
  }
};
