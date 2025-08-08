import { redirect } from "next/navigation";
import { getSession } from "next-auth/react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface FetchOptions extends RequestInit {
	requireAuth?: boolean;
}

/**
 * Enhanced fetch wrapper that automatically includes authentication headers
 */
export async function authenticatedFetch(
	url: string,
	options: FetchOptions = {},
): Promise<Response> {
	const { requireAuth = true, headers = {}, ...rest } = options;

	// Get the current session
	const session = await getSession();

	// Build headers
	const requestHeaders: Record<string, string> = {
		...(headers as Record<string, string>),
	};

	// Add auth header if we have a session
	if (session?.user) {
		// For now, we'll use the user ID as a token until we implement proper JWT
		requestHeaders.Authorization = `Bearer ${session.user.id}`;
	}

	// Make the request
	const response = await fetch(`${API_URL}${url}`, {
		...rest,
		headers: requestHeaders,
	});

	// Handle auth errors
	if (response.status === 401 && requireAuth) {
		// Session might be expired, trigger re-authentication
		// Check if we're on the server or client
		if (typeof window !== "undefined") {
			// Client-side: use window.location for redirect
			window.location.href = "/auth/signin";
		} else {
			// Server-side: use Next.js redirect
			redirect("/auth/signin");
		}
		throw new Error("Authentication required");
	}

	return response;
}
