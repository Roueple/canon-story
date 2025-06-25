import { NextRequest } from 'next/server';
import { successResponse, handleApiError } from '@/lib/api/utils';
import { trendingService } from '@/services/trendingService';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20');

    const novels = await trendingService.getRecentlyUpdated(limit);
    return successResponse(novels);
  } catch (error) {
    return handleApiError(error);
  }
}