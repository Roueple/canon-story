// src/app/api/admin/novels/[id]/chapters/route.ts
import { NextRequest } from 'next/server'
import { createAdminRoute } from '@/lib/api/middleware'
import { successResponse, errorResponse, paginatedResponse, handleApiError, getPaginationParams } from '@/lib/api/utils'
import { chapterService } from '@/services/chapterService'

export const GET = createAdminRoute(async (req, { params }) => {
  try {
    const novelId = params.novelId;
    if (!novelId) return errorResponse('Novel ID is required', 400);

    const { page, limit } = getPaginationParams(req.nextUrl.searchParams);
    const { chapters, total } = await chapterService.findAll(novelId, { page, limit, includeDeleted: true });
    return paginatedResponse(chapters, page, limit, total);
  } catch (error) { return handleApiError(error) }
});

export const POST = createAdminRoute(async (req, { params }) => {
  try {
    const novelId = params.novelId;
    if (!novelId) return errorResponse('Novel ID is required', 400);

    const body = await req.json();
    if (!body.title || !body.content || body.chapterNumber === undefined) {
      return errorResponse('Title, content, and chapter number are required', 400);
    }
    const chapter = await chapterService.create({ ...body, novelId });
    return successResponse(chapter, 201);
  } catch (error) { return handleApiError(error) }
});