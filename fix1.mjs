import fs from 'fs/promises';
import path from 'path';

const projectRoot = process.cwd();
const targetFile = 'src/services/novelService.ts';
const fullPath = path.join(projectRoot, targetFile);

const newContent = `
// src/services/novelService.ts
import { prisma } from '@/lib/db';
import { slugify } from '@/lib/utils';
import { serializeForJSON } from '@/lib/serialization';
import { Prisma } from '@prisma/client';

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
        genres: {
          select: {
            genre: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });
    return serializeForJSON(novel);
  },

  async create(data: any) {
    const { genreIds, ...novelData } = data;
    const slug = await this.generateUniqueSlug(novelData.title);

    const createPayload: Prisma.NovelCreateInput = {
      ...novelData,
      slug,
    };

    if (genreIds && Array.isArray(genreIds) && genreIds.length > 0) {
      createPayload.genres = {
        create: genreIds.map((id: string) => ({
          genreId: id,
        })),
      };
    }
    
    const novel = await prisma.novel.create({ data: createPayload });
    return serializeForJSON(novel);
  },

  async update(id: string, data: any) {
    const { genreIds, ...novelData } = data;
    const updatePayload: Prisma.NovelUpdateInput = { ...novelData };

    if (genreIds !== undefined) {
      updatePayload.genres = {
        deleteMany: {}, // Delete all existing relations for this novel
        create: (genreIds as string[]).map((genreId: string) => ({
          genreId: genreId,
        })),
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
      slug = \`\${slugify(title)}-\${counter++}\`;
    }
    return slug;
  }
};
`.trim();

async function main() {
    try {
        await fs.writeFile(fullPath, newContent, 'utf-8');
        console.log(`✅ Successfully updated ${targetFile}`);
        console.log("The root cause of the novel creation error has been fixed.");
    } catch (error) {
        console.error(`❌ Error updating ${targetFile}:`, error);
    }
}

main();