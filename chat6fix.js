// fix-database-error.js
// This script helps fix the DATABASE_URL environment variable error

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execAsync = promisify(exec);

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  console.log('🔧 Fixing Database Connection Error...');
  console.log('=====================================\n');

  const envLocalPath = path.join(process.cwd(), '.env.local');
  const envExamplePath = path.join(process.cwd(), '.env.local.example');

  // Step 1: Check if .env.local exists
  const envExists = await fileExists(envLocalPath);
  
  if (!envExists) {
    console.log('❌ .env.local file not found!');
    
    // Check if .env.local.example exists
    const exampleExists = await fileExists(envExamplePath);
    
    if (exampleExists) {
      console.log('📄 Creating .env.local from .env.local.example...');
      const exampleContent = await fs.readFile(envExamplePath, 'utf-8');
      await fs.writeFile(envLocalPath, exampleContent);
      console.log('✅ Created .env.local file');
    } else {
      console.log('📄 Creating new .env.local file...');
      const defaultEnvContent = `# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_WEBHOOK_SECRET=your_clerk_webhook_secret

# Clerk URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# Database (Neon/Supabase/Railway)
DATABASE_URL=postgresql://username:password@host:5432/database?sslmode=require

# Cloudinary (Media Management)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_API_KEY=your_api_key
`;
      await fs.writeFile(envLocalPath, defaultEnvContent);
      console.log('✅ Created .env.local file with template');
    }
  }

  // Step 2: Check if DATABASE_URL is set
  const envContent = await fs.readFile(envLocalPath, 'utf-8');
  const hasValidDatabaseUrl = envContent.includes('DATABASE_URL=') && 
                              !envContent.includes('DATABASE_URL=postgresql://username:password@host:5432/database');

  if (!hasValidDatabaseUrl) {
    console.log('\n⚠️  DATABASE_URL is not properly configured!');
    console.log('\n📝 You need to update your .env.local file with your actual database connection string.');
    console.log('\n🔍 Here are some options for getting a PostgreSQL database:\n');
    
    console.log('Option 1: Neon (Recommended - Free tier available)');
    console.log('   1. Go to https://neon.tech');
    console.log('   2. Sign up for a free account');
    console.log('   3. Create a new project');
    console.log('   4. Copy the connection string from the dashboard');
    console.log('   5. It will look like: postgresql://username:password@ep-cool-darkness-123456.us-east-2.aws.neon.tech/neondb?sslmode=require\n');
    
    console.log('Option 2: Supabase (Free tier available)');
    console.log('   1. Go to https://supabase.com');
    console.log('   2. Sign up and create a new project');
    console.log('   3. Go to Settings > Database');
    console.log('   4. Copy the connection string');
    console.log('   5. It will look like: postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxx.supabase.co:5432/postgres\n');
    
    console.log('Option 3: Railway (Simple deployment)');
    console.log('   1. Go to https://railway.app');
    console.log('   2. Create a new project');
    console.log('   3. Add PostgreSQL service');
    console.log('   4. Copy the DATABASE_URL from the service\n');
    
    console.log('Option 4: Local PostgreSQL (Development only)');
    console.log('   1. Install PostgreSQL locally');
    console.log('   2. Create a database: createdb canon_story');
    console.log('   3. Use: DATABASE_URL=postgresql://postgres:password@localhost:5432/canon_story\n');
  }

  // Step 3: Check Clerk configuration
  const hasClerkKeys = envContent.includes('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=') && 
                      !envContent.includes('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key');

  if (!hasClerkKeys) {
    console.log('\n⚠️  Clerk authentication keys are not configured!');
    console.log('\n📝 To set up Clerk authentication:');
    console.log('   1. Go to https://clerk.com');
    console.log('   2. Sign up and create a new application');
    console.log('   3. Copy your keys from the dashboard');
    console.log('   4. Update the Clerk keys in .env.local\n');
  }

  // Step 4: Check Cloudinary configuration
  const hasCloudinaryKeys = envContent.includes('CLOUDINARY_CLOUD_NAME=') && 
                           !envContent.includes('CLOUDINARY_CLOUD_NAME=your_cloud_name');

  if (!hasCloudinaryKeys) {
    console.log('\n⚠️  Cloudinary keys are not configured (optional for media management)');
    console.log('\n📝 To set up Cloudinary:');
    console.log('   1. Go to https://cloudinary.com');
    console.log('   2. Sign up for a free account');
    console.log('   3. Copy your credentials from the dashboard');
    console.log('   4. Update the Cloudinary keys in .env.local\n');
  }

  // Step 5: Generate Prisma client
  console.log('\n🔄 Generating Prisma client...');
  try {
    await execAsync('npx prisma generate');
    console.log('✅ Prisma client generated successfully');
  } catch (error) {
    console.error('❌ Failed to generate Prisma client:', error.message);
  }

  // Step 6: Final instructions
  console.log('\n========================================');
  console.log('📋 Next Steps:');
  console.log('========================================\n');
  
  console.log('1. Open .env.local and update:');
  console.log('   - DATABASE_URL with your PostgreSQL connection string');
  console.log('   - Clerk authentication keys');
  console.log('   - Cloudinary keys (optional)\n');
  
  console.log('2. After updating .env.local, run:');
  console.log('   npx prisma db push');
  console.log('   (This will create the database tables)\n');
  
  console.log('3. (Optional) Seed the database with initial data:');
  console.log('   npx prisma db seed\n');
  
  console.log('4. Restart your development server:');
  console.log('   npm run dev\n');

  // Create a quick check script
  const checkScript = `// quick-db-check.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Database connection successful!');
    
    const userCount = await prisma.user.count();
    console.log(\`Found \${userCount} users in the database.\`);
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('\\nMake sure you have:');
    console.log('1. Updated DATABASE_URL in .env.local');
    console.log('2. Run: npx prisma db push');
  }
}

checkConnection();
`;

  await fs.writeFile('quick-db-check.js', checkScript);
  console.log('✅ Created quick-db-check.js to test your database connection');
  console.log('   Run it with: node quick-db-check.js\n');
}

main().catch(console.error);