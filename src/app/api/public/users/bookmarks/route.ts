// src/app/api/public/users/bookmarks/route.ts
import { NextRequest } from 'next/server'
import { createProtectedRoute } from '@/lib/api/middleware'
import { successResponse, errorResponse, handleApiError, paginatedResponse, getPaginationParams } from '@/lib/api/utils'
import { prisma } from '@/lib/db'

// GET /api/public/users/bookmarks - List user's bookmarks
export const GET = createProtectedRoute(async (req, { user }) => {
  try {
    const searchParams = req.nextUrl.searchParams
    const novelId = searchParams.get('novelId')
    const { page, limit } = getPaginationParams(searchParams)

    const where = {
      userId: user.id,
      ...(novelId && { novelId })
    }

    const [bookmarks, total] = await Promise.all([
      prisma.userBookmark.findMany({
        where,
        include: {
          chapter: {
            select: {
              id: true,
              title: true,
              chapterNumber: true,
              novel: {
                select: {
                  id: true,
                  title: true,
                  author: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.userBookmark.count({ where })
    ])

    return paginatedResponse(bookmarks, page, limit, total)
  } catch (error) {
    return handleApiError(error)
  }
})

// POST /api/public/users/bookmarks - Create a bookmark
export const POST = createProtectedRoute(async (req, { user }) => {
  try {
    const body = await req.json()
    const { novelId, chapterId, position, note } = body

    if (!novelId || !chapterId) {
      return errorResponse('Novel ID and Chapter ID are required', 400)
    }

    // Check if bookmark already exists
    const existing = await prisma.userBookmark.findFirst({
      where: {
        userId: user.id,
        chapterId
      }
    })

    if (existing) {
      return errorResponse('Bookmark already exists', 409)
    }

    // Verify chapter exists and belongs to novel
    const chapter = await prisma.chapter.findFirst({
      where: {
        id: chapterId,
        novelId,
        isDeleted: false
      }
    })

    if (!chapter) {
      return errorResponse('Chapter not found', 404)
    }

    const bookmark = await prisma.userBookmark.create({
      data: {
        userId: user.id,
        novelId,
        chapterId,
        position: position || 0,
        note
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

    return successResponse(bookmark, 201)
  } catch (error) {
    return handleApiError(error)
  }
})