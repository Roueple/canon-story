// src/app/api/debug-user/route.ts
import { NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { serializeForJSON } from '@/lib/serialization'

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

    return NextResponse.json(serializeForJSON({
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
    }))
  } catch (error) {
    return NextResponse.json({ 
      error: 'Error checking user status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}