// src/app/api/admin/media/[id]/route.ts
import { createAdminRoute } from '@/lib/api/middleware';
import { successResponse, errorResponse, handleApiError } from '@/lib/api/utils';
import { mediaService } from '@/services/mediaService';

// DELETE: Soft-delete a media file
export const DELETE = createAdminRoute(async (req, { params }) => {
    try {
        const { id } = params;
        if (!id) return errorResponse('Media ID is required', 400);
        const result = await mediaService.delete(id);
        return successResponse(result);
    } catch (error) {
        return handleApiError(error);
    }
});