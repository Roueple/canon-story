import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

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
    
    return NextResponse.json(chapter)
  } catch (error) {
    console.error('Error fetching chapter content:', error)
    return NextResponse.json({ error: 'Failed to fetch chapter' }, { status: 500 })
  }
}