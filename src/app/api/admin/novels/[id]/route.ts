// src/app/api/admin/novels/[id]/route.ts
import { NextRequest } from 'next/server'
import { createAdminRoute } from '@/lib/api/middleware'
import { successResponse, errorResponse, handleApiError } from '@/lib/api/utils'
import { novelService } from '@/services/novelService'

// GET /api/admin/novels/[id] - Get novel details
export const GET = createAdminRoute(async (req: NextRequest, user: any) => {
  try {
    const url = new URL(req.url)
    const id = url.pathname.split('/').pop()
    
    if (!id) {
      return errorResponse('Novel ID required', 400)
    }

    const novel = await novelService.findById(id, true) // Include deleted

    if (!novel) {
      return errorResponse('Novel not found', 404)
    }

    return successResponse(novel)
  } catch (error) {
    return handleApiError(error)
  }
})

// PUT /api/admin/novels/[id] - Update novel
export const PUT = createAdminRoute(async (req: NextRequest, user: any) => {
  try {
    const url = new URL(req.url)
    const id = url.pathname.split('/').pop()
    
    if (!id) {
      return errorResponse('Novel ID required', 400)
    }

    const body = await req.json()
    const novel = await novelService.update(id, body)
    
    return successResponse(novel)
  } catch (error) {
    return handleApiError(error)
  }
})

// DELETE /api/admin/novels/[id] - Soft delete novel
export const DELETE = createAdminRoute(async (req: NextRequest, user: any) => {
  try {
    const url = new URL(req.url)
    const id = url.pathname.split('/').pop()
    
    if (!id) {
      return errorResponse('Novel ID required', 400)
    }

    await novelService.softDelete(id, user.id)
    return successResponse({ message: 'Novel deleted successfully' })
  } catch (error) {
    return handleApiError(error)
  }
})