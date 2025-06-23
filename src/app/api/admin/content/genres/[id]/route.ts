// src/app/api/admin/content/genres/[id]/route.ts
import { createAdminRoute } from '@/lib/api/middleware';
import { successResponse, errorResponse, handleApiError } from '@/lib/api/utils';
import { genreService } from '@/services/genreService';

export const GET = createAdminRoute(async (req, { params }) => {
  try {
    const { id } = params;
    const genre = await genreService.findById(id);
    if (!genre) return errorResponse('Genre not found', 404);
    return successResponse(genre);
  } catch (error) {
    return handleApiError(error);
  }
});

export const PUT = createAdminRoute(async (req, { params }) => {
  try {
    const { id } = params;
    const body = await req.json();
    const updatedGenre = await genreService.update(id, body);
    return successResponse(updatedGenre);
  } catch (error) {
    return handleApiError(error);
  }
});

export const DELETE = createAdminRoute(async (req, { params }) => {
  try {
    const { id } = params;
    await genreService.delete(id);
    return successResponse({ message: 'Genre deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
});