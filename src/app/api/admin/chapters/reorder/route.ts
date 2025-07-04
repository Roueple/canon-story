import { NextRequest } from 'next/server';
import { createAdminRoute } from '@/lib/api/middleware';
import { successResponse, errorResponse, handleApiError } from '@/lib/api/utils';
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

export const POST = createAdminRoute(async (req) => {
  try {
    const { novelId, chapterOrder } = await req.json() as { novelId: string, chapterOrder: Array<{ id: string; displayOrder: number }> };

    if (!novelId || !chapterOrder || !Array.isArray(chapterOrder)) {
      return errorResponse('Invalid request data: novelId and chapterOrder array are required.', 400);
    }
    if (chapterOrder.length === 0) {
        return successResponse({ message: 'No chapters to reorder.' });
    }

    // Validate chapterOrder data
    for (const item of chapterOrder) {
        if (typeof item.id !== 'string' || typeof item.displayOrder !== 'number') {
            return errorResponse('Invalid item in chapterOrder array. Each item must have id (string) and displayOrder (number).', 400);
        }
    }
    
    // Use a transaction to ensure all updates succeed or fail together
    await prisma.$transaction(
      chapterOrder.map(update =>
        prisma.chapter.update({
          where: { id: update.id, novelId: novelId }, // Ensure chapter belongs to the novel
          data: { displayOrder: update.displayOrder }
        })
      )
    );
    
    // Update novel's updatedAt timestamp
    await prisma.novel.update({
        where: { id: novelId },
        data: { updatedAt: new Date() }
    });

    return successResponse({ message: 'Chapters reordered successfully.' });
  } catch (error) {
    // Prisma's P2025 error for "Record to update not found" can occur if a chapterId is invalid or doesn't belong to novelId
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return errorResponse('One or more chapters not found or do not belong to the specified novel.', 404);
    }
    return handleApiError(error);
  }
});