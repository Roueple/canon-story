// src/app/api/public/novels/[novelId]/related/route.ts
import { NextRequest } from 'next/server';
import { successResponse, errorResponse, handleApiError } from '@/lib/api/utils';
import { recommendationService } from '@/services/recommendationService';

export async function GET(
  req: NextRequest,
  { params }: { params: { novelId: string } }
) {
  try {
    const { novelId } = params;
    if (!novelId) {
      return errorResponse('Novel ID is required', 400);
    }

    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '6');
    const related = await recommendationService.getRelatedNovels(novelId, limit);
    
    return successResponse(related);
  } catch (error) {
    return handleApiError(error);
  }
}