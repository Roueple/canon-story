// src/lib/data.ts
import { Prisma } from '@prisma/client';
import { prisma } from './db';
import { serializeForJSON } from './serialization';

const novelCardInclude = {
  author: { select: { displayName: true, username: true } },
  genres: { include: { genre: true } },
  tags: { include: { tag: true } },
  _count: { select: { chapters: { where: { isPublished: true, isDeleted: false } } } }
};

export async function getTrendingNovels(limit = 6) {
  const novels = await prisma.novel.findMany({
    where: { isPublished: true, isDeleted: false },
    include: novelCardInclude,
    orderBy: { totalViews: 'desc' },
    take: limit
  });
  return serializeForJSON(novels);
}

export async function getRecentNovels(limit = 6) {
  const novels = await prisma.novel.findMany({
    where: { isPublished: true, isDeleted: false },
    include: novelCardInclude,
    orderBy: { publishedAt: 'desc' },
    take: limit
  });
  return serializeForJSON(novels);
}

export async function getPublishedNovels() {
  const novels = await prisma.novel.findMany({
    where: { isPublished: true, isDeleted: false },
    include: novelCardInclude,
    orderBy: { updatedAt: 'desc' }
  });
  return serializeForJSON(novels);
}

export async function getNovelBySlug(slug: string) {
  const novel = await prisma.novel.findUnique({
    where: { slug: slug, isPublished: true, isDeleted: false },
    include: {
      author: { select: { displayName: true, username: true } },
      genres: { include: { genre: true } },
      tags: { include: { tag: true } },
      chapters: { 
        where: { isPublished: true, isDeleted: false }, 
        orderBy: { chapterNumber: 'asc' }, 
        select: { id: true, title: true, chapterNumber: true, createdAt: true } 
      },
      _count: { select: { chapters: true } }
    }
  });
  return serializeForJSON(novel);
}

export async function getChapterByNumber(novelSlug: string, chapterNumberStr: string) {
    const chapterNumber = new Prisma.Decimal(chapterNumberStr);
    const chapter = await prisma.chapter.findFirst({
        where: {
            novel: { slug: novelSlug, isPublished: true, isDeleted: false },
            chapterNumber: chapterNumber,
            isPublished: true,
            isDeleted: false
        },
        include: {
            novel: {
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    chapters: {
                        where: { isPublished: true, isDeleted: false },
                        select: { id: true, chapterNumber: true },
                        orderBy: { chapterNumber: 'asc' }
                    }
                }
            }
        }
    });
    return serializeForJSON(chapter);
}