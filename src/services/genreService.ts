// src/services/genreService.ts
import { prisma } from '@/lib/db';
import { generateSlug } from '@/lib/utils';
import { serializeForJSON } from '@/lib/serialization';
import * as XLSX from 'xlsx';

export const genreService = {
  async findAll(options?: { isActive?: boolean }) {
    const where: { isActive?: boolean } = {};
    if (options?.isActive !== undefined) {
      where.isActive = options.isActive;
    }

    const genres = await prisma.genre.findMany({
      where,
      include: {
        _count: {
          select: { novels: true }
        }
      },
      orderBy: { sortOrder: 'asc' }
    });
    return serializeForJSON(genres);
  },

  async findById(id: string) {
    const genre = await prisma.genre.findUnique({
      where: { id },
    });
    return serializeForJSON(genre);
  },

  async create(data: { name: string; description?: string; color: string; }) {
    const slug = generateSlug(data.name);
    const newGenre = await prisma.genre.create({
      data: {
        ...data,
        slug,
      }
    });
    return serializeForJSON(newGenre);
  },

  async update(id: string, data: { name?: string; description?: string; color?: string; }) {
    const updateData: { name?: string; description?: string; color?: string; slug?: string } = { ...data };
    if (data.name) {
      updateData.slug = generateSlug(data.name);
    }
    const updatedGenre = await prisma.genre.update({
      where: { id },
      data: updateData
    });
    return serializeForJSON(updatedGenre);
  },

  async delete(id: string) {
    const novelsCount = await prisma.novelGenre.count({ where: { genreId: id } });
    if (novelsCount > 0) {
      throw new Error(`Cannot delete genre. It is currently assigned to ${novelsCount} novel(s).`);
    }
    return await prisma.genre.delete({ where: { id } });
  },

  async bulkCreate(genresData: Array<{ name: string; description?: string; color?: string; }>) {
    const existingGenres = await prisma.genre.findMany({
      where: { name: { in: genresData.map(g => g.name) } },
      select: { name: true }
    });
    const existingNames = new Set(existingGenres.map(g => g.name.toLowerCase()));

    const toCreate = genresData.filter(g => g.name && !existingNames.has(g.name.toLowerCase()));

    if (toCreate.length > 0) {
      const dataToInsert = toCreate.map(g => ({
        name: g.name,
        description: g.description || '',
        color: g.color || '#6B7280',
        slug: generateSlug(g.name),
        isActive: true,
      }));
      await prisma.genre.createMany({
        data: dataToInsert,
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
      ['1. name: Text. The name of the genre. Required.'],
      ['2. description: Text. A short description. Optional.'],
      ['3. color: Hex color code (e.g., #EF4444). Optional.'],
    ];
    const ws_instructions = XLSX.utils.aoa_to_sheet(instructions);
    XLSX.utils.book_append_sheet(wb, ws_instructions, 'Instructions');
    
    const chapters_data = [
      ['name', 'description', 'color'],
      ['New Genre 1', 'Description for genre 1.', '#8B5CF6'],
      ['New Genre 2', 'Description for genre 2.', '#EC4899'],
    ];
    const ws_chapters = XLSX.utils.aoa_to_sheet(chapters_data);
    ws_chapters['!cols'] = [ {wch: 30}, {wch: 60}, {wch: 15} ];
    XLSX.utils.book_append_sheet(wb, ws_chapters, 'Genres');
    
    return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
  }
};