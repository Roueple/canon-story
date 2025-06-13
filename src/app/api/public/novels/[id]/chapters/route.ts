// src/app/api/public/novels/[id]/chapters/route.ts
import { NextRequest } from 'next/server'
import { errorResponse, paginatedResponse, handleApiError, getPaginationParams } from '@/lib/api/utils'
import { chapterService } from '@/services/chapterService'

// GET /api/public/novels/[id]/chapters - List published chapters
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    const novelIdIndex = pathParts.indexOf('novels') + 1
    const novelId = pathParts[novelIdIndex]
    
    if (!novelId) {
      return errorResponse('Novel ID required', 400)
    }

    const searchParams = req.nextUrl.searchParams
    const { page, limit } = getPaginationParams(searchParams)

    const { chapters, total } = await chapterService.findAll(novelId, {
      page,
      limit,
      isPublished: true, // Only published chapters
      includeDeleted: false
    })

    return paginatedResponse(chapters, page, limit, total)
  } catch (error) {
    return handleApiError(error)
  }
}