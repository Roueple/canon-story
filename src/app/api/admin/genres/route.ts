// src/app/api/admin/genres/route.ts
import { NextRequest } from 'next/server';
import { createAdminRoute } from '@/lib/api/middleware';
import { successResponse, errorResponse, handleApiError } from '@/lib/api/utils';
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
    const { name, description, color, iconUrl } = body;

    if (!name) {
      return errorResponse('Name is required', 400);
    }

    const genre = await genreService.create({
      name,
      description,
      color,
      iconUrl
    });

    return successResponse(genre);
  } catch (error) {
    return handleApiError(error);
  }
});