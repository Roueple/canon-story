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
      throw new Error(`Cannot delete genre. It is currently assigned to ${novelsCount} novel(s).`);
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