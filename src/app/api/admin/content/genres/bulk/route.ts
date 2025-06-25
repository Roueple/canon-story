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