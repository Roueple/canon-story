// fix-admin-redirect.js
// Fixes the admin redirect issue
// Run with: node fix-admin-redirect.js

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createFile(filePath, content) {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    const dir = path.dirname(fullPath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(fullPath, content.trim(), 'utf-8');
    console.log(`✅ Created: ${filePath}`);
  } catch (error) {
    console.error(`❌ Error creating ${filePath}:`, error.message);
  }
}

async function deleteFile(filePath) {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    await fs.unlink(fullPath);
    console.log(`🗑️  Deleted: ${filePath}`);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error(`❌ Error deleting ${filePath}:`, error.message);
    }
  }
}

// Fixed Admin Layout - the issue is likely with how we check the user
const fixedAdminLayout = `// src/app/(admin)/layout.tsx
import { redirect } from 'next/navigation'
import { currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminHeader } from '@/components/admin/AdminHeader'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Get the current user from Clerk
  const user = await currentUser()
  
  if (!user) {
    console.log('No user found, redirecting to sign-in')
    redirect('/sign-in')
  }

  // Check if user exists in database and has admin role
  let dbUser = null
  try {
    dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, role: true, displayName: true, email: true }
    })
    
    console.log('Database user:', dbUser)
  } catch (error) {
    console.error('Error fetching user from database:', error)
  }

  // If user doesn't exist in database, try by email
  if (!dbUser && user.primaryEmailAddress?.emailAddress) {
    try {
      dbUser = await prisma.user.findUnique({
        where: { email: user.primaryEmailAddress.emailAddress },
        select: { id: true, role: true, displayName: true, email: true }
      })
      console.log('Database user by email:', dbUser)
    } catch (error) {
      console.error('Error fetching user by email:', error)
    }
  }

  if (!dbUser || (dbUser.role !== 'admin' && dbUser.role !== 'moderator')) {
    console.log('User is not admin/moderator, redirecting to home')
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <AdminHeader user={{ 
        firstName: user.firstName,
        displayName: dbUser.displayName,
        role: dbUser.role 
      }} />
      <div className="flex">
        <AdminSidebar role={dbUser.role} />
        <main className="flex-1 p-6">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}`;

// Fixed middleware to properly handle admin routes
const fixedMiddleware = `import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/novels(.*)',
  '/genres(.*)',
  '/trending(.*)',
  '/api/public(.*)',
  '/api/test-api',
  '/ui-test'
]);

// Define admin routes
const isAdminRoute = createRouteMatcher([
  '/admin(.*)',
  '/api/admin(.*)'
]);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const { userId, sessionClaims } = await auth();
  
  // For public routes, allow access
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // For all other routes, require authentication
  if (!userId) {
    const signInUrl = new URL('/sign-in', req.url);
    signInUrl.searchParams.set('redirect_url', req.url);
    return NextResponse.redirect(signInUrl);
  }

  // Admin routes are handled by the admin layout
  // We don't redirect here to avoid double redirects
  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!.*\\..*|_next).*)',
    '/', 
    '/(api|trpc)(.*)'
  ],
};`;

// Remove the old homepage if it exists
const cleanupHomepage = `// This file should not exist
// If you see this, delete src/app/page.tsx`;

// Debug route to check user status
const debugRoute = `// src/app/api/debug-user/route.ts
import { NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const user = await currentUser()
    
    if (!user) {
      return NextResponse.json({ 
        error: 'No user logged in',
        suggestion: 'Please sign in first'
      })
    }

    // Try to find user by ID
    let dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, email: true, role: true, displayName: true }
    })

    // If not found by ID, try by email
    if (!dbUser && user.primaryEmailAddress?.emailAddress) {
      dbUser = await prisma.user.findUnique({
        where: { email: user.primaryEmailAddress.emailAddress },
        select: { id: true, email: true, role: true, displayName: true }
      })
    }

    return NextResponse.json({
      clerkUser: {
        id: user.id,
        email: user.primaryEmailAddress?.emailAddress,
        firstName: user.firstName,
        lastName: user.lastName
      },
      databaseUser: dbUser,
      isAdmin: dbUser?.role === 'admin',
      isModerator: dbUser?.role === 'moderator',
      canAccessAdmin: dbUser?.role === 'admin' || dbUser?.role === 'moderator',
      suggestions: !dbUser ? [
        'User not found in database',
        'Run the Clerk webhook sync or manually create user in database',
        'Make sure Clerk webhook is properly configured'
      ] : dbUser.role === 'reader' ? [
        'User exists but has reader role',
        'Update role to admin in database using Prisma Studio',
        'Run: npm run db:studio'
      ] : []
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Error checking user status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}`;

// Script to manually sync user
const syncUserScript = `// sync-clerk-user.js
// Manually sync Clerk user to database
// Run with: node sync-clerk-user.js

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function syncUser() {
  // Replace these with your actual Clerk user details
  const clerkUserId = 'YOUR_CLERK_USER_ID' // Get from Clerk dashboard
  const email = 'YOUR_EMAIL@example.com'
  const displayName = 'Your Name'
  
  try {
    const user = await prisma.user.upsert({
      where: { id: clerkUserId },
      update: {
        email,
        displayName,
        emailVerified: true,
        isActive: true,
        lastLoginAt: new Date()
      },
      create: {
        id: clerkUserId,
        email,
        displayName,
        role: 'admin', // Set as admin
        emailVerified: true,
        isActive: true
      }
    })
    
    console.log('User synced:', user)
  } catch (error) {
    console.error('Error syncing user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Instructions
console.log('To use this script:')
console.log('1. Go to Clerk Dashboard: https://dashboard.clerk.com')
console.log('2. Find your user and copy the User ID')
console.log('3. Replace YOUR_CLERK_USER_ID and YOUR_EMAIL in this script')
console.log('4. Run the script again')
console.log('')
console.log('Or use Prisma Studio:')
console.log('1. Run: npm run db:studio')
console.log('2. Find/create your user')
console.log('3. Set role to "admin"')

// Uncomment and modify to run:
// syncUser()
`;

async function main() {
  console.log('🔧 Fixing Admin Redirect Issue');
  console.log('==============================\n');

  // Delete old homepage if it exists
  await deleteFile('src/app/page.tsx');

  const files = [
    { path: 'src/app/(admin)/layout.tsx', content: fixedAdminLayout },
    { path: 'middleware.ts', content: fixedMiddleware },
    { path: 'src/app/api/debug-user/route.ts', content: debugRoute },
    { path: 'sync-clerk-user.js', content: syncUserScript }
  ];

  for (const file of files) {
    await createFile(file.path, file.content);
  }

  console.log('\n✅ Admin redirect fixes applied!');
  console.log('\n📝 Troubleshooting steps:');
  console.log('\n1. Check your user status:');
  console.log('   Visit: http://localhost:3000/api/debug-user');
  console.log('   This will show if your user is properly synced\n');
  
  console.log('2. If user not in database:');
  console.log('   - Check sync-clerk-user.js for manual sync instructions');
  console.log('   - Or use Prisma Studio: npm run db:studio\n');
  
  console.log('3. Clear all browser data:');
  console.log('   - Clear cookies and localStorage');
  console.log('   - Sign out and sign in again\n');
  
  console.log('4. Restart your dev server:');
  console.log('   - Ctrl+C to stop');
  console.log('   - npm run dev\n');
  
  console.log('5. Test admin access:');
  console.log('   - Visit http://localhost:3000');
  console.log('   - Click Admin Dashboard button');
  console.log('   - Or go directly to http://localhost:3000/admin');
}

main().catch(console.error);