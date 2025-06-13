// src/services/novelService.ts
import { prisma } from '@/lib/db'
import { NovelStatus } from '@/types'
import { generateSlug } from '@/lib/utils'

export const novelService = {
  async findAll(options: {
    page?: number
    limit?: number
    status?: NovelStatus
    isPublished?: boolean
    includeDeleted?: boolean
  }) {
    const { page = 1, limit = 10, status, isPublished, includeDeleted = false } = options
    const skip = (page - 1) * limit

    const where = {
      ...(status && { status }),
      ...(isPublished !== undefined && { isPublished }),
      ...(!includeDeleted && { isDeleted: false })
    }

    const [novels, total] = await Promise.all([
      prisma.novel.findMany({
        where,
        skip,
        take: limit,
        include: {
          author: {
            select: { id: true, displayName: true, username: true }
          },
          chapters: {
            where: { isDeleted: false },
            select: { id: true }
          },
          genres: {
            include: { genre: true }
          }
        },
        orderBy: { updatedAt: 'desc' }
      }),
      prisma.novel.count({ where })
    ])

    return { novels, total }
  },

  async findById(id: string, includeDeleted = false) {
    return prisma.novel.findFirst({
      where: {
        id,
        ...(!includeDeleted && { isDeleted: false })
      },
      include: {
        author: {
          select: { id: true, displayName: true, username: true, avatarUrl: true }
        },
        chapters: {
          where: { isDeleted: false },
          orderBy: { displayOrder: 'asc' }
        },
        genres: {
          include: { genre: true }
        },
        tags: {
          include: { tag: true }
        }
      }
    })
  },

  async create(data: {
    title: string
    description?: string
    coverColor?: string
    authorId: string
    genreIds?: string[]
    tagIds?: string[]
  }) {
    const slug = generateSlug(data.title)
    
    // Check if slug exists
    const existing = await prisma.novel.findUnique({ where: { slug } })
    if (existing) {
      throw new Error('A novel with this title already exists')
    }

    return prisma.novel.create({
      data: {
        title: data.title,
        slug,
        description: data.description,
        coverColor: data.coverColor,
        authorId: data.authorId,
        genres: {
          create: data.genreIds?.map(genreId => ({ genreId })) || []
        },
        tags: {
          create: data.tagIds?.map(tagId => ({ tagId })) || []
        }
      },
      include: {
        genres: { include: { genre: true } },
        tags: { include: { tag: true } }
      }
    })
  },

  async update(id: string, data: {
    title?: string
    description?: string
    coverColor?: string
    status?: NovelStatus
    isPublished?: boolean
    genreIds?: string[]
    tagIds?: string[]
  }) {
    const updateData: any = { ...data }
    
    // Handle slug update if title changes
    if (data.title) {
      updateData.slug = generateSlug(data.title)
    }
    
    // Handle genre updates
    if (data.genreIds) {
      await prisma.novelGenre.deleteMany({ where: { novelId: id } })
      updateData.genres = {
        create: data.genreIds.map(genreId => ({ genreId }))
      }
    }
    
    // Handle tag updates
    if (data.tagIds) {
      await prisma.novelTag.deleteMany({ where: { novelId: id } })
      updateData.tags = {
        create: data.tagIds.map(tagId => ({ tagId }))
      }
    }
    
    delete updateData.genreIds
    delete updateData.tagIds

    return prisma.novel.update({
      where: { id },
      data: updateData,
      include: {
        genres: { include: { genre: true } },
        tags: { include: { tag: true } }
      }
    })
  },

  async softDelete(id: string, deletedBy: string) {
    // Check dependencies first
    const chapters = await prisma.chapter.count({
      where: { novelId: id, isDeleted: false }
    })
    
    if (chapters > 0) {
      throw new Error(`Cannot delete novel with ${chapters} active chapters`)
    }

    return prisma.novel.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy,
        isPublished: false // Unpublish when deleting
      }
    })
  }
}