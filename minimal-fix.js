// minimal-fix.js
// This script applies only the essential fixes to make the novel/chapter
// management UI visible and functional, reverting unnecessary changes.
// Run with: node minimal-fix.js

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
    console.log(`✅ Applied Necessary Fix: ${filePath}`);
  } catch (error) {
    console.error(`❌ Error creating ${filePath}:`, error.message);
  }
}

const essentialFixes = [
  // ESSENTIAL FIX 1: Make the Button component visible
  {
    path: 'src/components/shared/ui/Button.tsx',
    content: `// src/components/shared/ui/Button.tsx
'use client' // <-- Absolutely necessary for the button to render

import { type ReactNode, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  children: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary/90',
    secondary: 'bg-secondary text-white hover:bg-secondary/90',
    outline: 'border border-border bg-transparent hover:bg-muted',
    ghost: 'bg-transparent hover:bg-muted',
    danger: 'bg-error text-white hover:bg-error/90',
  }
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  }
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
}`
  },
  // ESSENTIAL FIX 2: Make the API middleware pass parameters correctly
  {
    path: 'src/lib/api/middleware.ts',
    content: `// src/lib/api/middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

export async function withAuth(request: NextRequest, requiredRole?: string) {
  try {
    const user = await currentUser();
    if (!user) { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
    
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, role: true, isActive: true }
    });
    if (!dbUser || !dbUser.isActive) { return NextResponse.json({ error: 'User not found or inactive' }, { status: 403 }) }
    
    if (requiredRole && dbUser.role !== requiredRole && dbUser.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
    return { user: dbUser }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return NextResponse.json({ error: 'Authentication error' }, { status: 500 })
  }
}

export function createAdminRoute(
  handler: (req: NextRequest, context: { user: any; params: any }) => Promise<NextResponse>
) {
  return async (req: NextRequest, { params }: { params: any }) => {
    const authResult = await withAuth(req, 'admin');
    if (authResult instanceof NextResponse) { return authResult }
    return handler(req, { user: authResult.user, params });
  }
}

export function createProtectedRoute(
  handler: (req: NextRequest, context: { user: any; params: any }) => Promise<NextResponse>
) {
  return async (req: NextRequest, { params }: { params: any }) => {
    const authResult = await withAuth(req);
    if (authResult instanceof NextResponse) { return authResult }
    return handler(req, { user: authResult.user, params });
  }
}`
  },
  // ESSENTIAL FIX 3: Make the API routes functional by correctly reading the ID
  {
    path: 'src/app/api/admin/novels/[id]/route.ts',
    content: `// src/app/api/admin/novels/[id]/route.ts
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
  } catch (error) { return handleApiError(error) }
});

export const PUT = createAdminRoute(async (req, { params }) => {
  try {
    const { id } = params;
    if (!id) return errorResponse('Novel ID is required', 400);
    const body = await req.json();
    const novel = await novelService.update(id, body);
    return successResponse(novel);
  } catch (error) { return handleApiError(error) }
});

export const DELETE = createAdminRoute(async (req, { user, params }) => {
  try {
    const { id } = params;
    if (!id) return errorResponse('Novel ID is required', 400);
    await novelService.softDelete(id, user.id);
    return successResponse({ message: 'Novel deleted successfully' });
  } catch (error) { return handleApiError(error) }
});`
  },
  {
    path: 'src/app/api/admin/novels/[id]/chapters/route.ts',
    content: `// src/app/api/admin/novels/[id]/chapters/route.ts
import { NextRequest } from 'next/server'
import { createAdminRoute } from '@/lib/api/middleware'
import { successResponse, errorResponse, paginatedResponse, handleApiError, getPaginationParams } from '@/lib/api/utils'
import { chapterService } from '@/services/chapterService'

export const GET = createAdminRoute(async (req, { params }) => {
  try {
    const novelId = params.id;
    if (!novelId) return errorResponse('Novel ID is required', 400);

    const { page, limit } = getPaginationParams(req.nextUrl.searchParams);
    const { chapters, total } = await chapterService.findAll(novelId, { page, limit, includeDeleted: true });
    return paginatedResponse(chapters, page, limit, total);
  } catch (error) { return handleApiError(error) }
});

export const POST = createAdminRoute(async (req, { params }) => {
  try {
    const novelId = params.id;
    if (!novelId) return errorResponse('Novel ID is required', 400);

    const body = await req.json();
    if (!body.title || !body.content || body.chapterNumber === undefined) {
      return errorResponse('Title, content, and chapter number are required', 400);
    }
    const chapter = await chapterService.create({ ...body, novelId });
    return successResponse(chapter, 201);
  } catch (error) { return handleApiError(error) }
});`
  },
  // REVERT UNNECESSARY CHANGE: Use the original version of the admin novels page.
  {
    path: 'src/app/(admin)/admin/novels/page.tsx',
    content: `// src/app/(admin)/admin/novels/page.tsx
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { Plus, Edit, EyeOff } from 'lucide-react'
import { Button } from '@/components/shared/ui'
import { formatDate, formatNumber } from '@/lib/utils'

async function getNovels() {
  return await prisma.novel.findMany({
    where: { isDeleted: false },
    include: {
      author: {
        select: { displayName: true, username: true }
      },
      // This is the original query, which is fine for now.
      _count: {
        select: { chapters: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
}

export default async function AdminNovelsPage() {
  const novels = await getNovels()

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Novels</h1>
          <p className="text-gray-400">Manage your novel collection</p>
        </div>
        <Link href="/admin/novels/create">
          <Button variant="primary">
            <Plus className="h-4 w-4 mr-2" />
            Create Novel
          </Button>
        </Link>
      </div>

      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Novel</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Chapters</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Views</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Created</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {novels.map((novel) => (
              <tr key={novel.id} className="hover:bg-gray-750">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div
                      className="h-10 w-10 rounded-lg mr-3 flex-shrink-0"
                      style={{ backgroundColor: novel.coverColor }}
                    />
                    <div>
                      <div className="text-sm font-medium text-white">{novel.title}</div>
                      <div className="text-sm text-gray-400">by {novel.author.displayName || novel.author.username}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={\`inline-flex px-2 py-1 text-xs font-medium rounded-full \${
                    novel.status === 'ongoing' ? 'bg-green-900 text-green-300' :
                    novel.status === 'completed' ? 'bg-blue-900 text-blue-300' :
                    novel.status === 'hiatus' ? 'bg-yellow-900 text-yellow-300' :
                    'bg-gray-900 text-gray-300'
                  }\`}>
                    {novel.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{novel._count.chapters}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{formatNumber(novel.totalViews)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{formatDate(novel.createdAt)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    <Link href={\`/admin/novels/\${novel.id}\`}>
                      <Button size="sm" variant="outline">Edit</Button>
                    </Link>
                    <Link href={\`/admin/novels/\${novel.id}/chapters\`}>
                      <Button size="sm" variant="outline">Chapters</Button>
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}`
  }
];

async function main() {
  console.log("🚀 Applying MINIMAL required fixes for UI and API functionality...");
  console.log('==================================================================\n');

  for (const file of essentialFixes) {
    await createFile(file.path, file.content);
  }

  console.log('\n✅ All necessary fixes have been applied.');
  console.log('Unnecessary improvements have been reverted as requested.');
  console.log('\nPlease restart your development server to see the changes:');
  console.log('1. Press Ctrl+C in your terminal.');
  console.log('2. Run: npm run dev');
}

main().catch(console.error);