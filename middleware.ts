import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
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
    '/((?!.*\..*|_next).*)',
    '/', 
    '/(api|trpc)(.*)'
  ],
};