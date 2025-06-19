// create-test-novel.js
// Creates a test novel for DOCX import testing

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestNovel() {
  try {
    // First, ensure we have a test user
    let testUser = await prisma.user.findUnique({
      where: { email: 'test@example.com' }
    });
    
    if (!testUser) {
      testUser = await prisma.user.create({
        data: {
          id: 'test-user-id',
          email: 'test@example.com',
          username: 'testuser',
          displayName: 'Test User',
          role: 'admin',
          isActive: true,
          emailVerified: true
        }
      });
      console.log('✅ Created test user');
    }
    
    // Create a test novel
    const novel = await prisma.novel.create({
      data: {
        title: 'Test Novel for DOCX Import',
        slug: 'test-novel-import',
        description: 'This novel is for testing DOCX import functionality',
        coverColor: '#3B82F6',
        authorId: testUser.id,
        status: 'ongoing',
        isPublished: true
      }
    });
    
    console.log('✅ Created test novel:', novel.id);
    console.log('\nUse this novel ID for testing imports:', novel.id);
    console.log('Navigate to: /admin/novels/' + novel.id + '/chapters');
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
  }
}

createTestNovel();
