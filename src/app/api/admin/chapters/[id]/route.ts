// src/app/api/admin/chapters/[id]/route.ts
import { NextRequest } from 'next/server'
import { createAdminRoute } from '@/lib/api/middleware'
import { successResponse, errorResponse, handleApiError } from '@/lib/api/utils'
import { chapterService } from '@/services/chapterService'
import { prisma } from '@/lib/db'

// CORRECTED: Handler signature updated to use context
export const GET = createAdminRoute(async (req, { params }) => {
  try {
    const { id } = params;
    if (!id) {
      return errorResponse('Chapter ID is required', 400);
    }
    const chapter = await chapterService.findById(id, true);
    if (!chapter) {
      return errorResponse('Chapter not found', 404);
    }
    return successResponse(chapter);
  } catch (error) {
    return handleApiError(error);
  }
});

// CORRECTED: Handler signature updated to use context
export const PUT = createAdminRoute(async (req, { params }) => {
  try {
    const { id } = params;
    if (!id) {
      return errorResponse('Chapter ID is required', 400);
    }
    const body = await req.json();
    const chapter = await chapterService.update(id, body);
    await prisma.novel.update({
      where: { id: chapter.novelId },
      data: { updatedAt: new Date() }
    });
    return successResponse(chapter);
  } catch (error) {
    return handleApiError(error);
  }
});

// CORRECTED: Handler signature updated to use context
export const DELETE = createAdminRoute(async (req, { user, params }) => {
  try {
    const { id } = params;
    if (!id) {
      return errorResponse('Chapter ID is required', 400);
    }
    await chapterService.softDelete(id, user.id);
    return successResponse({ message: 'Chapter deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
});