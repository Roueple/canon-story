import { NextRequest } from 'next/server';
import { createAdminRoute } from '@/lib/api/middleware';
import { successResponse, errorResponse, handleApiError } from '@/lib/api/utils';
import { documentImportService } from '@/services/documentImportService';

export const POST = createAdminRoute(async (req, { user }) => {
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
    const chaptersFromFile = await documentImportService.parseBulkUploadFile(buffer);
    const uploaderId = user.id;

    if (chaptersFromFile.length === 0) {
      // Create a DocumentImport record indicating no chapters found in file
      const emptyImportRecord = await prisma.documentImport.create({
        data: {
          filename: file.name,
          originalSize: file.size,
          mimeType: file.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          novelId,
          uploadedBy: uploaderId,
          status: 'failed', // Or 'empty' if you want a specific status
          errorMessage: 'No valid chapters found in the uploaded Excel file.',
          extractedContent: { chapters: [], conflicts: [] },
          importSettings: { type: 'bulk-excel' },
          processingStarted: new Date(),
          processingCompleted: new Date(),
        }
      });
      // Return a specific response that client can interpret as "empty file"
      return successResponse({
        importRecordId: emptyImportRecord.id,
        chapters: [],
        conflicts: [],
        message: 'No valid chapters found in the file.'
      });
    }

    // If chapters are found, proceed to check conflicts and create preview record
    const { chapters: previewableChapters, conflicts } = await documentImportService.createBulkImportPreview(chaptersFromFile, novelId);

    // Create DocumentImport record for the preview
    const importRecord = await prisma.documentImport.create({
      data: {
        filename: file.name,
        originalSize: file.size,
        mimeType: file.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        novelId,
        uploadedBy: uploaderId,
        status: 'previewing', // Ready for user confirmation
        // Store the full list of chapters from file and conflicts for reference
        extractedContent: { chapters: chaptersFromFile, conflicts }, 
        importSettings: { type: 'bulk-excel' },
        processingStarted: new Date(), // Marks the start of preview generation
      }
    });

    const previewResponse = {
      importRecordId: importRecord.id,
      // Send only the chapters that can be imported (or all, and let client filter by conflicts)
      // For now, send all chapters as parsed, client can use conflicts info.
      chapters: chaptersFromFile, 
      conflicts,
    };
    return successResponse(previewResponse);
  
  } catch (error) {
    return handleApiError(error);
  }
});