// fix.mjs
import fs from 'fs/promises';
import path from 'path';

// --- Helper Functions ---
async function writeFile(filePath, content) {
    try {
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, content.trim(), 'utf-8');
        console.log(`✅ Wrote: ${filePath}`);
    } catch (error) {
        console.error(`❌ Error writing file ${filePath}:`, error);
    }
}

// --- File Content Definitions ---

const chapterServiceContent = `
// src/services/chapterService.ts
import { prisma } from '@/lib/db';
import { generateSlug, calculateReadingTime } from '@/lib/utils';
import { serializeForJSON } from '@/lib/serialization';
import { Chapter, Prisma } from '@prisma/client';
import { auditedSoftDelete, findByIdGeneric } from './baseService';

export interface ChapterCreateData {
  novelId: string;
  title: string;
  content: string;
  chapterNumber: number;
  displayOrder?: number;
  status?: string;
  isPublished?: boolean;
  isPremium?: boolean;
}

export type ChapterUpdateData = Partial<Omit<ChapterCreateData, 'novelId'>>;

export const chapterService = {
  /**
   * Finds a single chapter by its ID.
   * REFACTORED: Uses the generic findById function.
   */
  async findById(id: string, includeNovel = false): Promise<Chapter | null> {
    const include = includeNovel ? { novel: true } : undefined;
    return findByIdGeneric<Chapter>('chapter', id, include);
  },

  /**
   * Finds all chapters for a given novel with pagination.
   */
  async findByNovelId(novelId: string, options: { page?: number; limit?: number; includeUnpublished?: boolean }) {
    const { page = 1, limit = 100, includeUnpublished = false } = options;
    const where: Prisma.ChapterWhereInput = {
      novelId,
      isDeleted: false,
    };
    if (!includeUnpublished) {
      where.isPublished = true;
    }

    const [chapters, total] = await prisma.$transaction([
      prisma.chapter.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { displayOrder: 'asc' },
      }),
      prisma.chapter.count({ where }),
    ]);

    return { chapters: serializeForJSON(chapters), total };
  },
  
  /**
   * Finds a specific chapter by its slug and number.
   */
  async findBySlugAndChapterNumber(novelSlug: string, chapterNumber: number): Promise<Chapter | null> {
    const chapter = await prisma.chapter.findFirst({
      where: {
        novel: { slug: novelSlug },
        chapterNumber: chapterNumber,
        isPublished: true,
        isDeleted: false
      },
      include: {
        novel: { select: { id: true, title: true, slug: true, authorId: true } },
      }
    });
    return serializeForJSON(chapter);
  },

  /**
   * Creates a new chapter. Retains custom logic.
   */
  async create(data: ChapterCreateData): Promise<Chapter> {
    const { novelId, title, content, chapterNumber, ...rest } = data;
    
    const wordCount = content.split(/\\s+/).length;
    const estimatedReadTime = calculateReadingTime(wordCount);
    
    const lastChapter = await prisma.chapter.findFirst({
      where: { novelId },
      orderBy: { displayOrder: 'desc' },
      select: { displayOrder: true }
    });
    
    const displayOrder = lastChapter?.displayOrder 
      ? Number(lastChapter.displayOrder) + 1 
      : data.displayOrder ?? chapterNumber;

    const newChapter = await prisma.chapter.create({
      data: {
        ...rest,
        novel: { connect: { id: novelId } },
        title,
        content,
        slug: generateSlug(title),
        chapterNumber: chapterNumber,
        displayOrder: displayOrder,
        wordCount,
        estimatedReadTime,
      }
    });
    return serializeForJSON(newChapter);
  },

  /**
   * Updates an existing chapter. Retains custom logic.
   */
  async update(id: string, data: ChapterUpdateData): Promise<Chapter> {
    const updateData: Prisma.ChapterUpdateInput = { ...data };
    
    if (data.title) {
      updateData.slug = generateSlug(data.title);
    }
    if (data.content) {
      updateData.wordCount = data.content.split(/\\s+/).length;
      updateData.estimatedReadTime = calculateReadingTime(updateData.wordCount);
    }
    if (data.chapterNumber !== undefined) {
      updateData.chapterNumber = data.chapterNumber;
    }
    if (data.displayOrder !== undefined) {
      updateData.displayOrder = data.displayOrder;
    }

    const updatedChapter = await prisma.chapter.update({ where: { id }, data: updateData });
    return serializeForJSON(updatedChapter);
  },

  /**
   * Soft-deletes a chapter and creates audit logs.
   * REFACTORED: Uses the generic auditedSoftDelete function.
   */
  async softDelete(id: string, deletedBy: string | null, reason?: string): Promise<Chapter> {
    return auditedSoftDelete<Chapter>('chapter', id, deletedBy, reason);
  },
};
`;

