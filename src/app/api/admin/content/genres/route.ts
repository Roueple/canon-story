// src/app/api/admin/content/genres/route.ts
import { NextRequest } from 'next/server';
import { createAdminRoute } from '@/lib/api/middleware';
import { successResponse, errorResponse, handleApiError } from '@/lib/api/utils';
import { genreService } from '@/services/genreService';

// GET all genres for the admin panel
export const GET = createAdminRoute(async (req) => {
  try {
    // No options are passed, so it will fetch all genres (active and inactive)
    const genres = await genreService.findAll(); 
    return successResponse(genres);
  } catch (error) {
    return handleApiError(error);
  }
});

// POST to create a new genre
export const POST = createAdminRoute(async (req) => {
  try {
    const body = await req.json();
    const { name, description, color } = body;
    if (!name || !color) {
      return errorResponse('Name and color are required', 400);
    }
    const genre = await genreService.create({ name, description, color });
    return successResponse(genre, 201);
  } catch (error) {
    return handleApiError(error);
  }
});