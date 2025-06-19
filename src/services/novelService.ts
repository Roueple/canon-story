// src/services/novelService.ts
import { prisma } from '@/lib/db'
import { slugify } from '@/lib/utils'

export const novelService = {
  async findAll(options: {
    page?: number
    limit?: number
    authorId?: string
    status?: string
    isPublished?: boolean
    includeDeleted?: boolean
  } = {}) {
    const {
      page = 1,
      limit = 20,
      authorId,
      status,
      isPublished,
      includeDeleted = false
    } = options

    const where: any = {}
    
    if (!includeDeleted) {
      where.isDeleted = false
    }
    
    if (authorId) {
      where.authorId = authorId
    }
    
    if (status) {
      where.status = status
    }
    
    if (isPublished !== undefined) {
      where.isPublished = isPublished
    }

    const [novels, total] = await Promise.all([
      prisma.novel.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              displayName: true,
              username: true,
              avatarUrl: true
            }
          },
          genres: {
            include: {
              genre: true
            }
          },
          tags: {
            include: {
              tag: true
            }
          },
          _count: {
            select: {
              chapters: {
                where: {
                  isDeleted: false
                }
              }
            }
          }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          updatedAt: 'desc'
        }
      }),
      prisma.novel.count({ where })
    ])

    // Convert Decimal to number for serialization
    const serializedNovels = novels.map(novel => ({
      ...novel,
      averageRating: Number(novel.averageRating),
      totalViews: Number(novel.totalViews)
    }))

    return { novels: serializedNovels, total }
  },

  async findById(id: string, includeDeleted = false) {
    const novel = await prisma.novel.findFirst({
      where: {
        id,
        ...(!includeDeleted && { isDeleted: false })
      },
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            username: true,
            avatarUrl: true
          }
        },
        genres: {
          include: {
            genre: true
          }
        },
        tags: {
          include: {
            tag: true
          }
        },
        chapters: {
          where: {
            isDeleted: false
          },
          orderBy: {
            chapterNumber: 'asc'
          }
        },
        _count: {
          select: {
            chapters: {
              where: {
                isDeleted: false
              }
            }
          }
        }
      }
    })

    if (!novel) return null

    // Convert Decimal to number for serialization
    return {
      ...novel,
      averageRating: Number(novel.averageRating),
      totalViews: Number(novel.totalViews)
    }
  },

  async findBySlug(slug: string) {
    const novel = await prisma.novel.findFirst({
      where: {
        slug,
        isDeleted: false
      },
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            username: true,
            avatarUrl: true
          }
        },
        genres: {
          include: {
            genre: true
          }
        },
        tags: {
          include: {
            tag: true
          }
        },
        chapters: {
          where: {
            isDeleted: false,
            isPublished: true
          },
          orderBy: {
            chapterNumber: 'asc'
          }
        }
      }
    })

    if (!novel) return null

    // Convert Decimal to number
    return {
      ...novel,
      averageRating: Number(novel.averageRating),
      totalViews: Number(novel.totalViews),
      chapters: novel.chapters.map(chapter => ({
        ...chapter,
        chapterNumber: Number(chapter.chapterNumber)
      }))
    }
  },

  async create(data: {
    title: string
    description?: string
    coverColor?: string
    coverImageUrl?: string
    authorId: string
    status?: string
    isPublished?: boolean
    genreIds?: string[]
    tagNames?: string[]
  }) {
    const slug = await this.generateUniqueSlug(data.title)

    const novel = await prisma.novel.create({
      data: {
        title: data.title,
        slug,
        description: data.description,
        coverColor: data.coverColor || '#3B82F6',
        coverImageUrl: data.coverImageUrl,
        authorId: data.authorId,
        status: data.status || 'ongoing',
        isPublished: data.isPublished || false,
        ...(data.genreIds && data.genreIds.length > 0 && {
          genres: {
            create: data.genreIds.map(genreId => ({
              genreId
            }))
          }
        }),
        ...(data.tagNames && data.tagNames.length > 0 && {
          tags: {
            create: data.tagNames.map(name => ({
              tag: {
                connectOrCreate: {
                  where: { name },
                  create: { name, slug: slugify(name) }
                }
              }
            }))
          }
        })
      },
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            username: true,
            avatarUrl: true
          }
        }
      }
    })

    return {
      ...novel,
      averageRating: Number(novel.averageRating),
      totalViews: Number(novel.totalViews)
    }
  },

  async update(id: string, data: {
    title?: string
    description?: string
    coverColor?: string
    coverImageUrl?: string
    status?: string
    isPublished?: boolean
    genreIds?: string[]
    tagNames?: string[]
  }) {
    const updateData: any = {
      ...data
    }

    // Remove genre and tag fields from main update
    delete updateData.genreIds
    delete updateData.tagNames

    // If title changed, generate new slug
    if (data.title) {
      const currentNovel = await prisma.novel.findUnique({
        where: { id }
      })
      
      if (currentNovel && currentNovel.title !== data.title) {
        updateData.slug = await this.generateUniqueSlug(data.title, id)
      }
    }

    const novel = await prisma.$transaction(async (tx) => {
      // Update genres if provided
      if (data.genreIds !== undefined) {
        await tx.novelGenre.deleteMany({
          where: { novelId: id }
        })
        
        if (data.genreIds.length > 0) {
          await tx.novelGenre.createMany({
            data: data.genreIds.map(genreId => ({
              novelId: id,
              genreId
            }))
          })
        }
      }

      // Update tags if provided
      if (data.tagNames !== undefined) {
        await tx.novelTag.deleteMany({
          where: { novelId: id }
        })
        
        if (data.tagNames.length > 0) {
          for (const name of data.tagNames) {
            const tag = await tx.tag.upsert({
              where: { name },
              create: { name, slug: slugify(name) },
              update: {}
            })
            
            await tx.novelTag.create({
              data: {
                novelId: id,
                tagId: tag.id
              }
            })
          }
        }
      }

      // Update novel
      return await tx.novel.update({
        where: { id },
        data: updateData,
        include: {
          author: {
            select: {
              id: true,
              displayName: true,
              username: true,
              avatarUrl: true
            }
          }
        }
      })
    })

    return {
      ...novel,
      averageRating: Number(novel.averageRating),
      totalViews: Number(novel.totalViews)
    }
  },

  async softDelete(id: string, deletedBy: string) {
    return await prisma.novel.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy
      }
    })
  },

  async generateUniqueSlug(title: string, excludeId?: string): Promise<string> {
    let slug = slugify(title)
    let counter = 1
    
    while (true) {
      const existing = await prisma.novel.findFirst({
        where: {
          slug,
          ...(excludeId && { NOT: { id: excludeId } })
        }
      })
      
      if (!existing) break
      
      slug = `${slugify(title)}-${counter}`
      counter++
    }
    
    return slug
  }
}