const novelServiceContent = `
// src/services/novelService.ts
import { prisma } from '@/lib/db';
import { slugify } from '@/lib/utils';
import { serializeForJSON } from '@/lib/serialization';
import { Novel, Prisma } from '@prisma/client';
import { auditedSoftDelete, findByIdGeneric } from './baseService'; 

export interface NovelCreateData {
  title: string;
  authorId: string;
  description?: string;
  coverColor?: string;
  coverImageUrl?: string;
  status?: string;
  isPublished?: boolean;
  isPremium?: boolean;
  genreIds?: string[];
  tagIds?: string[];
}
export type NovelUpdateData = Partial<Omit<NovelCreateData, 'authorId'>>;

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
   * REFACTORED: Uses the generic findById function.
   */
  async findById(id: string, includeDeleted = false): Promise<Novel | null> {
    const include = {
      author: { select: { id: true, displayName: true, username: true } },
      chapters: { where: { isDeleted: false }, orderBy: { displayOrder: 'asc' } },
      genres: { select: { genre: { select: { id: true, name: true, slug: true } } } },
      tags: { select: { tag: { select: { id: true, name: true } } } },
    };
    // Note: findByIdGeneric doesn't have an includeDeleted param, so we handle it here.
    const novel = await findByIdGeneric<Novel>('novel', id, include);
    if (!novel || (novel.isDeleted && !includeDeleted)) {
        return null;
    }
    return novel;
  },

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
  
  async getIdFromSlug(slug: string): Promise<{id: string, title: string} | null> {
    const novel = await prisma.novel.findUnique({
      where: { slug },
      select: { id: true, title: true }
    });
    return serializeForJSON(novel);
  },

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
   * REFACTORED: Uses the generic auditedSoftDelete function.
   */
  async softDelete(id: string, deletedBy: string | null, reason?: string): Promise<Novel> {
    return auditedSoftDelete<Novel>('novel', id, deletedBy, reason);
  },

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
      slug = \`\${slugify(title)}-\${counter++}\`;
    }
    return slug;
  },
};
`;

const tagServiceContent = `
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
      throw new Error(\`Cannot delete tag: It is currently used by \${usageCount} novel(s).\`);
    }
    await deleteGeneric('tag', id);
    return { message: "Tag deleted successfully" };
  },
};
`;

