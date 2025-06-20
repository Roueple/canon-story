// src/app/api/public/chapters/[chapterId]/details/route.ts
import { NextRequest } from 'next/server';
import { successResponse, errorResponse, handleApiError } from '@/lib/api/utils';
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

export async function GET(req: NextRequest, { params }: { params: { chapterId: string } }) {
  try {
    const chapterId = params.chapterId;
    const novelId = req.nextUrl.searchParams.get('novelId'); // Ensure novelId is passed

    if (!chapterId || !novelId) {
      return errorResponse('Chapter ID and Novel ID are required', 400);
    }

    const currentChapter = await prisma.chapter.findFirst({
      where: { id: chapterId, novelId, isPublished: true, isDeleted: false },
      include: { novel: { select: { id: true, title: true, slug: true } } },
    });

    if (!currentChapter) {
      return errorResponse('Chapter not found', 404);
    }

    const currentChapterNumber = Number(currentChapter.chapterNumber);

    const [prevChapter, nextChapter] = await Promise.all([
      prisma.chapter.findFirst({
        where: {
          novelId,
          isPublished: true,
          isDeleted: false,
          chapterNumber: { lt: new Prisma.Decimal(currentChapterNumber) },
        },
        orderBy: { chapterNumber: 'desc' },
        select: { id: true },
      }),
      prisma.chapter.findFirst({
        where: {
          novelId,
          isPublished: true,
          isDeleted: false,
          chapterNumber: { gt: new Prisma.Decimal(currentChapterNumber) },
        },
        orderBy: { chapterNumber: 'asc' },
        select: { id: true },
      }),
    ]);

    return successResponse({
      currentChapter,
      prevChapterId: prevChapter?.id || null,
      nextChapterId: nextChapter?.id || null,
    });

  } catch (error) {
    return handleApiError(error);
  }
}