import { NextRequest } from 'next/server';
import { createAdminRoute } from '@/lib/api/middleware';
import { successResponse, errorResponse, handleApiError } from '@/lib/api/utils';
import { documentImportService } from '@/services/documentImportService';

export const POST = createAdminRoute(async (req, { user }) => { // user is available if needed for audit logs etc.
  try {
    const { novelId, chapters, importRecordId } = await req.json();

    if (!novelId || !importRecordId || !chapters || !Array.isArray(chapters) /* chapters.length === 0 is now allowed if all were conflicts */) {
      return errorResponse('Invalid request data: novelId, importRecordId, and chapters array are required.', 400);
    }
    if (chapters.length > 50) {
        return errorResponse('Cannot process more than 50 chapters in a single bulk import.', 400);
    }

    const result = await documentImportService.processBulkImport(
      chapters,
      novelId,
      user.id, // uploaderId
      importRecordId
    );

    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
});