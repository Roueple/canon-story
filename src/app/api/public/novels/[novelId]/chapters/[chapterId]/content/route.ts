// src/app/api/public/novels/[novelId]/chapters/[chapterId]/content/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse, handleApiError } from '@/lib/api/utils'

export async function GET(
  request: NextRequest,
  { params }: { params: { novelId: string; chapterId: string } }
) {
  try {
    const { novelId, chapterId } = await params
    const chapter = await prisma.chapter.findFirst({
      where: {
        id: chapterId,
        novelId: novelId,
        isPublished: true,
        isDeleted: false,
      },
      select: {
        id: true,
        title: true,
        content: true,
        chapterNumber: true,
        wordCount: true,
        publishedAt: true,
        novelId: true
      }
    })
    
    if (!chapter) {
      return errorResponse('Chapter content not found', 404)
    }
    
    // The successResponse function will handle serialization
    return successResponse(chapter)
  } catch (error) {
    return handleApiError(error)
  }
}