// src/app/api/admin/media/signature/route.ts
import { createAdminRoute } from '@/lib/api/middleware';
import { successResponse, handleApiError } from '@/lib/api/utils';
import { mediaService } from '@/services/mediaService';

// POST: Get a signature for direct client-side uploads
export const POST = createAdminRoute(async () => {
    try {
        const signatureData = mediaService.getUploadSignature();
        return successResponse(signatureData);
    } catch (error) {
        return handleApiError(error);
    }
});