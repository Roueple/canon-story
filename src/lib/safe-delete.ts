// src/lib/safe-delete.ts
// Utilities for safe deletion operations

import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'

// Soft delete a user (doesn't actually delete)
export async function softDeleteUser(userId: string, deletedBy: string) {
  return await prisma.user.update({
    where: { id: userId },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: deletedBy,
      // Optionally anonymize data
      email: `deleted-${userId}@deleted.com`,
      username: null,
      displayName: 'Deleted User'
    }
  })
}

// Check if deletion is safe (no dependencies)
export async function canSafelyDelete(
  model: string,
  id: string
): Promise<{ safe: boolean; dependencies: string[] }> {
  const dependencies: string[] = []

  switch (model) {
    case 'user':
      // Check for user's content
      const novels = await prisma.novel.count({ where: { authorId: id } })
      const comments = await prisma.comment.count({ where: { userId: id } })
      const reviews = await prisma.review.count({ where: { userId: id } })

      if (novels > 0) dependencies.push(`${novels} novels`)
      if (comments > 0) dependencies.push(`${comments} comments`)
      if (reviews > 0) dependencies.push(`${reviews} reviews`)
      break

    case 'novel':
      // Check for novel's content
      const chapters = await prisma.chapter.count({ where: { novelId: id } })
      const ratings = await prisma.rating.count({ where: { novelId: id } })

      if (chapters > 0) dependencies.push(`${chapters} chapters`)
      if (ratings > 0) dependencies.push(`${ratings} ratings`)
      break

    case 'chapter':
      // Check for chapter's content
      const views = await prisma.chapterView.count({ where: { chapterId: id } })
      const chapterComments = await prisma.comment.count({ where: { chapterId: id } })

      if (views > 0) dependencies.push(`${views} views`)
      if (chapterComments > 0) dependencies.push(`${chapterComments} comments`)
      break
  }

  return {
    safe: dependencies.length === 0,
    dependencies
  }
}

// Archive instead of delete
export async function archiveNovel(novelId: string) {
  // Move to an archive table or mark as archived
  return await prisma.novel.update({
    where: { id: novelId },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
      status: 'archived', // Custom status
      isPublished: false  // Hide from public
    }
  })
}

// Batch operations with transaction safety
export async function safeDeleteChapters(chapterIds: string[]) {
  // FIX: Added the 'Prisma.TransactionClient' type to the 'tx' parameter.
  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // First, check all chapters exist
    const chapters = await tx.chapter.findMany({
      where: { id: { in: chapterIds } }
    })

    if (chapters.length !== chapterIds.length) {
      throw new Error('Some chapters not found')
    }

    // Soft delete chapters
    const result = await tx.chapter.updateMany({
      where: { id: { in: chapterIds } },
      data: {
        isDeleted: true,
        deletedAt: new Date()
      }
    })

    return result
  })
}

// Create deletion log for audit trail
export async function logDeletion(
  model: string,
  recordId: string,
  deletedBy: string,
  reason?: string
) {
  // You could create a DeletionLog table for this
  console.log(`[DELETION LOG] ${model}:${recordId} deleted by ${deletedBy}`, reason)

  // In production, save to a deletion log table:
  // await prisma.deletionLog.create({
  //   data: {
  //     model,
  //     recordId,
  //     deletedBy,
  //     reason,
  //     timestamp: new Date()
  //   }
  // })
}
