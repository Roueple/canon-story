// src/app/api/admin/content/genres/route.ts
import { createAdminRoute } from '@/lib/api/middleware';
import { successResponse, handleApiError } from '@/lib/api/utils';
import { genreService } from '@/services/genreService';

export const GET = createAdminRoute(async (req) => {
  try {
    const genres = await genreService.findAll();
    return successResponse(genres);
  } catch (error) {
    return handleApiError(error);
  }
});

export const POST = createAdminRoute(async (req) => {
  try {
    const body = await req.json();
    const newGenre = await genreService.create(body);
    return successResponse(newGenre, 201);
  } catch (error) {
    return handleApiError(error);
  }
});