// src/app/api/admin/import/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createAdminRoute } from '@/lib/api/middleware';
import { successResponse, errorResponse, handleApiError } from '@/lib/api/utils';
import { documentImportService } from '@/services/documentImportService';

export const POST = createAdminRoute(async (req, { user }) => {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const novelId = formData.get('novelId') as string;
    const settings = JSON.parse(formData.get('settings') as string || '{}');

    if (!file) {
      return errorResponse('No file provided', 400);
    }

    // Validate file type
    if (!file.name.endsWith('.docx')) {
      return errorResponse('Only DOCX files are supported', 400);
    }

    // File size limit (25MB for Cloudinary free tier)
    const maxSize = 25 * 1024 * 1024;
    if (file.size > maxSize) {
      return errorResponse('File size exceeds 25MB limit', 400);
    }

    // Convert to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload DOCX to Cloudinary for temporary storage
    const cloudinaryUrl = await documentImportService.uploadDocxToCloudinary(buffer, file.name);

    // Create import record
    const importId = await documentImportService.createImportRecord(
      file.name,
      file.size,
      file.type || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      user.id,
      novelId,
      cloudinaryUrl,
      settings
    );

    // Process immediately in the background
    // In production, you might want to use Vercel's Edge Functions or similar
    documentImportService.processImport(importId).catch(error => {
      console.error('Import processing error:', error);
    });

    return successResponse({ importId }, 201);
  } catch (error) {
    return handleApiError(error);
  }
});

export const config = {
  runtime: 'nodejs',
  maxDuration: 30, // Allow longer execution for file processing
};