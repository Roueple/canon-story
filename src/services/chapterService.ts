// src/services/chapterService.ts
import { prisma } from '@/lib/db'
import { ChapterStatus } from '@/types'
import { generateSlug, calculateReadingTime } from '@/lib/utils'

export const chapterService = {
  async findAll(novelId: string, options: {
    page?: number
    limit?: number
    status?: ChapterStatus
    isPublished?: boolean
    includeDeleted?: boolean
  }) {
    const { page = 1, limit = 20, status, isPublished, includeDeleted = false } = options
    const skip = (page - 1) * limit

    const where = {
      novelId,
      ...(status && { status }),
      ...(isPublished !== undefined && { isPublished }),
      ...(!includeDeleted && { isDeleted: false })
    }

    const [chapters, total] = await Promise.all([
      prisma.chapter.findMany({
        where,
        skip,
        take: limit,
        orderBy: { displayOrder: 'asc' },
        include: {
          chapterMedia: {
            include: { media: true }
          }
        }
      }),
      prisma.chapter.count({ where })
    ])

    return { chapters, total }
  },

  async findById(id: string, includeDeleted = false) {
    return prisma.chapter.findFirst({
      where: {
        id,
        ...(!includeDeleted && { isDeleted: false })
      },
      include: {
        novel: {
          select: { id: true, title: true, slug: true, authorId: true }
        },
        chapterMedia: {
          include: { media: true },
          orderBy: { position: 'asc' }
        }
      }
    })
  },

  async create(data: {
    novelId: string
    title: string
    content: string
    chapterNumber: number
    status?: ChapterStatus
    isPublished?: boolean
  }) {
    const slug = generateSlug(data.title)
    const wordCount = data.content.split(/\s+/).length
    const estimatedReadTime = calculateReadingTime(wordCount)
    
    // Get the highest display order for this novel
    const lastChapter = await prisma.chapter.findFirst({
      where: { novelId: data.novelId },
      orderBy: { displayOrder: 'desc' },
      select: { displayOrder: true }
    })
    
    const displayOrder = lastChapter 
      ? Number(lastChapter.displayOrder) + 1 
      : data.chapterNumber

    return prisma.chapter.create({
      data: {
        ...data,
        slug,
        wordCount,
        estimatedReadTime,
        displayOrder,
        status: data.status || 'draft',
        isPublished: data.isPublished || false
      }
    })
  },

  async update(id: string, data: {
    title?: string
    content?: string
    chapterNumber?: number
    displayOrder?: number
    status?: ChapterStatus
    isPublished?: boolean
  }) {
    const updateData: any = { ...data }
    
    // Update slug if title changes
    if (data.title) {
      updateData.slug = generateSlug(data.title)
    }
    
    // Update word count if content changes
    if (data.content) {
      updateData.wordCount = data.content.split(/\s+/).length
      updateData.estimatedReadTime = calculateReadingTime(updateData.wordCount)
    }

    return prisma.chapter.update({
      where: { id },
      data: updateData
    })
  },

  async softDelete(id: string, deletedBy: string) {
    // Check dependencies
    const comments = await prisma.comment.count({
      where: { chapterId: id, isDeleted: false }
    })
    
    if (comments > 0) {
      throw new Error(`Cannot delete chapter with ${comments} active comments`)
    }

    return prisma.chapter.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy,
        isPublished: false
      }
    })
  },

  async updateViews(id: string, userId?: string, sessionId?: string) {
    // Check if view already exists in last hour
    const recentView = await prisma.chapterView.findFirst({
      where: {
        chapterId: id,
        OR: [
          { userId: userId || undefined },
          { sessionId: sessionId || undefined }
        ],
        viewedAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000) // 1 hour
        }
      }
    })

    if (!recentView) {
      await prisma.$transaction([
        prisma.chapterView.create({
          data: {
            chapterId: id,
            userId,
            sessionId,
            ipAddress: '', // Would get from request in real implementation
            userAgent: ''  // Would get from request headers
          }
        }),
        prisma.chapter.update({
          where: { id },
          data: { views: { increment: 1 } }
        })
      ])
    }
  }
}