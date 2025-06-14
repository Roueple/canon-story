// create-api-routes.js
// Part 2: API Routes (Admin & Public)
// Run with: node create-api-routes.js

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

// Admin Routes
const adminNovelsRoute = `// src/app/api/admin/novels/route.ts
import { NextRequest } from 'next/server'
import { createAdminRoute } from '@/lib/api/middleware'
import { successResponse, errorResponse, paginatedResponse, handleApiError, getPaginationParams } from '@/lib/api/utils'
import { novelService } from '@/services/novelService'

// GET /api/admin/novels - List all novels (including unpublished)
export const GET = createAdminRoute(async (req: NextRequest) => {
  try {
    const searchParams = req.nextUrl.searchParams
    const { page, limit } = getPaginationParams(searchParams)
    const status = searchParams.get('status') as any
    const isPublished = searchParams.get('isPublished') === 'true'
    const includeDeleted = searchParams.get('includeDeleted') === 'true'

    const { novels, total } = await novelService.findAll({
      page,
      limit,
      status,
      isPublished,
      includeDeleted
    })

    return paginatedResponse(novels, page, limit, total)
  } catch (error) {
    return handleApiError(error)
  }
})

// POST /api/admin/novels - Create new novel
export const POST = createAdminRoute(async (req: NextRequest, user: any) => {
  try {
    const body = await req.json()
    
    // Validate required fields
    if (!body.title) {
      return errorResponse('Title is required')
    }

    const novel = await novelService.create({
      ...body,
      authorId: user.id
    })

    return successResponse(novel, 201)
  } catch (error) {
    return handleApiError(error)
  }
})`;

const adminNovelIdRoute = `// src/app/api/admin/novels/[id]/route.ts
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
})`;

const adminChaptersRoute = `// src/app/api/admin/novels/[id]/chapters/route.ts
import { NextRequest } from 'next/server'
import { createAdminRoute } from '@/lib/api/middleware'
import { successResponse, errorResponse, paginatedResponse, handleApiError, getPaginationParams } from '@/lib/api/utils'
import { chapterService } from '@/services/chapterService'

// GET /api/admin/novels/[id]/chapters - List chapters
export const GET = createAdminRoute(async (req: NextRequest, user: any) => {
  try {
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    const novelIdIndex = pathParts.indexOf('novels') + 1
    const novelId = pathParts[novelIdIndex]
    
    if (!novelId) {
      return errorResponse('Novel ID required', 400)
    }

    const searchParams = req.nextUrl.searchParams
    const { page, limit } = getPaginationParams(searchParams)
    const includeDeleted = searchParams.get('includeDeleted') === 'true'

    const { chapters, total } = await chapterService.findAll(novelId, {
      page,
      limit,
      includeDeleted
    })

    return paginatedResponse(chapters, page, limit, total)
  } catch (error) {
    return handleApiError(error)
  }
})

// POST /api/admin/novels/[id]/chapters - Create chapter
export const POST = createAdminRoute(async (req: NextRequest, user: any) => {
  try {
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    const novelIdIndex = pathParts.indexOf('novels') + 1
    const novelId = pathParts[novelIdIndex]
    
    if (!novelId) {
      return errorResponse('Novel ID required', 400)
    }

    const body = await req.json()
    
    // Validate required fields
    if (!body.title || !body.content || body.chapterNumber === undefined) {
      return errorResponse('Title, content, and chapter number are required')
    }

    const chapter = await chapterService.create({
      ...body,
      novelId
    })

    return successResponse(chapter, 201)
  } catch (error) {
    return handleApiError(error)
  }
})`;

// Public Routes
const publicNovelsRoute = `// src/app/api/public/novels/route.ts
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
}`;

const publicNovelIdRoute = `// src/app/api/public/novels/[id]/route.ts
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
}`;

