// fix-all-issues.js
// This script fixes the dynamic API routing and middleware issues for novel and chapter management.
// Run with: node fix-all-issues.js

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createFile(filePath, content) {
  const fullPath = path.join(process.cwd(), filePath);
  const dir = path.dirname(fullPath);
  try {
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(fullPath, content.trim(), 'utf-8');
    console.log(`✅ Fixed & Updated: ${filePath}`);
  } catch (error) {
    console.error(`❌ Error creating ${filePath}:`, error.message);
  }
}

const filesToFix = [
  {
    path: 'src/lib/api/middleware.ts',
    content: `// src/lib/api/middleware.ts
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

// CORRECTED: The handler now receives a context object with user and params
export function createAdminRoute(
  handler: (req: NextRequest, context: { user: any; params: any }) => Promise<NextResponse>
) {
  return async (req: NextRequest, { params }: { params: any }) => {
    const authResult = await withAuth(req, 'admin')
    if (authResult instanceof NextResponse) {
      return authResult
    }
    return handler(req, { user: authResult.user, params })
  }
}

// CORRECTED: The handler now receives a context object with user and params
export function createProtectedRoute(
  handler: (req: NextRequest, context: { user: any; params: any }) => Promise<NextResponse>
) {
  return async (req: NextRequest, { params }: { params: any }) => {
    const authResult = await withAuth(req)
    if (authResult instanceof NextResponse) {
      return authResult
    }
    return handler(req, { user: authResult.user, params })
  }
}`
  },
  {
    path: 'src/app/api/admin/novels/[id]/route.ts',
    content: `// src/app/api/admin/novels/[id]/route.ts
import { NextRequest } from 'next/server'
import { createAdminRoute } from '@/lib/api/middleware'
import { successResponse, errorResponse, handleApiError } from '@/lib/api/utils'
import { novelService } from '@/services/novelService'

// CORRECTED: Handler signature updated to use context
export const GET = createAdminRoute(async (req, { params }) => {
  try {
    const { id } = params;
    if (!id) {
      return errorResponse('Novel ID is required', 400);
    }
    const novel = await novelService.findById(id, true); // Admin can view deleted
    if (!novel) {
      return errorResponse('Novel not found', 404);
    }
    return successResponse(novel);
  } catch (error) {
    return handleApiError(error);
  }
});

// CORRECTED: Handler signature updated to use context
export const PUT = createAdminRoute(async (req, { params }) => {
  try {
    const { id } = params;
    if (!id) {
      return errorResponse('Novel ID is required', 400);
    }
    const body = await req.json();
    const novel = await novelService.update(id, body);
    return successResponse(novel);
  } catch (error) {
    return handleApiError(error);
  }
});

// CORRECTED: Handler signature updated to use context
export const DELETE = createAdminRoute(async (req, { user, params }) => {
  try {
    const { id } = params;
    if (!id) {
      return errorResponse('Novel ID is required', 400);
    }
    await novelService.softDelete(id, user.id);
    return successResponse({ message: 'Novel deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
});`
  },
  {
    path: 'src/app/api/admin/novels/[id]/chapters/route.ts',
    content: `// src/app/api/admin/novels/[id]/chapters/route.ts
import { NextRequest } from 'next/server'
import { createAdminRoute } from '@/lib/api/middleware'
import { successResponse, errorResponse, paginatedResponse, handleApiError, getPaginationParams } from '@/lib/api/utils'
import { chapterService } from '@/services/chapterService'

// CORRECTED: Handler signature updated to use context
export const GET = createAdminRoute(async (req, { params }) => {
  try {
    const novelId = params.id;
    if (!novelId) {
      return errorResponse('Novel ID is required', 400);
    }

    const searchParams = req.nextUrl.searchParams;
    const { page, limit } = getPaginationParams(searchParams);

    const { chapters, total } = await chapterService.findAll(novelId, {
      page,
      limit,
      includeDeleted: true // Admin can view all chapters, including deleted ones
    });

    return paginatedResponse(chapters, page, limit, total);
  } catch (error) {
    return handleApiError(error);
  }
});

// CORRECTED: Handler signature updated to use context
export const POST = createAdminRoute(async (req, { params }) => {
  try {
    const novelId = params.id;
    if (!novelId) {
      return errorResponse('Novel ID is required', 400);
    }

    const body = await req.json();
    if (!body.title || !body.content || body.chapterNumber === undefined) {
      return errorResponse('Title, content, and chapter number are required', 400);
    }

    const chapter = await chapterService.create({ ...body, novelId });
    return successResponse(chapter, 201);
  } catch (error) {
    return handleApiError(error);
  }
});`
  },
  {
    path: 'src/app/api/admin/chapters/[id]/route.ts',
    content: `// src/app/api/admin/chapters/[id]/route.ts
import { NextRequest } from 'next/server'
import { createAdminRoute } from '@/lib/api/middleware'
import { successResponse, errorResponse, handleApiError } from '@/lib/api/utils'
import { chapterService } from '@/services/chapterService'
import { prisma } from '@/lib/db'

// CORRECTED: Handler signature updated to use context
export const GET = createAdminRoute(async (req, { params }) => {
  try {
    const { id } = params;
    if (!id) {
      return errorResponse('Chapter ID is required', 400);
    }
    const chapter = await chapterService.findById(id, true);
    if (!chapter) {
      return errorResponse('Chapter not found', 404);
    }
    return successResponse(chapter);
  } catch (error) {
    return handleApiError(error);
  }
});

// CORRECTED: Handler signature updated to use context
export const PUT = createAdminRoute(async (req, { params }) => {
  try {
    const { id } = params;
    if (!id) {
      return errorResponse('Chapter ID is required', 400);
    }
    const body = await req.json();
    const chapter = await chapterService.update(id, body);
    await prisma.novel.update({
      where: { id: chapter.novelId },
      data: { updatedAt: new Date() }
    });
    return successResponse(chapter);
  } catch (error) {
    return handleApiError(error);
  }
});

// CORRECTED: Handler signature updated to use context
export const DELETE = createAdminRoute(async (req, { user, params }) => {
  try {
    const { id } = params;
    if (!id) {
      return errorResponse('Chapter ID is required', 400);
    }
    await chapterService.softDelete(id, user.id);
    return successResponse({ message: 'Chapter deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
});`
  },
  {
    path: 'src/app/api/public/novels/[id]/route.ts',
    content: `// src/app/api/public/novels/[id]/route.ts
import { NextRequest } from 'next/server'
import { successResponse, errorResponse, handleApiError } from '@/lib/api/utils'
import { novelService } from '@/services/novelService'
import { prisma } from '@/lib/db'

// CORRECTED: Handler signature updated to use params
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    if (!id) {
      return errorResponse('Novel ID is required', 400);
    }
    const novel = await novelService.findById(id);
    if (!novel || !novel.isPublished) {
      return errorResponse('Novel not found', 404);
    }
    // Increment view count
    await prisma.novel.update({
      where: { id },
      data: { totalViews: { increment: 1 } }
    });
    return successResponse(novel);
  } catch (error) {
    return handleApiError(error);
  }
}`
  },
  {
    path: 'src/app/api/public/novels/[id]/chapters/route.ts',
    content: `// src/app/api/public/novels/[id]/chapters/route.ts
import { NextRequest } from 'next/server'
import { errorResponse, paginatedResponse, handleApiError, getPaginationParams } from '@/lib/api/utils'
import { chapterService } from '@/services/chapterService'

// CORRECTED: Handler signature updated to use params
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const novelId = params.id;
    if (!novelId) {
      return errorResponse('Novel ID is required', 400);
    }

    const searchParams = req.nextUrl.searchParams;
    const { page, limit } = getPaginationParams(searchParams);

    const { chapters, total } = await chapterService.findAll(novelId, {
      page,
      limit,
      isPublished: true, // Only published chapters
      includeDeleted: false
    });

    return paginatedResponse(chapters, page, limit, total);
  } catch (error) {
    return handleApiError(error);
  }
}`
  },
  {
    path: 'src/app/api/public/chapters/[id]/route.ts',
    content: `// src/app/api/public/chapters/[id]/route.ts
import { NextRequest } from 'next/server'
import { successResponse, errorResponse, handleApiError } from '@/lib/api/utils'
import { chapterService } from '@/services/chapterService'
import { currentUser } from '@clerk/nextjs/server'

// CORRECTED: Handler signature updated to use params
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    if (!id) {
      return errorResponse('Chapter ID is required', 400);
    }
    const chapter = await chapterService.findById(id);
    if (!chapter || !chapter.isPublished) {
      return errorResponse('Chapter not found', 404);
    }
    // Track view
    const user = await currentUser();
    const sessionId = req.headers.get('x-session-id') || req.cookies.get('session-id')?.value;
    await chapterService.updateViews(id, user?.id, sessionId);
    return successResponse(chapter);
  } catch (error) {
    return handleApiError(error);
  }
}`
  }
];

async function main() {
  console.log('🚀 Applying fixes for novel and chapter management...');
  console.log('====================================================\n');

  for (const file of filesToFix) {
    await createFile(file.path, file.content);
  }

  console.log('\n✅ All fixes have been applied!');
  console.log('\nPlease restart your development server to see the changes:');
  console.log('1. Press Ctrl+C in your terminal.');
  console.log('2. Run: npm run dev');
  console.log('\nAfter restarting, you should be able to create, view, and edit novels and chapters as expected.');
}

main().catch(console.error);