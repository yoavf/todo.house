import { NextResponse } from "next/server";
import { auth } from "@/auth";

export default auth((req) => {
	const isLoggedIn = !!req.auth;
	const isAuthPage = req.nextUrl.pathname.startsWith("/auth");
	const isApiAuth = req.nextUrl.pathname.startsWith("/api/auth");

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

// Protect all routes except auth, public paths, API routes, and PWA files
export const config = {
	matcher: [
		"/((?!api|auth|_next/static|_next/image|favicon\\.ico|favicon\\.svg|apple-touch-icon\\.png|manifest\\.json|manifest\\.webmanifest|sw\\.js|icon-.*\\.svg|icon-.*\\.png|robots\\.txt|public).*)",
	],
};
