// create-api-core.js
// Part 1: API Middleware, Utils, and Services
// Run with: node create-api-core.js

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createFile(filePath, content) {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    const dir = path.dirname(fullPath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(fullPath, content.trim(), 'utf-8');
    console.log(`✅ Created: ${filePath}`);
  } catch (error) {
    console.error(`❌ Error creating ${filePath}:`, error.message);
  }
}

// API Middleware
const apiMiddleware = `// src/lib/api/middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

export async function withAuth(
  request: NextRequest,
  requiredRole?: string
) {
  try {
    const user = await currentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user from database to check role
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, role: true, isActive: true }
    })

    if (!dbUser || !dbUser.isActive) {
      return NextResponse.json(
        { error: 'User not found or inactive' },
        { status: 403 }
      )
    }

    // Check role if required
    if (requiredRole && dbUser.role !== requiredRole && dbUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    return { user: dbUser }
  } catch (error) {
    console.error('Auth middleware error:', error)
    return NextResponse.json(
      { error: 'Authentication error' },
      { status: 500 }
    )
  }
}

export function createAdminRoute(
  handler: (req: NextRequest, user: any) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    const authResult = await withAuth(req, 'admin')
    
    if (authResult instanceof NextResponse) {
      return authResult
    }

    return handler(req, authResult.user)
  }
}

export function createProtectedRoute(
  handler: (req: NextRequest, user: any) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    const authResult = await withAuth(req)
    
    if (authResult instanceof NextResponse) {
      return authResult
    }

    return handler(req, authResult.user)
  }
}`;

// API Utils
const apiUtils = `// src/lib/api/utils.ts
import { NextResponse } from 'next/server'

export function successResponse(data: any, status = 200) {
  return NextResponse.json(
    { success: true, data },
    { status }
  )
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json(
    { success: false, error: message },
    { status }
  )
}

export function paginatedResponse(
  data: any[],
  page: number,
  limit: number,
  total: number
) {
  return NextResponse.json({
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total
    }
  })
}

export async function handleApiError(error: any) {
  console.error('API Error:', error)
  
  if (error.code === 'P2002') {
    return errorResponse('A record with this value already exists', 409)
  }
  
  if (error.code === 'P2025') {
    return errorResponse('Record not found', 404)
  }
  
  return errorResponse(
    error.message || 'An unexpected error occurred',
    500
  )
}

export function getPaginationParams(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10')))
  const skip = (page - 1) * limit
  
  return { page, limit, skip }
}`;

// Novel Service
const novelService = `// src/services/novelService.ts
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
      throw new Error(\`Cannot delete novel with \${chapters} active chapters\`)
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
}`;

// Chapter Service
const chapterService = `// src/services/chapterService.ts
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
    const wordCount = data.content.split(/\\s+/).length
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
      updateData.wordCount = data.content.split(/\\s+/).length
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
      throw new Error(\`Cannot delete chapter with \${comments} active comments\`)
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
}`;

async function main() {
  console.log('🚀 Creating Chat 3 Part 1: Core API & Services');
  console.log('=============================================\n');

  const files = [
    { path: 'src/lib/api/middleware.ts', content: apiMiddleware },
    { path: 'src/lib/api/utils.ts', content: apiUtils },
    { path: 'src/services/novelService.ts', content: novelService },
    { path: 'src/services/chapterService.ts', content: chapterService }
  ];

  for (const file of files) {
    await createFile(file.path, file.content);
  }

  console.log('\n✅ Part 1 completed!');
  console.log('Next: Run node create-api-routes.js to create API routes');
}

main().catch(console.error);