const publicChaptersRoute = `// src/app/api/public/novels/[id]/chapters/route.ts
import { NextRequest } from 'next/server'
import { errorResponse, paginatedResponse, handleApiError, getPaginationParams } from '@/lib/api/utils'
import { chapterService } from '@/services/chapterService'

// GET /api/public/novels/[id]/chapters - List published chapters
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    const novelIdIndex = pathParts.indexOf('novels') + 1
    const novelId = pathParts[novelIdIndex]
    
    if (!novelId) {
      return errorResponse('Novel ID required', 400)
    }

    const searchParams = req.nextUrl.searchParams
    const { page, limit } = getPaginationParams(searchParams)

    const { chapters, total } = await chapterService.findAll(novelId, {
      page,
      limit,
      isPublished: true, // Only published chapters
      includeDeleted: false
    })

    return paginatedResponse(chapters, page, limit, total)
  } catch (error) {
    return handleApiError(error)
  }
}`;

const publicChapterIdRoute = `// src/app/api/public/chapters/[id]/route.ts
import { NextRequest } from 'next/server'
import { successResponse, errorResponse, handleApiError } from '@/lib/api/utils'
import { chapterService } from '@/services/chapterService'
import { currentUser } from '@clerk/nextjs/server'

// GET /api/public/chapters/[id] - Get published chapter
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const id = url.pathname.split('/').pop()
    
    if (!id) {
      return errorResponse('Chapter ID required', 400)
    }

    const chapter = await chapterService.findById(id)

    if (!chapter || !chapter.isPublished) {
      return errorResponse('Chapter not found', 404)
    }

    // Track view
    const user = await currentUser()
    const sessionId = req.headers.get('x-session-id') || 
                      req.cookies.get('session-id')?.value

    await chapterService.updateViews(
      id,
      user?.id,
      sessionId
    )

    return successResponse(chapter)
  } catch (error) {
    return handleApiError(error)
  }
}`;

// Test route for API
const apiTestRoute = `// src/app/api/test-api/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const [novelCount, chapterCount, userCount] = await Promise.all([
      prisma.novel.count({ where: { isDeleted: false } }),
      prisma.chapter.count({ where: { isDeleted: false } }),
      prisma.user.count({ where: { isDeleted: false } })
    ])

    return NextResponse.json({
      success: true,
      message: 'API is working correctly',
      stats: {
        novels: novelCount,
        chapters: chapterCount,
        users: userCount
      },
      endpoints: {
        admin: [
          'GET /api/admin/novels',
          'POST /api/admin/novels',
          'GET /api/admin/novels/[id]',
          'PUT /api/admin/novels/[id]',
          'DELETE /api/admin/novels/[id]',
          'GET /api/admin/novels/[id]/chapters',
          'POST /api/admin/novels/[id]/chapters'
        ],
        public: [
          'GET /api/public/novels',
          'GET /api/public/novels/[id]',
          'GET /api/public/novels/[id]/chapters',
          'GET /api/public/chapters/[id]'
        ]
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}`;

async function main() {
  console.log('🚀 Creating Chat 3 Part 2: API Routes');
  console.log('=====================================\n');

  const files = [
    // Admin routes
    { path: 'src/app/api/admin/novels/route.ts', content: adminNovelsRoute },
    { path: 'src/app/api/admin/novels/[id]/route.ts', content: adminNovelIdRoute },
    { path: 'src/app/api/admin/novels/[id]/chapters/route.ts', content: adminChaptersRoute },
    // Public routes
    { path: 'src/app/api/public/novels/route.ts', content: publicNovelsRoute },
    { path: 'src/app/api/public/novels/[id]/route.ts', content: publicNovelIdRoute },
    { path: 'src/app/api/public/novels/[id]/chapters/route.ts', content: publicChaptersRoute },
    { path: 'src/app/api/public/chapters/[id]/route.ts', content: publicChapterIdRoute },
    // Test route
    { path: 'src/app/api/test-api/route.ts', content: apiTestRoute }
  ];

  for (const file of files) {
    await createFile(file.path, file.content);
  }

  console.log('\n✅ Part 2 completed!');
  console.log('Next: Run node create-admin-ui.js to create admin UI components');
}

main().catch(console.error);