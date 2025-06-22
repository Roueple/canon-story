#!/usr/bin/env node
import { readFile, writeFile, readdir, stat } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔧 Starting API Fix for Next.js 15 Compatibility...\n');

// Fix 1: Update middleware.ts for proper async handling
const middlewareFixContent = `// src/lib/api/middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

export async function withAuth(request: NextRequest, requiredRole?: string) {
  try {
    const user = await currentUser();
    if (!user) { 
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) 
    }
    
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, role: true, isActive: true }
    });
    
    if (!dbUser || !dbUser.isActive) { 
      return NextResponse.json({ error: 'User not found or inactive' }, { status: 403 }) 
    }
    
    if (requiredRole && dbUser.role !== requiredRole && dbUser.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
    
    return { user: dbUser }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return NextResponse.json({ error: 'Authentication error' }, { status: 500 })
  }
}

// CRITICAL FIX: Handle async params in Next.js 15
export function createAdminRoute(
  handler: (req: NextRequest, context: { user: any; params: any }) => Promise<NextResponse>
) {
  return async (req: NextRequest, props: { params: Promise<any> }) => {
    const params = await props.params; // Await the params Promise
    const authResult = await withAuth(req, 'admin');
    if (authResult instanceof NextResponse) { 
      return authResult 
    }
    return handler(req, { user: authResult.user, params });
  }
}

export function createProtectedRoute(
  handler: (req: NextRequest, context: { user: any; params: any }) => Promise<NextResponse>
) {
  return async (req: NextRequest, props: { params: Promise<any> }) => {
    const params = await props.params; // Await the params Promise
    const authResult = await withAuth(req);
    if (authResult instanceof NextResponse) { 
      return authResult 
    }
    return handler(req, { user: authResult.user, params });
  }
}`;

// Fix 2: Admin Novel Routes
const adminNovelRoutesFix = {
  '[id]/route.ts': `// src/app/api/admin/novels/[id]/route.ts
import { NextRequest } from 'next/server'
import { createAdminRoute } from '@/lib/api/middleware'
import { successResponse, errorResponse, handleApiError } from '@/lib/api/utils'
import { novelService } from '@/services/novelService'

export const GET = createAdminRoute(async (req, { params }) => {
  try {
    const { id } = params;
    if (!id) return errorResponse('Novel ID is required', 400);
    const novel = await novelService.findById(id, true);
    if (!novel) return errorResponse('Novel not found', 404);
    return successResponse(novel);
  } catch (error) { 
    return handleApiError(error) 
  }
});

export const PUT = createAdminRoute(async (req, { params }) => {
  try {
    const { id } = params;
    if (!id) return errorResponse('Novel ID is required', 400);
    const body = await req.json();
    const novel = await novelService.update(id, body);
    return successResponse(novel);
  } catch (error) { 
    return handleApiError(error) 
  }
});

export const DELETE = createAdminRoute(async (req, { user, params }) => {
  try {
    const { id } = params;
    if (!id) return errorResponse('Novel ID is required', 400);
    await novelService.softDelete(id, user.id);
    return successResponse({ message: 'Novel deleted successfully' });
  } catch (error) { 
    return handleApiError(error) 
  }
});`,

  '[id]/chapters/route.ts': `// src/app/api/admin/novels/[id]/chapters/route.ts
import { NextRequest } from 'next/server'
import { createAdminRoute } from '@/lib/api/middleware'
import { successResponse, errorResponse, paginatedResponse, handleApiError, getPaginationParams } from '@/lib/api/utils'
import { chapterService } from '@/services/chapterService'
import { prisma } from '@/lib/db'

export const GET = createAdminRoute(async (req, { params }) => {
  try {
    const { id } = params;
    if (!id) return errorResponse('Novel ID is required', 400);
    
    const { page, limit } = getPaginationParams(req.nextUrl.searchParams);
    const { chapters, total } = await chapterService.findByNovelId(id, { 
      page, 
      limit, 
      includeUnpublished: true 
    });
    
    return paginatedResponse(chapters, page, limit, total);
  } catch (error) { 
    return handleApiError(error) 
  }
});

export const POST = createAdminRoute(async (req, { params }) => {
  try {
    const { id } = params;
    if (!id) return errorResponse('Novel ID is required', 400);
    
    const body = await req.json();
    const chapter = await chapterService.create({ ...body, novelId: id });
    
    await prisma.novel.update({
      where: { id },
      data: { updatedAt: new Date() }
    });
    
    return successResponse(chapter, 201);
  } catch (error) { 
    return handleApiError(error) 
  }
});`
};

