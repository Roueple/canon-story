// prisma/seed.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create genres
  const genres = await Promise.all([
    prisma.genre.upsert({
      where: { slug: 'fantasy' },
      update: {},
      create: {
        name: 'Fantasy',
        slug: 'fantasy',
        description: 'Magic, mythical creatures, and otherworldly adventures',
        color: '#8B5CF6',
        sortOrder: 1
      }
    }),
    prisma.genre.upsert({
      where: { slug: 'sci-fi' },
      update: {},
      create: {
        name: 'Science Fiction',
        slug: 'sci-fi',
        description: 'Future technology, space exploration, and scientific possibilities',
        color: '#3B82F6',
        sortOrder: 2
      }
    }),
    prisma.genre.upsert({
      where: { slug: 'romance' },
      update: {},
      create: {
        name: 'Romance',
        slug: 'romance',
        description: 'Love stories and emotional connections',
        color: '#EC4899',
        sortOrder: 3
      }
    }),
    prisma.genre.upsert({
      where: { slug: 'mystery' },
      update: {},
      create: {
        name: 'Mystery',
        slug: 'mystery',
        description: 'Puzzles, investigations, and suspenseful revelations',
        color: '#6B7280',
        sortOrder: 4
      }
    })
  ])

  console.log(`✅ Created ${genres.length} genres`)

  // Create tags
  const tags = await Promise.all([
    prisma.tag.upsert({
      where: { name: 'Magic System' },
      update: {},
      create: {
        name: 'Magic System',
        type: 'theme',
        color: '#8B5CF6'
      }
    }),
    prisma.tag.upsert({
      where: { name: 'Time Travel' },
      update: {},
      create: {
        name: 'Time Travel',
        type: 'theme',
        color: '#3B82F6'
      }
    }),
    prisma.tag.upsert({
      where: { name: 'Graphic Violence' },
      update: {},
      create: {
        name: 'Graphic Violence',
        type: 'warning',
        color: '#EF4444'
      }
    }),
    prisma.tag.upsert({
      where: { name: 'Young Adult' },
      update: {},
      create: {
        name: 'Young Adult',
        type: 'demographic',
        color: '#10B981'
      }
    })
  ])

  console.log(`✅ Created ${tags.length} tags`)

  // Create test admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@canonstory.com' },
    update: {},
    create: {
      email: 'admin@canonstory.com',
      username: 'admin',
      displayName: 'Admin User',
      role: 'admin',
      emailVerified: true,
      isActive: true
    }
  })

  console.log('✅ Created admin user')

  // Create a test novel for E2E tests
  const testNovel = await prisma.novel.upsert({
    where: { slug: 'e2e-test-novel' },
    update: {},
    create: {
      title: 'E2E Test Novel',
      slug: 'e2e-test-novel',
      description: 'A novel created by the seed script for E2E testing.',
      authorId: adminUser.id,
      isPublished: true,
      status: 'ongoing',
      publishedAt: new Date(),
      genres: {
        create: {
          genreId: genres[0].id // Fantasy
        }
      }
    }
  });

  const testChapter = await prisma.chapter.findFirst({
    where: {
      novelId: testNovel.id,
      chapterNumber: 1
    }
  });

  if (!testChapter) {
    await prisma.chapter.create({
      data: {
        title: 'Chapter 1: The Seeded Chapter',
        slug: 'chapter-1-the-seeded-chapter',
        content: '<p>This is content from a seeded chapter for testing purposes.</p>',
        chapterNumber: 1,
        displayOrder: 1,
        novelId: testNovel.id,
        isPublished: true,
        status: 'free',
        publishedAt: new Date(),
        wordCount: 10,
      }
    });
    console.log('✅ Created test novel and chapter');
  } else {
    console.log('✅ Test novel and chapter already exist');
  }

  // Create initial backup log entry
  await prisma.backupLog.create({
    data: {
      filename: 'initial-setup',
      size: BigInt(0),
      tables: {
        genres: genres.length,
        tags: tags.length,
        users: 1
      },
      location: 'seed',
      status: 'completed',
      startedAt: new Date(),
      completedAt: new Date()
    }
  })

  console.log('✅ Created initial backup log')

  console.log('🎉 Database seed completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })