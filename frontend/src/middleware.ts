import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

export default auth((req) => {
	const isLoggedIn = !!req.auth;
	const isAuthPage = req.nextUrl.pathname.startsWith("/auth");
	const isApiAuth = req.nextUrl.pathname.startsWith("/api/auth");
	
	// Don't redirect on auth API calls
	if (isApiAuth) {
		return NextResponse.next();
	}

	if (!isLoggedIn && !isAuthPage) {
		const signInUrl = new URL("/auth/signin", req.url);
		signInUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
		return NextResponse.redirect(signInUrl);
	}

	return NextResponse.next();
});

// Protect all routes except auth and public paths
export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - api/auth (auth endpoints)
		 * - auth (auth pages)
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 * - public folder
		 */
		"/((?!api/auth|auth|_next/static|_next/image|favicon.ico|public).*)",
	],
};
