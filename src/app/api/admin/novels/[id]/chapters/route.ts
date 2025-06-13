// src/app/api/admin/novels/[id]/chapters/route.ts
import { NextRequest } from 'next/server'
import { createAdminRoute } from '@/lib/api/middleware'
import { successResponse, errorResponse, paginatedResponse, handleApiError, getPaginationParams } from '@/lib/api/utils'
import { chapterService } from '@/services/chapterService'

// GET /api/admin/novels/[id]/chapters - List chapters
export const GET = createAdminRoute(async (req: NextRequest, user: any) => {
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
    const includeDeleted = searchParams.get('includeDeleted') === 'true'

    const { chapters, total } = await chapterService.findAll(novelId, {
      page,
      limit,
      includeDeleted
    })

    return paginatedResponse(chapters, page, limit, total)
  } catch (error) {
    return handleApiError(error)
  }
})

// POST /api/admin/novels/[id]/chapters - Create chapter
export const POST = createAdminRoute(async (req: NextRequest, user: any) => {
  try {
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    const novelIdIndex = pathParts.indexOf('novels') + 1
    const novelId = pathParts[novelIdIndex]
    
    if (!novelId) {
      return errorResponse('Novel ID required', 400)
    }

    const body = await req.json()
    
    // Validate required fields
    if (!body.title || !body.content || body.chapterNumber === undefined) {
      return errorResponse('Title, content, and chapter number are required')
    }

    const chapter = await chapterService.create({
      ...body,
      novelId
    })

    return successResponse(chapter, 201)
  } catch (error) {
    return handleApiError(error)
  }
})