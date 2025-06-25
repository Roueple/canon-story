// src/services/tagService.ts
import { prisma } from '@/lib/db';
import { serializeForJSON } from '@/lib/serialization';

export const tagService = {
  async findAll(options?: { type?: string; isActive?: boolean }) {
    const where: any = {};
    if (options?.type) where.type = options.type;
    if (options?.isActive !== undefined) where.isActive = options.isActive;

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
    return serializeForJSON(tags);
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
    await prisma.tag.delete({
      where: { id }
    });
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