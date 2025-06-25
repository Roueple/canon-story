// src/app/api/admin/genres/[id]/route.ts
import { NextRequest } from 'next/server';
import { createAdminRoute } from '@/lib/api/middleware';
import { successResponse, errorResponse, handleApiError } from '@/lib/api/utils';
import { genreService } from '@/services/genreService';

export const GET = createAdminRoute(async (req, { params }) => {
  try {
    const { id } = await params;
    if (!id) return errorResponse('Genre ID is required', 400);
    
    const genre = await genreService.findById(id);
    if (!genre) return errorResponse('Genre not found', 404);
    
    return successResponse(genre);
  } catch (error) {
    return handleApiError(error);
  }
});

export const PUT = createAdminRoute(async (req, { params }) => {
  try {
    const { id } = await params;
    if (!id) return errorResponse('Genre ID is required', 400);
    
    const body = await req.json();
    const genre = await genreService.update(id, body);
    
    return successResponse(genre);
  } catch (error) {
    return handleApiError(error);
  }
});

export const DELETE = createAdminRoute(async (req, { params }) => {
  try {
    const { id } = await params;
    if (!id) return errorResponse('Genre ID is required', 400);
    
    await genreService.delete(id);
    return successResponse({ message: 'Genre deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
});