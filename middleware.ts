import { convexAuthNextjsMiddleware } from "@convex-dev/auth/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export default convexAuthNextjsMiddleware((request: NextRequest) => {
    const { pathname } = request.nextUrl;

    // Protected routes
    const protectedRoutes = ["/docs"];
    const authRoutes = ["/signin", "/signup"];

    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
    const isAuthRoute = authRoutes.includes(pathname);

    // The convexAuthNextjsMiddleware handles the actual auth check
    // We just need to handle redirects for authenticated users on auth pages
    const hasAuthCookie = request.cookies.has('__convexAuth');

    if (hasAuthCookie && isAuthRoute) {
      return NextResponse.redirect(new URL('/docs', request.url));
    }

    return;
  });

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
