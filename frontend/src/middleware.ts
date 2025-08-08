import { NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";

export default withAuth(
	function middleware(req) {
		// This function is called after authentication
		return NextResponse.next();
	},
	{
		callbacks: {
			authorized: ({ req, token }) => {
				const isAuthPage = req.nextUrl.pathname.startsWith("/auth");
				const isApiAuth = req.nextUrl.pathname.startsWith("/api/auth");

				// Allow auth API calls
				if (isApiAuth) {
					return true;
				}

				// Allow auth pages even when not logged in
				if (isAuthPage) {
					return true;
				}

				// For all other pages, require authentication
				return !!token;
			},
		},
		pages: {
			signIn: "/auth/signin",
		},
	},
);

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
