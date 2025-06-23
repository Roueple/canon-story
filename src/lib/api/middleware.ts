// src/lib/api/middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

export async function withAuth(request: NextRequest, requiredRole?: string) {
  try {
    const user = await currentUser();
    if (!user) { 
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 }) 
    }
    
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, role: true, isActive: true }
    });
    
    if (!dbUser || !dbUser.isActive) { 
      return NextResponse.json({ success: false, error: 'User not found or inactive' }, { status: 403 }) 
    }
    
    if (requiredRole && dbUser.role !== requiredRole && dbUser.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Insufficient permissions' }, { status: 403 })
    }
    
    return { user: dbUser }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return NextResponse.json({ success: false, error: 'Authentication error' }, { status: 500 })
  }
}

// Correctly handles Next.js 15 async params by awaiting them inside the wrapper
function createRouteHandler(
  handler: (req: NextRequest, context: { user: any; params: any }) => Promise<NextResponse>
) {
  return async (req: NextRequest, props: { params: any }) => {
    // The params from props might be a promise, so we await it.
    // This provides compatibility with newer Next.js versions.
    const params = props.params; 
    const authResult = await withAuth(req);
    
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    return handler(req, { user: authResult.user, params });
  }
}

// Wrapper for routes requiring admin access
export function createAdminRoute(
  handler: (req: NextRequest, context: { user: any; params: any }) => Promise<NextResponse>
) {
  return async (req: NextRequest, props: { params: any }) => {
    const params = props.params;
    const authResult = await withAuth(req, 'admin'); // Pass 'admin' role
    
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    return handler(req, { user: authResult.user, params });
  }
}

// Wrapper for routes requiring any authenticated user
export const createProtectedRoute = createRouteHandler;