// src/services/novelService.ts

import { prisma } from '@/lib/db';
import { slugify } from '@/lib/utils';
import { serializeForJSON } from '@/lib/serialization';
import { Novel, Prisma } from '@prisma/client';
// Import all necessary functions from our single, unified base service
import { auditedSoftDelete, findByIdGeneric } from './baseService'; 

// --- Data Transfer Object (DTO) Interfaces for Type Safety ---
export interface NovelCreateData {
  title: string;
  authorId: string;
  description?: string;
  status?: string;
  isPublished?: boolean;
  isPremium?: boolean;
  genreIds?: string[];
  tagIds?: string[];
}
export type NovelUpdateData = Partial<NovelCreateData>;

export const novelService = {
  /**
   * Finds all novels with pagination, filtering, and sorting.
   */
  async findAll(options: {
    page?: number;
    limit?: number;
    authorId?: string;
    status?: string;
    isPublished?: boolean;
    includeDeleted?: boolean;
  } = {}) {
    const { page = 1, limit = 20, authorId, status, isPublished, includeDeleted = false } = options;
    
    const where: Prisma.NovelWhereInput = {};
    if (!includeDeleted) where.isDeleted = false;
    if (authorId) where.authorId = authorId;
    if (status) where.status = status;
    if (isPublished !== undefined) where.isPublished = isPublished;

    const [novels, total] = await prisma.$transaction([
      prisma.novel.findMany({
        where,
        include: {
          author: { select: { id: true, displayName: true, username: true } },
          _count: { select: { chapters: { where: { isDeleted: false, isPublished: true } } } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.novel.count({ where }),
    ]);

    return { novels: serializeForJSON(novels), total };
  },

  /**
   * Finds a single novel by its ID with specific related data.
   */
  async findById(id: string, includeDeleted = false): Promise<Novel | null> {
    const novel = await prisma.novel.findFirst({
      where: { id, ...(!includeDeleted && { isDeleted: false }) },
      include: {
        author: { select: { id: true, displayName: true, username: true } },
        chapters: { where: { isDeleted: false }, orderBy: { displayOrder: 'asc' } },
        genres: { select: { genre: { select: { id: true, name: true, slug: true } } } },
        tags: { select: { tag: { select: { id: true, name: true } } } },
      },
    });
    return serializeForJSON(novel);
  },

  /**
   * Finds a published novel by its unique slug.
   */
  async findBySlug(slug: string): Promise<Novel | null> {
    const novel = await prisma.novel.findFirst({
      where: {
        slug,
        isPublished: true,
        isDeleted: false,
      },
      include: {
        author: { select: { id: true, displayName: true, username: true } },
        chapters: { where: { isPublished: true, isDeleted: false }, orderBy: { displayOrder: 'asc' } },
        genres: { include: { genre: true } },
        tags: { include: { tag: true } },
      },
    });
    return serializeForJSON(novel);
  },

  /**
   * Creates a new novel with its relations.
   */
  async create(data: NovelCreateData): Promise<Novel> {
    const { genreIds, tagIds, authorId, ...novelData } = data;
    const slug = await this.generateUniqueSlug(novelData.title);

    const createPayload: Prisma.NovelCreateInput = {
      ...novelData,
      slug,
      author: { connect: { id: authorId } },
    };

    if (genreIds?.length) {
      createPayload.genres = { create: genreIds.map((id) => ({ genre: { connect: { id } } })) };
    }
    if (tagIds?.length) {
      createPayload.tags = { create: tagIds.map((id) => ({ tag: { connect: { id } } })) };
    }

    const novel = await prisma.novel.create({ data: createPayload });
    return serializeForJSON(novel);
  },

  /**
   * Updates an existing novel and its relations.
   */
  async update(id: string, data: NovelUpdateData): Promise<Novel> {
    const { genreIds, tagIds, ...novelData } = data;
    const updatePayload: Prisma.NovelUpdateInput = { ...novelData };

    if (genreIds !== undefined) {
      updatePayload.genres = {
        deleteMany: {},
        create: genreIds.map((genreId) => ({ genre: { connect: { id: genreId } } })),
      };
    }
    if (tagIds !== undefined) {
      updatePayload.tags = {
        deleteMany: {},
        create: tagIds.map((tagId) => ({ tag: { connect: { id: tagId } } })),
      };
    }

    const novel = await prisma.novel.update({ where: { id }, data: updatePayload });
    return serializeForJSON(novel);
  },

  /**
   * Soft-deletes a novel and creates audit logs.
   */
  async softDelete(id: string, deletedBy: string | null, reason?: string): Promise<Novel> {
    return auditedSoftDelete<Novel>('novel', id, deletedBy, reason);
  },

  /**
   * A utility method to generate a unique slug for a novel title.
   */
  async generateUniqueSlug(title: string, excludeId?: string): Promise<string> {
    let slug = slugify(title);
    let counter = 1;
    while (true) {
      const where: Prisma.NovelWhereInput = { slug };
      if (excludeId) {
        where.id = { not: excludeId };
      }
      const existing = await prisma.novel.findFirst({ where: { slug } });
      if (!existing) {
        break;
      }
      slug = `${slugify(title)}-${counter++}`;
    }
    return slug;
  },
};