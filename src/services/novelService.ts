// src/services/novelService.ts
import { prisma } from '@/lib/db';
import { slugify } from '@/lib/utils';
import { serializeForJSON } from '@/lib/serialization';

// This service now strictly enforces that all outgoing data is serialized.

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
      }
    });
    return serializeForJSON(novel);
  },

  async create(data: any) {
    const slug = await this.generateUniqueSlug(data.title);
    const novel = await prisma.novel.create({ data: { ...data, slug } });
    return serializeForJSON(novel);
  },

  async update(id: string, data: any) {
    const novel = await prisma.novel.update({ where: { id }, data });
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
