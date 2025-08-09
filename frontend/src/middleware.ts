import { NextResponse } from "next/server";
import { auth } from "@/auth";

export default auth((req) => {
	const isLoggedIn = !!req.auth;
	const isAuthPage = req.nextUrl.pathname.startsWith("/auth");
	const isApiAuth = req.nextUrl.pathname.startsWith("/api/auth");
	const isDemoPage = req.nextUrl.pathname.startsWith("/scroll-demo");

	if (isApiAuth || isDemoPage) {
		return NextResponse.next();
	}

	if (!isLoggedIn && !isAuthPage) {
		const signInUrl = new URL("/auth/signin", req.url);
		signInUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
		return NextResponse.redirect(signInUrl);
	}

	return NextResponse.next();
});

// Protect all routes except auth, public paths, and ALL API routes
export const config = {
	matcher: ["/((?!api|auth|_next/static|_next/image|favicon.ico|public).*)"],
};
