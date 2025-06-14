// diagnose-and-fix.js
// Diagnoses and fixes all Chat 3 issues
// Run with: node diagnose-and-fix.js

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function fileExists(filePath) {
  try {
    await fs.access(path.join(process.cwd(), filePath));
    return true;
  } catch {
    return false;
  }
}

async function readFile(filePath) {
  try {
    return await fs.readFile(path.join(process.cwd(), filePath), 'utf-8');
  } catch {
    return null;
  }
}

async function diagnose() {
  console.log('🔍 Diagnosing Canon Story Setup');
  console.log('================================\n');

  const issues = [];
  const fixes = [];

  // Check 1: Old homepage exists
  if (await fileExists('src/app/page.tsx')) {
    const content = await readFile('src/app/page.tsx');
    if (content && content.includes('Canon Story Admin Panel')) {
      issues.push('❌ Old Chat 1 homepage still exists at src/app/page.tsx');
      fixes.push('Delete src/app/page.tsx to use the new routing');
    }
  }

  // Check 2: New homepage exists
  if (!await fileExists('src/app/(public)/page.tsx')) {
    issues.push('❌ New public homepage missing at src/app/(public)/page.tsx');
    fixes.push('Run the create-public-pages.js script');
  }

  // Check 3: Layouts exist
  if (!await fileExists('src/app/(public)/layout.tsx')) {
    issues.push('❌ Public layout missing');
    fixes.push('Create src/app/(public)/layout.tsx');
  }

  if (!await fileExists('src/app/(admin)/layout.tsx')) {
    issues.push('❌ Admin layout missing');
    fixes.push('Create src/app/(admin)/layout.tsx');
  }

  // Check 4: Environment variables
  const envFile = await readFile('.env');
  if (!envFile) {
    issues.push('❌ .env file not found');
    fixes.push('Create .env file with Clerk keys');
  } else {
    if (!envFile.includes('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY')) {
      issues.push('❌ Missing NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY in .env');
      fixes.push('Add Clerk publishable key to .env');
    }
    if (!envFile.includes('CLERK_SECRET_KEY')) {
      issues.push('❌ Missing CLERK_SECRET_KEY in .env');
      fixes.push('Add Clerk secret key to .env');
    }
  }

  // Check 5: API routes
  if (!await fileExists('src/app/api/test-api/route.ts')) {
    issues.push('❌ Test API route missing');
    fixes.push('Create API test route');
  }

  // Display results
  if (issues.length === 0) {
    console.log('✅ No issues found! Everything looks good.');
  } else {
    console.log('Issues Found:');
    issues.forEach(issue => console.log(issue));
    
    console.log('\n📋 Recommended Fixes:');
    fixes.forEach((fix, index) => console.log(`${index + 1}. ${fix}`));
  }

  console.log('\n📝 Environment Setup:');
  console.log('Make sure your .env file contains:');
  console.log('');
  console.log('# Clerk Authentication');
  console.log('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE');
  console.log('CLERK_SECRET_KEY=sk_test_YOUR_KEY_HERE');
  console.log('');
  console.log('# Clerk URLs');
  console.log('NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in');
  console.log('NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up');
  console.log('NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/');
  console.log('NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/');
  console.log('');
  console.log('# Database');
  console.log('DATABASE_URL=your_database_url_here');

  console.log('\n🚀 Quick Fix Commands:');
  console.log('1. Run: node fix-homepage.js');
  console.log('2. Add Clerk keys to .env file');
  console.log('3. Restart server: npm run dev');
  
  return issues.length === 0;
}

// Run diagnosis
diagnose().then(success => {
  if (!success) {
    console.log('\n⚠️  Please fix the issues above, then restart your dev server.');
  }
});