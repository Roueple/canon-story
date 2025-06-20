// src/app/api/public/users/progress/route.ts
import { NextRequest } from 'next/server';
import { createProtectedRoute } from '@/lib/api/middleware';
import { successResponse, errorResponse, handleApiError } from '@/lib/api/utils';
import { prisma } from '@/lib/db';

// GET user's reading progress for a novel
export const GET = createProtectedRoute(async (req, { user }) => {
  try {
    const novelId = req.nextUrl.searchParams.get('novelId');
    if (!novelId) {
      return errorResponse('Novel ID is required', 400);
    }

    const progress = await prisma.userReadingProgress.findUnique({
      where: { userId_novelId: { userId: user.id, novelId } },
    });

    if (!progress) {
      return errorResponse('No progress found for this novel', 404);
    }
    // Convert Decimal to number for chapterId if it's stored as Decimal
    // For now, assuming chapterId is string UUID.
    // progressPercentage and scrollPosition are Int, so no conversion needed.
    return successResponse(progress);
  } catch (error) {
    return handleApiError(error);
  }
});

// POST (update) user's reading progress
export const POST = createProtectedRoute(async (req, { user }) => {
  try {
    const body = await req.json();
    const { novelId, chapterId, progressPercentage, scrollPosition } = body;

    if (!novelId || !chapterId || progressPercentage === undefined || scrollPosition === undefined) {
      return errorResponse('Missing required fields: novelId, chapterId, progressPercentage, scrollPosition', 400);
    }
    
    const numericProgressPercentage = Number(progressPercentage);
    const numericScrollPosition = Number(scrollPosition);

    if (isNaN(numericProgressPercentage) || numericProgressPercentage < 0 || numericProgressPercentage > 100) {
        return errorResponse('Invalid progressPercentage. Must be between 0 and 100.', 400);
    }
    if (isNaN(numericScrollPosition) || numericScrollPosition < 0) {
        return errorResponse('Invalid scrollPosition. Must be a non-negative number.', 400);
    }


    const updatedProgress = await prisma.userReadingProgress.upsert({
      where: { userId_novelId: { userId: user.id, novelId } },
      update: { chapterId, progressPercentage: numericProgressPercentage, scrollPosition: numericScrollPosition, lastReadAt: new Date() },
      create: { userId: user.id, novelId, chapterId, progressPercentage: numericProgressPercentage, scrollPosition: numericScrollPosition, lastReadAt: new Date() },
    });
    return successResponse(updatedProgress);
  } catch (error) {
    return handleApiError(error);
  }
});