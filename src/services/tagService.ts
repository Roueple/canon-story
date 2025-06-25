
// src/services/tagService.ts
import { prisma } from '@/lib/db';
import { serializeForJSON } from '@/lib/serialization';

export const tagService = {
  async findAll(options?: { type?: string; isActive?: boolean }) {
    const where: any = {};
    if (options?.type) {
      where.type = options.type;
    }
    // Only add isActive to the where clause if it's actually provided
    if (options?.isActive !== undefined) {
      where.isActive = options.isActive;
    }

    const tags = await prisma.tag.findMany({
      where,
      include: {
        _count: {
          select: { novels: true }
        }
      },
      orderBy: [
        { usageCount: 'desc' },
        { name: 'asc' }
      ]
    });
    
    // Use the real-time count from the relation for accuracy
    const tagsWithRealCount = tags.map(tag => ({
      ...tag,
      usageCount: tag._count.novels
    }));

    return serializeForJSON(tagsWithRealCount);
  },

  async findById(id: string) {
    const tag = await prisma.tag.findUnique({
      where: { id },
      include: {
        _count: {
          select: { novels: true }
        }
      }
    });

    if (tag) {
      // Ensure usageCount is accurate on single-fetch as well
      (tag as any).usageCount = tag._count.novels;
    }
    return serializeForJSON(tag);
  },

  async create(data: { name: string; type: string; color?: string }) {
    const tag = await prisma.tag.create({
      data: {
        name: data.name.trim(),
        type: data.type,
        color: data.color || '#9CA3AF'
      }
    });
    return serializeForJSON(tag);
  },

  async update(id: string, data: { name?: string; type?: string; color?: string; isActive?: boolean }) {
    const tag = await prisma.tag.update({
      where: { id },
      data
    });
    return serializeForJSON(tag);
  },

  async delete(id: string) {
    // 1. Check for dependencies first. This is safer.
    const usageCount = await prisma.novelTag.count({
      where: { tagId: id }
    });

    if (usageCount > 0) {
      throw new Error(`Cannot delete tag: It is currently used by ${usageCount} novel(s).`);
    }

    // 2. If not in use, proceed with deletion.
    await prisma.tag.delete({
      where: { id }
    });
    return { message: "Tag deleted successfully" };
  },

  async updateUsageCount(tagId: string) {
    const count = await prisma.novelTag.count({
      where: { tagId }
    });
    
    await prisma.tag.update({
      where: { id: tagId },
      data: { usageCount: count }
    });
  }
};
