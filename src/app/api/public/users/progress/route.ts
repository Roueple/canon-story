// src/app/api/public/users/progress/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Simplified GET handler for debugging
export async function GET(req: NextRequest) {
  try {
    const novelId = req.nextUrl.searchParams.get('novelId');
    console.log(`[DEBUG] Simplified /api/public/users/progress GET. novelId: ${novelId}`);
    
    // Return a simple success response
    return NextResponse.json({ 
      success: true, 
      data: { 
        message: "Progress API test OK (simplified)", 
        novelId: novelId,
        // Mocked progress data
        chapterId: "mock-chapter-id", 
        progressPercentage: 0, 
        scrollPosition: 0 
      } 
    }, { status: 200 });

  } catch (error) {
    console.error('[DEBUG] Error in simplified progress GET:', error);
    return NextResponse.json({ success: false, error: 'Error in simplified handler' }, { status: 500 });
  }
}

// You can comment out or also simplify the POST handler if you only test GET for now
// For instance, to keep the original POST handler:
import { createProtectedRoute } from '@/lib/api/middleware';
import { successResponse, errorResponse, handleApiError } from '@/lib/api/utils';
import { prisma } from '@/lib/db';

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