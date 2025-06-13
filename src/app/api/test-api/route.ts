// src/app/api/test-api/route.ts
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
}