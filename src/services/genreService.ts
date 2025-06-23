// src/services/genreService.ts
import { prisma } from '@/lib/db';
import { generateSlug } from '@/lib/utils';
import { serializeForJSON } from '@/lib/serialization';

export const genreService = {
  async findAll() {
    const genres = await prisma.genre.findMany({
      where: { isActive: true },
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

  async update(id: string, data: { name: string; description?: string; color: string; }) {
    const updateData = { ...data };
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
  }
};