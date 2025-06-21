// 1. src/app/api/public/novels/[novelId]/chapters/[chapterId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ novelId: string; chapterId: string }> }
) {
  try {
    const { novelId, chapterId } = await params
    
    const currentChapter = await prisma.chapter.findFirst({
      where: {
        id: chapterId,
        novelId: novelId,
        publishedAt: { not: null }
      },
      include: {
        novel: {
          select: {
            id: true,
            title: true,
            author: true
          }
        }
      }
    })

    if (!currentChapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })
    }

    const allChapters = await prisma.chapter.findMany({
      where: {
        novelId: novelId,
        publishedAt: { not: null }
      },
      select: {
        id: true,
        chapterNumber: true
      },
      orderBy: { chapterNumber: 'asc' }
    })

    const currentIndex = allChapters.findIndex(ch => ch.id === chapterId)
    const prevChapterId = currentIndex > 0 ? allChapters[currentIndex - 1].id : null
    const nextChapterId = currentIndex < allChapters.length - 1 ? allChapters[currentIndex + 1].id : null
    const allChapterIds = allChapters.map(ch => ch.id)

    return NextResponse.json({
      currentChapter,
      prevChapterId,
      nextChapterId,
      totalChapters: allChapters.length,
      allChapterIds
    })
  } catch (error) {
    console.error('Error fetching chapter:', error)
    return NextResponse.json({ error: 'Failed to fetch chapter' }, { status: 500 })
  }
}