const genreServiceContent = `
// src/services/genreService.ts
import { prisma } from '@/lib/db';
import { generateSlug } from '@/lib/utils';
import { serializeForJSON } from '@/lib/serialization';
import * as XLSX from 'xlsx';
import { deleteGeneric, findByIdGeneric } from './baseService';
import { Genre } from '@prisma/client';

export const genreService = {
  async findAll(options?: { isActive?: boolean }) {
    const where: { isActive?: boolean } = {};
    if (options?.isActive !== undefined) where.isActive = options.isActive;

    const genres = await prisma.genre.findMany({
      where,
      include: { _count: { select: { novels: true } } },
      orderBy: { sortOrder: 'asc' },
    });
    return serializeForJSON(genres);
  },

  /**
   * Finds a single genre by its ID.
   * REFACTORED: Uses the generic findById function.
   */
  async findById(id: string): Promise<Genre | null> {
    return findByIdGeneric<Genre>('genre', id);
  },

  async create(data: { name: string; description?: string; color: string; }): Promise<Genre> {
    const slug = generateSlug(data.name);
    const newGenre = await prisma.genre.create({ data: { ...data, slug } });
    return serializeForJSON(newGenre);
  },

  async update(id: string, data: { name?: string; description?: string; color?: string; }): Promise<Genre> {
    const updateData: any = { ...data };
    if (data.name) updateData.slug = generateSlug(data.name);
    const updatedGenre = await prisma.genre.update({ where: { id }, data: updateData });
    return serializeForJSON(updatedGenre);
  },

  /**
   * Deletes a genre after checking dependencies.
   * REFACTORED: Uses the generic delete function.
   */
  async delete(id: string): Promise<{ message: string }> {
    const novelsCount = await prisma.novelGenre.count({ where: { genreId: id } });
    if (novelsCount > 0) {
      throw new Error(\`Cannot delete genre. It is currently assigned to \${novelsCount} novel(s).\`);
    }
    await deleteGeneric('genre', id);
    return { message: 'Genre deleted successfully' };
  },

  async bulkCreate(genresData: Array<{ name: string; description?: string; color?: string; }>) {
    const existingGenres = await prisma.genre.findMany({
      where: { name: { in: genresData.map(g => g.name) } },
      select: { name: true },
    });
    const existingNames = new Set(existingGenres.map(g => g.name.toLowerCase()));

    const toCreate = genresData.filter(g => g.name && !existingNames.has(g.name.toLowerCase()));

    if (toCreate.length > 0) {
      await prisma.genre.createMany({
        data: toCreate.map(g => ({
          name: g.name,
          description: g.description || '',
          color: g.color || '#6B7280',
          slug: generateSlug(g.name),
          isActive: true,
        })),
        skipDuplicates: true,
      });
    }
    
    return { created: toCreate.length, skipped: genresData.length - toCreate.length };
  },

  generateBulkUploadTemplate(): Buffer {
    const wb = XLSX.utils.book_new();
    const instructions = [
      ['Genre Bulk Upload Template Instructions'],
      [''],
      ['Sheet: "Genres" - Required Columns:'],
      ['1. name: Text. Required.'],
      ['2. description: Text. Optional.'],
      ['3. color: Hex color code (e.g., #EF4444). Optional.'],
    ];
    const ws_instructions = XLSX.utils.aoa_to_sheet(instructions);
    XLSX.utils.book_append_sheet(wb, ws_instructions, 'Instructions');
    
    const chapters_data = [['name', 'description', 'color']];
    const ws_chapters = XLSX.utils.aoa_to_sheet(chapters_data);
    ws_chapters['!cols'] = [{ wch: 30 }, { wch: 60 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, ws_chapters, 'Genres');
    
    return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
  }
};
`;

// --- Main Execution ---
async function main() {
    console.log('🚀 Systematically refactoring service layer for consistency...');

    await writeFile('src/services/chapterService.ts', chapterServiceContent);
    await writeFile('src/services/novelService.ts', novelServiceContent);
    await writeFile('src/services/tagService.ts', tagServiceContent);
    await writeFile('src/services/genreService.ts', genreServiceContent);
    
    console.log('\n\n✅ Service layer refactoring complete!');
    console.log('Summary of changes:');
    console.log('  - Refactored chapterService.ts to use baseService and added missing methods.');
    console.log('  - Refactored novelService.ts to consistently use baseService.');
    console.log('  - Refactored tagService.ts and genreService.ts to use baseService generics.');
    console.log('  - The entire service layer now follows a consistent, DRY architecture.');
    console.log('\nThe application is now ready for the final cleanup and verification phase.');
}

main().catch(console.error);