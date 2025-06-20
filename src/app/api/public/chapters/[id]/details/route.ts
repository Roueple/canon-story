// src/app/api/public/chapters/[id]/details/route.ts
import { NextRequest } from 'next/server';
import { successResponse, errorResponse, handleApiError } from '@/lib/api/utils';
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { serializePrismaData } from '@/lib/serialization';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) { // Corrected: params has 'id'
  try {
    const chapterIdFromParams = params.id; // Corrected: use params.id
    const novelIdFromQuery = req.nextUrl.searchParams.get('novelId');

    if (!chapterIdFromParams || !novelIdFromQuery) {
      return errorResponse('Chapter ID (from path) and Novel ID (from query) are required', 400);
    }

    const currentChapterData = await prisma.chapter.findFirst({
      where: { 
        id: chapterIdFromParams, // Use corrected variable
        novelId: novelIdFromQuery, 
        isPublished: true, 
        isDeleted: false 
      },
      include: { novel: { select: { id: true, title: true, slug: true } } },
    });

    if (!currentChapterData) {
      return errorResponse('Chapter not found or not published for this novel', 404);
    }

    const currentChapterNumber = Number(currentChapterData.chapterNumber);

    const [prevChapterData, nextChapterData] = await Promise.all([
      prisma.chapter.findFirst({
        where: {
          novelId: novelIdFromQuery,
          isPublished: true,
          isDeleted: false,
          chapterNumber: { lt: new Prisma.Decimal(currentChapterNumber) },
        },
        orderBy: { chapterNumber: 'desc' },
        select: { id: true },
      }),
      prisma.chapter.findFirst({
        where: {
          novelId: novelIdFromQuery,
          isPublished: true,
          isDeleted: false,
          chapterNumber: { gt: new Prisma.Decimal(currentChapterNumber) },
        },
        orderBy: { chapterNumber: 'asc' },
        select: { id: true },
      }),
    ]);
    
    const responseData = {
      currentChapter: currentChapterData,
      prevChapterId: prevChapterData?.id || null,
      nextChapterId: nextChapterData?.id || null,
    };

    return successResponse(serializePrismaData(responseData));

  } catch (error) {
    return handleApiError(error);
  }
}