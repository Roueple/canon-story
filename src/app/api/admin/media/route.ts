// src/app/api/admin/media/route.ts
import { NextRequest } from 'next/server';
import { createAdminRoute } from '@/lib/api/middleware';
import { successResponse, handleApiError, paginatedResponse, getPaginationParams } from '@/lib/api/utils';
import { mediaService } from '@/services/mediaService';

// GET: List all media files
export const GET = createAdminRoute(async (req) => {
    try {
        const { page, limit } = getPaginationParams(req.nextUrl.searchParams);
        const search = req.nextUrl.searchParams.get('search') || undefined;
        const novelId = req.nextUrl.searchParams.get('novelId') || undefined;
        const category = req.nextUrl.searchParams.get('category') || undefined;
        const { mediaFiles, total } = await mediaService.findAll({ page, limit, search, novelId, category });
        return paginatedResponse(mediaFiles, page, limit, total);
    } catch (error) {
        return handleApiError(error);
    }
});

// PUT: Save media metadata after a client-side upload
export const PUT = createAdminRoute(async (req, { user }) => {
    try {
        const { publicId, originalName, mimeType, fileSize, width, height, url, thumbnailUrl, category, novelId } = await req.json();
        const mediaFile = await mediaService.saveUploadedMedia({
            publicId,
            originalName,
            mimeType,
            fileSize,
            width,
            height,
            url,
            thumbnailUrl,
            uploadedBy: user.id,
            category,
            novelId,
        });
        return successResponse(mediaFile, 201);
    } catch (error) {
        return handleApiError(error);
    }
});