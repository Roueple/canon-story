// src/app/api/public/novels/[novelId]/route.ts
import { NextRequest } from 'next/server'
import { successResponse, errorResponse, handleApiError } from '@/lib/api/utils'
import { novelService } from '@/services/novelService'
import { prisma } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: { novelId: string } }
) {
  try {
    const { novelId } = params;
    if (!novelId) {
      return errorResponse('Novel ID is required', 400);
    }
    const novel = await novelService.findById(novelId);
    if (!novel || !novel.isPublished) {
      return errorResponse('Novel not found', 404);
    }
    await prisma.novel.update({
      where: { id: novelId },
      data: { totalViews: { increment: 1 } }
    });
    return successResponse(novel);
  } catch (error) {
    return handleApiError(error);
  }
}