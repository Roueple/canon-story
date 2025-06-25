// src/app/api/public/genres/route.ts
import { NextRequest } from 'next/server';
import { successResponse, handleApiError } from '@/lib/api/utils';
import { genreService } from '@/services/genreService';

export async function GET(req: NextRequest) {
  try {
    // Correctly call the service to only get active genres for the public view.
    const genres = await genreService.findAll({ isActive: true });
    return successResponse(genres);
  } catch (error) {
    return handleApiError(error);
  }
}