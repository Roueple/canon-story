// src/services/tagService.ts
import { prisma } from '@/lib/db';
import { serializeForJSON } from '@/lib/serialization';
import { deleteGeneric, findByIdGeneric, findAllGeneric } from './baseService';
import { Tag, Prisma } from '@prisma/client';

// Type definition for what the service should return. No more 'any'.
type TagWithCount = Tag & { usageCount: number };

export const tagService = {
  async findAll(options?: { type?: string; isActive?: boolean }): Promise<TagWithCount[]> {
    const where: Prisma.TagWhereInput = {};
    if (options?.type) where.type = options.type;
    if (options?.isActive !== undefined) where.isActive = options.isActive;

    const { data: tags } = await findAllGeneric<Tag & { _count: { novels: number } }>('tag', {
        where,
        include: { _count: { select: { novels: true } } },
        orderBy: [{ usageCount: 'desc' }, { name: 'asc' }],
    });
    
    // Map to the final shape, ensuring type safety.
    return tags.map(tag => ({ ...tag, usageCount: tag._count.novels }));
  },

  async findById(id: string): Promise<TagWithCount | null> {
    const tag = await findByIdGeneric<Tag & { _count: { novels: number } }>('tag', id, { 
        include: { _count: { select: { novels: true } } } 
    });
    
    if (!tag) return null;

    // Type-safe mapping
    return { ...tag, usageCount: tag._count.novels };
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

  async delete(id: string): Promise<{ message: string }> {
    const usageCount = await prisma.novelTag.count({ where: { tagId: id } });
    if (usageCount > 0) {
      throw new Error(`Cannot delete tag: It is currently used by ${usageCount} novel(s).`);
    }
    await deleteGeneric('tag', id);
    return { message: "Tag deleted successfully" };
  },
};