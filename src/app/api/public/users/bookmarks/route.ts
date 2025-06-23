// src/app/api/public/users/bookmarks/route.ts
import { NextRequest } from 'next/server';
import { createProtectedRoute } from '@/lib/api/middleware';
import { successResponse, errorResponse, handleApiError, paginatedResponse, getPaginationParams } from '@/lib/api/utils';
import { prisma } from '@/lib/db';

// GET /api/public/users/bookmarks - List user's bookmarks
export const GET = createProtectedRoute(async (req, { user }) => {
  try {
    const searchParams = req.nextUrl.searchParams;
    const novelId = searchParams.get('novelId');
    const { page, limit } = getPaginationParams(searchParams);

    // CORRECTED: The 'where' clause now filters through the chapter relation, which is correct for your schema.
    const where = {
      userId: user.id,
      ...(novelId && { chapter: { novelId: novelId } }),
    };

    const [bookmarks, total] = await Promise.all([
      prisma.userBookmark.findMany({
        where,
        include: {
          chapter: {
            select: {
              id: true,
              title: true,
              chapterNumber: true,
              novel: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.userBookmark.count({ where }),
    ]);

    return paginatedResponse(bookmarks, page, limit, total);
  } catch (error) {
    return handleApiError(error);
  }
});

// POST /api/public/users/bookmarks - Create a bookmark
export const POST = createProtectedRoute(async (req, { user }) => {
  try {
    const body = await req.json();
    // We get novelId here to verify the chapter belongs to the correct novel.
    const { novelId, chapterId, position, note } = body;

    if (!novelId || !chapterId) {
      return errorResponse('Novel ID and Chapter ID are required', 400);
    }

    // Check if bookmark already exists
    const existing = await prisma.userBookmark.findFirst({
      where: {
        userId: user.id,
        chapterId,
      },
    });

    if (existing) {
      return successResponse(existing, 200); // Return existing bookmark
    }

    // Verify chapter exists and belongs to the correct novel
    const chapter = await prisma.chapter.findFirst({
      where: {
        id: chapterId,
        novelId: novelId, // Ensure chapter is from the expected novel
        isDeleted: false,
      },
    });

    if (!chapter) {
      return errorResponse('Chapter not found for this novel', 404);
    }

    // CORRECTED: Do not try to save `novelId` as it's not in the schema.
    const bookmark = await prisma.userBookmark.create({
      data: {
        userId: user.id,
        chapterId,
        position: position || 0,
        note,
      },
      include: {
        chapter: {
          select: {
            id: true,
            title: true,
            chapterNumber: true,
          },
        },
      },
    });

    return successResponse(bookmark, 201);
  } catch (error) {
    return handleApiError(error);
  }
});