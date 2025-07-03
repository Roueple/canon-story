// src/app/api/public/novels/[novelId]/chapters/route.ts
import { NextRequest } from 'next/server';
import { successResponse, paginatedResponse, handleApiError, getPaginationParams } from '@/lib/api/utils';
import { chapterService } from '@/services/chapterService';

export async function GET(
  req: NextRequest,
  { params }: { params: { novelId: string } }
) {
  try {
    const { novelId } = params;
    const { page, limit } = getPaginationParams(req.nextUrl.searchParams);

    const { chapters, total } = await chapterService.findByNovelId(novelId, {
      page,
      limit,
      includeUnpublished: false // Public API should not include drafts
    });

    return paginatedResponse(chapters, page, limit, total);
  } catch (error) {
    return handleApiError(error);
  }
}