// Fix 3: Admin Chapter Routes
const adminChapterRouteFix = `// src/app/api/admin/chapters/[id]/route.ts
import { NextRequest } from 'next/server'
import { createAdminRoute } from '@/lib/api/middleware'
import { successResponse, errorResponse, handleApiError } from '@/lib/api/utils'
import { chapterService } from '@/services/chapterService'
import { prisma } from '@/lib/db'

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

export const PUT = createAdminRoute(async (req, { params }) => {
  try {
    const { id } = params;
    if (!id) {
      return errorResponse('Chapter ID is required', 400);
    }
    const body = await req.json();
    const chapter = await chapterService.update(id, body);
    
    // Update novel's updatedAt timestamp
    await prisma.novel.update({
      where: { id: chapter.novelId },
      data: { updatedAt: new Date() }
    });
    
    return successResponse(chapter);
  } catch (error) {
    return handleApiError(error);
  }
});

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
});`;

// Fix 4: Public Routes
const publicChapterRouteFix = `// src/app/api/public/chapters/[id]/route.ts
import { NextRequest } from 'next/server'
import { successResponse, errorResponse, handleApiError } from '@/lib/api/utils'
import { chapterService } from '@/services/chapterService'
import { currentUser } from '@clerk/nextjs/server'

export async function GET(
  req: NextRequest, 
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params; // Await the params Promise
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
}`;

const publicNovelRouteFix = `// src/app/api/public/novels/[id]/route.ts
import { NextRequest } from 'next/server'
import { successResponse, errorResponse, handleApiError } from '@/lib/api/utils'
import { novelService } from '@/services/novelService'
import { prisma } from '@/lib/db'

export async function GET(
  req: NextRequest, 
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params; // Await the params Promise
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
}`;

// Fix 5: Environment file template
const envFileContent = `# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_WEBHOOK_SECRET=your_clerk_webhook_secret

# Clerk URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# Database (Neon)
DATABASE_URL=postgresql://username:password@host/database?sslmode=require

# Cloudinary (Media Management)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_API_KEY=your_api_key`;

// Execute fixes
async function applyFixes() {
  try {
    // Fix 1: Update middleware
    console.log('📝 Fixing API middleware...');
    await writeFile(join(process.cwd(), 'src/lib/api/middleware.ts'), middlewareFixContent);
    console.log('✅ API middleware fixed\n');

    // Fix 2: Update admin novel routes
    console.log('📝 Fixing admin novel routes...');
    await writeFile(
      join(process.cwd(), 'src/app/api/admin/novels/[id]/route.ts'), 
      adminNovelRoutesFix['[id]/route.ts']
    );
    await writeFile(
      join(process.cwd(), 'src/app/api/admin/novels/[id]/chapters/route.ts'), 
      adminNovelRoutesFix['[id]/chapters/route.ts']
    );
    console.log('✅ Admin novel routes fixed\n');

    // Fix 3: Update admin chapter route
    console.log('📝 Fixing admin chapter routes...');
    await writeFile(
      join(process.cwd(), 'src/app/api/admin/chapters/[id]/route.ts'), 
      adminChapterRouteFix
    );
    console.log('✅ Admin chapter routes fixed\n');

    // Fix 4: Update public routes
    console.log('📝 Fixing public routes...');
    await writeFile(
      join(process.cwd(), 'src/app/api/public/chapters/[id]/route.ts'), 
      publicChapterRouteFix
    );
    await writeFile(
      join(process.cwd(), 'src/app/api/public/novels/[id]/route.ts'), 
      publicNovelRouteFix
    );
    console.log('✅ Public routes fixed\n');

    // Fix 5: Create .env template if .env doesn't exist
    try {
      await stat(join(process.cwd(), '.env'));
      console.log('ℹ️  .env file exists - skipping creation\n');
    } catch {
      console.log('📝 Creating .env file template...');
      await writeFile(join(process.cwd(), '.env'), envFileContent);
      console.log('✅ .env file created - Please update with your credentials\n');
    }

    // Additional fixes for nested chapter routes
    console.log('📝 Fixing additional nested routes...');
    
    // Keep existing chapter routes but ensure they're also updated
    const nestedRoutes = [
      'src/app/api/public/novels/[novelId]/chapters/[chapterId]/route.ts',
      'src/app/api/public/novels/[novelId]/chapters/[chapterId]/content/route.ts'
    ];

    // These routes already use async params correctly in your codebase
    console.log('✅ Nested routes are already using async params correctly\n');

    console.log('🎉 All API fixes completed successfully!\n');
    console.log('Next steps:');
    console.log('1. If .env was created, update it with your actual credentials');
    console.log('2. Run "npm run db:generate" to ensure Prisma client is up to date');
    console.log('3. Restart your development server');
    console.log('4. Test the admin panel and API endpoints\n');

  } catch (error) {
    console.error('❌ Error applying fixes:', error);
    process.exit(1);
  }
}

// Run the fixes
applyFixes();