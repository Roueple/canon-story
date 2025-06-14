// src/app/api/public/novels/[id]/route.ts
import { NextRequest } from 'next/server'
import { successResponse, errorResponse, handleApiError } from '@/lib/api/utils'
import { novelService } from '@/services/novelService'
import { prisma } from '@/lib/db'

// CORRECTED: Handler signature updated to use params
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    if (!id) {
      return errorResponse('Novel ID is required', 400);
    }
    const novel = await novelService.findById(id);
    if (!novel || !novel.isPublished) {
      return errorResponse('Novel not found', 404);
    }
    // Increment view count
    await prisma.novel.update({
      where: { id },
      data: { totalViews: { increment: 1 } }
    });
    return successResponse(novel);
  } catch (error) {
    return handleApiError(error);
  }
}