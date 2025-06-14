// src/app/api/admin/chapters/[id]/route.ts
import { NextRequest } from 'next/server'
import { createAdminRoute } from '@/lib/api/middleware'
import { successResponse, errorResponse, handleApiError } from '@/lib/api/utils'
import { chapterService } from '@/services/chapterService'
import { prisma } from '@/lib/db'

// GET /api/admin/chapters/[id] - Get chapter details
export const GET = createAdminRoute(async (req: NextRequest, user: any) => {
  try {
    const url = new URL(req.url)
    const id = url.pathname.split('/').pop()
    
    if (!id) {
      return errorResponse('Chapter ID required', 400)
    }

    const chapter = await chapterService.findById(id, true) // Include deleted

    if (!chapter) {
      return errorResponse('Chapter not found', 404)
    }

    return successResponse(chapter)
  } catch (error) {
    return handleApiError(error)
  }
})

// PUT /api/admin/chapters/[id] - Update chapter
export const PUT = createAdminRoute(async (req: NextRequest, user: any) => {
  try {
    const url = new URL(req.url)
    const id = url.pathname.split('/').pop()
    
    if (!id) {
      return errorResponse('Chapter ID required', 400)
    }

    const body = await req.json()
    const chapter = await chapterService.update(id, body)

    // Update novel's updatedAt timestamp
    await prisma.novel.update({
      where: { id: chapter.novelId },
      data: { updatedAt: new Date() }
    })
    
    return successResponse(chapter)
  } catch (error) {
    return handleApiError(error)
  }
})

// DELETE /api/admin/chapters/[id] - Soft delete chapter
export const DELETE = createAdminRoute(async (req: NextRequest, user: any) => {
  try {
    const url = new URL(req.url)
    const id = url.pathname.split('/').pop()
    
    if (!id) {
      return errorResponse('Chapter ID required', 400)
    }

    await chapterService.softDelete(id, user.id)
    return successResponse({ message: 'Chapter deleted successfully' })
  } catch (error) {
    return handleApiError(error)
  }
})