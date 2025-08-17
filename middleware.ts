import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	const isProtected = pathname.startsWith("/docs");
	const isAuthPage = pathname === "/signin" || pathname === "/signup";

	// Best-effort token detection. Convex auth primarily runs client-side; if no
	// cookie is present we fail-open to preserve existing behavior.
	const token = request.cookies.get("convex_auth")?.value
		|| request.cookies.get("auth-token")?.value
		|| request.cookies.get("convex-token")?.value
		|| request.cookies.get("token")?.value;

	if (isAuthPage && token) {
		return NextResponse.redirect(new URL("/docs", request.url));
	}

	// For now, allow through on protected routes if we cannot detect token.
	// Client-side checks still enforce redirects, preserving behavior.
	return NextResponse.next();
}

export const config = {
	matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
