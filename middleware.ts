import { convexAuthNextjsMiddleware } from "@convex-dev/auth/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export default convexAuthNextjsMiddleware((request: NextRequest) => {
	const { pathname } = request.nextUrl;
	
	// Auth routes that should redirect authenticated users
	const authRoutes = ["/signin", "/signup"];
	const isAuthRoute = authRoutes.includes(pathname);
	const isProtected = pathname.startsWith("/docs");
	
	// Get authentication status from Convex Auth
	const isAuthenticated = request.nextUrl.searchParams.has('convex-auth-token') || 
	                        request.cookies.has('convex-auth-token');
	
	// Redirect authenticated users away from auth pages
	if (isAuthenticated && isAuthRoute) {
		return NextResponse.redirect(new URL('/docs', request.url));
	}
	
	// For protected routes, let Convex Auth handle the authentication
	// The convexAuthNextjsMiddleware will automatically handle redirects
	return;
});

export const config = {
	matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
