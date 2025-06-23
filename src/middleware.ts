import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define all routes that should be publicly accessible.
// All other routes will be protected by default.
const isPublicRoute = createRouteMatcher([
  '/', 
  '/sign-in(.*)', 
  '/sign-up(.*)', 
  '/api/webhooks(.*)'
]);

export default clerkMiddleware((auth, request) => {
  // If the route is not public, then it is protected.
  // The auth() function will redirect unauthenticated users to the sign-in page.
  if (!isPublicRoute(request)) {
    auth().protect();
  }
});

export const config = {
  // The following matcher runs middleware on all routes
  // except static assets.
  matcher: ['/((?!.*\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
