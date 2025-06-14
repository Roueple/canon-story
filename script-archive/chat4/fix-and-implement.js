// fix-and-implement.js
// This script fixes the BigInt serialization error and implements the public novel listing page.
// Run with: node fix-and-implement.js

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
    console.log(`✅ Created/Updated: ${filePath}`);
  } catch (error) {
    console.error(`❌ Error creating ${filePath}:`, error.message);
  }
}

// 1. Fix for BigInt Serialization
const apiUtilsWithBigIntFix = `// src/lib/api/utils.ts
import { NextResponse } from 'next/server'

// Helper to convert BigInt to string in nested objects
const convertBigIntToString = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (typeof obj === 'bigint') {
    return obj.toString();
  }
  if (Array.isArray(obj)) {
    return obj.map(convertBigIntToString);
  }
  if (typeof obj === 'object') {
    const newObj: { [key: string]: any } = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        newObj[key] = convertBigIntToString(obj[key]);
      }
    }
    return newObj;
  }
  return obj;
};

export function successResponse(data: any, status = 200) {
  const jsonData = convertBigIntToString(data);
  return NextResponse.json(
    { success: true, data: jsonData },
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
  const jsonData = convertBigIntToString(data);
  return NextResponse.json({
    success: true,
    data: jsonData,
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

// 2. Implementation for Public Novel Listing Page
const publicNovelsPage = `// src/app/(public)/novels/page.tsx
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { BookOpen, Star } from 'lucide-react'
import { formatNumber } from '@/lib/utils'

async function getPublishedNovels() {
  try {
    const novels = await prisma.novel.findMany({
      where: {
        isPublished: true,
        isDeleted: false
      },
      include: {
        author: {
          select: { displayName: true, username: true }
        },
        _count: {
          select: { chapters: { where: { isPublished: true, isDeleted: false } } }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });
    return novels;
  } catch (error) {
    console.error("Failed to fetch novels:", error);
    return [];
  }
}

export default async function NovelsPage() {
  const novels = await getPublishedNovels()

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-foreground">Browse All Novels</h1>
      {novels.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {novels.map((novel) => (
            <Link
              key={novel.id}
              href={\`/novels/\${novel.id}\`}
              className="group bg-card border border-border rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col"
            >
              <div
                className="h-3 w-full"
                style={{ backgroundColor: novel.coverColor || '#3B82F6' }}
              />
              <div className="p-6 flex-grow flex flex-col">
                <h2 className="text-xl font-semibold text-card-foreground mb-2 group-hover:text-primary transition-colors">
                  {novel.title}
                </h2>
                <p className="text-sm text-secondary mb-3">
                  by {novel.author.displayName || novel.author.username}
                </p>
                <p className="text-sm text-secondary line-clamp-3 flex-grow">
                  {novel.description || 'No description available.'}
                </p>
                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-sm text-secondary">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    <span>{novel._count.chapters} Chapters</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span>{novel.averageRating.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-card border border-border rounded-lg">
          <h2 className="text-xl font-semibold text-foreground">No Novels Found</h2>
          <p className="text-secondary mt-2">
            There are no published novels available at the moment. Please check back later!
          </p>
        </div>
      )}
    </div>
  )
}`;

async function main() {
  console.log('🚀 Applying fixes and implementing missing features...');
  console.log('====================================================\n');

  const filesToCreate = [
    { path: 'src/lib/api/utils.ts', content: apiUtilsWithBigIntFix },
    { path: 'src/app/(public)/novels/page.tsx', content: publicNovelsPage },
  ];

  for (const file of filesToCreate) {
    await createFile(file.path, file.content);
  }

  console.log('\n✅ Fixes and implementations complete!');
  console.log('\nNext steps:');
  console.log('1. Restart your development server: npm run dev');
  console.log('2. The "BigInt" error on novel creation should be resolved.');
  console.log('3. Navigate to /novels to see the newly implemented public listing page.');
}

main().catch(console.error);