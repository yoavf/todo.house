/**
 * Server-side API fetch wrapper
 * This file is used by server components and can use server-only imports
 */

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface FetchOptions extends RequestInit {
	requireAuth?: boolean;
}

/**
 * Get the NextAuth session token to pass to the backend
 * The backend uses fastapi-nextauth-jwt to decrypt and validate this token
 */
async function getAuthToken(): Promise<string | null> {
	try {
		const cookieStore = await cookies();
		// NextAuth v5 uses these cookie names for the session token
		// The token is a JWE (JSON Web Encryption) that the backend will decrypt
		const sessionToken =
			cookieStore.get("authjs.session-token")?.value ||
			cookieStore.get("__Secure-authjs.session-token")?.value ||
			cookieStore.get("__Host-authjs.session-token")?.value;

		if (sessionToken) {
			return sessionToken;
		}

		// If no session token in cookies, check if we have a session
		// This handles edge cases where the cookie might not be accessible
		const session = await auth();
		if (!session) {
			return null;
		}

		// If we have a session but no cookie, something is wrong
		if (process.env.NODE_ENV === "development") {
			console.warn("Session exists but no session token cookie found");
		}
		return null;
	} catch (error) {
		console.error("Error getting auth token:", error);
		return null;
	}
}

/**
 * Server-side fetch wrapper that includes authentication headers
 */
export async function authenticatedFetch(
	url: string,
	options: FetchOptions = {},
): Promise<Response> {
	const { requireAuth = true, headers = {}, ...rest } = options;

	// Build headers
	const requestHeaders: Record<string, string> = {
		"Content-Type": "application/json",
		...(headers as Record<string, string>),
	};

	// Add auth header if we have a token
	const token = await getAuthToken();
	if (token) {
		// Pass the NextAuth session token as a Bearer token
		// The backend will decrypt and validate it using fastapi-nextauth-jwt
		requestHeaders.Authorization = `Bearer ${token}`;
	} else if (requireAuth) {
		// If auth is required but no token, check session
		const session = await auth();
		if (!session) {
			redirect("/auth/signin");
		}
	}

	// Make the request
	const response = await fetch(`${API_URL}${url}`, {
		...rest,
		headers: requestHeaders,
	});

	// Handle auth errors
	if (response.status === 401 && requireAuth) {
		// Session might be expired, trigger re-authentication
		redirect("/auth/signin");
	}

	return response;
}
