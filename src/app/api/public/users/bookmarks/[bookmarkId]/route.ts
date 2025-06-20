// src/app/api/public/users/bookmarks/[bookmarkId]/route.ts
import { NextRequest } from 'next/server';
import { createProtectedRoute } from '@/lib/api/middleware';
import { successResponse, errorResponse, handleApiError } from '@/lib/api/utils';
import { prisma } from '@/lib/db';

// DELETE a bookmark
export const DELETE = createProtectedRoute(async (req, { user, params }) => {
  try {
    const { bookmarkId } = params;
    if (!bookmarkId) {
      return errorResponse('Bookmark ID is required', 400);
    }

    const bookmark = await prisma.userBookmark.findUnique({
      where: { id: bookmarkId },
    });

    if (!bookmark) {
      return errorResponse('Bookmark not found', 404);
    }
    if (bookmark.userId !== user.id) {
      return errorResponse('Forbidden: You can only delete your own bookmarks', 403);
    }

    await prisma.userBookmark.delete({
      where: { id: bookmarkId },
    });
    return successResponse({ message: 'Bookmark deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
});