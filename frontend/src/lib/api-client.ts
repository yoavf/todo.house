/**
 * Client-side API fetch wrapper
 * This file is used by client components and handles cross-domain authentication
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface FetchOptions extends RequestInit {
	requireAuth?: boolean;
}

// Cache the token for a short time to avoid repeated fetches
let tokenCache: { token: string; expires: number } | null = null;

/**
 * Get the NextAuth session token via our API route
 */
async function getSessionToken(): Promise<string | null> {
	// Check cache first
	if (tokenCache && tokenCache.expires > Date.now()) {
		return tokenCache.token;
	}
	
	try {
		const response = await fetch("/api/auth/token");
		if (!response.ok) {
			return null;
		}
		
		const data = await response.json();
		if (data.token) {
			// Cache for 5 minutes
			tokenCache = {
				token: data.token,
				expires: Date.now() + 5 * 60 * 1000
			};
			return data.token;
		}
	} catch (error) {
		console.error("Failed to get session token:", error);
	}
	
	return null;
}

/**
 * Client-side fetch wrapper for use in React components
 * Gets the session token and sends it as Bearer token for cross-domain auth
 */
export async function authenticatedFetch(
	url: string,
	options: FetchOptions = {},
): Promise<Response> {
	const { requireAuth = true, headers = {}, ...rest } = options;

	// Build headers
	const requestHeaders: Record<string, string> = {
		...(headers as Record<string, string>),
	};
	
	// Only set Content-Type if not already set and not FormData
	if (!requestHeaders["Content-Type"] && !(rest.body instanceof FormData)) {
		requestHeaders["Content-Type"] = "application/json";
	}

	// Get session token and add as Bearer token
	const token = await getSessionToken();
	if (token) {
		requestHeaders["Authorization"] = `Bearer ${token}`;
	} else if (requireAuth) {
		// No token but auth required
		window.location.href = "/auth/signin";
		throw new Error("Authentication required");
	}

	// Make the request
	const response = await fetch(`${API_URL}${url}`, {
		...rest,
		headers: requestHeaders,
		// No need for credentials since we're sending the token explicitly
	});

	// Handle auth errors
	if (response.status === 401) {
		// Clear token cache on auth error
		tokenCache = null;
		
		if (requireAuth) {
			// Session might be expired, trigger re-authentication
			window.location.href = "/auth/signin";
			throw new Error("Authentication required");
		}
	}

	return response;
}