// src/app/api/public/chapters/[id]/details/route.ts
import { NextRequest } from 'next/server';
import { successResponse, errorResponse, handleApiError } from '@/lib/api/utils';
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { serializePrismaData } from '@/lib/serialization'; // <--- ADD THIS IMPORT

export async function GET(req: NextRequest, { params }: { params: { chapterId: string } }) {
  try {
    const chapterId = params.chapterId;
    const novelId = req.nextUrl.searchParams.get('novelId'); // Ensure novelId is passed

    if (!chapterId || !novelId) {
      return errorResponse('Chapter ID and Novel ID are required', 400);
    }

    const currentChapterData = await prisma.chapter.findFirst({ // Renamed to avoid conflict with currentChapter variable below
      where: { id: chapterId, novelId, isPublished: true, isDeleted: false },
      include: { novel: { select: { id: true, title: true, slug: true } } },
    });

    if (!currentChapterData) {
      return errorResponse('Chapter not found', 404);
    }

    const currentChapterNumber = Number(currentChapterData.chapterNumber); // Already converting here, good.

    const [prevChapterData, nextChapterData] = await Promise.all([ // Renamed
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
    
    // Serialize the data before sending
    const responseData = {
      currentChapter: currentChapterData, // Pass raw data to serializePrismaData
      prevChapterId: prevChapterData?.id || null,
      nextChapterId: nextChapterData?.id || null,
    };

    return successResponse(serializePrismaData(responseData)); // <--- SERIALIZE HERE

  } catch (error) {
    return handleApiError(error);
  }
}