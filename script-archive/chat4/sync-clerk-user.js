// sync-clerk-user.js
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