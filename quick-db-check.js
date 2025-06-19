// quick-db-check.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Database connection successful!');
    
    const userCount = await prisma.user.count();
    console.log(`Found ${userCount} users in the database.`);
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('\nMake sure you have:');
    console.log('1. Updated DATABASE_URL in .env.local');
    console.log('2. Run: npx prisma db push');
  }
}

checkConnection();
