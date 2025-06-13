// check-all-chats.js
// Comprehensive check for Chat 1, 2, and 3 implementation
// Run with: node check-all-chats.js

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

async function fileExists(filePath) {
  try {
    await fs.access(path.join(process.cwd(), filePath));
    return true;
  } catch {
    return false;
  }
}

async function checkFile(filePath, description, critical = true) {
  const exists = await fileExists(filePath);
  const status = exists ? `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`;
  const criticality = critical ? '(CRITICAL)' : '(Optional)';
  console.log(`${status} ${filePath} - ${description} ${!exists && critical ? criticality : ''}`);
  return exists;
}

async function checkContent(filePath, searchString, description) {
  try {
    const content = await fs.readFile(path.join(process.cwd(), filePath), 'utf-8');
    const found = content.includes(searchString);
    const status = found ? `${colors.green}✓${colors.reset}` : `${colors.yellow}⚠${colors.reset}`;
    console.log(`${status} ${filePath} contains "${searchString}" - ${description}`);
    return found;
  } catch {
    console.log(`${colors.red}✗${colors.reset} Could not check ${filePath} content`);
    return false;
  }
}

async function main() {
  console.log(`${colors.cyan}========================================`);
  console.log('Canon Story - Comprehensive System Check');
  console.log('Checking Chat 1, 2, and 3 Implementation');
  console.log(`========================================${colors.reset}\n`);

  let hasErrors = false;
  const missingFiles = [];

  // CHAT 1 CHECKS - Foundation
  console.log(`${colors.blue}📁 CHAT 1 - Project Foundation${colors.reset}`);
  console.log('--------------------------------');
  
  // Core files
  if (!await checkFile('package.json', 'Node.js project configuration')) {
    missingFiles.push('package.json');
    hasErrors = true;
  }
  if (!await checkFile('tsconfig.json', 'TypeScript configuration')) {
    missingFiles.push('tsconfig.json');
    hasErrors = true;
  }
  if (!await checkFile('.env', 'Environment variables')) {
    missingFiles.push('.env');
    hasErrors = true;
  }
  if (!await checkFile('prisma/schema.prisma', 'Database schema')) {
    missingFiles.push('prisma/schema.prisma');
    hasErrors = true;
  }
  
  // Core library files
  if (!await checkFile('src/lib/db.ts', 'Database connection')) {
    missingFiles.push('src/lib/db.ts');
    hasErrors = true;
  }
  if (!await checkFile('src/lib/utils.ts', 'Utility functions')) {
    missingFiles.push('src/lib/utils.ts');
    hasErrors = true;
  }
  if (!await checkFile('src/types/index.ts', 'TypeScript types')) {
    missingFiles.push('src/types/index.ts');
    hasErrors = true;
  }
  
  // Safety features
  await checkFile('src/lib/safe-delete.ts', 'Soft delete utilities', false);
  
  console.log('');

  // CHAT 2 CHECKS - Authentication & UI
  console.log(`${colors.blue}📁 CHAT 2 - Authentication & UI Components${colors.reset}`);
  console.log('------------------------------------------');
  
  // Authentication
  if (!await checkFile('middleware.ts', 'Clerk middleware')) {
    missingFiles.push('middleware.ts');
    hasErrors = true;
  }
  if (!await checkFile('src/lib/auth.ts', 'Auth utilities')) {
    missingFiles.push('src/lib/auth.ts');
    hasErrors = true;
  }
  if (!await checkFile('src/app/api/webhooks/clerk/route.ts', 'Clerk webhook')) {
    missingFiles.push('src/app/api/webhooks/clerk/route.ts');
    hasErrors = true;
  }
  
  // Providers
  if (!await checkFile('src/providers/theme-provider.tsx', 'Theme provider')) {
    missingFiles.push('src/providers/theme-provider.tsx');
    hasErrors = true;
  }
  if (!await checkFile('src/providers/clerk-provider.tsx', 'Clerk provider')) {
    missingFiles.push('src/providers/clerk-provider.tsx');
    hasErrors = true;
  }
  
  // UI Components
  const uiComponents = [
    'Button.tsx', 'Input.tsx', 'Card.tsx', 'Modal.tsx', 
    'Badge.tsx', 'LoadingSpinner.tsx', 'ProgressBar.tsx', 
    'Tooltip.tsx', 'index.ts'
  ];
  
  for (const component of uiComponents) {
    if (!await checkFile(`src/components/shared/ui/${component}`, `UI Component: ${component}`)) {
      missingFiles.push(`src/components/shared/ui/${component}`);
      hasErrors = true;
    }
  }
  
  // Layout Components
  const layoutComponents = [
    'Header.tsx', 'Footer.tsx', 'Navigation.tsx', 
    'Sidebar.tsx', 'Breadcrumbs.tsx', 'index.ts'
  ];
  
  for (const component of layoutComponents) {
    if (!await checkFile(`src/components/shared/layout/${component}`, `Layout Component: ${component}`)) {
      missingFiles.push(`src/components/shared/layout/${component}`);
      hasErrors = true;
    }
  }
  
  // Auth pages
  await checkFile('src/app/sign-in/[[...sign-in]]/page.tsx', 'Sign-in page', false);
  await checkFile('src/app/sign-up/[[...sign-up]]/page.tsx', 'Sign-up page', false);
  
  console.log('');

  // CHAT 3 CHECKS - API & Admin
  console.log(`${colors.blue}📁 CHAT 3 - API Structure & Admin Panel${colors.reset}`);
  console.log('---------------------------------------');
  
  // API Middleware and Utils
  if (!await checkFile('src/lib/api/middleware.ts', 'API middleware')) {
    missingFiles.push('src/lib/api/middleware.ts');
    hasErrors = true;
  }
  if (!await checkFile('src/lib/api/utils.ts', 'API utilities')) {
    missingFiles.push('src/lib/api/utils.ts');
    hasErrors = true;
  }
  
  // Services
  if (!await checkFile('src/services/novelService.ts', 'Novel service')) {
    missingFiles.push('src/services/novelService.ts');
    hasErrors = true;
  }
  if (!await checkFile('src/services/chapterService.ts', 'Chapter service')) {
    missingFiles.push('src/services/chapterService.ts');
    hasErrors = true;
  }
  
  // Admin API Routes
  const adminRoutes = [
    'src/app/api/admin/novels/route.ts',
    'src/app/api/admin/novels/[id]/route.ts',
    'src/app/api/admin/novels/[id]/chapters/route.ts'
  ];
  
  for (const route of adminRoutes) {
    if (!await checkFile(route, `Admin API: ${route}`)) {
      missingFiles.push(route);
      hasErrors = true;
    }
  }
  
  // Public API Routes
  const publicRoutes = [
    'src/app/api/public/novels/route.ts',
    'src/app/api/public/novels/[id]/route.ts',
    'src/app/api/public/novels/[id]/chapters/route.ts',
    'src/app/api/public/chapters/[id]/route.ts'
  ];
  
  for (const route of publicRoutes) {
    if (!await checkFile(route, `Public API: ${route}`)) {
      missingFiles.push(route);
      hasErrors = true;
    }
  }
  
  // Test API
  if (!await checkFile('src/app/api/test-api/route.ts', 'Test API endpoint')) {
    missingFiles.push('src/app/api/test-api/route.ts');
    hasErrors = true;
  }
  
  // Admin UI
  if (!await checkFile('src/app/(admin)/layout.tsx', 'Admin layout')) {
    missingFiles.push('src/app/(admin)/layout.tsx');
    hasErrors = true;
  }
  if (!await checkFile('src/app/(admin)/admin/page.tsx', 'Admin dashboard')) {
    missingFiles.push('src/app/(admin)/admin/page.tsx');
    hasErrors = true;
  }
  if (!await checkFile('src/components/admin/AdminHeader.tsx', 'Admin header')) {
    missingFiles.push('src/components/admin/AdminHeader.tsx');
    hasErrors = true;
  }
  if (!await checkFile('src/components/admin/AdminSidebar.tsx', 'Admin sidebar')) {
    missingFiles.push('src/components/admin/AdminSidebar.tsx');
    hasErrors = true;
  }
  
  // Public Pages
  if (!await checkFile('src/app/(public)/layout.tsx', 'Public layout')) {
    missingFiles.push('src/app/(public)/layout.tsx');
    hasErrors = true;
  }
  if (!await checkFile('src/app/(public)/page.tsx', 'Homepage')) {
    missingFiles.push('src/app/(public)/page.tsx');
    hasErrors = true;
  }
  
  console.log('');

  // CHECK FOR COMMON ISSUES
  console.log(`${colors.blue}🔍 Common Issues Check${colors.reset}`);
  console.log('---------------------');
  
  // Check if old homepage exists
  if (await fileExists('src/app/page.tsx')) {
    console.log(`${colors.red}✗ Old homepage exists at src/app/page.tsx - This blocks the new routing!${colors.reset}`);
    hasErrors = true;
  }
  
  // Check environment variables
  if (await fileExists('.env')) {
    await checkContent('.env', 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', 'Clerk publishable key');
    await checkContent('.env', 'CLERK_SECRET_KEY', 'Clerk secret key');
    await checkContent('.env', 'DATABASE_URL', 'Database connection');
  }
  
  // Check package.json for required dependencies
  if (await fileExists('package.json')) {
    await checkContent('package.json', '@clerk/nextjs', 'Clerk Next.js SDK');
    await checkContent('package.json', '@prisma/client', 'Prisma client');
    await checkContent('package.json', 'lucide-react', 'Icon library');
  }
  
  console.log('');

  // SUMMARY
  console.log(`${colors.cyan}========================================`);
  console.log('SUMMARY');
  console.log(`========================================${colors.reset}`);
  
  if (hasErrors) {
    console.log(`${colors.red}❌ Issues found!${colors.reset}`);
    console.log(`\n${colors.yellow}Missing files:${colors.reset}`);
    missingFiles.forEach(file => console.log(`  - ${file}`));
    
    console.log(`\n${colors.yellow}Common fixes:${colors.reset}`);
    console.log('1. If old homepage exists: rm src/app/page.tsx');
    console.log('2. Run all Chat 3 scripts in order:');
    console.log('   - node create-api-core.js');
    console.log('   - node create-api-routes.js');
    console.log('   - node create-admin-ui.js');
    console.log('   - node create-public-pages.js');
    console.log('3. Fix Clerk colors: node fix-clerk-colors.js');
    console.log('4. Add Clerk keys to .env file');
    console.log('5. Run: npm install');
    console.log('6. Run: npm run db:push');
    console.log('7. Restart server: npm run dev');
  } else {
    console.log(`${colors.green}✅ All files are in place!${colors.reset}`);
    console.log('\nIf admin redirect is not working, check:');
    console.log('1. Your user has admin role in database');
    console.log('2. Clerk webhook is syncing users correctly');
    console.log('3. No errors in browser console');
  }
  
  // Admin redirect specific check
  console.log(`\n${colors.blue}Admin Redirect Troubleshooting:${colors.reset}`);
  console.log('1. Check if your user ID matches in Clerk and database');
  console.log('2. Run: npm run db:studio');
  console.log('3. Find your user and ensure role = "admin"');
  console.log('4. Clear browser cookies and localStorage');
  console.log('5. Sign out and sign in again');
}

main().catch(console.error);