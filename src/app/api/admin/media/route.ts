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
        const { mediaFiles, total } = await mediaService.findAll({ page, limit, search });
        return paginatedResponse(mediaFiles, page, limit, total);
    } catch (error) {
        return handleApiError(error);
    }
});

// PUT: Save media metadata after a client-side upload
export const PUT = createAdminRoute(async (req, { user }) => {
    try {
        const body = await req.json();
        const mediaFile = await mediaService.saveUploadedMedia({ ...body, uploadedBy: user.id });
        return successResponse(mediaFile, 201);
    } catch (error) {
        return handleApiError(error);
    }
});