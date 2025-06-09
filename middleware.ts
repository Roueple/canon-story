import { authMiddleware } from "@clerk/nextjs";

// This example protects all routes including api/trpc routes
// Please edit this to allow other routes to be public as needed.
// See https://clerk.com/docs/references/nextjs/auth-middleware for more information about configuring your Middleware
export default authMiddleware({
  // Public routes that don't require authentication
  publicRoutes: [
    "/",
    "/novels",
    "/novels/(.*)",
    "/genres",
    "/genres/(.*)",
    "/search",
    "/trending",
    "/api/public/(.*)",
  ],
  // Routes that should redirect to sign-in if unauthenticated
  ignoredRoutes: [
    "/api/webhooks/(.*)",
  ],
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};