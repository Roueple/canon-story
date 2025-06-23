// src/app/api/public/novels/[novelId]/chapters/[chapterId]/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse, handleApiError } from '@/lib/api/utils'
import { serializeForJSON } from '@/lib/api/utils' // Use the correct serializer

export async function GET(
  request: NextRequest,
  { params }: { params: { novelId: string; chapterId: string } }
) {
  try {
    const { novelId, chapterId } = await params
    
    // 1. Fetch current chapter and its novel details
    const currentChapter = await prisma.chapter.findFirst({
      where: {
        id: chapterId,
        novelId: novelId,
        isPublished: true,
        isDeleted: false,
      },
      include: {
        novel: {
          select: {
            title: true,
          }
        }
      }
    })

    if (!currentChapter) {
      return errorResponse('Chapter not found or not published.', 404)
    }

    // 2. Fetch all published chapter IDs and their order for navigation
    const allChaptersInNovel = await prisma.chapter.findMany({
      where: {
        novelId: novelId,
        isPublished: true,
        isDeleted: false,
      },
      select: {
        id: true,
        displayOrder: true,
      },
      orderBy: { displayOrder: 'asc' }
    })

    const allChapterIds = allChaptersInNovel.map(ch => ch.id)
    const currentIndex = allChapterIds.indexOf(chapterId)
    
    const prevChapterId = currentIndex > 0 ? allChapterIds[currentIndex - 1] : null
    const nextChapterId = currentIndex < allChapterIds.length - 1 ? allChapterIds[currentIndex + 1] : null

    // 3. Prepare the response payload
    const responsePayload = {
      currentChapter,
      prevChapterId,
      nextChapterId,
      allChapterIds,
    }

    // 4. Return serialized data
    return successResponse(responsePayload)
  } catch (error) {
    return handleApiError(error)
  }
}