// src/app/api/public/novels/route.ts
import { NextRequest } from 'next/server'
import { successResponse, paginatedResponse, handleApiError, getPaginationParams } from '@/lib/api/utils'
import { novelService } from '@/services/novelService'

// GET /api/public/novels - List published novels
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const { page, limit } = getPaginationParams(searchParams)
    const status = searchParams.get('status') as any

    const { novels, total } = await novelService.findAll({
      page,
      limit,
      status,
      isPublished: true, // Only published novels for public
      includeDeleted: false
    })

    return paginatedResponse(novels, page, limit, total)
  } catch (error) {
    return handleApiError(error)
  }
}