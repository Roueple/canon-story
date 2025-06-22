// src/app/api/public/novels/[novelId]/chapters/[chapterId]/content/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Helper to convert BigInt to string
function serializeBigInt(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'bigint') return obj.toString();
  if (obj instanceof Date) return obj.toISOString();
  if (Array.isArray(obj)) return obj.map(serializeBigInt);
  if (typeof obj === 'object') {
    const serialized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      serialized[key] = serializeBigInt(value);
    }
    return serialized;
  }
  return obj;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ novelId: string; chapterId: string }> }
) {
  try {
    const { novelId, chapterId } = await params
    const chapter = await prisma.chapter.findFirst({
      where: {
        id: chapterId,
        novelId: novelId,
        publishedAt: { not: null }
      },
      select: {
        id: true,
        title: true,
        content: true,
        chapterNumber: true,
        wordCount: true,
        publishedAt: true,
        novelId: true
      }
    })
    
    if (!chapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })
    }
    
    return NextResponse.json(serializeBigInt(chapter))
  } catch (error) {
    console.error('Error fetching chapter content:', error)
    return NextResponse.json({ error: 'Failed to fetch chapter' }, { status: 500 })
  }
}