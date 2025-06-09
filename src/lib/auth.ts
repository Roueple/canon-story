import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import type { UserRole } from '@/types'

export async function getCurrentUser() {
  const { userId } = await auth()
  
  if (!userId) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { 
      id: userId,
      isDeleted: false 
    }
  })

  return user
}

export async function requireAuth() {
  const user = await getCurrentUser()
  
  if (!user) {
    throw new Error('Unauthorized')
  }

  return user
}

export async function requireRole(requiredRole: UserRole) {
  const user = await requireAuth()
  
  const roleHierarchy: Record<UserRole, number> = {
    reader: 1,
    premium_reader: 2,
    moderator: 3,
    admin: 4
  }

  const userLevel = roleHierarchy[user.role as UserRole] || 0
  const requiredLevel = roleHierarchy[requiredRole] || 0

  if (userLevel < requiredLevel) {
    throw new Error('Insufficient permissions')
  }

  return user
}

export async function isAdmin(userId?: string | null) {
  if (!userId) return false
  
  const user = await prisma.user.findUnique({
    where: { 
      id: userId,
      isDeleted: false 
    },
    select: { role: true }
  })

  return user?.role === 'admin'
}
