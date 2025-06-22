// src/app/api/admin/novels/[id]/chapters/route.ts
import { NextRequest } from 'next/server'
import { createAdminRoute } from '@/lib/api/middleware'
import { successResponse, errorResponse, paginatedResponse, handleApiError, getPaginationParams } from '@/lib/api/utils'
import { chapterService } from '@/services/chapterService'
import { prisma } from '@/lib/db'

export const GET = createAdminRoute(async (req, { params }) => {
  try {
    const { id } = params;
    if (!id) return errorResponse('Novel ID is required', 400);
    
    const { page, limit } = getPaginationParams(req.nextUrl.searchParams);
    const { chapters, total } = await chapterService.findByNovelId(id, { 
      page, 
      limit, 
      includeUnpublished: true 
    });
    
    return paginatedResponse(chapters, page, limit, total);
  } catch (error) { 
    return handleApiError(error) 
  }
});

export const POST = createAdminRoute(async (req, { params }) => {
  try {
    const { id } = params;
    if (!id) return errorResponse('Novel ID is required', 400);
    
    const body = await req.json();
    const chapter = await chapterService.create({ ...body, novelId: id });
    
    await prisma.novel.update({
      where: { id },
      data: { updatedAt: new Date() }
    });
    
    return successResponse(chapter, 201);
  } catch (error) { 
    return handleApiError(error) 
  }
});