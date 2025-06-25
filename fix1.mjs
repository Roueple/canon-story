// fix_genres.mjs
import fs from 'fs/promises';
import path from 'path';

// --- Helper Function ---
async function writeFile(filePath, content) {
    try {
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, content.trim(), 'utf-8');
        console.log(`✅ Fixed/Created: ${filePath}`);
    } catch (error) {
        console.error(`❌ Error writing file ${filePath}:`, error);
    }
}

// --- File Content Definitions ---

const newGenreService = `
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
      throw new Error(\`Cannot delete genre. It is currently assigned to \${novelsCount} novel(s).\`);
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
`;

const updatedPublicGenresRoute = `
// src/app/api/public/genres/route.ts
import { NextRequest } from 'next/server';
import { successResponse, handleApiError } from '@/lib/api/utils';
import { genreService } from '@/services/genreService';

export async function GET(req: NextRequest) {
  try {
    // Correctly call the service to only get active genres for the public view.
    const genres = await genreService.findAll({ isActive: true });
    return successResponse(genres);
  } catch (error) {
    return handleApiError(error);
  }
}
`;

const adminGenresRoute = `
// src/app/api/admin/content/genres/route.ts
import { NextRequest } from 'next/server';
import { createAdminRoute } from '@/lib/api/middleware';
import { successResponse, errorResponse, handleApiError } from '@/lib/api/utils';
import { genreService } from '@/services/genreService';

// GET all genres for the admin panel
export const GET = createAdminRoute(async (req) => {
  try {
    // No options are passed, so it will fetch all genres (active and inactive)
    const genres = await genreService.findAll(); 
    return successResponse(genres);
  } catch (error) {
    return handleApiError(error);
  }
});

// POST to create a new genre
export const POST = createAdminRoute(async (req) => {
  try {
    const body = await req.json();
    const { name, description, color } = body;
    if (!name || !color) {
      return errorResponse('Name and color are required', 400);
    }
    const genre = await genreService.create({ name, description, color });
    return successResponse(genre, 201);
  } catch (error) {
    return handleApiError(error);
  }
});
`;

const adminGenreIdRoute = `
// src/app/api/admin/content/genres/[id]/route.ts
import { NextRequest } from 'next/server';
import { createAdminRoute } from '@/lib/api/middleware';
import { successResponse, errorResponse, handleApiError } from '@/lib/api/utils';
import { genreService } from '@/services/genreService';

// GET a single genre by ID
export const GET = createAdminRoute(async (req, { params }) => {
  try {
    const { id } = await params;
    const genre = await genreService.findById(id);
    if (!genre) return errorResponse('Genre not found', 404);
    return successResponse(genre);
  } catch (error) {
    return handleApiError(error);
  }
});

// PUT to update a genre
export const PUT = createAdminRoute(async (req, { params }) => {
  try {
    const { id } = await params;
    const body = await req.json();
    const genre = await genreService.update(id, body);
    return successResponse(genre);
  } catch (error) {
    return handleApiError(error);
  }
});

// DELETE a genre
export const DELETE = createAdminRoute(async (req, { params }) => {
  try {
    const { id } = await params;
    await genreService.delete(id);
    return successResponse({ message: 'Genre deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
});
`;

const adminGenreBulkRoute = `
// src/app/api/admin/content/genres/bulk/route.ts
import { NextRequest } from 'next/server';
import { createAdminRoute } from '@/lib/api/middleware';
import { successResponse, errorResponse, handleApiError } from '@/lib/api/utils';
import { genreService } from '@/services/genreService';
import * as XLSX from 'xlsx';

export const POST = createAdminRoute(async (req) => {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) return errorResponse('No file provided.', 400);
    if (!file.name.endsWith('.xlsx')) return errorResponse('Invalid file type. Only .xlsx is supported.', 400);

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames.find(name => name.toLowerCase() === 'genres');
    if (!sheetName) {
        return errorResponse('Sheet named "Genres" not found in the Excel file.', 400);
    }
    const sheet = workbook.Sheets[sheetName];
    const genresData = XLSX.utils.sheet_to_json(sheet) as Array<{ name: string; description?: string; color?: string; }>;

    const result = await genreService.bulkCreate(genresData);
    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
});
`;

const adminGenreTemplateRoute = `
// src/app/api/admin/content/genres/template/route.ts
import { NextResponse } from 'next/server';
import { createAdminRoute } from '@/lib/api/middleware';
import { genreService } from '@/services/genreService';

export const GET = createAdminRoute(async (req) => {
  try {
    const buffer = genreService.generateBulkUploadTemplate();
    
    const headers = new Headers();
    headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    headers.set('Content-Disposition', 'attachment; filename="genre_upload_template.xlsx"');

    return new NextResponse(buffer, { status: 200, headers });
  } catch (error: any) {
    console.error("Error generating genre template:", error);
    return NextResponse.json({ success: false, error: "Failed to generate template." }, { status: 500 });
  }
});
`;

// --- Main Execution ---
async function main() {
    console.log('🚀 Applying fix for admin genres display...');

    await writeFile('src/services/genreService.ts', newGenreService);
    await writeFile('src/app/api/public/genres/route.ts', updatedPublicGenresRoute);
    await writeFile('src/app/api/admin/content/genres/route.ts', adminGenresRoute);
    await writeFile('src/app/api/admin/content/genres/[id]/route.ts', adminGenreIdRoute);
    await writeFile('src/app/api/admin/content/genres/bulk/route.ts', adminGenreBulkRoute);
    await writeFile('src/app/api/admin/content/genres/template/route.ts', adminGenreTemplateRoute);

    console.log('\\n\\n✅ Fix script completed successfully!');
    console.log('Summary of changes:');
    console.log('  - Updated `genreService` to be more flexible.');
    console.log('  - Created a full set of admin API routes for genres.');
    console.log('  - Cleaned up the public API route for genres.');
    console.log('\\nPlease restart your development server to see the changes.');
}

main().catch(console.error);