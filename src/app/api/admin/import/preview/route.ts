import { NextRequest } from 'next/server'
import { createAdminRoute } from '@/lib/api/middleware'
import { successResponse, errorResponse, handleApiError } from '@/lib/api/utils'
import { documentImportService } from '@/services/documentImportService'

export const POST = createAdminRoute(async (req) => {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const novelId = formData.get('novelId') as string;

    if (!file) return errorResponse('No file provided.', 400);
    if (!novelId) return errorResponse('Novel ID is required.', 400);
    if (!file.name.endsWith('.docx')) return errorResponse('Invalid file type. Only .docx is supported.', 400);
    
    // Add file size validation (e.g., 10MB limit)
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
        return errorResponse(`File size exceeds limit of ${MAX_SIZE / (1024*1024)}MB.`, 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const preview = await documentImportService.createImportPreview(
      buffer,
      file.name,
      novelId
    );

    return successResponse(preview);
  } catch (error) {
    return handleApiError(error);
  }
});