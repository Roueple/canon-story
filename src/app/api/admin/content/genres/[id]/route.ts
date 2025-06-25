// src/app/api/admin/content/genres/[id]/route.ts
import { NextRequest } from 'next/server';
import { createAdminRoute } from '@/lib/api/middleware';
import { successResponse, errorResponse, handleApiError } from '@/lib/api/utils';
import { genreService } from '@/services/genreService';

// GET a single genre by ID
export const GET = createAdminRoute(async (req, { params }) => {
  try {
    const { id } = await params;
    const genre = await genreService.findById(id);
    if (!genre) return errorResponse('Genre not found', 404);
    return successResponse(genre);
  } catch (error) {
    return handleApiError(error);
  }
});

// PUT to update a genre
export const PUT = createAdminRoute(async (req, { params }) => {
  try {
    const { id } = await params;
    const body = await req.json();
    const genre = await genreService.update(id, body);
    return successResponse(genre);
  } catch (error) {
    return handleApiError(error);
  }
});

// DELETE a genre
export const DELETE = createAdminRoute(async (req, { params }) => {
  try {
    const { id } = await params;
    await genreService.delete(id);
    return successResponse({ message: 'Genre deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
});