// src/app/api/admin/content/genres/bulk/route.ts
import { createAdminRoute } from '@/lib/api/middleware';
import { successResponse, errorResponse, handleApiError } from '@/lib/api/utils';
import { genreService } from '@/services/genreService';
import * as XLSX from 'xlsx';

export const POST = createAdminRoute(async (req) => {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return errorResponse('No file provided.', 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet) as Array<{ name: string; description?: string; color?: string; }>;

    if (data.length === 0) {
        return errorResponse('The Excel file is empty or has no data.', 400);
    }

    const result = await genreService.bulkCreate(data);
    
    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
});