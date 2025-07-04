// src/services/tagService.ts
import { prisma } from '@/lib/db';
import { serializeForJSON } from '@/lib/serialization';
import { deleteGeneric, findByIdGeneric } from './baseService';
import { Tag } from '@prisma/client';

export const tagService = {
  async findAll(options?: { type?: string; isActive?: boolean }) {
    const where: any = {};
    if (options?.type) where.type = options.type;
    if (options?.isActive !== undefined) where.isActive = options.isActive;

    const tags = await prisma.tag.findMany({
      where,
      include: { _count: { select: { novels: true } } },
      orderBy: [{ usageCount: 'desc' }, { name: 'asc' }],
    });
    
    return serializeForJSON(tags.map(tag => ({ ...tag, usageCount: tag._count.novels })));
  },

  /**
   * Finds a single tag by its ID.
   * REFACTORED: Uses the generic findById function.
   */
  async findById(id: string): Promise<Tag | null> {
    const tag = await findByIdGeneric<Tag>('tag', id, { _count: { select: { novels: true } } });
    if (tag) {
        (tag as any).usageCount = (tag as any)._count.novels;
    }
    return tag;
  },

  async create(data: { name: string; type: string; color?: string }): Promise<Tag> {
    const tag = await prisma.tag.create({
      data: {
        name: data.name.trim(),
        type: data.type,
        color: data.color || '#9CA3AF',
      },
    });
    return serializeForJSON(tag);
  },

  async update(id: string, data: { name?: string; type?: string; color?: string; isActive?: boolean }): Promise<Tag> {
    const tag = await prisma.tag.update({ where: { id }, data });
    return serializeForJSON(tag);
  },

  /**
   * Deletes a tag after checking dependencies.
   * REFACTORED: Uses the generic delete function.
   */
  async delete(id: string): Promise<{ message: string }> {
    const usageCount = await prisma.novelTag.count({ where: { tagId: id } });
    if (usageCount > 0) {
      throw new Error(`Cannot delete tag: It is currently used by ${usageCount} novel(s).`);
    }
    await deleteGeneric('tag', id);
    return { message: "Tag deleted successfully" };
  },
};