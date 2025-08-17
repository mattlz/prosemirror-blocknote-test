import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	const isProtected = pathname.startsWith("/docs");
	const isAuthPage = pathname === "/signin" || pathname === "/signup";

	// Improved token detection
	const token = request.cookies.get("convex_auth")?.value
		|| request.cookies.get("auth-token")?.value
		|| request.cookies.get("convex-token")?.value
		|| request.cookies.get("token")?.value;

	// Redirect authenticated users away from auth pages
	if (isAuthPage && token) {
		return NextResponse.redirect(new URL("/docs", request.url));
	}

	// Actually protect routes instead of failing open
	if (isProtected && !token) {
		return NextResponse.redirect(new URL("/signin", request.url));
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
