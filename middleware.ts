import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

// Define the routes that should be protected
const isProtectedRoute = createRouteMatcher([
  '/admin(.*)',
  '/profile(.*)',
  '/settings(.*)',
]);

// Define admin-only routes
const isAdminRoute = createRouteMatcher([
  '/admin(.*)',
]);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  // Protect routes that require authentication
  if (isProtectedRoute(req)) {
    await auth.protect();
  }

  // For admin routes, check if user has admin role
  if (isAdminRoute(req)) {
    const { sessionClaims } = await auth();
    const userRole = sessionClaims?.metadata?.role;

    if (userRole !== 'admin') {
      // Redirect non-admins to home
      return NextResponse.redirect(new URL('/', req.url));
    }
  }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
