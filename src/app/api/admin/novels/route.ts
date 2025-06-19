// src/app/api/admin/novels/route.ts
import { NextRequest } from 'next/server'
import { createAdminRoute } from '@/lib/api/middleware'
import { successResponse, errorResponse, paginatedResponse, handleApiError, getPaginationParams } from '@/lib/api/utils'
import { novelService } from '@/services/novelService'

// GET /api/admin/novels - List all novels (including unpublished)
export const GET = createAdminRoute(async (req: NextRequest) => {
  try {
    const searchParams = req.nextUrl.searchParams
    const { page, limit } = getPaginationParams(searchParams)
    const status = searchParams.get('status') as any
    const isPublished = searchParams.get('isPublished') === 'true'
    const includeDeleted = searchParams.get('includeDeleted') === 'true'

    const { novels, total } = await novelService.findAll({
      page,
      limit,
      status,
      isPublished,
      includeDeleted
    })

    return paginatedResponse(novels, page, limit, total)
  } catch (error) {
    return handleApiError(error)
  }
})

// POST /api/admin/novels - Create new novel
export const POST = createAdminRoute(async (req: NextRequest, { user }) => {
  try {
    const body = await req.json()
    
    // Validate required fields
    if (!body.title) {
      return errorResponse('Title is required')
    }

    const novel = await novelService.create({
      ...body,
      authorId: user.id
    })

    return successResponse(novel, 201)
  } catch (error) {
    return handleApiError(error)
  }
})