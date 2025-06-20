import { NextRequest } from 'next/server';
import { createAdminRoute } from '@/lib/api/middleware';
import { successResponse, errorResponse, handleApiError } from '@/lib/api/utils';
import { documentImportService } from '@/services/documentImportService';

export const POST = createAdminRoute(async (req) => {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const novelId = formData.get('novelId') as string;

    if (!file) return errorResponse('No file provided.', 400);
    if (!novelId) return errorResponse('Novel ID is required.', 400);
    if (!file.name.endsWith('.xlsx')) return errorResponse('Invalid file type. Only .xlsx is supported.', 400);

    // Add file size validation (e.g., 5MB limit for Excel)
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
        return errorResponse(`File size exceeds limit of ${MAX_SIZE / (1024*1024)}MB.`, 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const chapters = await documentImportService.parseBulkUploadFile(buffer);
    const preview = await documentImportService.createBulkImportPreview(chapters, novelId);

    return successResponse(preview);
  } catch (error) {
    return handleApiError(error);
  }
});