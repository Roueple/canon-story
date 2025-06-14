// src/app/api/public/novels/[id]/chapters/route.ts
import { NextRequest } from 'next/server'
import { errorResponse, paginatedResponse, handleApiError, getPaginationParams } from '@/lib/api/utils'
import { chapterService } from '@/services/chapterService'

// CORRECTED: Handler signature updated to use params
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const novelId = params.id;
    if (!novelId) {
      return errorResponse('Novel ID is required', 400);
    }

    const searchParams = req.nextUrl.searchParams;
    const { page, limit } = getPaginationParams(searchParams);

    const { chapters, total } = await chapterService.findAll(novelId, {
      page,
      limit,
      isPublished: true, // Only published chapters
      includeDeleted: false
    });

    return paginatedResponse(chapters, page, limit, total);
  } catch (error) {
    return handleApiError(error);
  }
}