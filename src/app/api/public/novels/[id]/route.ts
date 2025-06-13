// src/app/api/public/novels/[id]/route.ts
import { NextRequest } from 'next/server'
import { successResponse, errorResponse, handleApiError } from '@/lib/api/utils'
import { novelService } from '@/services/novelService'
import { prisma } from '@/lib/db'

// GET /api/public/novels/[id] - Get published novel details
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const id = url.pathname.split('/').pop()
    
    if (!id) {
      return errorResponse('Novel ID required', 400)
    }

    const novel = await novelService.findById(id)

    if (!novel || !novel.isPublished) {
      return errorResponse('Novel not found', 404)
    }

    // Increment view count
    await prisma.novel.update({
      where: { id },
      data: { totalViews: { increment: 1 } }
    })

    return successResponse(novel)
  } catch (error) {
    return handleApiError(error)
  }
}