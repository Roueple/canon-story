// src/app/api/public/users/bookmarks/[bookmarkId]/route.ts
import { NextRequest } from 'next/server'
import { createProtectedRoute } from '@/lib/api/middleware'
import { successResponse, errorResponse, handleApiError } from '@/lib/api/utils'
import { prisma } from '@/lib/db'

// DELETE /api/public/users/bookmarks/[bookmarkId] - Remove a bookmark
export const DELETE = createProtectedRoute(async (req, { user, params }) => {
  try {
    const { bookmarkId } = await params
    
    if (!bookmarkId) {
      return errorResponse('Bookmark ID is required', 400)
    }

    // Find and verify ownership
    const bookmark = await prisma.userBookmark.findFirst({
      where: {
        id: bookmarkId,
        userId: user.id
      }
    })

    if (!bookmark) {
      return errorResponse('Bookmark not found', 404)
    }

    await prisma.userBookmark.delete({
      where: { id: bookmarkId }
    })

    return successResponse({ message: 'Bookmark removed successfully' })
  } catch (error) {
    return handleApiError(error)
  }
})

// PUT /api/public/users/bookmarks/[bookmarkId] - Update a bookmark
export const PUT = createProtectedRoute(async (req, { user, params }) => {
  try {
    const { bookmarkId } = await params
    const body = await req.json()
    const { position, note } = body

    if (!bookmarkId) {
      return errorResponse('Bookmark ID is required', 400)
    }

    // Find and verify ownership
    const bookmark = await prisma.userBookmark.findFirst({
      where: {
        id: bookmarkId,
        userId: user.id
      }
    })

    if (!bookmark) {
      return errorResponse('Bookmark not found', 404)
    }

    const updated = await prisma.userBookmark.update({
      where: { id: bookmarkId },
      data: {
        ...(position !== undefined && { position }),
        ...(note !== undefined && { note })
      },
      include: {
        chapter: {
          select: {
            id: true,
            title: true,
            chapterNumber: true
          }
        }
      }
    })

    return successResponse(updated)
  } catch (error) {
    return handleApiError(error)
  }
})