// src/app/api/public/recommendations/route.ts
import { NextRequest } from 'next/server';
import { createProtectedRoute } from '@/lib/api/middleware';
import { successResponse, handleApiError } from '@/lib/api/utils';
import { recommendationService } from '@/services/recommendationService';

export const GET = createProtectedRoute(async (req, { user }) => {
  try {
    const searchParams = req.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');

    const recommendations = await recommendationService.getRecommendations(user.id, limit);
    return successResponse(recommendations);
  } catch (error) {
    return handleApiError(error);
  }
});