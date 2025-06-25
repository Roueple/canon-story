// src/app/api/public/home/recommendations/route.ts
import { NextRequest } from 'next/server';
import { successResponse, handleApiError } from '@/lib/api/utils';
import { recommendationService } from '@/services/recommendationService';
import { auth } from '@clerk/nextjs';

export async function GET(req: NextRequest) {
  try {
    const { userId } = auth();
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '10');

    let recommendations;
    if (userId) {
      recommendations = await recommendationService.getRecommendations(userId, limit);
    } else {
      recommendations = await recommendationService.getPopularNovels(limit);
    }

    return successResponse(recommendations);
  } catch (error) {
    return handleApiError(error);
  }
}