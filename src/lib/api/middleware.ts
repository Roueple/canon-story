// src/lib/api/middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

export async function withAuth(request: NextRequest, requiredRole?: string) {
  try {
    const user = await currentUser();
    if (!user) { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
    
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, role: true, isActive: true }
    });
    if (!dbUser || !dbUser.isActive) { return NextResponse.json({ error: 'User not found or inactive' }, { status: 403 }) }
    
    if (requiredRole && dbUser.role !== requiredRole && dbUser.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
    return { user: dbUser }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return NextResponse.json({ error: 'Authentication error' }, { status: 500 })
  }
}

export function createAdminRoute(
  handler: (req: NextRequest, context: { user: any; params: any }) => Promise<NextResponse>
) {
  return async (req: NextRequest, { params }: { params: any }) => {
    const authResult = await withAuth(req, 'admin');
    if (authResult instanceof NextResponse) { return authResult }
    return handler(req, { user: authResult.user, params });
  }
}

export function createProtectedRoute(
  handler: (req: NextRequest, context: { user: any; params: any }) => Promise<NextResponse>
) {
  return async (req: NextRequest, { params }: { params: any }) => {
    const authResult = await withAuth(req);
    if (authResult instanceof NextResponse) { return authResult }
    return handler(req, { user: authResult.user, params });
  }
}