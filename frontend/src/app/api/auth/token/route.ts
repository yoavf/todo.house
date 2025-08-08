import { NextResponse } from "next/server";

/**
 * SECURITY WARNING: This endpoint has been disabled.
 *
 * Previously, this endpoint exposed the httpOnly session token to client-side JavaScript,
 * which completely defeats the security purpose of httpOnly cookies and creates a severe
 * XSS vulnerability.
 *
 * The session token should NEVER be accessible to client-side JavaScript.
 *
 * Instead, use one of these secure alternatives:
 * 1. Server-side API proxy routes (recommended)
 * 2. Configure backend to accept credentials via CORS
 * 3. Implement a separate short-lived, limited-scope access token system
 *
 * See /api/proxy/* for the secure implementation.
 */
export async function GET() {
	return NextResponse.json(
		{
			error: "This endpoint has been disabled for security reasons",
			message: "Please use the secure API proxy endpoints instead",
		},
		{ status: 410 }, // 410 Gone - indicates this endpoint is permanently unavailable
	);
}
