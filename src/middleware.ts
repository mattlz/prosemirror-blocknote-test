import { convexAuthNextjsMiddleware } from "@convex-dev/auth/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export default convexAuthNextjsMiddleware((request: NextRequest) => {
  const { pathname } = request.nextUrl;
  
  // Get the authentication token from the request
  // Note: Convex Auth will populate this in the middleware context
  const isAuthenticated = request.nextUrl.searchParams.has('convex-auth-token') || 
                          request.cookies.has('convex-auth-token') ||
                          // Allow the convex auth system to determine auth status
                          false;

  // Auth routes that should redirect authenticated users
  const authRoutes: string[] = [];
  const isAuthRoute = authRoutes.includes(pathname);
  
  // Root route special handling
  if (pathname === '/') {
    // Let the page component handle the auth check and redirect
    // This prevents middleware redirect conflicts
    return;
  }
  
  // Redirect authenticated users away from auth pages
  if (isAuthenticated && isAuthRoute) {
    return NextResponse.redirect(new URL('/docs', request.url));
  }
  
  // For protected routes, let Convex Auth handle the authentication
  // The page components will handle redirects to maintain consistency
  return;
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
}; 