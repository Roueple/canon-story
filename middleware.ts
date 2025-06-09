import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';

// Define the routes that should be protected.
// Any route not listed here will be public by default.
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/settings(.*)',
  // Add any other routes you want to protect here
]);

export default clerkMiddleware((auth, req: NextRequest) => {
  // By using the matcher, you are telling Clerk to protect these routes.
  // No need to call auth().protect() here. Clerk does it automatically.
  if (isProtectedRoute(req)) {
    // This call gets the user's auth state and automatically
    // redirects to the sign-in page if they are not authenticated.
    auth();
  }
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};