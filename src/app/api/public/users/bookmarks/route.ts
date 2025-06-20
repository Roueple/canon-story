// src/app/api/public/users/bookmarks/route.ts
import { NextRequest } from 'next/server';
import { createProtectedRoute } from '@/lib/api/middleware';
import { successResponse, errorResponse, handleApiError } from '@/lib/api/utils';
import { prisma } from '@/lib/db';

// GET bookmarks for a user, optionally filtered by chapterId
export const GET = createProtectedRoute(async (req, { user }) => {
  try {
    const chapterId = req.nextUrl.searchParams.get('chapterId');
    const bookmarks = await prisma.userBookmark.findMany({
      where: { 
        userId: user.id,
        ...(chapterId && { chapterId }),
      },
      orderBy: { createdAt: 'desc' },
    });
    return successResponse(bookmarks);
  } catch (error) {
    return handleApiError(error);
  }
});

// POST a new bookmark
export const POST = createProtectedRoute(async (req, { user }) => {
  try {
    const body = await req.json();
    const { chapterId, position, note, isPrivate } = body;

    if (!chapterId) {
      return errorResponse('Chapter ID is required', 400);
    }

    const newBookmark = await prisma.userBookmark.create({
      data: {
        userId: user.id,
        chapterId,
        position: position || 0, // Default to 0 for chapter-level
        note,
        isPrivate: isPrivate === undefined ? true : isPrivate,
      },
    });
    return successResponse(newBookmark, 201);
  } catch (error) {
    return handleApiError(error);
  }
});