import { NextRequest } from 'next/server';
import { createAdminRoute } from '@/lib/api/middleware';
import { successResponse, errorResponse, handleApiError } from '@/lib/api/utils';
import { documentImportService } from '@/services/documentImportService';

export const POST = createAdminRoute(async (req, { user }) => { // user is available if needed for audit logs etc.
  try {
    const { novelId, chapters } = await req.json();

    if (!novelId || !chapters || !Array.isArray(chapters) || chapters.length === 0) {
      return errorResponse('Invalid request data: novelId and a non-empty chapters array are required.', 400);
    }
    if (chapters.length > 50) {
        return errorResponse('Cannot process more than 50 chapters in a single bulk import.', 400);
    }

    const result = await documentImportService.processBulkImport(
      chapters,
      novelId
      // userId if you add createdBy/updatedBy to Chapter schema
    );

    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
});