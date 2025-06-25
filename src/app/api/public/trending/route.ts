// src/app/api/public/trending/route.ts
import { NextRequest } from 'next/server';
import { successResponse, handleApiError } from '@/lib/api/utils';
import { trendingService } from '@/services/trendingService';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const period = searchParams.get('period') as 'day' | 'week' | 'month' || 'week';
    const limit = parseInt(searchParams.get('limit') || '20');

    const novels = await trendingService.getTrendingNovels(period, limit);
    return successResponse(novels);
  } catch (error) {
    return handleApiError(error);
  }
}