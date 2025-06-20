// src/app/api/public/chapters/[id]/route.ts
import { NextRequest } from 'next/server'
import { successResponse, errorResponse, handleApiError } from '@/lib/api/utils'
import { chapterService } from '@/services/chapterService'
import { currentUser } from '@clerk/nextjs/server'

// CORRECTED: Handler signature updated to use params
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    if (!id) {
      return errorResponse('Chapter ID is required', 400);
    }
    const chapter = await chapterService.findById(id);
    if (!chapter || !chapter.isPublished) {
      return errorResponse('Chapter not found', 404);
    }
    // Track view
    const user = await currentUser();
    const sessionId = req.headers.get('x-session-id') || req.cookies.get('session-id')?.value;
    await chapterService.updateViews(id, user?.id, sessionId);
    return successResponse(chapter);
  } catch (error) {
    return handleApiError(error);
  }
}