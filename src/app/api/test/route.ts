import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    // Test database connection by counting users
    const userCount = await prisma.user.count({
      where: { isDeleted: false } // Only count active users
    })
    
    // Count soft-deleted users
    const deletedUserCount = await prisma.user.count({
      where: { isDeleted: true }
    })
    
    // Get database info
    const dbInfo = {
      users: {
        active: userCount,
        deleted: deletedUserCount,
        total: userCount + deletedUserCount
      },
      novels: {
        active: await prisma.novel.count({ where: { isDeleted: false } }),
        deleted: await prisma.novel.count({ where: { isDeleted: true } })
      },
      chapters: {
        active: await prisma.chapter.count({ where: { isDeleted: false } }),
        deleted: await prisma.chapter.count({ where: { isDeleted: true } })
      },
      backups: await prisma.backupLog.count(),
      auditLogs: await prisma.auditLog.count()
    }
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      database: 'Neon PostgreSQL',
      features: {
        softDelete: true,
        cascadeProtection: true,
        auditLogging: true,
        branching: true
      },
      statistics: dbInfo,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Database connection error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Database connection failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}